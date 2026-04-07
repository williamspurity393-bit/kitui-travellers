import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

/** Hard check for mutations — throws on failure */
async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ code: "unauthenticated", message: "Not authenticated" });
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
    .first();
  if (!profile || profile.accountType !== "admin")
    throw new ConvexError({ code: "forbidden", message: "Admin access required" });
  return { identity, profile };
}

/** Soft check for queries — returns null during auth race, never throws */
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

// ── Dashboard stats ───────────────────────────────────────────

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return null;

    const [allProfiles, allBookings, allRoutes] = await Promise.all([
      ctx.db.query("userProfiles").collect(),
      ctx.db.query("bookings").collect(),
      ctx.db.query("routes").collect(),
    ]);

    const totalRevenue = allBookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const activeBookings = allBookings.filter(
      (b) => b.status === "confirmed" || b.status === "pending"
    ).length;

    const activeRoutes = allRoutes.filter((r) => r.isActive).length;
    const pendingDrivers = allProfiles.filter(
      (p) => p.accountType === "driver" && !p.isVerifiedDriver
    ).length;

    const now = Date.now();
    const months: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();
      const value = allBookings
        .filter(
          (b) => b.paymentStatus === "paid" && b.createdAt >= monthStart && b.createdAt <= monthEnd
        )
        .reduce((sum, b) => sum + b.totalAmount, 0);
      months.push({ month: d.toLocaleString("en-KE", { month: "short" }), value });
    }

    return {
      totalRevenue,
      activeBookings,
      totalUsers: allProfiles.length,
      activeRoutes,
      pendingDrivers,
      monthlyRevenue: months,
    };
  },
});

export const getRecentBookings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return [];
    return ctx.db
      .query("bookings")
      .order("desc")
      .take(args.limit ?? 10);
  },
});

// ── User management ───────────────────────────────────────────

export const listAllProfiles = query({
  args: {
    accountType: v.optional(v.union(v.literal("user"), v.literal("driver"), v.literal("admin"))),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return [];

    let profiles = args.accountType
      ? await ctx.db
          .query("userProfiles")
          .withIndex("by_accountType", (q: any) => q.eq("accountType", args.accountType!))
          .collect()
      : await ctx.db.query("userProfiles").collect();

    if (args.search) {
      const s = args.search.toLowerCase();
      profiles = profiles.filter(
        (p) =>
          p.userId.toLowerCase().includes(s) ||
          (p.phone ?? "").includes(s) ||
          (p.vehicleNumber ?? "").toLowerCase().includes(s)
      );
    }
    return profiles.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const banUser = mutation({
  args: {
    userId: v.string(),
    reason: v.optional(v.string()),
    banExpiresIn: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!profile) throw new Error("User profile not found");

    const banExpiresAt = args.banExpiresIn ? Date.now() + args.banExpiresIn * 1000 : undefined;
    await ctx.db.patch("userProfiles", profile._id, {
      isBanned: true,
      banReason: args.reason ?? "Violation of terms of service",
      banExpiresAt,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "user_banned",
      resource: "userProfiles",
      resourceId: args.userId,
      details: { reason: args.reason, banExpiresAt },
      createdAt: Date.now(),
    });
  },
});

export const unbanUser = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!profile) throw new Error("User profile not found");
    await ctx.db.patch("userProfiles", profile._id, {
      isBanned: false,
      banReason: undefined,
      banExpiresAt: undefined,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "user_unbanned",
      resource: "userProfiles",
      resourceId: args.userId,
      createdAt: Date.now(),
    });
  },
});

export const deleteUser = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (profile) await ctx.db.delete("userProfiles", profile._id);
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "user_deleted",
      resource: "userProfiles",
      resourceId: args.userId,
      createdAt: Date.now(),
    });
  },
});

export const promoteToAdmin = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!profile) throw new Error("User profile not found");
    await ctx.db.patch("userProfiles", profile._id, {
      accountType: "admin",
      updatedAt: Date.now(),
    });
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "user_promoted_to_admin",
      resource: "userProfiles",
      resourceId: profile._id,
      createdAt: Date.now(),
    });
  },
});

export const revokeAdminAccess = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!profile) throw new Error("User profile not found");
    await ctx.db.patch("userProfiles", profile._id, { accountType: "user", updatedAt: Date.now() });
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "admin_access_revoked",
      resource: "userProfiles",
      resourceId: profile._id,
      createdAt: Date.now(),
    });
  },
});

// ── Route management ──────────────────────────────────────────

export const getAllRoutesAdmin = query({
  args: { search: v.optional(v.string()), isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return [];
    let routes =
      args.isActive !== undefined
        ? await ctx.db
            .query("routes")
            .withIndex("by_active", (q: any) => q.eq("isActive", args.isActive!))
            .collect()
        : await ctx.db.query("routes").collect();
    if (args.search) {
      const s = args.search.toLowerCase();
      routes = routes.filter(
        (r) =>
          r.name.toLowerCase().includes(s) ||
          r.origin.toLowerCase().includes(s) ||
          r.destination.toLowerCase().includes(s)
      );
    }
    return routes.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const toggleRouteActive = mutation({
  args: { routeId: v.id("routes"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    await ctx.db.patch("routes", args.routeId, { isActive: args.isActive, updatedAt: Date.now() });
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: args.isActive ? "route_activated" : "route_deactivated",
      resource: "routes",
      resourceId: args.routeId,
      createdAt: Date.now(),
    });
  },
});

// ── Bookings management ───────────────────────────────────────

export const getAllBookingsAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("cancelled"),
        v.literal("completed"),
        v.literal("refunded")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return [];
    let bookings = args.status
      ? await ctx.db
          .query("bookings")
          .withIndex("by_status", (q: any) => q.eq("status", args.status!))
          .collect()
      : await ctx.db.query("bookings").collect();
    if (args.search) {
      const s = args.search.toLowerCase();
      bookings = bookings.filter(
        (b) => b.bookingCode.toLowerCase().includes(s) || b.userId.toLowerCase().includes(s)
      );
    }
    bookings.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? bookings.slice(0, args.limit) : bookings;
  },
});

export const cancelBookingAdmin = mutation({
  args: { bookingId: v.id("bookings"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (!["pending", "confirmed"].includes(booking.status))
      throw new Error("Booking cannot be cancelled");

    const now = Date.now();
    const schedule = await ctx.db.get("schedules", booking.scheduleId);
    if (schedule) {
      await ctx.db.patch("schedules", booking.scheduleId, {
        availableSeats: schedule.availableSeats + booking.passengers.length,
        updatedAt: now,
      });
    }
    await ctx.db.patch("bookings", args.bookingId, { status: "cancelled", updatedAt: now });
    await ctx.db.insert("notifications", {
      userId: booking.userId,
      type: "booking_cancelled",
      title: "Booking Cancelled by Admin",
      message: `Your booking ${booking.bookingCode} was cancelled.${args.reason ? ` Reason: ${args.reason}` : ""}`,
      isRead: false,
      createdAt: now,
    });
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "booking_cancelled_by_admin",
      resource: "bookings",
      resourceId: args.bookingId,
      details: { reason: args.reason },
      createdAt: now,
    });
  },
});

// ── Drivers ───────────────────────────────────────────────────

export const getDriverProfiles = query({
  args: { verified: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return [];
    let drivers = await ctx.db
      .query("userProfiles")
      .withIndex("by_accountType", (q) => q.eq("accountType", "driver"))
      .collect();
    if (args.verified !== undefined)
      drivers = drivers.filter((d) => d.isVerifiedDriver === args.verified);
    return drivers.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const verifyDriver = mutation({
  args: { userId: v.string(), isVerified: v.boolean() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!profile) throw new Error("Driver profile not found");
    if (profile.accountType !== "driver") throw new Error("User is not a driver");
    await ctx.db.patch("userProfiles", profile._id, {
      isVerifiedDriver: args.isVerified,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "system",
      title: args.isVerified ? "Driver Account Verified ✓" : "Driver Verification Removed",
      message: args.isVerified
        ? "Your driver account has been verified. You can now be assigned to routes."
        : "Your driver verification status has been removed. Contact admin for details.",
      isRead: false,
      createdAt: Date.now(),
    });
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: args.isVerified ? "driver_verified" : "driver_unverified",
      resource: "userProfiles",
      resourceId: args.userId,
      createdAt: Date.now(),
    });
  },
});

// ── Promo codes ───────────────────────────────────────────────

export const listPromoCodes = query({
  args: {},
  handler: async (ctx) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return [];
    const codes = await ctx.db.query("promoCodes").collect();
    return codes.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const createPromoCode = mutation({
  args: {
    code: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountValue: v.number(),
    description: v.optional(v.string()),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const code = args.code.toUpperCase().trim();
    const existing = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (existing) throw new Error(`Promo code ${code} already exists`);
    if (args.discountType === "percentage" && (args.discountValue <= 0 || args.discountValue > 100))
      throw new Error("Percentage discount must be between 1 and 100");
    if (args.discountType === "fixed" && args.discountValue <= 0)
      throw new Error("Fixed discount must be positive");
    return ctx.db.insert("promoCodes", {
      code,
      discountType: args.discountType,
      discountValue: args.discountValue,
      description: args.description,
      maxUses: args.maxUses,
      expiresAt: args.expiresAt,
      usedCount: 0,
      isActive: true,
      createdBy: identity.subject, // ← was `admin._id` (undefined); use identity.subject
      createdAt: Date.now(),
    });
  },
});

export const updatePromoCode = mutation({
  args: {
    promoId: v.id("promoCodes"),
    code: v.optional(v.string()),
    discountType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
    discountValue: v.optional(v.number()),
    description: v.optional(v.string()),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const promo = await ctx.db.get("promoCodes", args.promoId);
    if (!promo) throw new Error("Promo code not found");
    const { promoId, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(updates)) {
      if (val !== undefined) patch[k] = val;
    }
    if (patch.code) patch.code = (patch.code as string).toUpperCase().trim();
    await ctx.db.patch("promoCodes", promoId, patch);
  },
});

export const togglePromoCode = mutation({
  args: { promoId: v.id("promoCodes"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    await ctx.db.patch("promoCodes", args.promoId, { isActive: args.isActive });
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: args.isActive ? "promo_activated" : "promo_deactivated",
      resource: "promoCodes",
      resourceId: args.promoId,
      createdAt: Date.now(),
    });
  },
});

export const deletePromoCode = mutation({
  args: { promoId: v.id("promoCodes") },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const promo = await ctx.db.get("promoCodes", args.promoId);
    if (!promo) throw new Error("Promo code not found");
    await ctx.db.delete("promoCodes", args.promoId);
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "promo_deleted",
      resource: "promoCodes",
      resourceId: args.promoId,
      details: { code: promo.code },
      createdAt: Date.now(),
    });
  },
});

// ── Validate promo code (booking flow) ───────────────────────

export const validatePromoCode = query({
  args: { code: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { valid: false, error: "Not authenticated" };
    const promo = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
    if (!promo) return { valid: false, error: "Invalid promo code" };
    if (!promo.isActive) return { valid: false, error: "This promo code is disabled" };
    if (promo.expiresAt && promo.expiresAt < Date.now())
      return { valid: false, error: "This promo code has expired" };
    if (promo.maxUses && promo.usedCount >= promo.maxUses)
      return { valid: false, error: "This promo code has been fully used" };
    const discount =
      promo.discountType === "percentage"
        ? Math.round((args.amount * promo.discountValue) / 100)
        : Math.min(promo.discountValue, args.amount);
    return {
      valid: true,
      discount,
      finalAmount: args.amount - discount,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
    };
  },
});

// ── Admin earnings ────────────────────────────────────────────

const ADMIN_COMMISSION_RATE = 0.15;

export const getAdminEarnings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return null;
    const paidBookings = await ctx.db
      .query("bookings")
      .withIndex("by_paymentStatus", (q) => q.eq("paymentStatus", "paid"))
      .collect();
    const sorted = paidBookings.sort((a, b) => b.createdAt - a.createdAt);
    const list = args.limit ? sorted.slice(0, args.limit) : sorted;
    const entries = list.map((b) => ({
      bookingId: b._id,
      bookingCode: b.bookingCode,
      totalFare: b.totalAmount,
      adminCommission: Math.round(b.totalAmount * ADMIN_COMMISSION_RATE),
      driverPayout: Math.round(b.totalAmount * (1 - ADMIN_COMMISSION_RATE)),
      createdAt: b.createdAt,
      paymentReference: b.paymentReference,
    }));
    const totalFares = entries.reduce((s, e) => s + e.totalFare, 0);
    const totalCommission = entries.reduce((s, e) => s + e.adminCommission, 0);
    const totalDriverPayouts = entries.reduce((s, e) => s + e.driverPayout, 0);
    const now = new Date();
    const thisMonthFares = list
      .filter((b) => {
        const d = new Date(b.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, b) => s + b.totalAmount, 0);
    return {
      entries,
      summary: {
        totalFares,
        totalCommission,
        totalDriverPayouts,
        commissionRate: ADMIN_COMMISSION_RATE,
        transactionCount: entries.length,
        thisMonthRevenue: thisMonthFares,
        thisMonthCommission: Math.round(thisMonthFares * ADMIN_COMMISSION_RATE),
      },
    };
  },
});

// ── Audit logs ────────────────────────────────────────────────

export const getAuditLogs = query({
  args: { resource: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return [];
    const logs = args.resource
      ? await ctx.db
          .query("auditLogs")
          .withIndex("by_resource", (q: any) => q.eq("resource", args.resource!))
          .collect()
      : await ctx.db.query("auditLogs").collect();
    const sorted = logs.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? sorted.slice(0, args.limit) : sorted.slice(0, 100);
  },
});

import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
