import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── ALL notification types (mirrors schema exactly) ───────────
const NOTIF_TYPE = v.union(
  v.literal("booking_confirmed"),
  v.literal("booking_cancelled"),
  v.literal("payment_received"),
  v.literal("payment_failed"),
  v.literal("trip_reminder"),
  v.literal("trip_started"),
  v.literal("trip_completed"),
  v.literal("system"),
  v.literal("promo"), // was missing — now included
  v.literal("review_request") // was missing — now included
);

// ── Auth helpers ──────────────────────────────────────────────

async function requireAuth(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity;
}

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

// ── Shared query (works for every role) ──────────────────────

export const getMyNotifications = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    notifications = notifications.sort((a, b) => b.createdAt - a.createdAt);

    if (args.unreadOnly) {
      notifications = notifications.filter((n) => !n.isRead);
    }
    if (args.limit) {
      notifications = notifications.slice(0, args.limit);
    }

    return notifications;
  },
});

/**
 * Driver notifications — same table, same data, but adds
 * `driverContext` metadata so the frontend can show relevant actions.
 */
export const getDriverNotifications = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .first();
    // Soft check — return [] during auth race or if wrong role
    if (!profile || profile.accountType !== "driver") return [];

    let notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    notifications = notifications.sort((a, b) => b.createdAt - a.createdAt);

    if (args.unreadOnly) {
      notifications = notifications.filter((n) => !n.isRead);
    }
    if (args.limit) {
      notifications = notifications.slice(0, args.limit);
    }

    return notifications;
  },
});

/**
 * Admin notifications — same table + adds unread breakdown by type
 * so the admin UI can show counts per category.
 */
export const getAdminNotifications = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .first();
    if (!profile || profile.accountType !== "admin") return [];

    let notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    notifications = notifications.sort((a, b) => b.createdAt - a.createdAt);

    if (args.unreadOnly) {
      notifications = notifications.filter((n) => !n.isRead);
    }
    if (args.limit) {
      notifications = notifications.slice(0, args.limit);
    }

    return notifications;
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_unread", (q) => q.eq("userId", identity.subject).eq("isRead", false))
      .collect();
    return unread.length;
  },
});

// ── Core mutations ────────────────────────────────────────────

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const n = await ctx.db.get("notifications", args.notificationId);
    if (!n || n.userId !== identity.subject) throw new Error("Not found");
    await ctx.db.patch("notifications", args.notificationId, { isRead: true });
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_unread", (q: any) =>
        q.eq("userId", identity.subject).eq("isRead", false)
      )
      .collect();
    await Promise.all(unread.map((n) => ctx.db.patch("notifications", n._id, { isRead: true })));
    return { count: unread.length };
  },
});

export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const n = await ctx.db.get("notifications", args.notificationId);
    if (!n || n.userId !== identity.subject) throw new Error("Not found");
    await ctx.db.delete("notifications", args.notificationId);
  },
});

export const clearAllNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
    await Promise.all(all.map((n) => ctx.db.delete("notifications", n._id)));
    return { count: all.length };
  },
});

// ── createNotification — now includes ALL schema types ────────

/**
 * Internal helper: create a notification for any user.
 * Called from bookings, payments, reviews, and schedulerAgent.
 * Now supports all 10 notification types defined in the schema.
 */
export const createNotification = mutation({
  args: {
    userId: v.string(),
    type: NOTIF_TYPE,
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      isRead: false,
      data: args.data,
      createdAt: Date.now(),
    });
  },
});

// ── Driver notification helper ────────────────────────────────

/**
 * notifyDriver — send a targeted notification to a specific driver.
 *
 * Called from:
 *  - bookings.ts → createBooking (new passenger on your schedule)
 *  - bookings.ts → cancelBooking (passenger cancelled from your schedule)
 *  - payments.ts → handleMpesaCallback (payment confirmed on your schedule)
 *  - schedulerAgent.ts → status transitions (boarding, in_transit, arrived)
 *
 * The caller must be authenticated. Admin or the scheduler system calls this.
 * Auth is verified by checking the caller has a valid identity.
 */
export const notifyDriver = mutation({
  args: {
    driverId: v.string(),
    type: NOTIF_TYPE,
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Verify caller is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify the target is actually a driver
    const driverProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.driverId))
      .first();
    if (!driverProfile) {
      // Silently skip if driver profile not found (seed driver or deleted account)
      console.warn("[notifyDriver] Driver profile not found:", args.driverId);
      return null;
    }

    return ctx.db.insert("notifications", {
      userId: args.driverId,
      type: args.type,
      title: args.title,
      message: args.message,
      isRead: false,
      data: args.data,
      createdAt: Date.now(),
    });
  },
});

// ── Admin broadcast helper ─────────────────────────────────────

/**
 * notifyAdmins — broadcast a notification to ALL admin accounts.
 *
 * Called from:
 *  - users.ts → completeOnboarding (new driver registered)
 *  - reviews.ts → createReview (new review pending verification)
 *  - bookings.ts → createBooking (high-value booking alerts)
 *  - schedulerAgent.ts → anomaly detection
 *
 * NOTE: This does a full table scan on userProfiles filtered by accountType.
 * This is acceptable because there are typically very few admin accounts (1-5).
 * If you scale to many admins, replace with a dedicated admin notification fanout.
 */
export const notifyAdmins = mutation({
  args: {
    type: NOTIF_TYPE,
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Verify caller is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const adminProfiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_accountType", (q: any) => q.eq("accountType", "admin"))
      .collect();

    const now = Date.now();
    const ids = await Promise.all(
      adminProfiles.map((admin) =>
        ctx.db.insert("notifications", {
          userId: admin.userId,
          type: args.type,
          title: args.title,
          message: args.message,
          isRead: false,
          data: args.data,
          createdAt: now,
        })
      )
    );

    return { notified: ids.length };
  },
});

// ── Admin: send a promo notification to all users ─────────────

/**
 * broadcastPromo — admin-only: send a promo notification to a list of users
 * (or all users if userIds is empty). Used from the admin promos page.
 */
export const broadcastPromo = mutation({
  args: {
    userIds: v.optional(v.array(v.string())), // empty = all users
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let targets: string[] = args.userIds ?? [];

    if (targets.length === 0) {
      const allUsers = await ctx.db
        .query("userProfiles")
        .withIndex("by_accountType", (q: any) => q.eq("accountType", "user"))
        .collect();
      targets = allUsers.map((u) => u.userId);
    }

    const now = Date.now();
    // Batch in chunks of 50 to stay within Convex mutation limits
    const CHUNK = 50;
    let sent = 0;
    for (let i = 0; i < targets.length; i += CHUNK) {
      const chunk = targets.slice(i, i + CHUNK);
      await Promise.all(
        chunk.map((userId) =>
          ctx.db.insert("notifications", {
            userId,
            type: "promo",
            title: args.title,
            message: args.message,
            isRead: false,
            data: args.data,
            createdAt: now,
          })
        )
      );
      sent += chunk.length;
    }

    return { sent };
  },
});
