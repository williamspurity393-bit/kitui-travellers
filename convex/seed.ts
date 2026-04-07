import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const ROUTES = [
  {
    name: "Kitui Coastal Link",
    origin: "Kitui",
    destination: "Mombasa",
    distanceKm: 400,
    durationMinutes: 480,
    basePrice: 1200,
    vehicleType: "coach",
    amenities: ["ac", "wifi", "charging"],
    stops: ["Kibwezi", "Voi"],
  },
  {
    name: "Kitui–Eldoret Fast",
    origin: "Kitui",
    destination: "Eldoret",
    distanceKm: 450,
    durationMinutes: 540,
    basePrice: 1400,
    vehicleType: "coach",
    amenities: ["ac", "wifi", "charging"],
    stops: ["Nairobi", "Nakuru"],
  },
  {
    name: "Kitui–Kisumu Lake Express",
    origin: "Kitui",
    destination: "Kisumu",
    distanceKm: 480,
    durationMinutes: 570,
    basePrice: 1500,
    vehicleType: "coach",
    amenities: ["ac", "wifi", "charging"],
    stops: ["Nairobi"],
  },

  // Long-haul bus routes (durationMinutes 180–480)
  {
    name: "Kitui Express",
    origin: "Kitui",
    destination: "Nairobi",
    distanceKm: 170,
    durationMinutes: 210,
    basePrice: 700,
    vehicleType: "bus",
    amenities: ["ac"],
    stops: ["Machakos"],
  },
  {
    name: "Kitui–Garissa Traveller",
    origin: "Kitui",
    destination: "Garissa",
    distanceKm: 250,
    durationMinutes: 330,
    basePrice: 900,
    vehicleType: "bus",
    amenities: ["ac"],
    stops: ["Mwingi"],
  },
  {
    name: "Kitui–Meru Highland",
    origin: "Kitui",
    destination: "Meru",
    distanceKm: 220,
    durationMinutes: 270,
    basePrice: 800,
    vehicleType: "bus",
    amenities: ["ac"],
    stops: ["Embu"],
  },
  {
    name: "Kitui–Nyeri Link",
    origin: "Kitui",
    destination: "Nyeri",
    distanceKm: 210,
    durationMinutes: 270,
    basePrice: 750,
    vehicleType: "bus",
    amenities: ["ac"],
    stops: ["Embu"],
  },
  {
    name: "Kitui–Isiolo Connect",
    origin: "Kitui",
    destination: "Isiolo",
    distanceKm: 260,
    durationMinutes: 330,
    basePrice: 950,
    vehicleType: "bus",
    amenities: ["ac"],
    stops: ["Meru"],
  },
  {
    name: "Kitui–Nakuru Valley",
    origin: "Kitui",
    destination: "Nakuru",
    distanceKm: 320,
    durationMinutes: 390,
    basePrice: 1100,
    vehicleType: "bus",
    amenities: ["ac"],
    stops: ["Nairobi"],
  },
  {
    name: "Kitui–Thika Express",
    origin: "Kitui",
    destination: "Thika",
    distanceKm: 140,
    durationMinutes: 180,
    basePrice: 550,
    vehicleType: "bus",
    amenities: ["ac"],
    stops: ["Kangundo"],
  },
  {
    name: "Kitui–Embu Connect",
    origin: "Kitui",
    destination: "Embu",
    distanceKm: 120,
    durationMinutes: 150,
    basePrice: 450,
    vehicleType: "bus",
    amenities: ["ac"],
    stops: [],
  },
  {
    name: "Mwingi–Nairobi Express",
    origin: "Mwingi",
    destination: "Nairobi",
    distanceKm: 230,
    durationMinutes: 270,
    basePrice: 850,
    vehicleType: "bus",
    amenities: ["ac"],
    stops: ["Machakos"],
  },
  {
    name: "Mwingi–Garissa Route",
    origin: "Mwingi",
    destination: "Garissa",
    distanceKm: 185,
    durationMinutes: 240,
    basePrice: 700,
    vehicleType: "bus",
    amenities: ["ac"],
    stops: [],
  },
  {
    name: "Mutomo–Nairobi Express",
    origin: "Mutomo",
    destination: "Nairobi",
    distanceKm: 280,
    durationMinutes: 330,
    basePrice: 950,
    vehicleType: "bus",
    amenities: ["ac"],
    stops: ["Kibwezi", "Machakos"],
  },
  {
    name: "Mutomo–Mombasa Coastal",
    origin: "Mutomo",
    destination: "Mombasa",
    distanceKm: 350,
    durationMinutes: 420,
    basePrice: 1100,
    vehicleType: "bus",
    amenities: ["ac", "wifi"],
    stops: ["Kibwezi", "Voi"],
  },

  // Minibus routes (medium distance)
  {
    name: "Kitui–Machakos Shuttle",
    origin: "Kitui",
    destination: "Machakos",
    distanceKm: 75,
    durationMinutes: 90,
    basePrice: 300,
    vehicleType: "minibus",
    amenities: ["ac"],
    stops: [],
  },
  {
    name: "Kitui–Ikutha Link",
    origin: "Kitui Town",
    destination: "Ikutha",
    distanceKm: 120,
    durationMinutes: 150,
    basePrice: 350,
    vehicleType: "minibus",
    amenities: [],
    stops: ["Mutomo"],
  },
  {
    name: "Kitui–Kyuso Traveller",
    origin: "Kitui Town",
    destination: "Kyuso",
    distanceKm: 110,
    durationMinutes: 135,
    basePrice: 320,
    vehicleType: "minibus",
    amenities: [],
    stops: ["Mwingi"],
  },
  {
    name: "Kitui–Migwani Express",
    origin: "Kitui Town",
    destination: "Migwani",
    distanceKm: 90,
    durationMinutes: 105,
    basePrice: 280,
    vehicleType: "minibus",
    amenities: [],
    stops: [],
  },
  {
    name: "Mwingi–Embu Connect",
    origin: "Mwingi",
    destination: "Embu",
    distanceKm: 130,
    durationMinutes: 150,
    basePrice: 480,
    vehicleType: "minibus",
    amenities: [],
    stops: [],
  },
  {
    name: "Kibwezi–Kitui Connect",
    origin: "Kibwezi",
    destination: "Kitui",
    distanceKm: 100,
    durationMinutes: 120,
    basePrice: 350,
    vehicleType: "minibus",
    amenities: [],
    stops: ["Mutomo"],
  },

  // Matatu routes (short/local)
  {
    name: "Kitui–Mwingi Matatu",
    origin: "Kitui Town",
    destination: "Mwingi",
    distanceKm: 65,
    durationMinutes: 75,
    basePrice: 200,
    vehicleType: "matatu",
    amenities: [],
    stops: [],
  },
  {
    name: "Kitui–Mutomo Shuttle",
    origin: "Kitui Town",
    destination: "Mutomo",
    distanceKm: 80,
    durationMinutes: 90,
    basePrice: 250,
    vehicleType: "matatu",
    amenities: [],
    stops: [],
  },
  {
    name: "Kitui–Kabati Shuttle",
    origin: "Kitui Town",
    destination: "Kabati",
    distanceKm: 50,
    durationMinutes: 60,
    basePrice: 180,
    vehicleType: "matatu",
    amenities: [],
    stops: [],
  },
  {
    name: "Kitui–Zombe Link",
    origin: "Kitui Town",
    destination: "Zombe",
    distanceKm: 45,
    durationMinutes: 55,
    basePrice: 170,
    vehicleType: "matatu",
    amenities: [],
    stops: [],
  },
  {
    name: "Kitui–Mulango Connect",
    origin: "Kitui Town",
    destination: "Mulango",
    distanceKm: 30,
    durationMinutes: 40,
    basePrice: 120,
    vehicleType: "matatu",
    amenities: [],
    stops: [],
  },
  {
    name: "Mutomo–Kibwezi Shuttle",
    origin: "Mutomo",
    destination: "Kibwezi",
    distanceKm: 90,
    durationMinutes: 110,
    basePrice: 300,
    vehicleType: "matatu",
    amenities: [],
    stops: [],
  },
  {
    name: "Mutomo–Ikutha Link",
    origin: "Mutomo",
    destination: "Ikutha",
    distanceKm: 40,
    durationMinutes: 50,
    basePrice: 150,
    vehicleType: "matatu",
    amenities: [],
    stops: [],
  },
];

// ── Driver data ───────────────────────────────────────────────
// Enough drivers per vehicle type to cover all routes:
//   coach  × 3  (Mombasa, Eldoret, Kisumu)
//   bus    × 8  (Nairobi, Garissa, Meru, Nyeri, Isiolo, Nakuru, Thika, Embu...)
//   minibus × 5 (Machakos, Ikutha, Kyuso, Migwani, Embu, Kibwezi...)
//   matatu × 7  (Mwingi, Mutomo, Kabati, Zombe, Mulango, Kibwezi, Ikutha...)

const DRIVERS = [
  // Coach drivers
  {
    userId: "seed_driver_coach_001",
    fullName: "John Mwanzia",
    phone: "+254744001001",
    vehicleType: "coach",
    vehicleNumber: "KDH 001C",
    vehicleCapacity: 49,
  },
  {
    userId: "seed_driver_coach_002",
    fullName: "Mark Kyalo",
    phone: "+254744001002",
    vehicleType: "coach",
    vehicleNumber: "KDH 002C",
    vehicleCapacity: 49,
  },
  {
    userId: "seed_driver_coach_003",
    fullName: "Eric Nzioki",
    phone: "+254744001003",
    vehicleType: "coach",
    vehicleNumber: "KDH 003C",
    vehicleCapacity: 49,
  },
  // Bus drivers
  {
    userId: "seed_driver_bus_001",
    fullName: "Robert Ndolo",
    phone: "+254733002001",
    vehicleType: "bus",
    vehicleNumber: "KDG 001S",
    vehicleCapacity: 49,
  },
  {
    userId: "seed_driver_bus_002",
    fullName: "Michael Makau",
    phone: "+254733002002",
    vehicleType: "bus",
    vehicleNumber: "KDG 002S",
    vehicleCapacity: 49,
  },
  {
    userId: "seed_driver_bus_003",
    fullName: "Stephen Maingi",
    phone: "+254733002003",
    vehicleType: "bus",
    vehicleNumber: "KDG 003S",
    vehicleCapacity: 49,
  },
  {
    userId: "seed_driver_bus_004",
    fullName: "George Kathuku",
    phone: "+254733002004",
    vehicleType: "bus",
    vehicleNumber: "KDG 004S",
    vehicleCapacity: 49,
  },
  {
    userId: "seed_driver_bus_005",
    fullName: "Daniel Wambua",
    phone: "+254733002005",
    vehicleType: "bus",
    vehicleNumber: "KDG 005S",
    vehicleCapacity: 49,
  },
  {
    userId: "seed_driver_bus_006",
    fullName: "Paul Mutunga",
    phone: "+254733002006",
    vehicleType: "bus",
    vehicleNumber: "KDG 006S",
    vehicleCapacity: 49,
  },
  {
    userId: "seed_driver_bus_007",
    fullName: "Moses Kiilu",
    phone: "+254733002007",
    vehicleType: "bus",
    vehicleNumber: "KDG 007S",
    vehicleCapacity: 49,
  },
  {
    userId: "seed_driver_bus_008",
    fullName: "Isaac Mwololo",
    phone: "+254733002008",
    vehicleType: "bus",
    vehicleNumber: "KDG 008S",
    vehicleCapacity: 49,
  },
  // Minibus drivers
  {
    userId: "seed_driver_minibus_001",
    fullName: "Charles Muendo",
    phone: "+254722003001",
    vehicleType: "minibus",
    vehicleNumber: "KCA 001B",
    vehicleCapacity: 25,
  },
  {
    userId: "seed_driver_minibus_002",
    fullName: "Francis Mutisya",
    phone: "+254722003002",
    vehicleType: "minibus",
    vehicleNumber: "KCA 002B",
    vehicleCapacity: 25,
  },
  {
    userId: "seed_driver_minibus_003",
    fullName: "Patrick Mulwa",
    phone: "+254722003003",
    vehicleType: "minibus",
    vehicleNumber: "KCA 003B",
    vehicleCapacity: 25,
  },
  {
    userId: "seed_driver_minibus_004",
    fullName: "Anthony Mbuvi",
    phone: "+254722003004",
    vehicleType: "minibus",
    vehicleNumber: "KCA 004B",
    vehicleCapacity: 25,
  },
  {
    userId: "seed_driver_minibus_005",
    fullName: "Bernard Musau",
    phone: "+254722003005",
    vehicleType: "minibus",
    vehicleNumber: "KCA 005B",
    vehicleCapacity: 25,
  },
  // Matatu drivers
  {
    userId: "seed_driver_matatu_001",
    fullName: "James Mutua",
    phone: "+254711004001",
    vehicleType: "matatu",
    vehicleNumber: "KBZ 001M",
    vehicleCapacity: 14,
  },
  {
    userId: "seed_driver_matatu_002",
    fullName: "Peter Kioko",
    phone: "+254711004002",
    vehicleType: "matatu",
    vehicleNumber: "KBZ 002M",
    vehicleCapacity: 14,
  },
  {
    userId: "seed_driver_matatu_003",
    fullName: "David Musyoka",
    phone: "+254711004003",
    vehicleType: "matatu",
    vehicleNumber: "KBZ 003M",
    vehicleCapacity: 14,
  },
  {
    userId: "seed_driver_matatu_004",
    fullName: "Samuel Nzomo",
    phone: "+254711004004",
    vehicleType: "matatu",
    vehicleNumber: "KBZ 004M",
    vehicleCapacity: 14,
  },
  {
    userId: "seed_driver_matatu_005",
    fullName: "Joseph Mwangangi",
    phone: "+254711004005",
    vehicleType: "matatu",
    vehicleNumber: "KBZ 005M",
    vehicleCapacity: 14,
  },
  {
    userId: "seed_driver_matatu_006",
    fullName: "Elijah Mutemi",
    phone: "+254711004006",
    vehicleType: "matatu",
    vehicleNumber: "KBZ 006M",
    vehicleCapacity: 14,
  },
  {
    userId: "seed_driver_matatu_007",
    fullName: "Victor Ngilu",
    phone: "+254711004007",
    vehicleType: "matatu",
    vehicleNumber: "KBZ 007M",
    vehicleCapacity: 14,
  },
];

// ── Seed routes ───────────────────────────────────────────────

export const seedRoutes = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let created = 0,
      skipped = 0;

    for (const r of ROUTES) {
      // Check by name (unique enough for seeding)
      const exists = await ctx.db
        .query("routes")
        .filter((q) => q.eq(q.field("name"), r.name))
        .first();
      if (exists) {
        skipped++;
        continue;
      }

      await ctx.db.insert("routes", {
        name: r.name,
        origin: r.origin,
        destination: r.destination,
        stops: r.stops,
        distanceKm: r.distanceKm,
        durationMinutes: r.durationMinutes,
        basePrice: r.basePrice,
        vehicleType: r.vehicleType,
        amenities: r.amenities,
        isActive: true,
        createdBy: "seed",
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }

    return {
      created,
      skipped,
      message: `✅ Routes: ${created} created, ${skipped} skipped. Total: ${ROUTES.length}`,
    };
  },
});

// ── Seed drivers ──────────────────────────────────────────────

export const seedDrivers = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let created = 0,
      skipped = 0;

    for (const d of DRIVERS) {
      const exists = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", d.userId))
        .first();
      if (exists) {
        skipped++;
        continue;
      }

      await ctx.db.insert("userProfiles", {
        userId: d.userId,
        fullName: d.fullName,
        phone: d.phone,
        accountType: "driver",
        vehicleType: d.vehicleType as any,
        vehicleNumber: d.vehicleNumber,
        vehicleCapacity: d.vehicleCapacity,
        licenseNumber: `DL-${d.userId.replace("seed_driver_", "").toUpperCase()}`,
        isVerifiedDriver: true,
        isOnboarded: true,
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }

    return {
      created,
      skipped,
      message: `✅ Drivers: ${created} created, ${skipped} skipped. Total: ${DRIVERS.length}`,
    };
  },
});

// ── Seed vehicles ─────────────────────────────────────────────
// Each vehicle matches its driver's vehicle type and is assigned to that driver

export const seedVehicles = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let created = 0,
      skipped = 0;

    const vehicleData = [
      // Coach
      {
        reg: "KDH 001C",
        type: "coach",
        cap: 49,
        make: "Scania",
        model: "Touring",
        year: 2019,
        driverId: "seed_driver_coach_001",
      },
      {
        reg: "KDH 002C",
        type: "coach",
        cap: 49,
        make: "Scania",
        model: "Touring",
        year: 2020,
        driverId: "seed_driver_coach_002",
      },
      {
        reg: "KDH 003C",
        type: "coach",
        cap: 49,
        make: "Volvo",
        model: "9700",
        year: 2018,
        driverId: "seed_driver_coach_003",
      },
      // Bus
      {
        reg: "KDG 001S",
        type: "bus",
        cap: 49,
        make: "Isuzu",
        model: "FVR",
        year: 2018,
        driverId: "seed_driver_bus_001",
      },
      {
        reg: "KDG 002S",
        type: "bus",
        cap: 49,
        make: "Isuzu",
        model: "FVR",
        year: 2019,
        driverId: "seed_driver_bus_002",
      },
      {
        reg: "KDG 003S",
        type: "bus",
        cap: 49,
        make: "Toyota",
        model: "Coaster",
        year: 2017,
        driverId: "seed_driver_bus_003",
      },
      {
        reg: "KDG 004S",
        type: "bus",
        cap: 49,
        make: "Toyota",
        model: "Coaster",
        year: 2020,
        driverId: "seed_driver_bus_004",
      },
      {
        reg: "KDG 005S",
        type: "bus",
        cap: 49,
        make: "Isuzu",
        model: "FVR",
        year: 2021,
        driverId: "seed_driver_bus_005",
      },
      {
        reg: "KDG 006S",
        type: "bus",
        cap: 49,
        make: "Isuzu",
        model: "NQR",
        year: 2019,
        driverId: "seed_driver_bus_006",
      },
      {
        reg: "KDG 007S",
        type: "bus",
        cap: 49,
        make: "Toyota",
        model: "Coaster",
        year: 2018,
        driverId: "seed_driver_bus_007",
      },
      {
        reg: "KDG 008S",
        type: "bus",
        cap: 49,
        make: "Isuzu",
        model: "FVR",
        year: 2022,
        driverId: "seed_driver_bus_008",
      },
      // Minibus
      {
        reg: "KCA 001B",
        type: "minibus",
        cap: 25,
        make: "Toyota",
        model: "Hiace",
        year: 2019,
        driverId: "seed_driver_minibus_001",
      },
      {
        reg: "KCA 002B",
        type: "minibus",
        cap: 25,
        make: "Toyota",
        model: "Hiace",
        year: 2020,
        driverId: "seed_driver_minibus_002",
      },
      {
        reg: "KCA 003B",
        type: "minibus",
        cap: 25,
        make: "Nissan",
        model: "Caravan",
        year: 2018,
        driverId: "seed_driver_minibus_003",
      },
      {
        reg: "KCA 004B",
        type: "minibus",
        cap: 25,
        make: "Toyota",
        model: "Hiace",
        year: 2021,
        driverId: "seed_driver_minibus_004",
      },
      {
        reg: "KCA 005B",
        type: "minibus",
        cap: 25,
        make: "Nissan",
        model: "Caravan",
        year: 2020,
        driverId: "seed_driver_minibus_005",
      },
      // Matatu
      {
        reg: "KBZ 001M",
        type: "matatu",
        cap: 14,
        make: "Nissan",
        model: "Matatu",
        year: 2018,
        driverId: "seed_driver_matatu_001",
      },
      {
        reg: "KBZ 002M",
        type: "matatu",
        cap: 14,
        make: "Nissan",
        model: "Matatu",
        year: 2019,
        driverId: "seed_driver_matatu_002",
      },
      {
        reg: "KBZ 003M",
        type: "matatu",
        cap: 14,
        make: "Toyota",
        model: "HiAce 14",
        year: 2020,
        driverId: "seed_driver_matatu_003",
      },
      {
        reg: "KBZ 004M",
        type: "matatu",
        cap: 14,
        make: "Toyota",
        model: "HiAce 14",
        year: 2018,
        driverId: "seed_driver_matatu_004",
      },
      {
        reg: "KBZ 005M",
        type: "matatu",
        cap: 14,
        make: "Nissan",
        model: "Matatu",
        year: 2021,
        driverId: "seed_driver_matatu_005",
      },
      {
        reg: "KBZ 006M",
        type: "matatu",
        cap: 14,
        make: "Nissan",
        model: "Matatu",
        year: 2019,
        driverId: "seed_driver_matatu_006",
      },
      {
        reg: "KBZ 007M",
        type: "matatu",
        cap: 14,
        make: "Toyota",
        model: "HiAce 14",
        year: 2022,
        driverId: "seed_driver_matatu_007",
      },
    ];

    for (const v of vehicleData) {
      const exists = await ctx.db
        .query("vehicles")
        .withIndex("by_registrationNumber", (q) => q.eq("registrationNumber", v.reg))
        .first();
      if (exists) {
        skipped++;
        continue;
      }

      await ctx.db.insert("vehicles", {
        registrationNumber: v.reg,
        type: v.type as any,
        capacity: v.cap,
        make: v.make,
        model: v.model,
        year: v.year,
        amenities: v.type === "coach" ? ["ac", "wifi", "charging"] : v.type === "bus" ? ["ac"] : [],
        isActive: true,
        assignedDriverId: v.driverId,
        createdAt: now,
        updatedAt: now,
      });
      created++;

      // Also update the driver profile's vehicleNumber (links them together)
      const driverProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", v.driverId))
        .first();
      if (driverProfile && !driverProfile.vehicleNumber) {
        await ctx.db.patch(driverProfile._id, {
          vehicleNumber: v.reg,
          vehicleCapacity: v.cap,
          updatedAt: now,
        });
      }
    }

    return {
      created,
      skipped,
      message: `✅ Vehicles: ${created} created, ${skipped} skipped.`,
    };
  },
});

// ── Seed everything ───────────────────────────────────────────

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // ── Routes ─────────────────────────────────────────
    let routesCreated = 0,
      routesSkipped = 0;
    for (const r of ROUTES) {
      const exists = await ctx.db
        .query("routes")
        .filter((q) => q.eq(q.field("name"), r.name))
        .first();
      if (exists) {
        routesSkipped++;
        continue;
      }
      await ctx.db.insert("routes", {
        name: r.name,
        origin: r.origin,
        destination: r.destination,
        stops: r.stops,
        distanceKm: r.distanceKm,
        durationMinutes: r.durationMinutes,
        basePrice: r.basePrice,
        vehicleType: r.vehicleType,
        amenities: r.amenities,
        isActive: true,
        createdBy: "seed",
        createdAt: now,
        updatedAt: now,
      });
      routesCreated++;
    }

    // ── Drivers ────────────────────────────────────────
    let driversCreated = 0,
      driversSkipped = 0;
    for (const d of DRIVERS) {
      const exists = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", d.userId))
        .first();
      if (exists) {
        driversSkipped++;
        continue;
      }
      await ctx.db.insert("userProfiles", {
        userId: d.userId,
        fullName: d.fullName,
        phone: d.phone,
        accountType: "driver",
        vehicleType: d.vehicleType as any,
        vehicleNumber: d.vehicleNumber,
        vehicleCapacity: d.vehicleCapacity,
        licenseNumber: `DL-${d.userId.replace("seed_driver_", "").toUpperCase()}`,
        isVerifiedDriver: true,
        isOnboarded: true,
        createdAt: now,
        updatedAt: now,
      });
      driversCreated++;
    }

    // ── Vehicles ───────────────────────────────────────
    const vehicleData = [
      {
        reg: "KDH 001C",
        type: "coach",
        cap: 49,
        make: "Scania",
        model: "Touring",
        year: 2019,
        driverId: "seed_driver_coach_001",
        amenities: ["ac", "wifi", "charging"],
      },
      {
        reg: "KDH 002C",
        type: "coach",
        cap: 49,
        make: "Scania",
        model: "Touring",
        year: 2020,
        driverId: "seed_driver_coach_002",
        amenities: ["ac", "wifi", "charging"],
      },
      {
        reg: "KDH 003C",
        type: "coach",
        cap: 49,
        make: "Volvo",
        model: "9700",
        year: 2018,
        driverId: "seed_driver_coach_003",
        amenities: ["ac", "wifi", "charging"],
      },
      {
        reg: "KDG 001S",
        type: "bus",
        cap: 49,
        make: "Isuzu",
        model: "FVR",
        year: 2018,
        driverId: "seed_driver_bus_001",
        amenities: ["ac"],
      },
      {
        reg: "KDG 002S",
        type: "bus",
        cap: 49,
        make: "Isuzu",
        model: "FVR",
        year: 2019,
        driverId: "seed_driver_bus_002",
        amenities: ["ac"],
      },
      {
        reg: "KDG 003S",
        type: "bus",
        cap: 49,
        make: "Toyota",
        model: "Coaster",
        year: 2017,
        driverId: "seed_driver_bus_003",
        amenities: ["ac"],
      },
      {
        reg: "KDG 004S",
        type: "bus",
        cap: 49,
        make: "Toyota",
        model: "Coaster",
        year: 2020,
        driverId: "seed_driver_bus_004",
        amenities: ["ac"],
      },
      {
        reg: "KDG 005S",
        type: "bus",
        cap: 49,
        make: "Isuzu",
        model: "FVR",
        year: 2021,
        driverId: "seed_driver_bus_005",
        amenities: ["ac"],
      },
      {
        reg: "KDG 006S",
        type: "bus",
        cap: 49,
        make: "Isuzu",
        model: "NQR",
        year: 2019,
        driverId: "seed_driver_bus_006",
        amenities: ["ac"],
      },
      {
        reg: "KDG 007S",
        type: "bus",
        cap: 49,
        make: "Toyota",
        model: "Coaster",
        year: 2018,
        driverId: "seed_driver_bus_007",
        amenities: ["ac"],
      },
      {
        reg: "KDG 008S",
        type: "bus",
        cap: 49,
        make: "Isuzu",
        model: "FVR",
        year: 2022,
        driverId: "seed_driver_bus_008",
        amenities: ["ac"],
      },
      {
        reg: "KCA 001B",
        type: "minibus",
        cap: 25,
        make: "Toyota",
        model: "Hiace",
        year: 2019,
        driverId: "seed_driver_minibus_001",
        amenities: [],
      },
      {
        reg: "KCA 002B",
        type: "minibus",
        cap: 25,
        make: "Toyota",
        model: "Hiace",
        year: 2020,
        driverId: "seed_driver_minibus_002",
        amenities: [],
      },
      {
        reg: "KCA 003B",
        type: "minibus",
        cap: 25,
        make: "Nissan",
        model: "Caravan",
        year: 2018,
        driverId: "seed_driver_minibus_003",
        amenities: [],
      },
      {
        reg: "KCA 004B",
        type: "minibus",
        cap: 25,
        make: "Toyota",
        model: "Hiace",
        year: 2021,
        driverId: "seed_driver_minibus_004",
        amenities: [],
      },
      {
        reg: "KCA 005B",
        type: "minibus",
        cap: 25,
        make: "Nissan",
        model: "Caravan",
        year: 2020,
        driverId: "seed_driver_minibus_005",
        amenities: [],
      },
      {
        reg: "KBZ 001M",
        type: "matatu",
        cap: 14,
        make: "Nissan",
        model: "Matatu",
        year: 2018,
        driverId: "seed_driver_matatu_001",
        amenities: [],
      },
      {
        reg: "KBZ 002M",
        type: "matatu",
        cap: 14,
        make: "Nissan",
        model: "Matatu",
        year: 2019,
        driverId: "seed_driver_matatu_002",
        amenities: [],
      },
      {
        reg: "KBZ 003M",
        type: "matatu",
        cap: 14,
        make: "Toyota",
        model: "HiAce 14",
        year: 2020,
        driverId: "seed_driver_matatu_003",
        amenities: [],
      },
      {
        reg: "KBZ 004M",
        type: "matatu",
        cap: 14,
        make: "Toyota",
        model: "HiAce 14",
        year: 2018,
        driverId: "seed_driver_matatu_004",
        amenities: [],
      },
      {
        reg: "KBZ 005M",
        type: "matatu",
        cap: 14,
        make: "Nissan",
        model: "Matatu",
        year: 2021,
        driverId: "seed_driver_matatu_005",
        amenities: [],
      },
      {
        reg: "KBZ 006M",
        type: "matatu",
        cap: 14,
        make: "Nissan",
        model: "Matatu",
        year: 2019,
        driverId: "seed_driver_matatu_006",
        amenities: [],
      },
      {
        reg: "KBZ 007M",
        type: "matatu",
        cap: 14,
        make: "Toyota",
        model: "HiAce 14",
        year: 2022,
        driverId: "seed_driver_matatu_007",
        amenities: [],
      },
    ];

    let vehiclesCreated = 0,
      vehiclesSkipped = 0;
    for (const v of vehicleData) {
      const exists = await ctx.db
        .query("vehicles")
        .withIndex("by_registrationNumber", (q) => q.eq("registrationNumber", v.reg))
        .first();
      if (exists) {
        vehiclesSkipped++;
        continue;
      }
      await ctx.db.insert("vehicles", {
        registrationNumber: v.reg,
        type: v.type as any,
        capacity: v.cap,
        make: v.make,
        model: v.model,
        year: v.year,
        amenities: v.amenities,
        isActive: true,
        assignedDriverId: v.driverId,
        createdAt: now,
        updatedAt: now,
      });
      vehiclesCreated++;

      // Link vehicle number back to driver
      const dp = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", v.driverId))
        .first();
      if (dp && !dp.vehicleNumber) {
        await ctx.db.patch(dp._id, {
          vehicleNumber: v.reg,
          vehicleCapacity: v.cap,
          updatedAt: now,
        });
      }
    }

    return {
      routes: { created: routesCreated, skipped: routesSkipped },
      drivers: { created: driversCreated, skipped: driversSkipped },
      vehicles: { created: vehiclesCreated, skipped: vehiclesSkipped },
      message:
        `✅ Seeded: ${routesCreated} routes, ${driversCreated} drivers, ${vehiclesCreated} vehicles.` +
        (routesSkipped + driversSkipped + vehiclesSkipped > 0
          ? ` (${routesSkipped + driversSkipped + vehiclesSkipped} already existed)`
          : ""),
    };
  },
});

// ── Re-seed (wipe + seed) ─────────────────────────────────────

export const reseedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Only delete seeded data (not admin-created data)
    const seededDriverIds = new Set(DRIVERS.map((d) => d.userId));
    const seededVehicleRegs = new Set([
      "KDH 001C",
      "KDH 002C",
      "KDH 003C",
      "KDG 001S",
      "KDG 002S",
      "KDG 003S",
      "KDG 004S",
      "KDG 005S",
      "KDG 006S",
      "KDG 007S",
      "KDG 008S",
      "KCA 001B",
      "KCA 002B",
      "KCA 003B",
      "KCA 004B",
      "KCA 005B",
      "KBZ 001M",
      "KBZ 002M",
      "KBZ 003M",
      "KBZ 004M",
      "KBZ 005M",
      "KBZ 006M",
      "KBZ 007M",
    ]);
    const seededRouteNames = new Set(ROUTES.map((r) => r.name));

    const allProfiles = await ctx.db.query("userProfiles").collect();
    for (const p of allProfiles) {
      if (seededDriverIds.has(p.userId)) await ctx.db.delete(p._id);
    }
    const allVehicles = await ctx.db.query("vehicles").collect();
    for (const v of allVehicles) {
      if (seededVehicleRegs.has(v.registrationNumber)) await ctx.db.delete(v._id);
    }
    const allRoutes = await ctx.db.query("routes").collect();
    for (const r of allRoutes) {
      if (seededRouteNames.has(r.name)) await ctx.db.delete(r._id);
    }

    console.log("🗑 Cleared seeded data. Re-seeding...");

    // Now seed fresh
    const now = Date.now();
    let rc = 0,
      dc = 0,
      vc = 0;

    for (const r of ROUTES) {
      await ctx.db.insert("routes", {
        name: r.name,
        origin: r.origin,
        destination: r.destination,
        stops: r.stops,
        distanceKm: r.distanceKm,
        durationMinutes: r.durationMinutes,
        basePrice: r.basePrice,
        vehicleType: r.vehicleType,
        amenities: r.amenities,
        isActive: true,
        createdBy: "seed",
        createdAt: now,
        updatedAt: now,
      });
      rc++;
    }

    for (const d of DRIVERS) {
      await ctx.db.insert("userProfiles", {
        userId: d.userId,
        fullName: d.fullName,
        phone: d.phone,
        accountType: "driver",
        vehicleType: d.vehicleType as any,
        vehicleNumber: d.vehicleNumber,
        vehicleCapacity: d.vehicleCapacity,
        licenseNumber: `DL-${d.userId.replace("seed_driver_", "").toUpperCase()}`,
        isVerifiedDriver: true,
        isOnboarded: true,
        createdAt: now,
        updatedAt: now,
      });
      dc++;
    }

    return {
      message: `✅ Re-seeded: ${rc} routes, ${dc} drivers. Run seedVehicles separately.`,
    };
  },
});

// ── Clear all seeded data ─────────────────────────────────────

export const clearAllSeedData = mutation({
  args: {},
  handler: async (ctx) => {
    const seededDriverIds = new Set(DRIVERS.map((d) => d.userId));
    const seededRouteNames = new Set(ROUTES.map((r) => r.name));

    let deleted = 0;

    const profiles = await ctx.db.query("userProfiles").collect();
    for (const p of profiles) {
      if (seededDriverIds.has(p.userId)) {
        await ctx.db.delete(p._id);
        deleted++;
      }
    }

    const vehicles = await ctx.db.query("vehicles").collect();
    for (const v of vehicles) {
      if (v.assignedDriverId && seededDriverIds.has(v.assignedDriverId)) {
        await ctx.db.delete(v._id);
        deleted++;
      }
    }

    const routes = await ctx.db.query("routes").collect();
    for (const r of routes) {
      if (seededRouteNames.has(r.name)) {
        await ctx.db.delete(r._id);
        deleted++;
      }
    }

    return { deleted, message: `🗑 Cleared ${deleted} seeded records.` };
  },
});

// ── Legacy aliases (keeps backward compat with old seed.ts) ──

export const seedRoutesSeedTs = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Alias — delegates to the main seedAll
    const now = Date.now();
    let count = 0;
    for (const r of ROUTES) {
      const ex = await ctx.db
        .query("routes")
        .filter((q) => q.eq(q.field("name"), r.name))
        .first();
      if (ex) continue;
      await ctx.db.insert("routes", {
        name: r.name,
        origin: r.origin,
        destination: r.destination,
        stops: r.stops,
        distanceKm: r.distanceKm,
        durationMinutes: r.durationMinutes,
        basePrice: r.basePrice,
        vehicleType: r.vehicleType,
        amenities: r.amenities,
        isActive: true,
        createdBy: "seed",
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }
    return { count };
  },
});
