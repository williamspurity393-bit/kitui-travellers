import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

/** Public: verified reviews for a route */
export const getRouteReviews = query({
  args: {
    routeId: v.id("routes"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_routeId", (q: any) => q.eq("routeId", args.routeId))
      .collect();
    const sorted = reviews.filter((r) => r.isVerified).sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

/** Admin: ALL reviews, with optional filters */
export const getAllReviews = query({
  args: {
    isVerified: v.optional(v.boolean()),
    minRating: v.optional(v.number()),
    routeId: v.optional(v.id("routes")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let reviews = await ctx.db.query("reviews").collect();
    if (args.isVerified !== undefined)
      reviews = reviews.filter((r) => r.isVerified === args.isVerified);
    if (args.minRating) reviews = reviews.filter((r) => r.rating >= args.minRating!);
    if (args.routeId) reviews = reviews.filter((r) => r.routeId === args.routeId);
    const sorted = reviews.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

/** Admin dashboard review stats */
export const getReviewStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const reviews = await ctx.db.query("reviews").collect();
    const total = reviews.length;
    const avgRating =
      total > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : 0;
    const distribution = [5, 4, 3, 2, 1].map((n) => ({
      rating: n,
      count: reviews.filter((r) => r.rating === n).length,
      percentage:
        total > 0 ? Math.round((reviews.filter((r) => r.rating === n).length / total) * 100) : 0,
    }));
    return {
      total,
      verified: reviews.filter((r) => r.isVerified).length,
      pending: reviews.filter((r) => !r.isVerified).length,
      avgRating,
      distribution,
    };
  },
});

/** User: my reviews */
export const getMyReviews = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .collect();
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Check if user already reviewed a booking */
export const getReviewForBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const review = await ctx.db
      .query("reviews")
      .withIndex("by_bookingId", (q: any) => q.eq("bookingId", args.bookingId))
      .first();
    if (!review) return null;
    if (review.userId !== identity.subject) {
      // admin can also see it
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
        .first();
      if (!profile || profile.accountType !== "admin") return null;
    }
    return review;
  },
});

/** Driver: reviews for routes on their schedules */
export const getMyRouteReviews = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .first();
    if (!profile || profile.accountType !== "driver") throw new Error("Forbidden");

    const schedules = await ctx.db
      .query("schedules")
      .withIndex("by_driverId", (q: any) => q.eq("driverId", identity.subject))
      .collect();
    const routeIds = [...new Set(schedules.map((s) => s.routeId))];

    const allReviews = await ctx.db.query("reviews").collect();
    return allReviews
      .filter((r) => routeIds.includes(r.routeId))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ── Mutations ─────────────────────────────────────────────────

/** User: submit a review — only for completed bookings */
export const createReview = mutation({
  args: {
    bookingId: v.id("bookings"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    if (args.rating < 1 || args.rating > 5) throw new Error("Rating must be between 1 and 5");

    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== identity.subject) throw new Error("Forbidden");
    if (booking.status !== "completed") throw new Error("You can only review completed journeys");

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_bookingId", (q: any) => q.eq("bookingId", args.bookingId))
      .first();
    if (existing) throw new Error("You have already submitted a review for this journey");

    const schedule = await ctx.db.get("schedules", booking.scheduleId);
    if (!schedule) throw new Error("Schedule not found");

    const now = Date.now();
    const reviewId = await ctx.db.insert("reviews", {
      userId: identity.subject,
      bookingId: args.bookingId,
      routeId: schedule.routeId,
      rating: args.rating,
      comment: args.comment?.trim(),
      isVerified: false,
      createdAt: now,
    });

    // Notify admin of new review
    const adminProfiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_accountType", (q: any) => q.eq("accountType", "admin"))
      .collect();
    for (const admin of adminProfiles) {
      await ctx.db.insert("notifications", {
        userId: admin.userId,
        type: "system",
        title: "New Review Submitted",
        message: `A ${args.rating}★ review was submitted for booking ${booking.bookingCode}. Pending verification.`,
        isRead: false,
        data: { reviewId, bookingId: args.bookingId },
        createdAt: now,
      });
    }

    return reviewId;
  },
});

/** User: edit their own review */
export const updateReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    rating: v.optional(v.number()),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const review = await ctx.db.get("reviews", args.reviewId);
    if (!review) throw new Error("Review not found");
    if (review.userId !== identity.subject) throw new Error("Forbidden");
    if (args.rating && (args.rating < 1 || args.rating > 5))
      throw new Error("Rating must be between 1 and 5");

    const patch: any = { updatedAt: Date.now() };
    if (args.rating !== undefined) patch.rating = args.rating;
    if (args.comment !== undefined) patch.comment = args.comment.trim();
    await ctx.db.patch("reviews", args.reviewId, patch);
  },
});

/** Admin: verify or unverify */
export const verifyReview = mutation({
  args: { reviewId: v.id("reviews"), isVerified: v.boolean() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    await ctx.db.patch("reviews", args.reviewId, {
      isVerified: args.isVerified,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: args.isVerified ? "review_verified" : "review_unverified",
      resource: "reviews",
      resourceId: args.reviewId,
      createdAt: Date.now(),
    });
  },
});

/** Admin: add or update a driver response */
export const respondToReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .first();
    if (!profile || !["admin", "driver"].includes(profile.accountType))
      throw new Error("Forbidden");

    await ctx.db.patch("reviews", args.reviewId, {
      driverResponse: args.response.trim(),
      updatedAt: Date.now(),
    });
  },
});

/** Admin or review owner: delete */
export const deleteReview = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const review = await ctx.db.get("reviews", args.reviewId);
    if (!review) throw new Error("Review not found");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .first();
    const isAdmin = profile?.accountType === "admin";
    const isOwner = review.userId === identity.subject;
    if (!isAdmin && !isOwner) throw new Error("Forbidden");

    await ctx.db.delete("reviews", args.reviewId);
    if (isAdmin) {
      await ctx.db.insert("auditLogs", {
        actorId: identity.subject,
        action: "review_deleted_by_admin",
        resource: "reviews",
        resourceId: args.reviewId,
        createdAt: Date.now(),
      });
    }
  },
});
