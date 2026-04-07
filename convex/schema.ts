import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── User profiles ────────────────────────────────────────────
  userProfiles: defineTable({
    userId: v.string(),
    accountType: v.union(v.literal("user"), v.literal("driver"), v.literal("admin")),
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()),
    isOnboarded: v.boolean(),

    // Display info from better-auth sign-up
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),

    // Extended profile
    dateOfBirth: v.optional(v.number()),
    nationalId: v.optional(v.string()),
    emergencyContact: v.optional(
      v.object({
        name: v.string(),
        phone: v.string(),
        relationship: v.optional(v.string()),
      })
    ),
    preferredPaymentMethod: v.optional(v.string()),
    walletBalance: v.optional(v.number()),
    totalTrips: v.optional(v.number()),
    loyaltyPoints: v.optional(v.number()),

    // Ban management (admin-controlled)
    isBanned: v.optional(v.boolean()),
    banReason: v.optional(v.string()),
    banExpiresAt: v.optional(v.number()),

    // Driver-specific
    licenseNumber: v.optional(v.string()),
    licenseExpiry: v.optional(v.number()),
    vehicleType: v.optional(
      v.union(v.literal("bus"), v.literal("minibus"), v.literal("matatu"), v.literal("coach"))
    ),
    vehicleNumber: v.optional(v.string()),
    vehicleCapacity: v.optional(v.number()),
    isVerifiedDriver: v.optional(v.boolean()),
    driverRating: v.optional(v.number()),
    totalRatings: v.optional(v.number()),

    // Used by AI chat agent: own key → default key (if admin-enabled) → no AI
    geminiApiKey: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_accountType", ["accountType"])
    .index("by_banned", ["isBanned"]),

  // ── Routes ───────────────────────────────────────────────────
  routes: defineTable({
    name: v.string(),
    origin: v.string(),
    destination: v.string(),
    stops: v.array(v.string()),
    distanceKm: v.number(),
    durationMinutes: v.number(),
    basePrice: v.number(),
    vehicleType: v.string(),
    amenities: v.array(v.string()),
    isActive: v.boolean(),
    createdBy: v.string(),

    // NEW fields
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    peakHourSurcharge: v.optional(v.number()),
    returnRouteId: v.optional(v.id("routes")),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_origin", ["origin"])
    .index("by_destination", ["destination"])
    .index("by_active", ["isActive"]),

  // ── Schedules ────────────────────────────────────────────────
  schedules: defineTable({
    routeId: v.id("routes"),
    driverId: v.optional(v.string()),
    vehicleId: v.optional(v.id("vehicles")),
    departureTime: v.string(), // "HH:MM" wall-clock time
    arrivalTime: v.string(),
    date: v.optional(v.string()), // NEW: "YYYY-MM-DD" — the specific run date
    totalSeats: v.number(),
    availableSeats: v.number(),
    price: v.optional(v.number()), // NEW: per-schedule price override (falls back to route basePrice)
    status: v.union(
      v.literal("scheduled"),
      v.literal("boarding"),
      v.literal("in_transit"),
      v.literal("arrived"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()), // NEW: driver/admin notes
    recurrenceRule: v.optional(v.string()), // NEW: iCal RRULE string for repeating schedules
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_routeId", ["routeId"])
    .index("by_driverId", ["driverId"])
    .index("by_status", ["status"])
    .index("by_date", ["date"])
    // NEW: enables O(1) "does vehicle have active schedules?" check in deleteVehicle
    .index("by_vehicleId", ["vehicleId"]),

  // ── Vehicles ─────────────────────────────────────────────────
  vehicles: defineTable({
    registrationNumber: v.string(),
    type: v.union(v.literal("bus"), v.literal("minibus"), v.literal("matatu"), v.literal("coach")),
    capacity: v.number(),
    make: v.string(),
    model: v.string(),
    year: v.number(),
    color: v.optional(v.string()), // NEW
    fuelType: v.optional(
      v.union(
        // NEW
        v.literal("petrol"),
        v.literal("diesel"),
        v.literal("electric"),
        v.literal("hybrid")
      )
    ),
    photoUrl: v.optional(v.string()), // NEW
    isActive: v.boolean(),
    amenities: v.array(v.string()),
    assignedDriverId: v.optional(v.string()),
    lastMaintenanceDate: v.optional(v.number()),
    nextMaintenanceDate: v.optional(v.number()),
    insuranceExpiry: v.optional(v.number()), // NEW: epoch ms
    inspectionExpiry: v.optional(v.number()), // NEW: epoch ms — NTSA inspection sticker
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_registrationNumber", ["registrationNumber"])
    .index("by_type", ["type"])
    .index("by_active", ["isActive"])
    // NEW: enables O(1) driver→vehicle lookup in getMyVehicle, assignDriver
    .index("by_assignedDriverId", ["assignedDriverId"]),

  // ── Bookings ─────────────────────────────────────────────────
  bookings: defineTable({
    userId: v.string(),
    scheduleId: v.id("schedules"),
    bookingCode: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("refunded")
    ),
    passengers: v.array(
      v.object({
        name: v.string(),
        idNumber: v.optional(v.string()),
        seatNumber: v.optional(v.string()),
        phone: v.optional(v.string()), // NEW: per-passenger contact
      })
    ),
    totalAmount: v.number(),
    promoCode: v.optional(v.string()),
    discountAmount: v.optional(v.number()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    paymentMethod: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
    paymentId: v.optional(v.id("payments")),

    // NEW fields
    boardingPoint: v.optional(v.string()), // specific stop where passenger boards
    alightingPoint: v.optional(v.string()), // specific stop where passenger alights
    tripDate: v.optional(v.string()), // "YYYY-MM-DD" — denormalised for quick queries
    ticketUrl: v.optional(v.string()), // generated PDF/QR ticket URL
    checkedIn: v.optional(v.boolean()), // driver scanned ticket
    checkedInAt: v.optional(v.number()),
    refundAmount: v.optional(v.number()), // actual amount refunded (may differ from totalAmount)
    refundedAt: v.optional(v.number()),

    notes: v.optional(v.string()),
    cancelReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_scheduleId", ["scheduleId"])
    .index("by_bookingCode", ["bookingCode"])
    .index("by_status", ["status"])
    .index("by_paymentStatus", ["paymentStatus"])
    .index("by_tripDate", ["tripDate"]), // NEW index

  // ── Payments (M-Pesa STK Push) ────────────────────────────────
  payments: defineTable({
    userId: v.string(),
    bookingId: v.id("bookings"),
    amount: v.number(),
    phoneNumber: v.string(),
    merchantRequestId: v.optional(v.string()),
    checkoutRequestId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    mpesaReceiptNumber: v.optional(v.string()),
    mpesaTransactionDate: v.optional(v.number()),
    resultCode: v.optional(v.number()),
    resultDesc: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    attemptCount: v.number(),

    // NEW fields
    transactionType: v.optional(
      v.union(
        // STK push vs manual cash/bank
        v.literal("stk_push"),
        v.literal("manual"),
        v.literal("wallet")
      )
    ),
    initiatedBy: v.optional(v.string()), // userId of admin if manual
    rawCallback: v.optional(v.any()), // raw M-Pesa callback payload for debugging

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_bookingId", ["bookingId"])
    .index("by_checkoutRequestId", ["checkoutRequestId"])
    .index("by_status", ["status"])
    .index("by_mpesaReceiptNumber", ["mpesaReceiptNumber"]),

  // ── Wallet / money usage history ──────────────────────────────
  walletTransactions: defineTable({
    userId: v.string(),
    type: v.union(v.literal("payment"), v.literal("refund"), v.literal("failed")),
    amount: v.number(),
    description: v.string(),
    bookingId: v.optional(v.id("bookings")),
    paymentId: v.optional(v.id("payments")),
    mpesaReceiptNumber: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_bookingId", ["bookingId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  // ── Promo codes ──────────────────────────────────────────────
  promoCodes: defineTable({
    code: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountValue: v.number(),
    description: v.optional(v.string()),
    maxUses: v.optional(v.number()),
    usedCount: v.number(),
    minBookingAmount: v.optional(v.number()), // NEW: minimum fare to qualify
    applicableRouteIds: v.optional(v.array(v.id("routes"))), // NEW: restrict to specific routes
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"]),

  // ── Reviews ──────────────────────────────────────────────────
  reviews: defineTable({
    userId: v.string(),
    bookingId: v.id("bookings"),
    routeId: v.id("routes"),
    driverId: v.optional(v.string()), // NEW: link to driver being reviewed
    rating: v.number(),
    driverRating: v.optional(v.number()), // NEW: separate driver rating
    comment: v.optional(v.string()),
    isVerified: v.boolean(),
    isHidden: v.optional(v.boolean()), // NEW: admin can hide inappropriate reviews
    driverResponse: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_routeId", ["routeId"])
    .index("by_bookingId", ["bookingId"])
    .index("by_driverId", ["driverId"]), // NEW index

  // ── Notifications ─────────────────────────────────────────────
  notifications: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("booking_confirmed"),
      v.literal("booking_cancelled"),
      v.literal("payment_received"),
      v.literal("payment_failed"),
      v.literal("trip_reminder"),
      v.literal("trip_started"),
      v.literal("trip_completed"),
      v.literal("system"),
      v.literal("promo"), // NEW
      v.literal("review_request") // NEW: prompt user to review after trip
    ),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    data: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_unread", ["userId", "isRead"]),

  // ── Audit logs ────────────────────────────────────────────────
  auditLogs: defineTable({
    actorId: v.string(),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    details: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_actorId", ["actorId"])
    .index("by_resource", ["resource"]),

  // ── Driver Earnings ───────────────────────────────────────────
  // TODO: Replace with real M-Pesa B2C disbursement when implemented.
  driverEarnings: defineTable({
    driverId: v.string(),
    bookingId: v.id("bookings"),
    scheduleId: v.id("schedules"),
    grossAmount: v.number(),
    commissionRate: v.number(),
    commissionAmount: v.number(),
    netAmount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("disbursed"),
      v.literal("failed")
    ),
    mpesaReference: v.optional(v.string()),
    disbursedAt: v.optional(v.number()), // NEW: epoch ms when B2C was confirmed
    notes: v.optional(v.string()), // NEW: admin notes / failure reason
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_driverId", ["driverId"])
    .index("by_bookingId", ["bookingId"])
    .index("by_status", ["status"]),

  // ── System Settings ───────────────────────────────────────────
  systemSettings: defineTable({
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
    updatedBy: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // ── Passenger Manifest ────────────────────────────────────────
  // Was referenced in the changelog but missing from the schema.
  // Driver-facing list of confirmed passengers for a given schedule.
  passengerManifest: defineTable({
    scheduleId: v.id("schedules"),
    bookingId: v.id("bookings"),
    userId: v.string(),
    passengerName: v.string(),
    passengerIdNumber: v.optional(v.string()),
    seatNumber: v.optional(v.string()),
    boardingPoint: v.optional(v.string()),
    alightingPoint: v.optional(v.string()),
    phone: v.optional(v.string()),
    checkedIn: v.boolean(),
    checkedInAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_scheduleId", ["scheduleId"])
    .index("by_bookingId", ["bookingId"])
    .index("by_userId", ["userId"]),

  // ── Support Tickets ───────────────────────────────────────────
  // NEW table: users can raise issues; admins respond.
  supportTickets: defineTable({
    userId: v.string(),
    bookingId: v.optional(v.id("bookings")), // linked booking if relevant
    subject: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    assignedTo: v.optional(v.string()), // admin userId
    resolution: v.optional(v.string()),
    messages: v.array(
      v.object({
        senderId: v.string(),
        senderType: v.union(v.literal("user"), v.literal("admin")),
        message: v.string(),
        sentAt: v.number(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_bookingId", ["bookingId"]),

  // ── Waitlist ──────────────────────────────────────────────────
  // NEW table: when a schedule is full, users join a waitlist.
  waitlist: defineTable({
    userId: v.string(),
    scheduleId: v.id("schedules"),
    seatsRequested: v.number(),
    status: v.union(
      v.literal("waiting"), // still in queue
      v.literal("notified"), // seat became available, user notified
      v.literal("booked"), // user followed through and booked
      v.literal("expired"), // user didn't act in time
      v.literal("cancelled") // user removed themselves
    ),
    notifiedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()), // deadline to claim the seat
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_scheduleId", ["scheduleId"])
    .index("by_status", ["status"]),

  // ── Gemini Allowlist ──────────────────────────────────────────
  // Admin grants specific users access to the shared GEMINI_API_KEY env var.
  // Used when gemini_X_mode = "allowlist" for their role.
  geminiAllowlist: defineTable({
    userId: v.string(), // Convex identity subject
    email: v.optional(v.string()), // denormalised for admin UI display
    fullName: v.optional(v.string()),
    accountType: v.union(v.literal("user"), v.literal("driver"), v.literal("admin")),
    grantedBy: v.string(), // admin userId
    grantedAt: v.number(),
    note: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_accountType", ["accountType"]),

  // ── Device Fingerprints ───────────────────────────────────────
  // Maps a browser fingerprint → userId.
  // Prevents one person from creating multiple accounts to abuse the
  // shared Gemini key ("Cursor-style" device-level free tier).
  // A fingerprint is blocked from the shared key if it is linked to
  // MORE THAN ONE userId (multi-account detection).
  deviceFingerprints: defineTable({
    fingerprint: v.string(), // 32-char hex hash of browser signals
    userId: v.string(), // first userId that used this fingerprint
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    blocked: v.optional(v.boolean()), // admin can manually block a fingerprint
    blockReason: v.optional(v.string()),
  })
    .index("by_fingerprint", ["fingerprint"])
    .index("by_userId", ["userId"]),
});
