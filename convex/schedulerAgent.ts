import { action, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ScheduleAssignment {
  route: {
    routeId: string;
    name: string;
    origin: string;
    destination: string;
    durationMinutes: number;
    vehicleType: string;
    basePrice: number;
    stops: string[];
  };
  departureTime: string;
  arrivalTime: string;
  assignedDriverId: string | null;
  assignedDriverPhone: string | null;
  totalSeats: number;
  isSecondTrip: boolean;
}
interface SchedulePlan {
  assignments: ScheduleAssignment[];
  driverSummary: Array<{
    driverId: string;
    phone: string;
    trips: number;
    totalDutyHours: number;
    routes: string[];
  }>;
  unassignableRoutes: string[];
}
interface GeminiResponse {
  schedules: Array<{ planIndex: number; notes: string }>;
  reasoning: string;
  warnings: string[];
}

function buildTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}
function isBeforeToday(d: string): boolean {
  return d < buildTodayDate();
}
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24,
    m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function addMins(t: string, add: number): string {
  return minutesToTime(timeToMinutes(t) + add);
}

const SHIFT_START = 5 * 60 + 30,
  SHIFT_END = 21 * 60,
  MIN_REST = 30,
  MAX_TRIPS = 2,
  MAX_DUTY_MINS = 10 * 60;
interface DriverSlot {
  driverId: string;
  phone: string;
  vehicleType: string;
  vehicleCapacity: number | null;
  busy: Array<{ start: number; end: number; label: string }>;
  trips: number;
  dutyMins: number;
}
function canTake(slot: DriverSlot, depMin: number, durMins: number): boolean {
  if (
    slot.trips >= MAX_TRIPS ||
    depMin < SHIFT_START ||
    depMin + durMins > SHIFT_END ||
    slot.dutyMins + durMins > MAX_DUTY_MINS
  )
    return false;
  const deadHead = durMins > 60 ? Math.round(durMins * 0.6) : 0,
    freeAt = depMin + durMins + MIN_REST + deadHead;
  for (const b of slot.busy) if (depMin < b.end && freeAt > b.start) return false;
  return true;
}
function bookSlot(slot: DriverSlot, depMin: number, durMins: number, label: string): void {
  const deadHead = durMins > 60 ? Math.round(durMins * 0.6) : 0;
  slot.busy.push({ start: depMin, end: depMin + durMins + MIN_REST + deadHead, label });
  slot.trips++;
  slot.dutyMins += durMins;
}
function defaultSeats(vt: string): number {
  return vt === "matatu" ? 14 : vt === "minibus" ? 25 : 49;
}

function computePlan(routes: any[], drivers: any[], vehicles: any[]): SchedulePlan {
  const vehicleMap: Record<string, number> = {};
  for (const v of vehicles)
    if (v.assignedDriverId && v.capacity) vehicleMap[v.assignedDriverId] = v.capacity;
  const slots: DriverSlot[] = drivers.map((d: any) => ({
    driverId: d.userId,
    phone: d.phone ?? d.userId.slice(0, 8),
    vehicleType: d.vehicleType ?? "any",
    vehicleCapacity: vehicleMap[d.userId] ?? d.vehicleCapacity ?? null,
    busy: [],
    trips: 0,
    dutyMins: 0,
  }));
  const assignments: ScheduleAssignment[] = [],
    unassignable: string[] = [],
    sorted = [...routes].sort((a, b) => a.durationMinutes - b.durationMinutes),
    MORNING = [360, 390, 420],
    MIDDAY = [780, 840],
    EVENING = [960, 1020];

  function tryAssign(route: any, groups: number[][], isSecondTrip: boolean): boolean {
    const typed = slots.filter(
      (s) => s.vehicleType === route.vehicleType || s.vehicleType === "any"
    );
    const pool = typed.length > 0 ? typed : slots;
    for (const group of groups)
      for (const dep of group)
        for (const slot of pool) {
          if (!canTake(slot, dep, route.durationMinutes)) continue;
          const depStr = minutesToTime(dep),
            seats = slot.vehicleCapacity ?? defaultSeats(route.vehicleType);
          assignments.push({
            route: {
              routeId: route._id,
              name: route.name,
              origin: route.origin,
              destination: route.destination,
              durationMinutes: route.durationMinutes,
              vehicleType: route.vehicleType,
              basePrice: route.basePrice,
              stops: route.stops,
            },
            departureTime: depStr,
            arrivalTime: addMins(depStr, route.durationMinutes),
            assignedDriverId: slot.driverId,
            assignedDriverPhone: slot.phone,
            totalSeats: seats,
            isSecondTrip,
          });
          bookSlot(slot, dep, route.durationMinutes, route.name);
          return true;
        }
    return false;
  }

  for (const route of sorted) {
    const long = route.durationMinutes > 180;
    if (!tryAssign(route, [MORNING], false)) {
      let found = false;
      for (let dep = SHIFT_START; dep <= SHIFT_END - route.durationMinutes; dep += 30) {
        const typed = slots.filter(
          (s) => s.vehicleType === route.vehicleType || s.vehicleType === "any"
        );
        const pool = typed.length > 0 ? typed : slots;
        for (const slot of pool) {
          if (!canTake(slot, dep, route.durationMinutes)) continue;
          const depStr = minutesToTime(dep),
            seats = slot.vehicleCapacity ?? defaultSeats(route.vehicleType);
          assignments.push({
            route: {
              routeId: route._id,
              name: route.name,
              origin: route.origin,
              destination: route.destination,
              durationMinutes: route.durationMinutes,
              vehicleType: route.vehicleType,
              basePrice: route.basePrice,
              stops: route.stops,
            },
            departureTime: depStr,
            arrivalTime: addMins(depStr, route.durationMinutes),
            assignedDriverId: slot.driverId,
            assignedDriverPhone: slot.phone,
            totalSeats: seats,
            isSecondTrip: false,
          });
          bookSlot(slot, dep, route.durationMinutes, route.name);
          found = true;
          break;
        }
        if (found) break;
      }
      if (!found) {
        unassignable.push(
          `${route.name} (${route.origin}→${route.destination}): no driver available`
        );
        const depStr = minutesToTime(MORNING[0]);
        assignments.push({
          route: {
            routeId: route._id,
            name: route.name,
            origin: route.origin,
            destination: route.destination,
            durationMinutes: route.durationMinutes,
            vehicleType: route.vehicleType,
            basePrice: route.basePrice,
            stops: route.stops,
          },
          departureTime: depStr,
          arrivalTime: addMins(depStr, route.durationMinutes),
          assignedDriverId: null,
          assignedDriverPhone: null,
          totalSeats: defaultSeats(route.vehicleType),
          isSecondTrip: false,
        });
      }
    }
    if (!long) tryAssign(route, route.durationMinutes > 90 ? [MIDDAY] : [EVENING], true);
  }
  return {
    assignments,
    driverSummary: slots.map((s) => ({
      driverId: s.driverId,
      phone: s.phone,
      trips: s.trips,
      totalDutyHours: Math.round((s.dutyMins / 60) * 10) / 10,
      routes: s.busy.map((b) => b.label),
    })),
    unassignableRoutes: unassignable,
  };
}

function schedulerSystemPrompt(co: string): string {
  return `You write brief scheduling notes for ${co}.\nA TypeScript algorithm computed the schedule. Only add human-friendly notes.\nReturn ONLY planIndex+notes in "schedules". No routeId/driverId. Valid JSON only.\nFORMAT:\n{"schedules":[{"planIndex":0,"notes":"Brief note."}],"reasoning":"Summary.","warnings":[]}`;
}
function schedulerUserPrompt(plan: SchedulePlan, date: string, driverCount: number): string {
  const view = plan.assignments.map((a, i) => ({
    planIndex: i,
    route: `${a.route.origin}→${a.route.destination}`,
    duration: `${a.route.durationMinutes}min`,
    type: a.route.vehicleType,
    driver: a.assignedDriverPhone ?? "unassigned",
    dep: a.departureTime,
    arr: a.arrivalTime,
    seats: a.totalSeats,
    second: a.isSecondTrip,
  }));
  return `Write notes for schedule ${date} (${plan.assignments.length} trips, ${driverCount} drivers).\n${JSON.stringify(view, null, 2)}\nUnassigned: ${plan.unassignableRoutes.length > 0 ? plan.unassignableRoutes.join(", ") : "none"}\nReturn only the JSON format shown in system prompt.`;
}

export const cleanupPastSchedulesMutation = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ deleted: number; completed: number }> => {
    let deleted = 0,
      completed = 0;
    const now = Date.now();
    const all = await ctx.db.query("schedules").collect();
    const past = all.filter((s) => s.date !== undefined && isBeforeToday(s.date as string));
    for (const s of past) {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_scheduleId", (q) => q.eq("scheduleId", s._id))
        .collect();
      const active = bookings.filter((b) => ["pending", "confirmed"].includes(b.status));
      if (active.length > 0) {
        await ctx.db.patch(s._id, { status: "arrived", updatedAt: now });
        for (const b of active) {
          await ctx.db.patch(b._id, { status: "completed", updatedAt: now });
          await ctx.db.insert("notifications", {
            userId: b.userId,
            type: "trip_completed",
            title: "Trip Completed",
            message: `Booking ${b.bookingCode} completed. Tap to rate.`,
            isRead: false,
            data: { bookingId: b._id },
            createdAt: now,
          });
        }
        completed++;
      } else {
        await ctx.db.delete(s._id);
        deleted++;
      }
    }
    return { deleted, completed };
  },
});

export const createAgentSchedule = internalMutation({
  args: {
    routeId: v.id("routes"),
    driverId: v.optional(v.string()),
    departureTime: v.string(),
    arrivalTime: v.string(),
    totalSeats: v.number(),
    date: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    if (!route || !route.isActive) throw new Error(`Route ${args.routeId} not found or inactive`);
    const now = Date.now();
    return ctx.db.insert("schedules", {
      routeId: args.routeId,
      driverId: args.driverId,
      departureTime: args.departureTime,
      arrivalTime: args.arrivalTime,
      totalSeats: args.totalSeats,
      availableSeats: args.totalSeats,
      date: args.date,
      status: "scheduled",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const logAgentRun = internalMutation({
  args: {
    triggeredBy: v.string(),
    targetDate: v.string(),
    schedulesCreated: v.number(),
    reasoning: v.string(),
    warnings: v.array(v.string()),
    success: v.boolean(),
    cleanupDeleted: v.number(),
    cleanupCompleted: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      actorId: "ai_scheduler",
      action: args.success ? "ai_scheduler_ran" : "ai_scheduler_failed",
      resource: "schedules",
      details: {
        triggeredBy: args.triggeredBy,
        targetDate: args.targetDate,
        schedulesCreated: args.schedulesCreated,
        reasoning: args.reasoning,
        warnings: args.warnings,
        cleanup: { deleted: args.cleanupDeleted, completed: args.cleanupCompleted },
      },
      createdAt: Date.now(),
    });
  },
});

export const getProfileForAgent = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) =>
    ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first(),
});
export const getActiveRoutesForAgent = internalQuery({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("routes")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect(),
});
export const getVerifiedDriversForAgent = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("userProfiles")
      .withIndex("by_accountType", (q) => q.eq("accountType", "driver"))
      .collect();
    return all.filter((d) => d.isVerifiedDriver === true && !d.isBanned);
  },
});
export const getActiveVehiclesForAgent = internalQuery({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("vehicles")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect(),
});
export const getSchedulesForDate = internalQuery({
  args: { date: v.string() },
  handler: async (ctx, args) =>
    ctx.db
      .query("schedules")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect(),
});
export const getAgentSettings = internalQuery({
  args: {},
  handler: async (ctx) => {
    const stored = await ctx.db.query("systemSettings").collect();
    const map: Record<string, any> = {
      company_name: "Kitui Travellers",
      max_passengers_per_booking: 8,
      ai_scheduler_enabled: false,
    };
    for (const s of stored) map[s.key] = s.value;
    return map;
  },
});

export const cleanupPastSchedules = internalAction({
  args: {},
  handler: async (ctx): Promise<{ deleted: number; completed: number }> => {
    const r = await ctx.runMutation(internal.schedulerAgent.cleanupPastSchedulesMutation, {});
    console.log(`[Scheduler] Cleanup: ${r.deleted} deleted, ${r.completed} completed`);
    return r;
  },
});

// cleanupPastSchedulesMutation, adding billing/overhead for no reason.
export const runMidnightCleanup = internalAction({
  args: {},
  handler: async (ctx) => {
    const r = await ctx.runMutation(internal.schedulerAgent.cleanupPastSchedulesMutation, {});
    console.log(`[Scheduler] Midnight cleanup: ${r.deleted} deleted, ${r.completed} completed`);
  },
});

export const runSchedulerAgentInternal = internalAction({
  args: { triggeredBy: v.string(), targetDate: v.string() },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    schedulesCreated: number;
    reasoning: string;
    warnings: string[];
    error?: string;
    cleanup: { deleted: number; completed: number };
  }> => {
    const cleanup = await ctx.runMutation(internal.schedulerAgent.cleanupPastSchedulesMutation, {});
    const [routes, drivers, vehicles, existing, settings] = await Promise.all([
      ctx.runQuery(internal.schedulerAgent.getActiveRoutesForAgent, {}),
      ctx.runQuery(internal.schedulerAgent.getVerifiedDriversForAgent, {}),
      ctx.runQuery(internal.schedulerAgent.getActiveVehiclesForAgent, {}),
      ctx.runQuery(internal.schedulerAgent.getSchedulesForDate, { date: args.targetDate }),
      ctx.runQuery(internal.schedulerAgent.getAgentSettings, {}),
    ]);
    if (existing.length > 0 && args.triggeredBy === "cron")
      return {
        success: true,
        schedulesCreated: 0,
        reasoning: "Already scheduled today.",
        warnings: [],
        cleanup,
      };
    if (routes.length === 0)
      return {
        success: false,
        schedulesCreated: 0,
        reasoning: "No active routes.",
        warnings: ["Add routes first."],
        cleanup,
      };
    const plan = computePlan(routes, drivers, vehicles);
    console.log(
      `[Scheduler] Plan: ${plan.assignments.length} trips, ${plan.unassignableRoutes.length} unassignable`
    );
    const apiKey = process.env.GEMINI_API_KEY,
      notesMap: Record<number, string> = {};
    let reasoning = "";
    const geminiWarnings: string[] = [];
    if (apiKey && plan.assignments.length > 0) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 } as any,
        });
        const result = await model.generateContent([
          { text: schedulerSystemPrompt(settings.company_name ?? "Kitui Travellers") },
          { text: schedulerUserPrompt(plan, args.targetDate, drivers.length) },
        ]);
        const raw = result.response
          .text()
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        const parsed = JSON.parse(raw) as GeminiResponse;
        reasoning = parsed.reasoning ?? "";
        if (Array.isArray(parsed.warnings)) geminiWarnings.push(...parsed.warnings);
        if (Array.isArray(parsed.schedules))
          for (const e of parsed.schedules)
            if (typeof e.planIndex === "number" && e.notes) notesMap[e.planIndex] = e.notes;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gemini error";
        console.warn("[Scheduler] Gemini non-fatal:", msg);
        geminiWarnings.push(`AI notes unavailable: ${msg}`);
        reasoning = `${plan.assignments.length} schedules created by algorithm.`;
      }
    } else {
      reasoning = `${plan.assignments.length} schedules created.`;
    }
    let created = 0;
    const errors: string[] = [];
    for (let i = 0; i < plan.assignments.length; i++) {
      const a = plan.assignments[i],
        note = notesMap[i] ? `[AI Scheduled] ${notesMap[i]}` : "[AI Scheduled]";
      try {
        await ctx.runMutation(internal.schedulerAgent.createAgentSchedule, {
          routeId: a.route.routeId as any,
          driverId: a.assignedDriverId ?? undefined,
          departureTime: a.departureTime,
          arrivalTime: a.arrivalTime,
          totalSeats: a.totalSeats,
          date: args.targetDate,
          notes: note,
        });
        created++;
      } catch (err) {
        errors.push(
          `${a.route.origin}→${a.route.destination} ${a.departureTime}: ${err instanceof Error ? err.message : "Unknown"}`
        );
      }
    }
    const allWarnings = [...plan.unassignableRoutes, ...geminiWarnings, ...errors];
    await ctx.runMutation(internal.schedulerAgent.logAgentRun, {
      triggeredBy: args.triggeredBy,
      targetDate: args.targetDate,
      schedulesCreated: created,
      reasoning: reasoning || `${created} schedules created.`,
      warnings: allWarnings,
      success: true,
      cleanupDeleted: cleanup.deleted,
      cleanupCompleted: cleanup.completed,
    });
    console.log(
      `[Scheduler] Created ${created}/${plan.assignments.length} schedules for ${args.targetDate}`
    );
    return { success: true, schedulesCreated: created, reasoning, warnings: allWarnings, cleanup };
  },
});

export const runSchedulerAgent = action({
  args: { triggeredBy: v.optional(v.string()), targetDate: v.optional(v.string()) },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    schedulesCreated: number;
    reasoning: string;
    warnings: string[];
    error?: string;
    cleanup: { deleted: number; completed: number };
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.runQuery(internal.schedulerAgent.getProfileForAgent, {
      userId: identity.subject,
    });
    if (!profile || profile.accountType !== "admin")
      throw new Error("Forbidden: admin access required");
    return ctx.runAction(internal.schedulerAgent.runSchedulerAgentInternal, {
      triggeredBy: args.triggeredBy ?? "manual",
      targetDate: args.targetDate ?? buildTodayDate(),
    });
  },
});

export const runSchedulerAgentCron = internalAction({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.runQuery(internal.schedulerAgent.getAgentSettings, {});
    if (!settings.ai_scheduler_enabled) {
      console.log("[Scheduler] Disabled — cleanup only.");
      // FIX: call mutation directly instead of wrapping in an action
      await ctx.runMutation(internal.schedulerAgent.cleanupPastSchedulesMutation, {});
      return;
    }
    await ctx.runAction(internal.schedulerAgent.runSchedulerAgentInternal, {
      triggeredBy: "cron",
      targetDate: buildTodayDate(),
    });
  },
});

// ════════════════════════════════════════════════════════════════════
// DRIVER STATUS AGENT
// Runs every 5 min via cron. Advances schedule status by EAT wall-clock.
//   scheduled → boarding    (15 min before departure)
//   boarding  → in_transit  (at departure, ≤10 min grace)
//   in_transit→ arrived     (at arrival, or early if ≥50% pax checked in)
// ════════════════════════════════════════════════════════════════════

function todayEAT(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}
function scheduleTimeToMs(t: string, d: string): number {
  return new Date(`${d}T${t}:00+03:00`).getTime();
}
function nowTimeEAT(): string {
  return new Date().toLocaleTimeString("en-KE", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const BOARDING_OPEN_MINS = 15,
  LATE_DEPART_GRACE = 10,
  EARLY_ARRIVE_MINS = 30,
  CHECKIN_THRESHOLD = 0.5;
type ActiveStatus = "scheduled" | "boarding" | "in_transit";

function decideTransition(
  status: ActiveStatus,
  depTime: string,
  arrTime: string,
  dateStr: string,
  nowMs: number,
  checkedIn: number,
  confirmed: number
): { move: boolean; next?: "boarding" | "in_transit" | "arrived"; reason: string } {
  const depMs = scheduleTimeToMs(depTime, dateStr),
    arrMs = scheduleTimeToMs(arrTime, dateStr);
  const minsToDepart = (depMs - nowMs) / 60_000,
    minsSinceDep = (nowMs - depMs) / 60_000;
  const minsToArrive = (arrMs - nowMs) / 60_000,
    minsSinceArr = (nowMs - arrMs) / 60_000;
  if (status === "scheduled") {
    if (minsToDepart <= BOARDING_OPEN_MINS && minsToDepart > -LATE_DEPART_GRACE)
      return {
        move: true,
        next: "boarding",
        reason: `${Math.round(minsToDepart)}m to departure — opening boarding`,
      };
    if (minsSinceDep > 0 && minsSinceDep <= LATE_DEPART_GRACE)
      return {
        move: true,
        next: "boarding",
        reason: `${Math.round(minsSinceDep)}m overdue — catching up`,
      };
    return { move: false, reason: `${Math.round(minsToDepart)}m until boarding opens` };
  }
  if (status === "boarding") {
    if (minsSinceDep >= 0)
      return {
        move: true,
        next: "in_transit",
        reason:
          minsSinceDep <= LATE_DEPART_GRACE
            ? "Departure time — departing"
            : `${Math.round(minsSinceDep)}m late — auto-departing`,
      };
    return { move: false, reason: `Departs in ${Math.round(-minsSinceDep)}m` };
  }
  if (status === "in_transit") {
    if (minsSinceArr >= 0) return { move: true, next: "arrived", reason: "Arrival time reached" };
    const earlyOk = minsToArrive <= EARLY_ARRIVE_MINS,
      paxOk = confirmed > 0 && checkedIn / confirmed >= CHECKIN_THRESHOLD;
    if (earlyOk && paxOk)
      return {
        move: true,
        next: "arrived",
        reason: `Early arrival: ${checkedIn}/${confirmed} pax checked in, ${Math.round(minsToArrive)}m early`,
      };
    return { move: false, reason: `${Math.round(minsToArrive)}m to arrival` };
  }
  return { move: false, reason: "No transition needed" };
}

export const getTodayWindowedSchedulesForAgent = internalQuery({
  args: {},
  handler: async (ctx) => {
    const today = todayEAT(),
      nowMs = Date.now();
    const msToHHMM = (ms: number) => {
      const eat = new Date(ms + 3 * 60 * 60_000);
      return `${String(eat.getUTCHours()).padStart(2, "0")}:${String(eat.getUTCMinutes()).padStart(2, "0")}`;
    };
    const nowHHMM = msToHHMM(nowMs),
      boardingOpenHHMM = msToHHMM(nowMs + BOARDING_OPEN_MINS * 60_000);
    const lateGraceHHMM = msToHHMM(nowMs - LATE_DEPART_GRACE * 60_000),
      earlyArriveHHMM = msToHHMM(nowMs + EARLY_ARRIVE_MINS * 60_000);
    const allToday = await ctx.db
      .query("schedules")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();
    return allToday.filter((s) => {
      if (s.status === "scheduled")
        return s.departureTime <= boardingOpenHHMM && s.departureTime >= lateGraceHHMM;
      if (s.status === "boarding") return s.departureTime <= nowHHMM;
      if (s.status === "in_transit") return s.arrivalTime <= earlyArriveHHMM;
      return false;
    });
  },
});

export const getScheduleCheckinCounts = internalQuery({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_scheduleId", (q) => q.eq("scheduleId", args.scheduleId))
      .collect();
    return {
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      checkedIn: bookings.filter((b) => b.checkedIn === true).length,
    };
  },
});
export const getScheduleByIdForAgent = internalQuery({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => ctx.db.get(args.scheduleId),
});

export const applyScheduleStatusTransition = internalMutation({
  args: {
    scheduleId: v.id("schedules"),
    newStatus: v.union(v.literal("boarding"), v.literal("in_transit"), v.literal("arrived")),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) return { skipped: true };
    const ORDER = ["scheduled", "boarding", "in_transit", "arrived"];
    if (
      ORDER.indexOf(schedule.status) >= ORDER.indexOf(args.newStatus) ||
      schedule.status === "cancelled"
    )
      return { skipped: true };
    const now = Date.now();
    await ctx.db.patch(args.scheduleId, { status: args.newStatus, updatedAt: now });
    const route = await ctx.db.get(schedule.routeId),
      routeName = route ? `${route.origin} → ${route.destination}` : "your route";
    const NOTIFS: Record<string, { type: string; title: string; msg: string }> = {
      boarding: {
        type: "trip_reminder",
        title: `🚌 Now Boarding — ${routeName}`,
        msg: `Your bus is now boarding. Please proceed to the departure point. Departs ${schedule.departureTime}.`,
      },
      in_transit: {
        type: "trip_started",
        title: `🚀 Trip Departed — ${routeName}`,
        msg: `Your journey to ${route?.destination ?? "destination"} has started. Estimated arrival: ${schedule.arrivalTime}.`,
      },
      arrived: {
        type: "trip_completed",
        title: `✅ You've Arrived — ${routeName}`,
        msg: `Welcome to ${route?.destination ?? "your destination"}! Please tap to rate your journey.`,
      },
    };
    const notif = NOTIFS[args.newStatus];
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_scheduleId", (q) => q.eq("scheduleId", args.scheduleId))
      .collect();
    const active = bookings.filter((b) => ["confirmed", "pending"].includes(b.status));
    let notified = 0;
    for (const booking of active) {
      await ctx.db.insert("notifications", {
        userId: booking.userId,
        type: notif.type as any,
        title: notif.title,
        message: notif.msg,
        isRead: false,
        data: { scheduleId: args.scheduleId, bookingId: booking._id },
        createdAt: now,
      });
      if (args.newStatus === "arrived")
        await ctx.db.patch(booking._id, { status: "completed", updatedAt: now });
      notified++;
    }
    await ctx.db.insert("auditLogs", {
      actorId: "driver_status_agent",
      action: `schedule_auto_${args.newStatus}`,
      resource: "schedules",
      resourceId: args.scheduleId,
      details: { from: schedule.status, to: args.newStatus, reason: args.reason, notified },
      createdAt: now,
    });
    return { skipped: false, from: schedule.status, to: args.newStatus, notified };
  },
});

export const runDriverStatusAgentCron = internalAction({
  args: {},
  handler: async (ctx) => {
    const nowMs = Date.now();
    const candidates = await ctx.runQuery(
      internal.schedulerAgent.getTodayWindowedSchedulesForAgent,
      {}
    );
    if (candidates.length === 0) return;
    console.log(`[DriverAgent] ${candidates.length} candidate(s) at ${nowTimeEAT()} EAT`);
    let moved = 0,
      held = 0;
    for (const s of candidates) {
      if (!s.date) {
        held++;
        continue;
      }
      const counts =
        s.status === "in_transit"
          ? await ctx.runQuery(internal.schedulerAgent.getScheduleCheckinCounts, {
              scheduleId: s._id,
            })
          : { confirmed: 0, checkedIn: 0 };
      const dec = decideTransition(
        s.status as ActiveStatus,
        s.departureTime,
        s.arrivalTime,
        s.date,
        nowMs,
        counts.checkedIn,
        counts.confirmed
      );
      if (!dec.move || !dec.next) {
        held++;
        continue;
      }
      console.log(
        `[DriverAgent] MOVE ${s.departureTime} ${s.status} → ${dec.next} — ${dec.reason}`
      );
      const result = await ctx.runMutation(internal.schedulerAgent.applyScheduleStatusTransition, {
        scheduleId: s._id,
        newStatus: dec.next,
        reason: dec.reason,
      });
      if (!result.skipped) moved++;
      else held++;
    }
    if (moved > 0 || held > 0) console.log(`[DriverAgent] Done: ${moved} moved, ${held} held`);
  },
});

export const getDriverScheduleStatus = action({
  args: { scheduleId: v.id("schedules") },
  handler: async (
    ctx,
    args
  ): Promise<{
    currentStatus: string;
    suggestedNext: string | null;
    reason: string;
    departureTime: string;
    arrivalTime: string;
    minsToDepart: number;
    minsToArrive: number;
    checkedIn: number;
    totalConfirmed: number;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const schedule = await ctx.runQuery(internal.schedulerAgent.getScheduleByIdForAgent, {
      scheduleId: args.scheduleId,
    });
    if (!schedule) throw new Error("Schedule not found");
    const profile = await ctx.runQuery(internal.schedulerAgent.getProfileForAgent, {
      userId: identity.subject,
    });
    if (!profile) throw new Error("Profile not found");
    if (profile.accountType === "driver" && schedule.driverId !== identity.subject)
      throw new Error("Not your schedule");
    const counts = await ctx.runQuery(internal.schedulerAgent.getScheduleCheckinCounts, {
      scheduleId: args.scheduleId,
    });
    const nowMs = Date.now(),
      dateStr = schedule.date ?? todayEAT();
    const isActive = (["scheduled", "boarding", "in_transit"] as string[]).includes(
      schedule.status
    );
    const dec = isActive
      ? decideTransition(
          schedule.status as ActiveStatus,
          schedule.departureTime,
          schedule.arrivalTime,
          dateStr,
          nowMs,
          counts.checkedIn,
          counts.confirmed
        )
      : { move: false, next: undefined as any, reason: "Trip ended" };
    const depMs = scheduleTimeToMs(schedule.departureTime, dateStr),
      arrMs = scheduleTimeToMs(schedule.arrivalTime, dateStr);
    return {
      currentStatus: schedule.status,
      suggestedNext: dec.next ?? null,
      reason: dec.reason,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      minsToDepart: Math.round((depMs - nowMs) / 60_000),
      minsToArrive: Math.round((arrMs - nowMs) / 60_000),
      checkedIn: counts.checkedIn,
      totalConfirmed: counts.confirmed,
    };
  },
});

// ════════════════════════════════════════════════════════════════════
// USER CHAT AGENT
// ════════════════════════════════════════════════════════════════════

const CHAT_TOOL_DEFINITIONS = [
  {
    name: "searchRoutes",
    description:
      "Search available Kitui Travellers bus routes. Call with no args for ALL routes, or filter by origin/destination city name.",
    parameters: {
      type: "OBJECT",
      properties: {
        origin: { type: "STRING", description: "Departure city e.g. 'Kitui', 'Nairobi'" },
        destination: { type: "STRING", description: "Destination city e.g. 'Mombasa', 'Nairobi'" },
      },
    },
  },
  {
    name: "getSchedules",
    description:
      "Get departure times, seats left and price for a specific route. Pass the EXACT routeId string from searchRoutes — never guess it.",
    parameters: {
      type: "OBJECT",
      required: ["routeId"],
      properties: {
        routeId: { type: "STRING", description: "Exact routeId from searchRoutes" },
      },
    },
  },
  {
    name: "createBooking",
    description:
      "Create a confirmed booking. Call ONLY after user says 'yes'/'confirm'/'book it' to your booking summary. Returns bookingId — the payment screen opens automatically.",
    parameters: {
      type: "OBJECT",
      required: ["scheduleId", "passengerNames"],
      properties: {
        scheduleId: { type: "STRING", description: "Exact scheduleId from getSchedules" },
        passengerNames: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: 'Full name of every passenger e.g. ["Jane Muthoni","John Kamau"]',
        },
        promoCode: { type: "STRING", description: "Optional promo code" },
      },
    },
  },
  {
    name: "getMyBookings",
    description:
      "User's booking history — status, amounts, passengers, dates (last 10). Flags completed trips with no review so you can remind them.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "getNotifications",
    description:
      "User's notifications: unread count + recent list with titles, messages and timestamps.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "getSpendingSummary",
    description:
      "User's M-Pesa spending: total, this month, refunds, avg per trip, peak month, 6-month breakdown.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "getProfile",
    description: "User's current profile: name, phone, account type, total trips, ban status.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "updateProfile",
    description:
      "Update the user's profile. Call ONLY after user has confirmed the new value(s). Can update fullName, phone, or both.",
    parameters: {
      type: "OBJECT",
      properties: {
        fullName: { type: "STRING", description: "New full name" },
        phone: { type: "STRING", description: "New phone number e.g. +254712345678" },
      },
    },
  },
];

function buildChatSystemPrompt(
  profile: {
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    totalTrips?: number | null;
  } | null
): string {
  const name =
    profile?.fullName ??
    (profile?.email ? profile.email.split("@")[0].replace(/[._-]/g, " ") : null) ??
    "there";
  return `You are Beba 🚌, the friendly AI travel assistant for Kitui Travellers — a bus booking service in Kenya.

USER: ${name}${profile?.phone ? ` · ${profile.phone}` : ""}${profile?.totalTrips != null ? ` · ${profile.totalTrips} trips` : ""} 

═══════════════════════════════════════
BOOKING FLOW — strict order
═══════════════════════════════════════
1. searchRoutes → show routes with vehicle type & base price. Ask which route.
2. getSchedules(routeId) → show times, seats, price. Ask which time & how many passengers.
3. Collect full name for EVERY passenger. ID optional. Ask one by one if >1.
4. Ask if they have a promo code (optional).
5. Show BOOKING SUMMARY before creating anything:
   Route:      Origin → Destination
   Time:       HH:MM → HH:MM  [Date if available]
   Vehicle:    type
   Passengers: N × KES price = KES total
   Names:      1. Full Name
               2. Full Name
   Promo:      CODE (if any)
   Then ask: "Shall I confirm this booking? The M-Pesa payment screen will open next."
6. On "yes"/"confirm"/"book it" → call createBooking with EXACT scheduleId.
   Say: "Booking confirmed! ✅ The M-Pesa payment screen is opening now — enter your PIN."
7. On error → explain clearly, offer alternative times/routes.

═══════════════════════════════════════
ALL OTHER FEATURES
═══════════════════════════════════════
ROUTES:        searchRoutes → list with prices, vehicle type, duration, stops.
BOOKINGS:      getMyBookings → summarise by status. For any needsReview=true booking:
               "You have an unreviewed trip — go to My Bookings to rate your journey! ⭐"
NOTIFICATIONS: getNotifications → show unreadCount first, then list unread ones.
               Summarise in plain language, newest first.
SPENDING:      getSpendingSummary → give clear insight:
               "KES X this month · KES Y total · avg KES Z per trip"
               "Your busiest month: [month] at KES Y"
               Flag if spending is unusually high.
PROFILE VIEW:  getProfile → show name, phone, trips taken, account status.
PROFILE UPDATE:
  1. Confirm new value(s) with user.
  2. Call updateProfile(fullName?, phone?).
  3. Confirm: "Done! Your [name/phone] has been updated to [value]."
TRAVEL ADVICE: Answer from knowledge — boarding tips, luggage, Kitui info, travel with kids.
REVIEW REMIND: After getMyBookings, proactively remind about unreviewed completed trips.

═══════════════════════════════════════
RULES
═══════════════════════════════════════
• Warm, concise, practical — <200 words unless showing a booking summary
• Prices in KES. Times in EAT (Kenya, UTC+3)
• NEVER invent routeId / scheduleId — use exact strings from tool results
• NEVER call createBooking without explicit confirmation
• If seats=0 say "fully booked" and suggest other times
• If asked about something unrelated to travel, politely redirect
• Never expose raw IDs to the user`;
}

async function executeChatTool(
  ctx: any,
  userId: string,
  toolName: string,
  toolArgs: Record<string, any>
): Promise<any> {
  switch (toolName) {
    case "searchRoutes":
      return ctx.runQuery(internal.schedulerAgent.chatSearchRoutes, {
        origin: toolArgs.origin ?? undefined,
        destination: toolArgs.destination ?? undefined,
      });
    case "getSchedules":
      return ctx.runQuery(internal.schedulerAgent.chatGetSchedules, { routeId: toolArgs.routeId });
    case "createBooking": {
      const names = Array.isArray(toolArgs.passengerNames)
        ? (toolArgs.passengerNames as string[])
            .filter((n) => typeof n === "string" && n.trim().length > 0)
            .map((n) => ({ name: n.trim() }))
        : [];
      if (names.length === 0) throw new Error("At least one passenger name is required");
      return ctx.runMutation(api.bookings.createBooking, {
        scheduleId: toolArgs.scheduleId,
        passengers: names,
        promoCode: toolArgs.promoCode?.trim() || undefined,
      });
    }
    case "getMyBookings":
      return ctx.runQuery(internal.schedulerAgent.chatGetMyBookings, { userId });
    case "getNotifications":
      return ctx.runQuery(internal.schedulerAgent.chatGetNotifications, { userId });
    case "getSpendingSummary":
      return ctx.runQuery(internal.schedulerAgent.chatGetSpendingSummary, { userId });
    case "getProfile":
      return ctx.runQuery(internal.schedulerAgent.chatGetProfile, { userId });
    case "updateProfile": {
      const patch: { fullName?: string; phone?: string } = {};
      if (toolArgs.fullName?.trim()) patch.fullName = toolArgs.fullName.trim();
      if (toolArgs.phone?.trim()) patch.phone = toolArgs.phone.trim();
      if (Object.keys(patch).length === 0)
        throw new Error("Provide fullName and/or phone to update");
      return ctx.runMutation(api.users.updateProfile, patch);
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ── Internal queries for chat tools ──────────────────────────────

export const chatSearchRoutes = internalQuery({
  args: { origin: v.optional(v.string()), destination: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let routes = await ctx.db
      .query("routes")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    if (args.origin) {
      const o = args.origin.toLowerCase();
      routes = routes.filter(
        (r) => r.origin.toLowerCase().includes(o) || r.name.toLowerCase().includes(o)
      );
    }
    if (args.destination) {
      const d = args.destination.toLowerCase();
      routes = routes.filter(
        (r) => r.destination.toLowerCase().includes(d) || r.name.toLowerCase().includes(d)
      );
    }
    if (routes.length === 0)
      return {
        routes: [],
        message:
          args.origin || args.destination
            ? `No routes found for "${args.origin ?? ""}${args.origin && args.destination ? " → " : ""}${args.destination ?? ""}". Try a different city name.`
            : "No active routes right now.",
      };
    return {
      count: routes.length,
      routes: routes.map((r) => ({
        routeId: r._id,
        name: r.name,
        origin: r.origin,
        destination: r.destination,
        stops: r.stops,
        distanceKm: r.distanceKm,
        durationMinutes: r.durationMinutes,
        basePrice: r.basePrice,
        vehicleType: r.vehicleType,
        amenities: r.amenities,
      })),
    };
  },
});

export const chatGetSchedules = internalQuery({
  args: { routeId: v.string() },
  handler: async (ctx, args) => {
    // Convex IDs are base32 strings — a valid routes ID is typically 32 chars.
    // If Gemini hallucinates or truncates an ID, db.get throws "Invalid ID length".
    // We validate length and character set before touching the DB.
    const validIdPattern = /^[0-9a-zA-Z]{20,40}$/;
    if (!validIdPattern.test(args.routeId)) {
      return {
        schedules: [],
        error: "invalid_route_id",
        message:
          "I don't have a valid route selected. Please call searchRoutes first to get the correct route ID, then try again.",
      };
    }

    let route: any = null;
    try {
      route = await ctx.db.get(args.routeId as any);
    } catch {
      return {
        schedules: [],
        error: "invalid_route_id",
        message:
          "That route ID is not valid. Please search for routes again using searchRoutes and use the exact routeId from the results.",
      };
    }

    if (!route) {
      return {
        schedules: [],
        message: "Route not found. Please search again with searchRoutes.",
        basePrice: null,
      };
    }

    const schedules = await ctx.db
      .query("schedules")
      .withIndex("by_routeId", (q: any) => q.eq("routeId", args.routeId))
      .collect();
    const available = schedules.filter((s) => ["scheduled", "boarding"].includes(s.status));
    if (available.length === 0)
      return {
        schedules: [],
        message: "No departures available for this route right now.",
        basePrice: route.basePrice ?? null,
      };
    return {
      count: available.length,
      basePrice: route.basePrice ?? null,
      schedules: available
        .sort((a, b) => a.departureTime.localeCompare(b.departureTime))
        .map((s) => ({
          scheduleId: s._id,
          departureTime: s.departureTime,
          arrivalTime: s.arrivalTime,
          availableSeats: s.availableSeats,
          totalSeats: s.totalSeats,
          status: s.status,
          price: s.price ?? route.basePrice ?? null,
          date: s.date ?? null,
          isBoarding: s.status === "boarding",
        })),
    };
  },
});

export const chatGetMyBookings = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const sorted = bookings.sort((a, b) => b.createdAt - a.createdAt);
    const completedIds = sorted.filter((b) => b.status === "completed").map((b) => b._id);
    // FIX: single bulk query instead of N queries (one per completed booking)
    const allUserReviews = await ctx.db
      .query("reviews")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const reviewedBookingIds = new Set(allUserReviews.map((r) => String(r.bookingId)));
    const reviewedIds = new Set<string>(
      completedIds.filter((id) => reviewedBookingIds.has(String(id)))
    );
    return {
      total: bookings.length,
      unreviewed: completedIds.length - reviewedIds.size,
      bookings: sorted.slice(0, 10).map((b) => ({
        bookingCode: b.bookingCode,
        status: b.status,
        paymentStatus: b.paymentStatus,
        totalAmount: b.totalAmount,
        passengerCount: b.passengers.length,
        passengers: b.passengers.map((p) => p.name),
        createdAt: new Date(b.createdAt).toLocaleDateString("en-KE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        needsReview: b.status === "completed" && !reviewedIds.has(String(b._id)),
      })),
    };
  },
});

export const chatGetNotifications = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const sorted = all.sort((a, b) => b.createdAt - a.createdAt);
    return {
      unreadCount: sorted.filter((n) => !n.isRead).length,
      notifications: sorted.slice(0, 10).map((n) => ({
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        time: new Date(n.createdAt).toLocaleString("en-KE", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    };
  },
});

export const chatGetSpendingSummary = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const txns = await ctx.db
      .query("walletTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const payments = txns.filter((t) => t.type === "payment"),
      refunds = txns.filter((t) => t.type === "refund");
    const totalSpent = payments.reduce((s, t) => s + t.amount, 0),
      totalRefunded = refunds.reduce((s, t) => s + t.amount, 0);
    const now = new Date();
    const thisMonth = payments
      .filter((t) => {
        const d = new Date(t.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, t) => s + t.amount, 0);
    const monthlyBreakdown: { month: string; amount: number; trips: number }[] = [],
      peakMonth = { month: "", amount: 0 };
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();
      const slice = payments.filter((t) => t.createdAt >= start && t.createdAt <= end);
      const label = d.toLocaleString("en-KE", { month: "short" }),
        amt = slice.reduce((s, t) => s + t.amount, 0);
      monthlyBreakdown.push({ month: label, amount: amt, trips: slice.length });
      if (amt > peakMonth.amount) {
        peakMonth.month = label;
        peakMonth.amount = amt;
      }
    }
    return {
      totalSpent,
      totalRefunded,
      netSpent: totalSpent - totalRefunded,
      thisMonth,
      transactionCount: payments.length,
      avgPerTrip: payments.length > 0 ? Math.round(totalSpent / payments.length) : 0,
      peakMonth: peakMonth.amount > 0 ? peakMonth : null,
      monthlyBreakdown,
    };
  },
});

export const chatGetProfile = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const p = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!p) return null;
    return {
      fullName: p.fullName ?? null,
      email: p.email ?? null,
      phone: p.phone ?? null,
      accountType: p.accountType,
      totalTrips: p.totalTrips ?? null,
      isBanned: p.isBanned ?? false,
      banReason: p.banReason ?? null,
      // Personal Gemini key — only accessible server-side via internalQuery
      geminiApiKey: p.geminiApiKey ?? null,
    };
  },
});

/**
 * Internal query: can users of `accountType` fall back to the shared
 * GEMINI_API_KEY env var?  Reads the admin-controlled system setting.
 */
// chatGetGeminiAccess is now handled by convex/geminiAccess.ts
// userChatAgent delegates to internal.geminiAccess.checkSharedKeyAccess

/** Parse retry-after seconds that Gemini embeds in 429 error messages */
function parseGeminiRetrySeconds(msg: string): number | null {
  const secMatch = msg.match(/retry in\s+([\d.]+)s/i);
  if (secMatch) return Math.ceil(parseFloat(secMatch[1]));
  const delayMatch = msg.match(/"retryDelay"\s*:\s*"([\d.]+)s"/i);
  if (delayMatch) return Math.ceil(parseFloat(delayMatch[1]));
  return null;
}

function formatRateLimitMessage(retrySeconds: number | null): string {
  const retryLine =
    retrySeconds !== null
      ? retrySeconds < 60
        ? `Please wait about **${retrySeconds} seconds** and try again.`
        : `Please wait about **${Math.ceil(retrySeconds / 60)} minute${Math.ceil(retrySeconds / 60) > 1 ? "s" : ""}** and try again.`
      : "Please wait a few minutes and try again.";
  return `⚠️ Daily request limit reached\n\nThe free Gemini API tier allows **20 requests per day**. You've used all of today's quota.\n\n${retryLine}\n\nTo remove this limit permanently, upgrade your API key at https://aistudio.google.com — the paid tier gives thousands of requests per day.\n\nIn the meantime, use the dashboard directly to browse routes and book trips.`;
}

export const userChatAgent = action({
  args: {
    message: v.string(),
    history: v.array(
      v.object({ role: v.union(v.literal("user"), v.literal("model")), content: v.string() })
    ),
    fingerprint: v.optional(v.string()), // 32-char browser fingerprint for device-level abuse prevention
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    message: string;
    errorType?: string;
    action?: { type: "open_payment"; bookingId: string; bookingCode: string; amount: number };
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    // ── 1. Load profile ──────────────────────────────────────────────────────
    const profile = await ctx.runQuery(internal.schedulerAgent.chatGetProfile, { userId });

    // ── 2. Hard block for banned users ───────────────────────────────────────
    if (profile?.isBanned) {
      return {
        message: `🚫 Your account has been suspended.\n\nReason: ${profile.banReason ?? "Violation of terms of service"}\n\nYou cannot use this service while suspended. Contact support if you believe this is an error.`,
        errorType: "banned",
      };
    }

    // ── 3. Resolve which Gemini API key to use ───────────────────────────────
    //  Priority: own key → shared key (if admin allows + device check passes) → error
    const ownKey = profile?.geminiApiKey?.trim() || null;
    let apiKey: string | null = ownKey;
    let usingOwnKey = !!ownKey;

    if (!apiKey) {
      // Check allowlist/mode and device fingerprint for the shared key
      const access = await ctx.runQuery(internal.geminiAccess.checkSharedKeyAccess, {
        userId,
        accountType: (profile?.accountType ?? "user") as "user" | "driver" | "admin",
        fingerprint: args.fingerprint,
      });

      if (access.allowed) {
        apiKey = process.env.GEMINI_API_KEY?.trim() || null;
        usingOwnKey = false;

        // Register the device fingerprint so future multi-account attempts are caught
        if (access.allowed && args.fingerprint && apiKey) {
          await ctx.runMutation(internal.geminiAccess.registerDeviceFingerprint, {
            fingerprint: args.fingerprint,
            userId,
          });
        }
      } else {
        // Access denied — surface the right message based on reason
        const reason = access.reason;
        if (reason === "device_conflict") {
          return {
            message:
              `🖥️ **Device already in use by another account**\n\n` +
              `${access.message}\n\n` +
              `This protection prevents the shared API key from being abused by creating multiple accounts on the same device.`,
            errorType: "device_conflict",
          };
        }
        if (reason === "device_blocked") {
          return {
            message: `🚫 **This device has been blocked**\n\n${access.message}`,
            errorType: "device_blocked",
          };
        }
        if (reason === "not_allowlisted") {
          return {
            message:
              `🔒 **You are not on the AI access list**\n\n` +
              `${access.message}\n\n` +
              `You can get your own free Gemini API key at https://aistudio.google.com/apikey (free tier: 1,500 requests/day) and add it in your profile settings.`,
            errorType: "not_allowlisted",
          };
        }
        // "off" or unknown
        const roleHint =
          profile?.accountType === "admin"
            ? "Go to **Settings → AI Chat Settings** to enable access or add your own key."
            : profile?.accountType === "driver"
              ? "Go to **My Profile → AI Settings** to add your own Gemini API key."
              : "Go to **My Profile → AI Settings** to add your own Gemini API key.";
        return {
          message:
            `🔑 The AI assistant is not available to you right now.\n\n` +
            `The admin has not enabled shared AI access for your account type, and you haven't added your own key.\n\n` +
            `**${roleHint}**\n\n` +
            `You can get a free Gemini API key at https://aistudio.google.com — the free tier gives 1,500 requests/day.\n\n` +
            `In the meantime, use the dashboard directly to browse routes and book trips.`,
          errorType: "no_key",
        };
      }
    }

    if (!apiKey) {
      return {
        message: "❌ The shared Gemini API key is not configured on the server. Contact the admin.",
        errorType: "config",
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: buildChatSystemPrompt(profile),
        tools: [{ functionDeclarations: CHAT_TOOL_DEFINITIONS }] as any,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } as any,
      });
      const geminiHistory = args.history
        .slice(-20)
        .map((h) => ({ role: h.role, parts: [{ text: h.content }] }));
      const chat = model.startChat({ history: geminiHistory });
      let result = await chat.sendMessage(args.message);
      let bookingCreated: { bookingId: string; bookingCode: string; totalAmount: number } | null =
        null;
      let rounds = 0;

      while (rounds < 6) {
        let functionCalls: any[];
        try {
          functionCalls = result.response.functionCalls() ?? [];
        } catch {
          functionCalls = [];
        }
        if (!functionCalls.length) break;
        rounds++;
        const responses: any[] = [];
        for (const call of functionCalls) {
          let toolResult: any;
          try {
            toolResult = await executeChatTool(
              ctx,
              userId,
              call.name,
              (call.args ?? {}) as Record<string, any>
            );
            if (call.name === "createBooking" && toolResult?.bookingId && toolResult?.bookingCode) {
              bookingCreated = {
                bookingId: String(toolResult.bookingId),
                bookingCode: String(toolResult.bookingCode),
                totalAmount: Number(toolResult.totalAmount ?? 0),
              };
            }
          } catch (err) {
            toolResult = {
              error: err instanceof Error ? err.message : "Tool failed",
              success: false,
            };
          }
          responses.push({ functionResponse: { name: call.name, response: toolResult } });
        }
        result = await chat.sendMessage(responses as any);
      }

      const message =
        result.response.text()?.trim() ||
        "Sorry, I couldn't generate a response. Please try again.";
      return {
        message,
        action: bookingCreated
          ? {
              type: "open_payment",
              bookingId: bookingCreated.bookingId,
              bookingCode: bookingCreated.bookingCode,
              amount: bookingCreated.totalAmount,
            }
          : undefined,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const lower = errMsg.toLowerCase();
      console.error("[userChatAgent] Error:", errMsg.slice(0, 300));

      // 429 rate limit / quota exceeded
      if (
        lower.includes("429") ||
        lower.includes("too many requests") ||
        lower.includes("quota") ||
        lower.includes("generaterequests")
      ) {
        const retrySeconds = parseGeminiRetrySeconds(errMsg);
        const baseMsg = formatRateLimitMessage(retrySeconds);
        // If using own key, tell them it's their key that's rate-limited
        const suffix = usingOwnKey
          ? "\n\nThis limit is on your personal API key. The free tier allows 1,500 requests/day on the new Gemini API — check https://aistudio.google.com/apikey for your usage."
          : "\n\nThis is the shared API key. Contact the admin if this keeps happening.";
        return { message: baseMsg + suffix, errorType: "rate_limit" };
      }
      // Invalid API key
      if (lower.includes("api_key") || lower.includes("invalid key") || lower.includes("api key")) {
        const hint = usingOwnKey
          ? "Your personal Gemini API key appears to be invalid. Update it in your profile settings."
          : "The shared Gemini API key is invalid. Contact the admin.";
        return { message: `❌ API key error\n\n${hint}`, errorType: "invalid_key" };
      }
      // Network / timeout
      if (
        lower.includes("network") ||
        lower.includes("timeout") ||
        lower.includes("econnrefused") ||
        lower.includes("fetch failed")
      ) {
        return {
          message:
            "❌ Connection error — couldn't reach the AI service.\n\nCheck your internet connection and try again.",
          errorType: "network",
        };
      }
      // Catch-all
      return {
        message:
          "❌ Something went wrong. Please try again in a moment.\n\nIf this keeps happening, use the dashboard directly to browse routes and book trips.",
        errorType: "unknown",
      };
    }
  },
});
