import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

// ── Mode helpers ──────────────────────────────────────────────

type AccountType = "user" | "driver" | "admin";
type GeminiMode = "off" | "all" | "allowlist";

const MODE_DEFAULTS: Record<string, GeminiMode> = {
  gemini_user_mode: "off",
  gemini_driver_mode: "off",
  gemini_admin_mode: "off",
};

async function getModeForRole(ctx: any, accountType: AccountType): Promise<GeminiMode> {
  const key = `gemini_${accountType}_mode`;
  const row = await ctx.db
    .query("systemSettings")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .first();
  return (row?.value as GeminiMode) ?? MODE_DEFAULTS[key] ?? "off";
}

// ══════════════════════════════════════════════════════════════
// INTERNAL — called by schedulerAgent.userChatAgent
// ══════════════════════════════════════════════════════════════

/**
 * Determine whether `userId` may use the shared Gemini key.
 * Returns { allowed, reason } — reason is a user-friendly explanation when denied.
 */
export const checkSharedKeyAccess = internalQuery({
  args: {
    userId: v.string(),
    accountType: v.union(v.literal("user"), v.literal("driver"), v.literal("admin")),
    fingerprint: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ── Step 1: Check individual allowlist FIRST ──────────────────────────
    // If the admin has explicitly granted this user, they get access
    // regardless of the role-wide mode. This is intentional — individual
    // grants override the role switch so admins can selectively allow
    // specific users even when the role is set to "off".
    const allowlistEntry = await ctx.db
      .query("geminiAllowlist")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .first();

    const isIndividuallyGranted = !!allowlistEntry;

    // ── Step 2: If NOT individually granted, check role-wide mode ─────────
    if (!isIndividuallyGranted) {
      const mode = await getModeForRole(ctx, args.accountType);

      if (mode === "off") {
        return { allowed: false, reason: "off" };
      }

      if (mode === "allowlist") {
        // Role is in allowlist mode and this user is NOT on the list
        return {
          allowed: false,
          reason: "not_allowlisted",
          message:
            "You are not on the AI assistant access list. " +
            "Ask the admin to grant you access, or add your own Gemini API key in your profile.",
        };
      }
      // mode === "all" — fall through to device check
    }

    // ── Step 3: Device fingerprint check ─────────────────────────────────
    // Applied to everyone using the shared key (individually granted or via "all" mode).
    // Skipped if no fingerprint provided (e.g. privacy mode browser).
    if (args.fingerprint) {
      const existing = await ctx.db
        .query("deviceFingerprints")
        .withIndex("by_fingerprint", (q: any) => q.eq("fingerprint", args.fingerprint!))
        .first();

      if (existing) {
        // Admin has manually blocked this device
        if (existing.blocked) {
          return {
            allowed: false,
            reason: "device_blocked",
            message:
              "This device has been blocked from using the shared AI key. " +
              "Add your own Gemini API key in your profile settings.",
          };
        }
        // Same fingerprint used by a DIFFERENT userId → multi-account abuse
        if (existing.userId !== args.userId) {
          return {
            allowed: false,
            reason: "device_conflict",
            message:
              "This device is already associated with a different account. " +
              "The shared AI key can only be used on one account per device. " +
              "Add your own Gemini API key at https://aistudio.google.com/apikey",
          };
        }
      }
      // Fingerprint is new or belongs to this user — allowed
    }

    return { allowed: true, reason: "ok" };
  },
});

/**
 * Register or refresh a device fingerprint for a userId.
 * Called AFTER access is confirmed (so we only store successful users).
 * No-op if the fingerprint is already registered for this user.
 */
export const registerDeviceFingerprint = internalMutation({
  args: {
    fingerprint: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("deviceFingerprints")
      .withIndex("by_fingerprint", (q: any) => q.eq("fingerprint", args.fingerprint))
      .first();

    const now = Date.now();
    if (existing) {
      // Update lastSeen for the existing record (even if conflict — for admin visibility)
      await ctx.db.patch(existing._id, { lastSeenAt: now });
    } else {
      await ctx.db.insert("deviceFingerprints", {
        fingerprint: args.fingerprint,
        userId: args.userId,
        firstSeenAt: now,
        lastSeenAt: now,
      });
    }
  },
});

// ══════════════════════════════════════════════════════════════
// PUBLIC — Admin allowlist management
// ══════════════════════════════════════════════════════════════

/** Admin: get the full allowlist with profile info */
export const getGeminiAllowlist = query({
  args: {
    accountType: v.optional(v.union(v.literal("user"), v.literal("driver"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return [];

    const entries = args.accountType
      ? await ctx.db
          .query("geminiAllowlist")
          .withIndex("by_accountType", (q: any) => q.eq("accountType", args.accountType!))
          .collect()
      : await ctx.db.query("geminiAllowlist").collect();

    return entries.sort((a, b) => b.grantedAt - a.grantedAt);
  },
});

/** Admin: check if a specific user is on the allowlist */
export const isUserOnAllowlist = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const entry = await ctx.db
      .query("geminiAllowlist")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .first();
    return !!entry;
  },
});

/** Admin: grant a user access to the shared Gemini key */
export const grantGeminiAccess = mutation({
  args: {
    userId: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);

    // Check already granted
    const existing = await ctx.db
      .query("geminiAllowlist")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .first();
    if (existing) throw new Error("User already has access");

    // Load profile to denormalise email/name/accountType
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .first();
    if (!profile) throw new Error("User profile not found");

    const now = Date.now();
    await ctx.db.insert("geminiAllowlist", {
      userId: args.userId,
      email: profile.email ?? undefined,
      fullName: profile.fullName ?? undefined,
      accountType: profile.accountType as AccountType,
      grantedBy: identity.subject,
      grantedAt: now,
      note: args.note,
    });

    // Notify the user
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "system",
      title: "AI Assistant Access Granted",
      message:
        "The admin has granted you access to the shared AI assistant. Open the chat to get started!",
      isRead: false,
      createdAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "gemini_access_granted",
      resource: "geminiAllowlist",
      details: { userId: args.userId, note: args.note },
      createdAt: now,
    });
  },
});

/** Admin: revoke a user's access to the shared Gemini key */
export const revokeGeminiAccess = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const entry = await ctx.db
      .query("geminiAllowlist")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .first();
    if (!entry) throw new Error("User is not on the allowlist");
    await ctx.db.delete(entry._id);

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "gemini_access_revoked",
      resource: "geminiAllowlist",
      details: { userId: args.userId },
      createdAt: Date.now(),
    });
  },
});

/** Admin: get device fingerprints — useful for spotting multi-account abuse */
export const getDeviceFingerprints = query({
  args: {},
  handler: async (ctx) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return [];
    const prints = await ctx.db.query("deviceFingerprints").collect();
    return prints.sort((a, b) => b.lastSeenAt - a.lastSeenAt).slice(0, 200);
  },
});

/** Admin: manually block a device fingerprint */
export const blockDeviceFingerprint = mutation({
  args: { fingerprint: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const row = await ctx.db
      .query("deviceFingerprints")
      .withIndex("by_fingerprint", (q: any) => q.eq("fingerprint", args.fingerprint))
      .first();
    if (!row) throw new Error("Fingerprint not found");
    await ctx.db.patch(row._id, { blocked: true, blockReason: args.reason });
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "device_fingerprint_blocked",
      resource: "deviceFingerprints",
      details: { fingerprint: args.fingerprint, reason: args.reason },
      createdAt: Date.now(),
    });
  },
});

// ══════════════════════════════════════════════════════════════
// PUBLIC — Mode management (wraps systemSettings for clarity)
// ══════════════════════════════════════════════════════════════

/** Get the current access mode for each role */
export const getGeminiModes = query({
  args: {},
  handler: async (ctx) => {
    const auth = await getAdminIdentity(ctx);
    if (!auth) return null;
    const keys = ["gemini_user_mode", "gemini_driver_mode", "gemini_admin_mode"];
    const rows = await ctx.db.query("systemSettings").collect();
    const map: Record<string, string> = {};
    for (const row of rows) if (keys.includes(row.key)) map[row.key] = row.value as string;
    return {
      userMode: (map["gemini_user_mode"] ?? "off") as GeminiMode,
      driverMode: (map["gemini_driver_mode"] ?? "off") as GeminiMode,
      adminMode: (map["gemini_admin_mode"] ?? "off") as GeminiMode,
    };
  },
});

/** Set mode for a role */
export const setGeminiMode = mutation({
  args: {
    role: v.union(v.literal("user"), v.literal("driver"), v.literal("admin")),
    mode: v.union(v.literal("off"), v.literal("all"), v.literal("allowlist")),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const key = `gemini_${args.role}_mode`;
    const existing = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.mode,
        updatedBy: identity.subject,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("systemSettings", {
        key,
        value: args.mode,
        updatedBy: identity.subject,
        updatedAt: now,
      });
    }
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "gemini_mode_changed",
      resource: "systemSettings",
      details: { role: args.role, mode: args.mode },
      createdAt: now,
    });
  },
});
