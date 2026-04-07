import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

export const getPayment = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const payment = await ctx.db.get("payments", args.paymentId);
    if (!payment) return null;
    if (payment.userId !== user._id) throw new Error("Forbidden");
    return payment;
  },
});

export const getPaymentByCheckoutId = query({
  args: { checkoutRequestId: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_checkoutRequestId", (q) => q.eq("checkoutRequestId", args.checkoutRequestId))
      .first();
    if (!payment) return null;
    if (payment.userId !== user._id) throw new Error("Forbidden");
    return payment;
  },
});

export const getPaymentsByBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking || booking.userId !== user._id) throw new Error("Forbidden");
    return ctx.db
      .query("payments")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .collect();
  },
});

// Uses ctx.auth.getUserIdentity() to avoid Unauthenticated race on page load
export const getMyWalletTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const txns = await ctx.db
      .query("walletTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
    const sorted = txns.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

export const getMySpendingSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const txns = await ctx.db
      .query("walletTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    const payments = txns.filter((t) => t.type === "payment");
    const totalSpent = payments.reduce((s, t) => s + t.amount, 0);
    const totalRefunded = txns.filter((t) => t.type === "refund").reduce((s, t) => s + t.amount, 0);

    const now = new Date();
    const thisMonth = payments
      .filter((t) => {
        const d = new Date(t.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, t) => s + t.amount, 0);

    const monthlyBreakdown: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();
      const amount = payments
        .filter((t) => t.createdAt >= start && t.createdAt <= end)
        .reduce((s, t) => s + t.amount, 0);
      monthlyBreakdown.push({ month: d.toLocaleString("en-KE", { month: "short" }), amount });
    }

    return {
      totalSpent,
      totalRefunded,
      netSpent: totalSpent - totalRefunded,
      thisMonth,
      transactionCount: payments.length,
      monthlyBreakdown,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────

export const preparePayment = mutation({
  args: {
    bookingId: v.id("bookings"),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== user._id) throw new Error("Forbidden");
    if (booking.paymentStatus === "paid") throw new Error("Already paid");
    if (!["pending", "confirmed"].includes(booking.status))
      throw new Error(`Cannot pay for booking with status: ${booking.status}`);

    const existing = await ctx.db
      .query("payments")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .collect();

    const alreadyProcessing = existing.find((p) => p.status === "processing");
    if (alreadyProcessing) {
      return {
        paymentId: alreadyProcessing._id,
        amount: booking.totalAmount,
        bookingCode: booking.bookingCode,
        resumed: true,
      };
    }

    const now = Date.now();
    const paymentId = await ctx.db.insert("payments", {
      userId: user._id,
      bookingId: args.bookingId,
      amount: booking.totalAmount,
      phoneNumber: args.phoneNumber,
      status: "pending",
      attemptCount: existing.length + 1,
      createdAt: now,
      updatedAt: now,
    });

    return {
      paymentId,
      amount: booking.totalAmount,
      bookingCode: booking.bookingCode,
      resumed: false,
    };
  },
});

export const attachStkResponse = mutation({
  args: {
    paymentId: v.id("payments"),
    merchantRequestId: v.string(),
    checkoutRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("payments", args.paymentId, {
      merchantRequestId: args.merchantRequestId,
      checkoutRequestId: args.checkoutRequestId,
      status: "processing",
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const markStkFailed = mutation({
  args: { paymentId: v.id("payments"), reason: v.string() },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get("payments", args.paymentId);
    if (!payment) return { ok: false };
    if (payment.status === "completed") return { ok: true, note: "already completed" };
    await ctx.db.patch("payments", args.paymentId, {
      status: "failed",
      failureReason: args.reason,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

/**
 * CRITICAL FIX: resultCode accepts v.union(v.number(), v.string())
 * Daraja STK Query returns ResultCode as STRING, callbacks as NUMBER.
 * Both routes coerce to Number() before calling this, but we accept both
 * as belt-and-suspenders.
 */
export const handleMpesaCallback = mutation({
  args: {
    checkoutRequestId: v.string(),
    merchantRequestId: v.string(),
    resultCode: v.union(v.number(), v.string()),
    resultDesc: v.string(),
    mpesaReceiptNumber: v.optional(v.string()),
    amount: v.optional(v.number()),
    phoneNumber: v.optional(v.string()),
    transactionDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const resultCode =
      typeof args.resultCode === "string" ? Number(args.resultCode) : args.resultCode;

    const payment = await ctx.db
      .query("payments")
      .withIndex("by_checkoutRequestId", (q) => q.eq("checkoutRequestId", args.checkoutRequestId))
      .first();

    if (!payment) {
      console.error("[handleMpesaCallback] No payment for:", args.checkoutRequestId);
      return { ok: false, error: "Payment not found" };
    }
    if (payment.status === "completed") return { ok: true, note: "already completed" };

    const now = Date.now();
    const success = resultCode === 0;

    if (success) {
      await ctx.db.patch("payments", payment._id, {
        status: "completed",
        mpesaReceiptNumber: args.mpesaReceiptNumber,
        mpesaTransactionDate: args.transactionDate,
        resultCode,
        resultDesc: args.resultDesc,
        updatedAt: now,
      });

      const booking = await ctx.db.get("bookings", payment.bookingId);
      if (booking && booking.paymentStatus !== "paid") {
        await ctx.db.patch("bookings", payment.bookingId, {
          status: "confirmed",
          paymentStatus: "paid",
          paymentMethod: "mpesa",
          paymentReference: args.mpesaReceiptNumber,
          paymentId: payment._id,
          updatedAt: now,
        });

        // Idempotent wallet transaction
        const existingTxn = await ctx.db
          .query("walletTransactions")
          .withIndex("by_bookingId", (q) => q.eq("bookingId", payment.bookingId))
          .first();
        if (!existingTxn) {
          await ctx.db.insert("walletTransactions", {
            userId: payment.userId,
            type: "payment",
            amount: payment.amount,
            description: `Booking ${booking.bookingCode}`,
            bookingId: payment.bookingId,
            paymentId: payment._id,
            mpesaReceiptNumber: args.mpesaReceiptNumber,
            createdAt: now,
          });
        }

        // Auto-create driver earning record if schedule has a driver
        const schedule = await ctx.db.get("schedules", booking.scheduleId);
        if (schedule?.driverId) {
          const existingEarning = await ctx.db
            .query("driverEarnings")
            .withIndex("by_bookingId", (q: any) => q.eq("bookingId", payment.bookingId))
            .first();
          if (!existingEarning) {
            const commissionAmount = Math.round(payment.amount * 0.15);
            await ctx.db.insert("driverEarnings", {
              driverId: schedule.driverId,
              bookingId: payment.bookingId,
              scheduleId: booking.scheduleId,
              grossAmount: payment.amount,
              commissionRate: 0.15,
              commissionAmount,
              netAmount: payment.amount - commissionAmount,
              status: "pending",
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        await ctx.db.insert("notifications", {
          userId: payment.userId,
          type: "payment_received",
          title: "Payment Confirmed ✓",
          message: `KES ${payment.amount.toLocaleString()} received. Booking ${booking.bookingCode} confirmed.`,
          isRead: false,
          data: {
            bookingId: payment.bookingId,
            paymentId: payment._id,
            receiptNumber: args.mpesaReceiptNumber,
          },
          createdAt: now,
        });
      }

      return { ok: true, status: "completed" };
    } else {
      await ctx.db.patch("payments", payment._id, {
        status: "failed",
        resultCode,
        resultDesc: args.resultDesc,
        failureReason: args.resultDesc,
        updatedAt: now,
      });

      const booking = await ctx.db.get("bookings", payment.bookingId);
      await ctx.db.insert("walletTransactions", {
        userId: payment.userId,
        type: "failed",
        amount: payment.amount,
        description: `Failed: ${args.resultDesc} — ${booking?.bookingCode ?? "booking"}`,
        bookingId: payment.bookingId,
        paymentId: payment._id,
        createdAt: now,
      });

      await ctx.db.insert("notifications", {
        userId: payment.userId,
        type: "payment_failed",
        title: "Payment Failed",
        message: `M-Pesa payment of KES ${payment.amount.toLocaleString()} failed. ${args.resultDesc}`,
        isRead: false,
        data: { bookingId: payment.bookingId, paymentId: payment._id },
        createdAt: now,
      });

      return { ok: true, status: "failed" };
    }
  },
});

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

export const getBookingForPayment = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => ctx.db.get("bookings", args.bookingId),
});

export const countPaymentAttempts = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const p = await ctx.db
      .query("payments")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .collect();
    return p.length;
  },
});

export const markPaymentFailed = internalMutation({
  args: { paymentId: v.id("payments"), reason: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch("payments", args.paymentId, {
      status: "failed",
      failureReason: args.reason,
      updatedAt: Date.now(),
    });
  },
});
