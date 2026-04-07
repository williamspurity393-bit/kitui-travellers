import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

/** Hard check for mutations — always throws on failure */
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

/** Soft check for queries — returns null instead of throwing */
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

async function requireAdminOrDriver(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ code: "unauthenticated", message: "Not authenticated" });
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
    .first();
  if (!profile || !["admin", "driver"].includes(profile.accountType))
    throw new ConvexError({ code: "forbidden", message: "Forbidden" });
  return { identity, profile };
}

/** Public: bookable schedules for a route */
export const getSchedulesByRoute = query({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args) => {
    const schedules = await ctx.db
      .query("schedules")
      .withIndex("by_routeId", (q) => q.eq("routeId", args.routeId))
      .collect();
    return schedules
      .filter((s) => ["scheduled", "boarding"].includes(s.status))
      .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  },
});

/** Authenticated: single schedule by ID */
export const getSchedule = query({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db.get("schedules", args.scheduleId);
  },
});

export const getAllSchedules = query({
  args: {
    routeId: v.optional(v.id("routes")),
    status: v.optional(v.string()),
    driverId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return [];

    let schedules = await ctx.db.query("schedules").collect();
    if (args.routeId) schedules = schedules.filter((s) => s.routeId === args.routeId);
    if (args.status) schedules = schedules.filter((s) => s.status === args.status);
    if (args.driverId) schedules = schedules.filter((s) => s.driverId === args.driverId);

    const enriched = await Promise.all(
      schedules.map(async (s) => {
        const route = await ctx.db.get("routes", s.routeId);
        return { ...s, route };
      })
    );
    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Driver: their own assigned schedules */
export const getMySchedules = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!profile || profile.accountType !== "driver") return [];
    const schedules = await ctx.db
      .query("schedules")
      .withIndex("by_driverId", (q) => q.eq("driverId", identity.subject))
      .collect();
    return schedules.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ── Mutations ─────────────────────────────────────────────────

export const createSchedule = mutation({
  args: {
    routeId: v.id("routes"),
    driverId: v.optional(v.string()),
    vehicleId: v.optional(v.id("vehicles")),
    departureTime: v.string(),
    arrivalTime: v.string(),
    totalSeats: v.number(),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("boarding"),
        v.literal("in_transit"),
        v.literal("arrived"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const route = await ctx.db.get("routes", args.routeId);
    if (!route) throw new Error("Route not found");
    if (!route.isActive) throw new Error("Route is not active");

    const now = Date.now();
    const scheduleId = await ctx.db.insert("schedules", {
      routeId: args.routeId,
      driverId: args.driverId,
      vehicleId: args.vehicleId,
      departureTime: args.departureTime,
      arrivalTime: args.arrivalTime,
      totalSeats: args.totalSeats,
      availableSeats: args.totalSeats,
      status: args.status ?? "scheduled",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "schedule_created",
      resource: "schedules",
      resourceId: scheduleId,
      details: { routeId: args.routeId, departureTime: args.departureTime },
      createdAt: now,
    });

    return scheduleId;
  },
});

export const updateSchedule = mutation({
  args: {
    scheduleId: v.id("schedules"),
    routeId: v.optional(v.id("routes")),
    driverId: v.optional(v.string()),
    vehicleId: v.optional(v.id("vehicles")),
    departureTime: v.optional(v.string()),
    arrivalTime: v.optional(v.string()),
    totalSeats: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("boarding"),
        v.literal("in_transit"),
        v.literal("arrived"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const { scheduleId, routeId: _routeId, ...rest } = args;
    const patch: Record<string, any> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch("schedules", scheduleId, { ...patch, updatedAt: Date.now() });
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "schedule_updated",
      resource: "schedules",
      resourceId: scheduleId,
      details: patch,
      createdAt: Date.now(),
    });
  },
});

export const deleteSchedule = mutation({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const schedule = await ctx.db.get("schedules", args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    if (["boarding", "in_transit"].includes(schedule.status))
      throw new Error("Cannot delete an active schedule");

    const hasBookings = await ctx.db
      .query("bookings")
      .withIndex("by_scheduleId", (q) => q.eq("scheduleId", args.scheduleId))
      .first();
    if (hasBookings) throw new Error("Cannot delete a schedule with existing bookings");

    await ctx.db.delete("schedules", args.scheduleId);
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "schedule_deleted",
      resource: "schedules",
      resourceId: args.scheduleId,
      createdAt: Date.now(),
    });
  },
});

export const updateMyScheduleStatus = mutation({
  args: {
    scheduleId: v.id("schedules"),
    status: v.union(
      v.literal("boarding"),
      v.literal("in_transit"),
      v.literal("arrived"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const { identity, profile } = await requireAdminOrDriver(ctx);
    const schedule = await ctx.db.get("schedules", args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");

    if (profile.accountType !== "admin" && schedule.driverId !== identity.subject)
      throw new Error("Not your schedule");

    const now = Date.now();
    await ctx.db.patch("schedules", args.scheduleId, { status: args.status, updatedAt: now });

    if (args.status === "arrived") {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_scheduleId", (q) => q.eq("scheduleId", args.scheduleId))
        .collect();
      for (const booking of bookings.filter((b) => b.status === "confirmed")) {
        await ctx.db.patch("bookings", booking._id, { status: "completed", updatedAt: now });
        await ctx.db.insert("notifications", {
          userId: booking.userId,
          type: "trip_completed",
          title: "Trip Complete — Rate Your Journey",
          message: `You've arrived! How was your trip? Tap to rate booking ${booking.bookingCode}.`,
          isRead: false,
          data: { bookingId: booking._id },
          createdAt: now,
        });
      }
    }
  },
});

export const adminCompleteSchedule = mutation({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const now = Date.now();
    await ctx.db.patch("schedules", args.scheduleId, { status: "arrived", updatedAt: now });

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_scheduleId", (q) => q.eq("scheduleId", args.scheduleId))
      .collect();
    let count = 0;
    for (const booking of bookings.filter((b) => b.status === "confirmed")) {
      await ctx.db.patch("bookings", booking._id, { status: "completed", updatedAt: now });
      await ctx.db.insert("notifications", {
        userId: booking.userId,
        type: "trip_completed",
        title: "Trip Completed",
        message: `Booking ${booking.bookingCode} has been completed. Rate your journey!`,
        isRead: false,
        data: { bookingId: booking._id },
        createdAt: now,
      });
      count++;
    }
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "schedule_force_completed",
      resource: "schedules",
      resourceId: args.scheduleId,
      details: { bookingsCompleted: count },
      createdAt: now,
    });
    return { bookingsCompleted: count };
  },
});
