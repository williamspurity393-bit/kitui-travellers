import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const COMMISSION_RATE = 0.15;

/** Hard check — throws. Use in mutations only. */
async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
    .first();
  if (!profile || profile.accountType !== "admin")
    throw new Error("Forbidden: admin access required");
  return { identity, profile };
}

/** Soft check for queries — returns null during auth race. */
async function getDriverIdentity(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
    .first();
  if (!profile || profile.accountType !== "driver") return null;
  return { identity, profile };
}

/** Soft check for admin queries. */
async function getAdminIdentity(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
    .first();
  if (!profile || profile.accountType !== "admin") return null;
  return { identity, profile };
}

// ── Called internally by payments.ts ─────────────────────────

export const createEarningRecord = mutation({
  args: {
    driverId: v.string(),
    bookingId: v.id("bookings"),
    scheduleId: v.id("schedules"),
    grossAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const commissionAmount = Math.round(args.grossAmount * COMMISSION_RATE);
    const netAmount = args.grossAmount - commissionAmount;
    const now = Date.now();

    return ctx.db.insert("driverEarnings", {
      driverId: args.driverId,
      bookingId: args.bookingId,
      scheduleId: args.scheduleId,
      grossAmount: args.grossAmount,
      commissionRate: COMMISSION_RATE,
      commissionAmount,
      netAmount,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ── Queries ───────────────────────────────────────────────────

/** Driver: their own earnings list */
export const getMyEarnings = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Soft check — return [] during auth race
    const auth = await getDriverIdentity(ctx);
    if (!auth) return [];

    let earnings = await ctx.db
      .query("driverEarnings")
      .withIndex("by_driverId", (q: any) => q.eq("driverId", auth.identity.subject))
      .collect();

    if (args.status && args.status !== "all")
      earnings = earnings.filter((e) => e.status === args.status);

    const sorted = earnings.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

/** Driver: earnings summary — soft auth, returns null during race */
export const getMyEarningsSummary = query({
  args: {},
  handler: async (ctx) => {
    // FIX: soft check — return null instead of throwing during token-resolving window
    const auth = await getDriverIdentity(ctx);
    if (!auth) return null;

    const earnings = await ctx.db
      .query("driverEarnings")
      .withIndex("by_driverId", (q: any) => q.eq("driverId", auth.identity.subject))
      .collect();

    const totalGross = earnings.reduce((s, e) => s + e.grossAmount, 0);
    const totalNet = earnings.reduce((s, e) => s + e.netAmount, 0);
    const totalCommission = earnings.reduce((s, e) => s + e.commissionAmount, 0);
    const pending = earnings
      .filter((e) => e.status === "pending")
      .reduce((s, e) => s + e.netAmount, 0);
    const disbursed = earnings
      .filter((e) => e.status === "disbursed")
      .reduce((s, e) => s + e.netAmount, 0);
    const tripCount = earnings.length;

    const now = new Date();
    const thisMonth = earnings
      .filter((e) => {
        const d = new Date(e.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + e.netAmount, 0);

    const monthlyBreakdown: { month: string; gross: number; net: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();
      const slice = earnings.filter((e) => e.createdAt >= start && e.createdAt <= end);
      monthlyBreakdown.push({
        month: d.toLocaleString("en-KE", { month: "short" }),
        gross: slice.reduce((s, e) => s + e.grossAmount, 0),
        net: slice.reduce((s, e) => s + e.netAmount, 0),
      });
    }

    return {
      totalGross,
      totalNet,
      totalCommission,
      pending,
      disbursed,
      tripCount,
      thisMonth,
      commissionRate: COMMISSION_RATE,
      monthlyBreakdown,
    };
  },
});

/** Admin: all driver earnings — soft auth */
export const getAllEarnings = query({
  args: {
    driverId: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return [];

    let earnings = await ctx.db.query("driverEarnings").collect();
    if (args.driverId) earnings = earnings.filter((e) => e.driverId === args.driverId);
    if (args.status && args.status !== "all")
      earnings = earnings.filter((e) => e.status === args.status);

    const sorted = earnings.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

/** Admin: platform commission summary — soft auth */
export const getAdminCommissionSummary = query({
  args: {},
  handler: async (ctx) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return null;

    const earnings = await ctx.db.query("driverEarnings").collect();
    const totalCommission = earnings.reduce((s, e) => s + e.commissionAmount, 0);
    const totalGross = earnings.reduce((s, e) => s + e.grossAmount, 0);
    const pendingPayout = earnings
      .filter((e) => e.status === "pending")
      .reduce((s, e) => s + e.netAmount, 0);

    const now = new Date();
    const thisMonth = earnings
      .filter((e) => {
        const d = new Date(e.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + e.commissionAmount, 0);

    const monthlyBreakdown: { month: string; commission: number; gross: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();
      const slice = earnings.filter((e) => e.createdAt >= start && e.createdAt <= end);
      monthlyBreakdown.push({
        month: d.toLocaleString("en-KE", { month: "short" }),
        commission: slice.reduce((s, e) => s + e.commissionAmount, 0),
        gross: slice.reduce((s, e) => s + e.grossAmount, 0),
      });
    }

    return {
      totalCommission,
      totalGross,
      pendingPayout,
      thisMonth,
      commissionRate: COMMISSION_RATE,
      monthlyBreakdown,
    };
  },
});

// ── Mutations ─────────────────────────────────────────────────

export const markDisbursed = mutation({
  args: { earningId: v.id("driverEarnings") },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const earning = await ctx.db.get("driverEarnings", args.earningId);
    if (!earning) throw new Error("Earning record not found");
    if (earning.status === "disbursed") throw new Error("Already disbursed");

    await ctx.db.patch("driverEarnings", args.earningId, {
      status: "disbursed",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: earning.driverId,
      type: "payment_received",
      title: "Earnings Credited ✓",
      message: `KES ${earning.netAmount.toLocaleString()} earnings have been processed.`,
      isRead: false,
      data: { earningId: args.earningId },
      createdAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "driver_earning_disbursed",
      resource: "driverEarnings",
      resourceId: args.earningId,
      details: { driverId: earning.driverId, netAmount: earning.netAmount },
      createdAt: Date.now(),
    });
  },
});

export const bulkDisburseDriver = mutation({
  args: { driverId: v.string() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const all = await ctx.db
      .query("driverEarnings")
      .withIndex("by_driverId", (q: any) => q.eq("driverId", args.driverId))
      .collect();
    const toPay = all.filter((e) => e.status === "pending");
    if (toPay.length === 0) throw new Error("No pending earnings for this driver");

    const totalNet = toPay.reduce((s, e) => s + e.netAmount, 0);
    const now = Date.now();

    for (const e of toPay) {
      await ctx.db.patch("driverEarnings", e._id, { status: "disbursed", updatedAt: now });
    }

    await ctx.db.insert("notifications", {
      userId: args.driverId,
      type: "payment_received",
      title: "Earnings Batch Credited ✓",
      message: `KES ${totalNet.toLocaleString()} from ${toPay.length} trip(s) processed.`,
      isRead: false,
      createdAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "driver_earnings_bulk_disbursed",
      resource: "driverEarnings",
      details: { driverId: args.driverId, count: toPay.length, totalNet },
      createdAt: now,
    });

    return { count: toPay.length, totalNet };
  },
});
