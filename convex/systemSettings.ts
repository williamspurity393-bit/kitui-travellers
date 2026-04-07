import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DEFAULTS: Record<string, any> = {
  commission_rate: 0.15,
  maintenance_mode: false,
  allow_new_registrations: true,
  booking_code_prefix: "KT",
  company_name: "Kitui Travellers",
  support_phone: "+254 700 000000",
  support_email: "support@kuittravellers.co.ke",
  max_passengers_per_booking: 8,
  cancellation_window_hours: 2,
  ai_scheduler_enabled: false,

  // ── Gemini API key access control ─────────────────────────────
  // When true, users of that role may fall back to the shared GEMINI_API_KEY
  // env var if they have not set their own personal key.
  // Admin tip: keep all false until you move to a paid Gemini plan.
  gemini_enabled_for_users: false,
  gemini_enabled_for_drivers: false,
  gemini_enabled_for_admins: false,
};

// ── Auth helpers ──────────────────────────────────────────────

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

// ── Queries ───────────────────────────────────────────────────

export const getAllSettings = query({
  args: {},
  handler: async (ctx) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return null;
    const stored = await ctx.db.query("systemSettings").collect();
    const map: Record<string, any> = { ...DEFAULTS };
    for (const s of stored) map[s.key] = s.value;
    return map;
  },
});

export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .first();
    return row?.value ?? DEFAULTS[args.key] ?? null;
  },
});

/**
 * Public query: can a given accountType use the shared Gemini key?
 * Called by the chat agent (via internalQuery) and by profile pages
 * to show the user their access status.
 */
export const getGeminiAccessForRole = query({
  args: { accountType: v.union(v.literal("user"), v.literal("driver"), v.literal("admin")) },
  handler: async (ctx, args) => {
    const settingKey = `gemini_enabled_for_${args.accountType}s` as
      | "gemini_enabled_for_users"
      | "gemini_enabled_for_drivers"
      | "gemini_enabled_for_admins";
    const row = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q: any) => q.eq("key", settingKey))
      .first();
    return (row?.value as boolean) ?? DEFAULTS[settingKey] ?? false;
  },
});

// ── Mutations ─────────────────────────────────────────────────

export const updateSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const existing = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch("systemSettings", existing._id, {
        value: args.value,
        description: args.description,
        updatedBy: identity.subject,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("systemSettings", {
        key: args.key,
        value: args.value,
        description: args.description,
        updatedBy: identity.subject,
        updatedAt: now,
      });
    }
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "setting_updated",
      resource: "systemSettings",
      details: { key: args.key, value: args.value },
      createdAt: now,
    });
  },
});

export const bulkUpdateSettings = mutation({
  args: {
    settings: v.array(v.object({ key: v.string(), value: v.any() })),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const now = Date.now();
    for (const { key, value } of args.settings) {
      const existing = await ctx.db
        .query("systemSettings")
        .withIndex("by_key", (q: any) => q.eq("key", key))
        .first();
      if (existing) {
        await ctx.db.patch("systemSettings", existing._id, {
          value,
          updatedBy: identity.subject,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("systemSettings", {
          key,
          value,
          updatedBy: identity.subject,
          updatedAt: now,
        });
      }
    }
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "settings_bulk_updated",
      resource: "systemSettings",
      details: { keys: args.settings.map((s) => s.key) },
      createdAt: now,
    });
  },
});
