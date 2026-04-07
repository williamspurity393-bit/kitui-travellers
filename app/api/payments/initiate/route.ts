import { NextRequest, NextResponse } from "next/server";
import { Mpesa } from "pesafy";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface InitiateBody {
  paymentId: string;
  phoneNumber: string;
  amount: number;
  bookingCode: string;
}

function toApiPhone(raw: string): string {
  // Strip everything except digits
  const d = raw.replace(/\D/g, "");

  if (d.startsWith("254") && d.length === 12) return d; // already 254XXXXXXXXX
  if (d.startsWith("0") && d.length === 10) return "254" + d.slice(1); // 07XXXXXXXX → 2547XXXXXXXX
  if (d.length === 9) return "254" + d; // 7XXXXXXXX  → 2547XXXXXXXX
  return d; // return as-is; validation below will catch anything else
}

function isValidKenyanPhone(normalized: string): boolean {
  return /^254(7|1)\d{8}$/.test(normalized);
}

export async function POST(request: NextRequest) {
  // ── Parse ─────────────────────────────────────────────────────────────────
  let body: InitiateBody;
  try {
    body = (await request.json()) as InitiateBody;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { paymentId, phoneNumber: rawPhone, amount, bookingCode } = body;

  // ── Validate required fields ───────────────────────────────────────────────
  if (!paymentId || !rawPhone || !amount || !bookingCode) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required fields: paymentId, phoneNumber, amount, bookingCode",
      },
      { status: 400 }
    );
  }
  if (typeof amount !== "number" || amount <= 0 || !isFinite(amount)) {
    return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
  }

  // ── Normalize + validate phone ─────────────────────────────────────────────
  const phoneNumber = toApiPhone(rawPhone);

  if (!isValidKenyanPhone(phoneNumber)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid phone number "${rawPhone}". Use format: 0712 345 678 or 254712345678`,
      },
      { status: 400 }
    );
  }

  // ── Read env ──────────────────────────────────────────────────────────────
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortCode = process.env.MPESA_SHORTCODE ?? "174379";
  const passKey = process.env.MPESA_PASSKEY ?? "";
  const environment = (process.env.MPESA_ENVIRONMENT ?? "sandbox") as "sandbox" | "production";
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  // Helper: mark payment failed in Convex + return error response
  const failAndMark = async (reason: string, httpStatus = 500) => {
    console.error("[payments/initiate] FAIL:", reason);
    try {
      await convex.mutation(api.payments.markStkFailed, {
        paymentId: paymentId as Id<"payments">,
        reason,
      });
    } catch (e) {
      console.error("[payments/initiate] Could not mark payment failed:", e);
    }
    return NextResponse.json({ success: false, error: reason }, { status: httpStatus });
  };

  if (!consumerKey || !consumerSecret)
    return failAndMark("MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET not configured");
  if (!passKey) return failAndMark("MPESA_PASSKEY not configured");
  if (!callbackUrl) return failAndMark("MPESA_CALLBACK_URL not configured");

  // ── Fire STK Push ─────────────────────────────────────────────────────────
  try {
    const mpesa = new Mpesa({
      consumerKey,
      consumerSecret,
      environment,
      lipaNaMpesaShortCode: shortCode,
      lipaNaMpesaPassKey: passKey,
    });

    // Daraja hard limits: accountReference ≤ 12 chars, transactionDesc ≤ 13 chars
    const accountReference = bookingCode.replace(/-/g, "").slice(0, 12);

    console.log("[payments/initiate] Firing STK Push:", {
      amount,
      phoneNumber, // normalized 254XXXXXXXXX
      rawPhone, // original for debugging
      accountReference,
      environment,
    });

    const response = await mpesa.stkPush({
      amount,
      phoneNumber, // always 254XXXXXXXXX here
      callbackUrl,
      accountReference,
      transactionDesc: "KituiTravellers",
      transactionType: "CustomerPayBillOnline",
    });

    console.log("[payments/initiate] STK Push queued ✓", {
      merchantRequestId: response.MerchantRequestID,
      checkoutRequestId: response.CheckoutRequestID,
    });

    // Persist Daraja IDs so the callback/query can reconcile later
    await convex.mutation(api.payments.attachStkResponse, {
      paymentId: paymentId as Id<"payments">,
      merchantRequestId: response.MerchantRequestID,
      checkoutRequestId: response.CheckoutRequestID,
    });

    return NextResponse.json({
      success: true,
      checkoutRequestId: response.CheckoutRequestID,
      customerMessage: response.CustomerMessage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "STK Push failed";
    return failAndMark(message);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
