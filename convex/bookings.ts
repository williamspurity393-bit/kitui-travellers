import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "KT-";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
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

/** Notify all admin accounts — inline fan-out (avoids calling another mutation) */
async function notifyAdmins(
  ctx: any,
  payload: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
) {
  const admins = await ctx.db
    .query("userProfiles")
    .withIndex("by_accountType", (q: any) => q.eq("accountType", "admin"))
    .collect();
  const now = Date.now();
  await Promise.all(
    admins.map((a: any) =>
      ctx.db.insert("notifications", {
        userId: a.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        isRead: false,
        data: payload.data,
        createdAt: now,
      })
    )
  );
}

// ── Queries ───────────────────────────────────────────────────

export const getMyBookings = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("cancelled"),
        v.literal("completed"),
        v.literal("refunded")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
    const filtered = args.status ? bookings.filter((b) => b.status === args.status) : bookings;
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) return null;
    if (booking.userId !== identity.subject) {
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
        .first();
      if (!profile || !["admin", "driver"].includes(profile.accountType))
        throw new Error("Forbidden");
    }
    return booking;
  },
});

export const getBookingDetail = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) return null;
    if (booking.userId !== identity.subject) {
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
        .first();
      if (!profile || profile.accountType !== "admin") throw new Error("Forbidden");
    }
    const schedule = await ctx.db.get("schedules", booking.scheduleId);
    const route = schedule ? await ctx.db.get("routes", schedule.routeId) : null;
    return { ...booking, schedule, route };
  },
});

export const getAllBookings = query({
  args: {
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
    await requireAdmin(ctx);
    let bookings = await ctx.db.query("bookings").collect();
    if (args.status) bookings = bookings.filter((b) => b.status === args.status);
    bookings.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? bookings.slice(0, args.limit) : bookings;
  },
});

export const getBookingsBySchedule = query({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!profile) throw new Error("Profile not found");
    if (profile.accountType !== "admin") {
      const schedule = await ctx.db.get("schedules", args.scheduleId);
      if (!schedule || schedule.driverId !== identity.subject) throw new Error("Forbidden");
    }
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_scheduleId", (q) => q.eq("scheduleId", args.scheduleId))
      .collect();
    return bookings
      .filter((b) => b.status === "confirmed")
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

// ── Mutations ─────────────────────────────────────────────────

export const createBooking = mutation({
  args: {
    scheduleId: v.id("schedules"),
    passengers: v.array(
      v.object({
        name: v.string(),
        idNumber: v.optional(v.string()),
        seatNumber: v.optional(v.string()),
      })
    ),
    promoCode: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (profile?.isBanned) throw new Error("Your account is suspended");

    const schedule = await ctx.db.get("schedules", args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    if (schedule.status === "cancelled") throw new Error("This schedule has been cancelled");
    if (!["scheduled", "boarding"].includes(schedule.status))
      throw new Error("Booking is no longer available for this schedule");
    if (schedule.availableSeats < args.passengers.length)
      throw new Error(`Only ${schedule.availableSeats} seat(s) available`);

    const route = await ctx.db.get("routes", schedule.routeId);
    if (!route) throw new Error("Route not found");
    if (!route.isActive) throw new Error("This route is no longer active");

    let totalAmount = route.basePrice * args.passengers.length;
    let discountAmount = 0;

    if (args.promoCode) {
      const promo = await ctx.db
        .query("promoCodes")
        .withIndex("by_code", (q) => q.eq("code", args.promoCode!.toUpperCase()))
        .first();
      if (!promo || !promo.isActive) throw new Error("Invalid or inactive promo code");
      if (promo.expiresAt && promo.expiresAt < Date.now())
        throw new Error("Promo code has expired");
      if (promo.maxUses && promo.usedCount >= promo.maxUses)
        throw new Error("Promo code usage limit reached");
      discountAmount =
        promo.discountType === "percentage"
          ? Math.round((totalAmount * promo.discountValue) / 100)
          : Math.min(promo.discountValue, totalAmount);
      totalAmount = Math.max(0, totalAmount - discountAmount);
      await ctx.db.patch("promoCodes", promo._id, { usedCount: promo.usedCount + 1 });
    }

    let bookingCode = "";
    let attempts = 0;
    do {
      bookingCode = generateBookingCode();
      const existing = await ctx.db
        .query("bookings")
        .withIndex("by_bookingCode", (q) => q.eq("bookingCode", bookingCode))
        .first();
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const now = Date.now();
    const bookingId = await ctx.db.insert("bookings", {
      userId,
      scheduleId: args.scheduleId,
      bookingCode,
      status: "pending",
      passengers: args.passengers,
      totalAmount,
      promoCode: args.promoCode?.toUpperCase(),
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      paymentStatus: "pending",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch("schedules", args.scheduleId, {
      availableSeats: schedule.availableSeats - args.passengers.length,
      updatedAt: now,
    });

    // ── Notify passenger ────────────────────────────────────────
    await ctx.db.insert("notifications", {
      userId,
      type: "booking_confirmed",
      title: "Booking Created",
      message: `Booking ${bookingCode} created. Complete M-Pesa payment to confirm your seat.`,
      isRead: false,
      data: { bookingId },
      createdAt: now,
    });

    // ── Notify driver (NEW) ─────────────────────────────────────
    if (schedule.driverId) {
      const paxCount = args.passengers.length;
      const remaining = schedule.availableSeats - paxCount;
      await ctx.db.insert("notifications", {
        userId: schedule.driverId,
        type: "booking_confirmed",
        title: `New Booking — ${route.name}`,
        message: `${paxCount} passenger${paxCount > 1 ? "s" : ""} booked for your ${schedule.departureTime} departure. ${remaining} seat${remaining !== 1 ? "s" : ""} remaining.`,
        isRead: false,
        data: {
          bookingId,
          bookingCode,
          scheduleId: args.scheduleId,
          passengerCount: paxCount,
          seatsRemaining: remaining,
        },
        createdAt: now,
      });
    }

    // ── Notify admins when schedule is nearly full (≤10% seats left) ──
    const remaining = schedule.availableSeats - args.passengers.length;
    const fillPct = ((schedule.totalSeats - remaining) / schedule.totalSeats) * 100;
    if (fillPct >= 90) {
      await notifyAdmins(ctx, {
        type: "system",
        title: `Schedule Nearly Full — ${route.name}`,
        message: `${route.name} ${schedule.departureTime} is ${Math.round(fillPct)}% full. Only ${remaining} seat${remaining !== 1 ? "s" : ""} left.`,
        data: { scheduleId: args.scheduleId, bookingId, fillPct },
      });
    }

    return { bookingId, bookingCode, totalAmount };
  },
});

export const cancelBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    cancelReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== identity.subject) throw new Error("Forbidden");
    if (!["pending", "confirmed"].includes(booking.status))
      throw new Error(`Cannot cancel a ${booking.status} booking`);

    const now = Date.now();
    const schedule = await ctx.db.get("schedules", booking.scheduleId);

    if (schedule) {
      await ctx.db.patch("schedules", booking.scheduleId, {
        availableSeats: schedule.availableSeats + booking.passengers.length,
        updatedAt: now,
      });
    }

    await ctx.db.patch("bookings", args.bookingId, {
      status: "cancelled",
      cancelReason: args.cancelReason,
      updatedAt: now,
    });

    // ── Notify passenger ────────────────────────────────────────
    await ctx.db.insert("notifications", {
      userId: booking.userId,
      type: "booking_cancelled",
      title: "Booking Cancelled",
      message: `Your booking ${booking.bookingCode} has been cancelled.`,
      isRead: false,
      data: { bookingId: args.bookingId },
      createdAt: now,
    });

    // ── Notify driver (NEW) ─────────────────────────────────────
    if (schedule?.driverId) {
      const paxCount = booking.passengers.length;
      const newAvail = schedule.availableSeats + paxCount;
      await ctx.db.insert("notifications", {
        userId: schedule.driverId,
        type: "booking_cancelled",
        title: `Cancellation — ${booking.bookingCode}`,
        message: `${paxCount} passenger${paxCount > 1 ? "s" : ""} cancelled from your ${schedule.departureTime} departure. ${newAvail} seat${newAvail !== 1 ? "s" : ""} now available.`,
        isRead: false,
        data: {
          bookingId: args.bookingId,
          bookingCode: booking.bookingCode,
          scheduleId: booking.scheduleId,
          passengerCount: paxCount,
          seatsAvailable: newAvail,
        },
        createdAt: now,
      });
    }
  },
});

export const adminCompleteBooking = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "confirmed") throw new Error("Only confirmed bookings can be completed");
    await ctx.db.patch("bookings", args.bookingId, { status: "completed", updatedAt: Date.now() });
    await ctx.db.insert("notifications", {
      userId: booking.userId,
      type: "trip_completed",
      title: "Trip Completed",
      message: `Booking ${booking.bookingCode} marked complete. Rate your journey!`,
      isRead: false,
      data: { bookingId: args.bookingId },
      createdAt: Date.now(),
    });
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "booking_completed_by_admin",
      resource: "bookings",
      resourceId: args.bookingId,
      createdAt: Date.now(),
    });
  },
});

export const bulkCancelBookings = mutation({
  args: {
    bookingIds: v.array(v.id("bookings")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const now = Date.now();
    let count = 0;

    for (const bookingId of args.bookingIds) {
      const booking = await ctx.db.get("bookings", bookingId);
      if (!booking || !["pending", "confirmed"].includes(booking.status)) continue;

      const schedule = await ctx.db.get("schedules", booking.scheduleId);
      if (schedule) {
        await ctx.db.patch("schedules", booking.scheduleId, {
          availableSeats: schedule.availableSeats + booking.passengers.length,
          updatedAt: now,
        });
      }

      await ctx.db.patch("bookings", bookingId, {
        status: "cancelled",
        cancelReason: args.reason ?? "Cancelled by admin",
        updatedAt: now,
      });

      await ctx.db.insert("notifications", {
        userId: booking.userId,
        type: "booking_cancelled",
        title: "Booking Cancelled by Admin",
        message: `Your booking ${booking.bookingCode} was cancelled.${args.reason ? ` Reason: ${args.reason}` : ""}`,
        isRead: false,
        data: { bookingId },
        createdAt: now,
      });

      count++;
    }

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "bulk_cancel_bookings",
      resource: "bookings",
      details: { count, reason: args.reason },
      createdAt: now,
    });

    return { cancelled: count };
  },
});

export const checkinPassenger = mutation({
  args: {
    bookingId: v.id("bookings"),
    checkedIn: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!profile || !["admin", "driver"].includes(profile.accountType))
      throw new Error("Forbidden");

    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) throw new Error("Booking not found");

    if (profile.accountType === "driver") {
      const schedule = await ctx.db.get("schedules", booking.scheduleId);
      if (!schedule || schedule.driverId !== identity.subject) throw new Error("Not your schedule");
    }

    const now = Date.now();
    await ctx.db.patch("bookings", args.bookingId, {
      checkedIn: args.checkedIn,
      checkedInAt: args.checkedIn ? now : undefined,
      updatedAt: now,
    });

    return { ok: true };
  },
});
