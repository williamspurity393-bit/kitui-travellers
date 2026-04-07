import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Get all active routes (public — no auth required) */
export const getActiveRoutes = query({
  args: {
    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    vehicleType: v.optional(v.string()),
    maxPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let routes = await ctx.db
      .query("routes")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    if (args.origin) {
      routes = routes.filter((r) => r.origin.toLowerCase().includes(args.origin!.toLowerCase()));
    }
    if (args.destination) {
      routes = routes.filter((r) =>
        r.destination.toLowerCase().includes(args.destination!.toLowerCase())
      );
    }
    if (args.vehicleType) {
      routes = routes.filter((r) => r.vehicleType === args.vehicleType);
    }
    if (args.maxPrice) {
      routes = routes.filter((r) => r.basePrice <= args.maxPrice!);
    }

    return routes;
  },
});

/** Get all routes – admin only */
export const getAllRoutes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!profile || profile.accountType !== "admin") {
      throw new Error("Forbidden");
    }

    return ctx.db.query("routes").collect();
  },
});

/** Get a single route by ID (public) */
export const getRoute = query({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args) => {
    return ctx.db.get("routes", args.routeId);
  },
});

// ── Mutations ─────────────────────────────────────────────────

/** Create a new route – admin only */
export const createRoute = mutation({
  args: {
    name: v.string(),
    origin: v.string(),
    destination: v.string(),
    stops: v.array(v.string()),
    distanceKm: v.number(),
    durationMinutes: v.number(),
    basePrice: v.number(),
    vehicleType: v.string(),
    amenities: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!profile || profile.accountType !== "admin") {
      throw new Error("Forbidden: admin access required");
    }

    const now = Date.now();
    const routeId = await ctx.db.insert("routes", {
      ...args,
      isActive: true,
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "route_created",
      resource: "routes",
      resourceId: routeId,
      details: { name: args.name },
      createdAt: now,
    });

    return routeId;
  },
});

/** Update a route – admin only */
export const updateRoute = mutation({
  args: {
    routeId: v.id("routes"),
    name: v.optional(v.string()),
    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    stops: v.optional(v.array(v.string())),
    distanceKm: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    basePrice: v.optional(v.number()),
    vehicleType: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!profile || profile.accountType !== "admin") {
      throw new Error("Forbidden");
    }

    const { routeId, ...updates } = args;
    await ctx.db.patch("routes", routeId, { ...updates, updatedAt: Date.now() });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "route_updated",
      resource: "routes",
      resourceId: routeId,
      details: updates,
      createdAt: Date.now(),
    });
  },
});

/** Delete a route – admin only */
export const deleteRoute = mutation({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!profile || profile.accountType !== "admin") {
      throw new Error("Forbidden");
    }

    // Check for active schedules
    const activeSchedules = await ctx.db
      .query("schedules")
      .withIndex("by_routeId", (q) => q.eq("routeId", args.routeId))
      .collect();
    const hasActiveSchedules = activeSchedules.some((s) =>
      ["scheduled", "boarding", "in_transit"].includes(s.status)
    );
    if (hasActiveSchedules) {
      throw new Error("Cannot delete a route with active schedules");
    }

    await ctx.db.delete("routes", args.routeId);

    // FIX: use identity.subject — there was no `user` variable in scope here
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "route_deleted",
      resource: "routes",
      resourceId: args.routeId,
      createdAt: Date.now(),
    });
  },
});

// ── ADD THESE QUERIES to convex/routes.ts ────────────────────

/** Public: single route with schedules + reviews summary */
export const getRouteDetail = query({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args) => {
    const route = await ctx.db.get("routes", args.routeId);
    if (!route) return null;
    const schedules = await ctx.db
      .query("schedules")
      .withIndex("by_routeId", (q) => q.eq("routeId", args.routeId))
      .collect();
    const available = schedules.filter((s) => ["scheduled", "boarding"].includes(s.status));
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_routeId", (q) => q.eq("routeId", args.routeId))
      .collect();
    const verified = reviews.filter((r) => r.isVerified);
    const avgRating =
      verified.length > 0
        ? Math.round((verified.reduce((s, r) => s + r.rating, 0) / verified.length) * 10) / 10
        : null;
    return {
      ...route,
      schedules: available,
      reviews: verified.slice(0, 10),
      avgRating,
      reviewCount: verified.length,
    };
  },
});
