import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── Seed data ─────────────────────────────────────────────────

const SEED_DRIVERS = [
  // ── Matatu drivers (short local routes) ───────────────────
  {
    userId: "seed_driver_matatu_001",
    fullName: "James Mutua",
    phone: "+254711001001",
    accountType: "driver" as const,
    vehicleType: "matatu" as const,
    vehicleNumber: "KBZ 001M",
    vehicleCapacity: 14,
    licenseNumber: "DL-MT-001",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_matatu_002",
    fullName: "Peter Kioko",
    phone: "+254711001002",
    accountType: "driver" as const,
    vehicleType: "matatu" as const,
    vehicleNumber: "KBZ 002M",
    vehicleCapacity: 14,
    licenseNumber: "DL-MT-002",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_matatu_003",
    fullName: "David Musyoka",
    phone: "+254711001003",
    accountType: "driver" as const,
    vehicleType: "matatu" as const,
    vehicleNumber: "KBZ 003M",
    vehicleCapacity: 14,
    licenseNumber: "DL-MT-003",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_matatu_004",
    fullName: "Samuel Nzomo",
    phone: "+254711001004",
    accountType: "driver" as const,
    vehicleType: "matatu" as const,
    vehicleNumber: "KBZ 004M",
    vehicleCapacity: 14,
    licenseNumber: "DL-MT-004",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_matatu_005",
    fullName: "Joseph Mwangangi",
    phone: "+254711001005",
    accountType: "driver" as const,
    vehicleType: "matatu" as const,
    vehicleNumber: "KBZ 005M",
    vehicleCapacity: 14,
    licenseNumber: "DL-MT-005",
    isVerifiedDriver: true,
    isOnboarded: true,
  },

  // ── Minibus drivers (medium routes) ───────────────────────
  {
    userId: "seed_driver_minibus_001",
    fullName: "Charles Muendo",
    phone: "+254722002001",
    accountType: "driver" as const,
    vehicleType: "minibus" as const,
    vehicleNumber: "KCA 001B",
    vehicleCapacity: 25,
    licenseNumber: "DL-MB-001",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_minibus_002",
    fullName: "Francis Mutisya",
    phone: "+254722002002",
    accountType: "driver" as const,
    vehicleType: "minibus" as const,
    vehicleNumber: "KCA 002B",
    vehicleCapacity: 25,
    licenseNumber: "DL-MB-002",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_minibus_003",
    fullName: "Patrick Mulwa",
    phone: "+254722002003",
    accountType: "driver" as const,
    vehicleType: "minibus" as const,
    vehicleNumber: "KCA 003B",
    vehicleCapacity: 25,
    licenseNumber: "DL-MB-003",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_minibus_004",
    fullName: "Anthony Mbuvi",
    phone: "+254722002004",
    accountType: "driver" as const,
    vehicleType: "minibus" as const,
    vehicleNumber: "KCA 004B",
    vehicleCapacity: 25,
    licenseNumber: "DL-MB-004",
    isVerifiedDriver: true,
    isOnboarded: true,
  },

  // ── Bus drivers (long-haul routes) ────────────────────────
  {
    userId: "seed_driver_bus_001",
    fullName: "Robert Ndolo",
    phone: "+254733003001",
    accountType: "driver" as const,
    vehicleType: "bus" as const,
    vehicleNumber: "KDG 001S",
    vehicleCapacity: 49,
    licenseNumber: "DL-BS-001",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_bus_002",
    fullName: "Michael Makau",
    phone: "+254733003002",
    accountType: "driver" as const,
    vehicleType: "bus" as const,
    vehicleNumber: "KDG 002S",
    vehicleCapacity: 49,
    licenseNumber: "DL-BS-002",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_bus_003",
    fullName: "Stephen Maingi",
    phone: "+254733003003",
    accountType: "driver" as const,
    vehicleType: "bus" as const,
    vehicleNumber: "KDG 003S",
    vehicleCapacity: 49,
    licenseNumber: "DL-BS-003",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_bus_004",
    fullName: "George Kathuku",
    phone: "+254733003004",
    accountType: "driver" as const,
    vehicleType: "bus" as const,
    vehicleNumber: "KDG 004S",
    vehicleCapacity: 49,
    licenseNumber: "DL-BS-004",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_bus_005",
    fullName: "Daniel Wambua",
    phone: "+254733003005",
    accountType: "driver" as const,
    vehicleType: "bus" as const,
    vehicleNumber: "KDG 005S",
    vehicleCapacity: 49,
    licenseNumber: "DL-BS-005",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_bus_006",
    fullName: "Paul Mutunga",
    phone: "+254733003006",
    accountType: "driver" as const,
    vehicleType: "bus" as const,
    vehicleNumber: "KDG 006S",
    vehicleCapacity: 49,
    licenseNumber: "DL-BS-006",
    isVerifiedDriver: true,
    isOnboarded: true,
  },

  // ── Coach drivers (VIP long-haul: Eldoret, Kisumu, Nakuru) ──
  {
    userId: "seed_driver_coach_001",
    fullName: "John Mwanzia",
    phone: "+254744004001",
    accountType: "driver" as const,
    vehicleType: "coach" as const,
    vehicleNumber: "KDH 001C",
    vehicleCapacity: 49,
    licenseNumber: "DL-CH-001",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_coach_002",
    fullName: "Mark Kyalo",
    phone: "+254744004002",
    accountType: "driver" as const,
    vehicleType: "coach" as const,
    vehicleNumber: "KDH 002C",
    vehicleCapacity: 49,
    licenseNumber: "DL-CH-002",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
  {
    userId: "seed_driver_coach_003",
    fullName: "Eric Nzioki",
    phone: "+254744004003",
    accountType: "driver" as const,
    vehicleType: "coach" as const,
    vehicleNumber: "KDH 003C",
    vehicleCapacity: 49,
    licenseNumber: "DL-CH-003",
    isVerifiedDriver: true,
    isOnboarded: true,
  },
];

// ── Seed mutation ─────────────────────────────────────────────

export const seedDrivers = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let created = 0;
    let skipped = 0;

    for (const driver of SEED_DRIVERS) {
      // Check if already exists by userId to make this idempotent
      const existing = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", driver.userId))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("userProfiles", {
        userId: driver.userId,
        fullName: driver.fullName,
        phone: driver.phone,
        accountType: driver.accountType,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber,
        vehicleCapacity: driver.vehicleCapacity,
        licenseNumber: driver.licenseNumber,
        isVerifiedDriver: driver.isVerifiedDriver,
        isOnboarded: driver.isOnboarded,
        createdAt: now,
        updatedAt: now,
      });

      created++;
    }

    return {
      created,
      skipped,
      total: SEED_DRIVERS.length,
      message: `✅ Seeded ${created} drivers (${skipped} already existed). Total: ${SEED_DRIVERS.length} drivers.`,
    };
  },
});

// ── Clear seeded drivers (for re-seeding) ─────────────────────

export const clearSeededDrivers = mutation({
  args: {},
  handler: async (ctx) => {
    let deleted = 0;

    for (const driver of SEED_DRIVERS) {
      const existing = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", driver.userId))
        .first();

      if (existing) {
        await ctx.db.delete(existing._id);
        deleted++;
      }
    }

    return {
      deleted,
      message: `🗑 Cleared ${deleted} seeded drivers.`,
    };
  },
});

// ── Check seed status ─────────────────────────────────────────

export const checkDriverSeedStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const allDrivers = await ctx.db
      .query("userProfiles")
      .withIndex("by_accountType", (q) => q.eq("accountType", "driver"))
      .collect();

    const verified = allDrivers.filter((d) => d.isVerifiedDriver);
    const unverified = allDrivers.filter((d) => !d.isVerifiedDriver);
    const seeded = allDrivers.filter((d) => d.userId.startsWith("seed_driver_"));

    const byType = {
      matatu: verified.filter((d) => d.vehicleType === "matatu").length,
      minibus: verified.filter((d) => d.vehicleType === "minibus").length,
      bus: verified.filter((d) => d.vehicleType === "bus").length,
      coach: verified.filter((d) => d.vehicleType === "coach").length,
    };

    return {
      total: allDrivers.length,
      verified: verified.length,
      unverified: unverified.length,
      seeded: seeded.length,
      byType,
      readyForScheduling: verified.length >= 10,
      message:
        verified.length >= 10
          ? `✅ ${verified.length} verified drivers ready for scheduling.`
          : `⚠️ Only ${verified.length} verified drivers. Run seedDrivers to add more.`,
    };
  },
});
