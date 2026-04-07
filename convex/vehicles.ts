import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Auth helpers ──────────────────────────────────────────────

/**
 * Soft auth check for queries — returns null instead of throwing.
 * Use this in any query the client might call during the auth-resolving window.
 */
async function getDriverOrAdminIdentity(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
    .first();

  if (!profile || !["admin", "driver"].includes(profile.accountType)) return null;
  return { identity, profile };
}

/**
 * Hard auth check for mutations — throws on failure.
 */
async function requireDriverOrAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
    .first();

  if (!profile || !["admin", "driver"].includes(profile.accountType)) throw new Error("Forbidden");

  return { identity, profile };
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

// ── Queries ───────────────────────────────────────────────────

/**
 * Driver: get the vehicle assigned to the current driver.
 *
 * FIX: returns null (not throws) when:
 *  - user is not yet authenticated (auth token still resolving)
 *  - user is authenticated but not a driver/admin
 *  - no vehicle is assigned
 *
 * The client page guards this with useConvexAuth / useSession "skip",
 * but this double-guard ensures zero error logs even during edge-case races.
 */
export const getMyVehicle = query({
  args: {},
  handler: async (ctx) => {
    // Soft check — returns null instead of throwing
    const auth = await getDriverOrAdminIdentity(ctx);
    if (!auth) return null;

    const { identity, profile } = auth;

    // Admins don't have "their own" vehicle
    if (profile.accountType === "admin") return null;

    // Use by_assignedDriverId index (new in schema) — O(1) instead of collect+find
    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_assignedDriverId", (q: any) => q.eq("assignedDriverId", identity.subject))
      .first();

    return vehicle ?? null;
  },
});

/** Admin: get all vehicles */
export const getAllVehicles = query({
  args: {
    type: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .first();
    if (!profile || profile.accountType !== "admin") return [];

    let vehicles = await ctx.db.query("vehicles").collect();

    if (args.isActive !== undefined)
      vehicles = vehicles.filter((v) => v.isActive === args.isActive);
    if (args.type) vehicles = vehicles.filter((v) => v.type === args.type);

    return vehicles.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Get a single vehicle by ID (admin or assigned driver) */
export const getVehicle = query({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    const auth = await getDriverOrAdminIdentity(ctx);
    if (!auth) return null;

    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) return null;

    // Drivers can only see their own vehicle
    if (
      auth.profile.accountType === "driver" &&
      vehicle.assignedDriverId !== auth.identity.subject
    ) {
      return null;
    }

    return vehicle;
  },
});

/** Driver: get their assigned schedule for today (used on driver dashboard) */
export const getMyAssignedSchedules = query({
  args: {},
  handler: async (ctx) => {
    const auth = await getDriverOrAdminIdentity(ctx);
    if (!auth) return [];

    if (auth.profile.accountType !== "driver") return [];

    const schedules = await ctx.db
      .query("schedules")
      .withIndex("by_driverId", (q: any) => q.eq("driverId", auth.identity.subject))
      .collect();

    return schedules
      .filter((s) => ["scheduled", "boarding", "in_transit"].includes(s.status))
      .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  },
});

// ── Mutations ─────────────────────────────────────────────────

/** Admin: create a new vehicle */
export const createVehicle = mutation({
  args: {
    registrationNumber: v.string(),
    type: v.union(v.literal("bus"), v.literal("minibus"), v.literal("matatu"), v.literal("coach")),
    capacity: v.number(),
    make: v.string(),
    model: v.string(),
    year: v.number(),
    color: v.optional(v.string()),
    fuelType: v.optional(
      v.union(v.literal("petrol"), v.literal("diesel"), v.literal("electric"), v.literal("hybrid"))
    ),
    photoUrl: v.optional(v.string()),
    amenities: v.array(v.string()),
    insuranceExpiry: v.optional(v.number()),
    inspectionExpiry: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);

    // Check registration number uniqueness
    const existing = await ctx.db
      .query("vehicles")
      .withIndex("by_registrationNumber", (q: any) =>
        q.eq("registrationNumber", args.registrationNumber.toUpperCase())
      )
      .first();
    if (existing) throw new Error(`Vehicle ${args.registrationNumber} already exists`);

    const now = Date.now();
    const vehicleId = await ctx.db.insert("vehicles", {
      ...args,
      registrationNumber: args.registrationNumber.toUpperCase(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "vehicle_created",
      resource: "vehicles",
      resourceId: vehicleId,
      details: { registrationNumber: args.registrationNumber },
      createdAt: now,
    });

    return vehicleId;
  },
});

/** Admin: update vehicle details */
export const updateVehicle = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    registrationNumber: v.optional(v.string()),
    type: v.optional(
      v.union(v.literal("bus"), v.literal("minibus"), v.literal("matatu"), v.literal("coach"))
    ),
    capacity: v.optional(v.number()),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    color: v.optional(v.string()),
    fuelType: v.optional(
      v.union(v.literal("petrol"), v.literal("diesel"), v.literal("electric"), v.literal("hybrid"))
    ),
    photoUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    amenities: v.optional(v.array(v.string())),
    assignedDriverId: v.optional(v.string()),
    lastMaintenanceDate: v.optional(v.number()),
    nextMaintenanceDate: v.optional(v.number()),
    insuranceExpiry: v.optional(v.number()),
    inspectionExpiry: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);

    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    const { vehicleId, ...updates } = args;
    const patch: Record<string, any> = {};
    for (const [k, val] of Object.entries(updates)) {
      if (val !== undefined) patch[k] = val;
    }
    if (patch.registrationNumber) {
      patch.registrationNumber = (patch.registrationNumber as string).toUpperCase();
    }

    await ctx.db.patch("vehicles", vehicleId, { ...patch, updatedAt: Date.now() });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "vehicle_updated",
      resource: "vehicles",
      resourceId: vehicleId,
      details: patch,
      createdAt: Date.now(),
    });
  },
});

/** Admin: assign a driver to a vehicle */
export const assignDriver = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    driverId: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);

    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    const driverProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.driverId))
      .first();
    if (!driverProfile || driverProfile.accountType !== "driver")
      throw new Error("User is not a driver");

    // Use by_assignedDriverId index — avoids unbounded collect of all vehicles
    const otherVehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_assignedDriverId", (q: any) => q.eq("assignedDriverId", args.driverId))
      .collect();
    for (const v of otherVehicles) {
      if (v._id !== args.vehicleId)
        await ctx.db.patch("vehicles", v._id, {
          assignedDriverId: undefined,
          updatedAt: Date.now(),
        });
    }

    await ctx.db.patch("vehicles", args.vehicleId, {
      assignedDriverId: args.driverId,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: args.driverId,
      type: "system",
      title: "Vehicle Assigned",
      message: `You have been assigned to vehicle ${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model}).`,
      isRead: false,
      createdAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "vehicle_driver_assigned",
      resource: "vehicles",
      resourceId: args.vehicleId,
      details: { driverId: args.driverId },
      createdAt: Date.now(),
    });
  },
});

/** Admin: unassign driver from vehicle */
export const unassignDriver = mutation({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);

    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    await ctx.db.patch("vehicles", args.vehicleId, {
      assignedDriverId: undefined,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "vehicle_driver_unassigned",
      resource: "vehicles",
      resourceId: args.vehicleId,
      createdAt: Date.now(),
    });
  },
});

/** Admin: toggle vehicle active/inactive */
export const toggleVehicleActive = mutation({
  args: { vehicleId: v.id("vehicles"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);

    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    await ctx.db.patch("vehicles", args.vehicleId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: args.isActive ? "vehicle_activated" : "vehicle_deactivated",
      resource: "vehicles",
      resourceId: args.vehicleId,
      createdAt: Date.now(),
    });
  },
});

/** Admin: delete a vehicle */
export const deleteVehicle = mutation({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);

    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    // Use by_vehicleId index (new in schema) — avoids unbounded collect of all schedules
    const activeSchedule = await ctx.db
      .query("schedules")
      .withIndex("by_vehicleId", (q: any) => q.eq("vehicleId", args.vehicleId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "scheduled"),
          q.eq(q.field("status"), "boarding"),
          q.eq(q.field("status"), "in_transit")
        )
      )
      .first();
    if (activeSchedule) {
      throw new Error("Cannot delete a vehicle with active schedules");
    }

    await ctx.db.delete("vehicles", args.vehicleId);

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "vehicle_deleted",
      resource: "vehicles",
      resourceId: args.vehicleId,
      details: { registrationNumber: vehicle.registrationNumber },
      createdAt: Date.now(),
    });
  },
});

/** Driver: update maintenance notes / report an issue (limited fields) */
export const driverUpdateVehicle = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    lastMaintenanceDate: v.optional(v.number()),
    nextMaintenanceDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity, profile } = await requireDriverOrAdmin(ctx);

    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    // Driver can only update their own assigned vehicle
    if (profile.accountType === "driver" && vehicle.assignedDriverId !== identity.subject) {
      throw new Error("Forbidden: not your assigned vehicle");
    }

    const { vehicleId, ...updates } = args;
    await ctx.db.patch("vehicles", vehicleId, { ...updates, updatedAt: Date.now() });
  },
});
// ── Missing exports called by admin/vehicles/page.tsx ─────────────

/**
 * Admin: fleet statistics — total, active, inactive, assigned, overdue maintenance.
 * Soft auth — returns null during token-resolving window.
 */
export const getFleetStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .first();
    if (!profile || profile.accountType !== "admin") return null;

    const vehicles = await ctx.db.query("vehicles").collect();
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    return {
      total: vehicles.length,
      active: vehicles.filter((v) => v.isActive).length,
      inactive: vehicles.filter((v) => !v.isActive).length,
      assigned: vehicles.filter((v) => v.isActive && v.assignedDriverId).length,
      overdueMaintenance: vehicles.filter(
        (v) => v.nextMaintenanceDate && v.nextMaintenanceDate < now
      ).length,
      dueSoonMaintenance: vehicles.filter(
        (v) =>
          v.nextMaintenanceDate &&
          v.nextMaintenanceDate >= now &&
          v.nextMaintenanceDate < now + sevenDays
      ).length,
    };
  },
});

/**
 * Admin: assign a driver to a vehicle (alias expected by the vehicles page).
 * The page uses assignVehicleToDriver({ vehicleId, driverId }).
 */
export const assignVehicleToDriver = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    driverId: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);

    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    const driverProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.driverId))
      .first();
    if (!driverProfile || driverProfile.accountType !== "driver")
      throw new Error("User is not a driver");

    // Use by_assignedDriverId index — avoids unbounded collect of all vehicles
    const others = await ctx.db
      .query("vehicles")
      .withIndex("by_assignedDriverId", (q: any) => q.eq("assignedDriverId", args.driverId))
      .collect();
    for (const v of others) {
      if (v._id !== args.vehicleId)
        await ctx.db.patch("vehicles", v._id, {
          assignedDriverId: undefined,
          updatedAt: Date.now(),
        });
    }

    await ctx.db.patch("vehicles", args.vehicleId, {
      assignedDriverId: args.driverId,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: args.driverId,
      type: "system",
      title: "Vehicle Assigned",
      message: `You have been assigned to vehicle ${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model}).`,
      isRead: false,
      createdAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "vehicle_driver_assigned",
      resource: "vehicles",
      resourceId: args.vehicleId,
      details: { driverId: args.driverId },
      createdAt: Date.now(),
    });
  },
});

/**
 * Admin: unassign the driver from a vehicle (alias expected by the vehicles page).
 * The page uses unassignVehicle({ vehicleId }).
 */
export const unassignVehicle = mutation({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);

    const vehicle = await ctx.db.get("vehicles", args.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    await ctx.db.patch("vehicles", args.vehicleId, {
      assignedDriverId: undefined,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "vehicle_driver_unassigned",
      resource: "vehicles",
      resourceId: args.vehicleId,
      createdAt: Date.now(),
    });
  },
});
