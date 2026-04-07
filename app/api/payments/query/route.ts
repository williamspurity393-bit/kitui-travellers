import { NextRequest, NextResponse } from "next/server";
import { Mpesa } from "pesafy";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface QueryBody {
  checkoutRequestId: string;
  paymentId: string;
}

// ResultCode 1032 = user pressed ❌ (cancelled on phone)
const CANCELLED_CODE = 1032;

const PENDING_PHRASES = [
  "being processed",
  "still under processing",
  "still processing",
  "request is being processed",
];

export async function POST(request: NextRequest) {
  // ── Parse ─────────────────────────────────────────────────────────────────
  let body: QueryBody;
  try {
    body = (await request.json()) as QueryBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { checkoutRequestId, paymentId } = body;
  if (!checkoutRequestId || !paymentId) {
    return NextResponse.json(
      { error: "checkoutRequestId and paymentId are required" },
      { status: 400 }
    );
  }

  // ── Env ───────────────────────────────────────────────────────────────────
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortCode = process.env.MPESA_SHORTCODE ?? "174379";
  const passKey = process.env.MPESA_PASSKEY ?? "";
  const environment = (process.env.MPESA_ENVIRONMENT ?? "sandbox") as "sandbox" | "production";

  if (!consumerKey || !consumerSecret || !passKey) {
    return NextResponse.json(
      { error: "M-Pesa not configured", status: "unknown" },
      { status: 500 }
    );
  }

  // ── Query Daraja ──────────────────────────────────────────────────────────
  try {
    const mpesa = new Mpesa({
      consumerKey,
      consumerSecret,
      environment,
      lipaNaMpesaShortCode: shortCode,
      lipaNaMpesaPassKey: passKey,
    });

    const result = await mpesa.stkQuery({ checkoutRequestId });

    // Daraja sandbox returns ResultCode as a STRING — coerce to number for
    // Convex validator which uses v.float64() (rejects strings)
    const rawCode = result.ResultCode;
    const resultCode = typeof rawCode === "string" ? Number(rawCode) : (rawCode ?? -1);
    const resultDesc = result.ResultDesc ?? "";

    console.log("[payments/query] Result:", { checkoutRequestId, resultCode, resultDesc });

    const isSuccess = resultCode === 0;
    const isCancelled = resultCode === CANCELLED_CODE;
    const isPending = PENDING_PHRASES.some((p) => resultDesc.toLowerCase().includes(p));

    // ── Update Convex for terminal states ─────────────────────────────────
    if (isSuccess || (!isPending && resultCode !== -1)) {
      try {
        await convex.mutation(api.payments.handleMpesaCallback, {
          checkoutRequestId,
          merchantRequestId: result.MerchantRequestID ?? "",
          resultCode, // number ✓
          resultDesc,
        });
        console.log("[payments/query] Convex updated ✓");
      } catch (convexErr) {
        // Non-fatal — the Daraja webhook may have already updated Convex
        console.warn("[payments/query] Convex update skipped (may be duplicate):", convexErr);
      }
    }

    // ── Build client response ──────────────────────────────────────────────
    if (isSuccess) {
      return NextResponse.json({ resultCode, resultDesc, status: "completed" });
    }
    if (isCancelled) {
      return NextResponse.json({
        resultCode,
        resultDesc: "Payment cancelled — you pressed ❌ on your phone. Please try again.",
        status: "failed",
      });
    }
    if (isPending) {
      return NextResponse.json({ status: "processing", resultDesc: "Still processing…" });
    }

    // Any other non-zero code = failed
    return NextResponse.json({ resultCode, resultDesc, status: "failed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Query failed";

    // Daraja returns this error when the transaction hasn't been processed yet
    if (
      message.toLowerCase().includes("does not exist") ||
      message.toLowerCase().includes("not found") ||
      message.toLowerCase().includes("no stk")
    ) {
      return NextResponse.json({ status: "processing", resultDesc: "Still processing…" });
    }

    console.error("[payments/query] Error:", message);
    return NextResponse.json({ error: message, status: "unknown" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
