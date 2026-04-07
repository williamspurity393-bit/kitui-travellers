import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { isStkCallbackSuccess, getCallbackValue, type StkPushCallback } from "pesafy";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Constant response — Daraja requires 200 or it will retry indefinitely
const DARAJA_OK = NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

export async function POST(request: NextRequest) {
  // ── Parse body ────────────────────────────────────────────────────────────
  let body: StkPushCallback;
  try {
    body = (await request.json()) as StkPushCallback;
  } catch {
    console.error("[mpesa/callback] Invalid JSON body");
    return DARAJA_OK; // still 200 to prevent Daraja retries
  }

  const { stkCallback } = body?.Body ?? {};
  if (!stkCallback) {
    console.error("[mpesa/callback] Missing stkCallback:", JSON.stringify(body).slice(0, 200));
    return DARAJA_OK;
  }

  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

  // Daraja sandbox sometimes returns ResultCode as a STRING ("0", "1032")
  // Convex validator uses v.float64() which REJECTS strings — coerce to number
  const resultCode = typeof ResultCode === "string" ? Number(ResultCode) : ResultCode;
  const resultDesc = ResultDesc ?? "";

  console.log("[mpesa/callback] Received:", { CheckoutRequestID, resultCode, resultDesc });

  // ── Extract metadata from successful callbacks ────────────────────────────
  let mpesaReceiptNumber: string | undefined;
  let amount: number | undefined;
  let phoneNumber: string | undefined;
  let transactionDate: number | undefined;

  if (isStkCallbackSuccess(stkCallback)) {
    mpesaReceiptNumber = getCallbackValue(body, "MpesaReceiptNumber") as string | undefined;
    amount = getCallbackValue(body, "Amount") as number | undefined;
    const rawPhone = getCallbackValue(body, "PhoneNumber");
    phoneNumber = rawPhone != null ? String(rawPhone) : undefined;

    // Daraja TransactionDate format: YYYYMMDDHHmmss (14 chars)
    const rawDate = getCallbackValue(body, "TransactionDate");
    if (rawDate) {
      const raw = String(rawDate);
      if (raw.length === 14) {
        transactionDate = new Date(
          Number(raw.slice(0, 4)), // year
          Number(raw.slice(4, 6)) - 1, // month (0-indexed)
          Number(raw.slice(6, 8)), // day
          Number(raw.slice(8, 10)), // hour
          Number(raw.slice(10, 12)), // minute
          Number(raw.slice(12, 14)) // second
        ).getTime();
      }
    }
  }

  // ── Update Convex (fire-and-forget — never fail Daraja over this) ─────────
  try {
    await convex.mutation(api.payments.handleMpesaCallback, {
      checkoutRequestId: CheckoutRequestID,
      merchantRequestId: MerchantRequestID,
      resultCode, // number ✓ — coerced above
      resultDesc,
      mpesaReceiptNumber,
      amount,
      phoneNumber,
      transactionDate,
    });
    console.log("[mpesa/callback] Convex updated ✓", {
      CheckoutRequestID,
      resultCode,
      mpesaReceiptNumber,
    });
  } catch (err) {
    // Log only — NEVER return non-200 to Daraja
    console.error("[mpesa/callback] Convex mutation failed:", err);
  }

  return DARAJA_OK;
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
