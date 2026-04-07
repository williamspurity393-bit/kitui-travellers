import { action } from "./_generated/server";
import { v } from "convex/values";

const FROM = process.env.EMAIL_FROM ?? "Kitui Travellers <noreply@kuittravellers.co.ke>";
const RESEND_API = "https://api.resend.com/emails";

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — email skipped");
    return false;
  }
  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[email] Resend error:", res.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Network error:", err);
    return false;
  }
}

// ── Email templates ───────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kitui Travellers</title>
<style>
  body{margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5}
  .wrap{max-width:560px;margin:40px auto;background:#111;border:1px solid #222;border-radius:16px;overflow:hidden}
  .header{background:#7c3aed;padding:24px 32px}
  .header h1{margin:0;color:#fff;font-size:20px;font-weight:900;letter-spacing:-0.5px}
  .header p{margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px}
  .body{padding:32px}
  .code-box{background:#1a1a1a;border:1px solid #7c3aed40;border-radius:12px;padding:20px;text-align:center;margin:24px 0}
  .code{font-family:monospace;font-size:28px;font-weight:900;color:#7c3aed;letter-spacing:4px}
  .info-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #222;font-size:14px}
  .info-label{color:#888}
  .info-value{color:#e5e5e5;font-weight:500;text-align:right}
  .badge{display:inline-block;background:#7c3aed20;border:1px solid #7c3aed40;color:#7c3aed;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600}
  .footer{background:#0a0a0a;padding:20px 32px;text-align:center;font-size:12px;color:#555;border-top:1px solid #1a1a1a}
  .btn{display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:700;margin-top:16px}
  h2{font-size:18px;font-weight:800;color:#e5e5e5;margin:0 0 8px}
  p{font-size:14px;color:#aaa;line-height:1.6;margin:8px 0}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Kitui Travellers</h1>
    <p>Connecting Kitui to Kenya</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>Kitui Travellers Sacco · Kitui Town, Kenya</p>
    <p>+254 700 000 000 · support@kuittravellers.co.ke</p>
    <p style="margin-top:8px">
      <a href="https://transport-me.vercel.app/privacy" style="color:#555;margin:0 8px">Privacy</a>
      <a href="https://transport-me.vercel.app/terms" style="color:#555;margin:0 8px">Terms</a>
    </p>
  </div>
</div>
</body>
</html>`;
}

function bookingConfirmedHtml(data: {
  bookingCode: string;
  passengerName: string;
  origin: string;
  destination: string;
  departureTime: string;
  passengerCount: number;
  totalAmount: number;
  mpesaReceipt?: string;
}): string {
  return baseTemplate(`
    <h2>Booking Confirmed ✓</h2>
    <p>Hi ${data.passengerName}, your journey is confirmed. Present the booking code below to board.</p>
    <div class="code-box">
      <div style="font-size:12px;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Booking Code</div>
      <div class="code">${data.bookingCode}</div>
    </div>
    <div class="info-row"><span class="info-label">Route</span><span class="info-value">${data.origin} → ${data.destination}</span></div>
    <div class="info-row"><span class="info-label">Departure</span><span class="info-value">${data.departureTime}</span></div>
    <div class="info-row"><span class="info-label">Passengers</span><span class="info-value">${data.passengerCount}</span></div>
    <div class="info-row"><span class="info-label">Amount Paid</span><span class="info-value" style="color:#7c3aed;font-weight:700">KES ${data.totalAmount.toLocaleString()}</span></div>
    ${data.mpesaReceipt ? `<div class="info-row"><span class="info-label">M-Pesa Receipt</span><span class="info-value" style="font-family:monospace;color:#4ade80">${data.mpesaReceipt}</span></div>` : ""}
    <p style="margin-top:24px;font-size:13px;color:#666">Please arrive at the boarding point at least 15 minutes before departure. Carry a valid ID.</p>
    <a href="https://transport-me.vercel.app/user/bookings" class="btn">View My Bookings</a>
  `);
}

function bookingCancelledHtml(data: {
  bookingCode: string;
  passengerName: string;
  origin: string;
  destination: string;
  reason?: string;
}): string {
  return baseTemplate(`
    <h2>Booking Cancelled</h2>
    <p>Hi ${data.passengerName}, your booking has been cancelled.</p>
    <div class="code-box">
      <div style="font-size:12px;color:#888;margin-bottom:8px">Cancelled Booking</div>
      <div class="code" style="color:#ef4444;text-decoration:line-through">${data.bookingCode}</div>
    </div>
    <div class="info-row"><span class="info-label">Route</span><span class="info-value">${data.origin} → ${data.destination}</span></div>
    ${data.reason ? `<div class="info-row"><span class="info-label">Reason</span><span class="info-value">${data.reason}</span></div>` : ""}
    <p style="margin-top:16px">If you paid by M-Pesa and cancelled before the cutoff window, a refund will be processed within 3 business days.</p>
    <a href="https://transport-me.vercel.app/routes" class="btn">Book Again</a>
  `);
}

function tripCompletedHtml(data: {
  bookingCode: string;
  passengerName: string;
  origin: string;
  destination: string;
}): string {
  return baseTemplate(`
    <h2>Journey Complete 🎉</h2>
    <p>Hi ${data.passengerName}, we hope you had a great trip from ${data.origin} to ${data.destination}!</p>
    <p>Your feedback helps us improve. Rate your journey in the app.</p>
    <a href="https://transport-me.vercel.app/user/bookings" class="btn">Rate Your Journey</a>
    <p style="margin-top:24px;font-size:12px;color:#555">Booking: <span style="font-family:monospace;color:#7c3aed">${data.bookingCode}</span></p>
  `);
}

// ── Exported actions ──────────────────────────────────────────

export const sendBookingConfirmed = action({
  args: {
    toEmail: v.string(),
    bookingCode: v.string(),
    passengerName: v.string(),
    origin: v.string(),
    destination: v.string(),
    departureTime: v.string(),
    passengerCount: v.number(),
    totalAmount: v.number(),
    mpesaReceipt: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    return sendEmail(
      args.toEmail,
      `Booking Confirmed — ${args.bookingCode} | Kitui Travellers`,
      bookingConfirmedHtml(args)
    );
  },
});

export const sendBookingCancelled = action({
  args: {
    toEmail: v.string(),
    bookingCode: v.string(),
    passengerName: v.string(),
    origin: v.string(),
    destination: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    return sendEmail(
      args.toEmail,
      `Booking Cancelled — ${args.bookingCode} | Kitui Travellers`,
      bookingCancelledHtml(args)
    );
  },
});

export const sendTripCompleted = action({
  args: {
    toEmail: v.string(),
    bookingCode: v.string(),
    passengerName: v.string(),
    origin: v.string(),
    destination: v.string(),
  },
  handler: async (_ctx, args) => {
    return sendEmail(
      args.toEmail,
      `How was your trip? | Kitui Travellers`,
      tripCompletedHtml(args)
    );
  },
});
