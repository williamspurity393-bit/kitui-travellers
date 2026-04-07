import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent, createAuth } from "./auth";

/** Get the current user's profile */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile) return null;

    const now = Date.now();

    // Ban expired — signal client to call clearExpiredBan mutation
    // (cannot call ctx.db.patch inside a query — that's what caused the crash)
    if (profile.isBanned && profile.banExpiresAt && profile.banExpiresAt <= now) {
      return { ...profile, isBanned: false, _banExpired: true };
    }

    // Active ban — surface reason to client
    if (profile.isBanned) {
      return {
        ...profile,
        _banned: true,
        banReason: profile.banReason ?? "Violation of terms of service",
      };
    }

    // ── Merge JWT identity fields as live fallback ──────────────────────────
    // identity.name and identity.email come from the JWT definePayload in auth.ts.
    // If syncMyProfile hasn't been called yet (e.g. first load after sign-up),
    // the profile rows may still be empty. Merging here means the dashboard and
    // profile page always show the correct name/email immediately — no extra
    // mutation or hook needed.
    return {
      ...profile,
      fullName: profile.fullName ?? (identity.name as string | undefined) ?? undefined,
      email: profile.email ?? (identity.email as string | undefined) ?? undefined,
    };
  },
});

/** Call this from the client whenever getMyProfile returns _banExpired: true */
export const clearExpiredBan = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!profile) return;

    const now = Date.now();
    if (profile.isBanned && profile.banExpiresAt && profile.banExpiresAt <= now) {
      await ctx.db.patch("userProfiles", profile._id, {
        isBanned: false,
        banReason: undefined,
        banExpiresAt: undefined,
        updatedAt: now,
      });
    }
  },
});

/** Get any user's profile (admin only) */
export const getUserProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (identity.subject !== args.userId) {
      const currentProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
        .first();
      if (!currentProfile || currentProfile.accountType !== "admin") {
        throw new Error("Forbidden");
      }
    }

    return ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/** List all user profiles (admin only) */
export const listProfiles = query({
  args: {
    accountType: v.optional(v.union(v.literal("user"), v.literal("driver"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!currentProfile || currentProfile.accountType !== "admin") {
      throw new Error("Forbidden");
    }

    if (args.accountType) {
      return ctx.db
        .query("userProfiles")
        .withIndex("by_accountType", (q) => q.eq("accountType", args.accountType!))
        .collect();
    }
    return ctx.db.query("userProfiles").collect();
  },
});

// ── Mutations ─────────────────────────────────────────────────

/**
 * Sync profile info from the auth JWT (fullName, email, avatar).
 * This is the missing syncMyProfile that was crashing.
 * Call it on every sign-in so the profile stays up to date.
 */
export const syncMyProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) {
      await ctx.db.patch("userProfiles", existing._id, {
        fullName: args.fullName ?? existing.fullName,
        email: args.email ?? existing.email,
        avatar: args.avatar ?? existing.avatar,
        updatedAt: now,
      });
      return existing._id;
    }

    // First ever sign-in — create a bare profile; onboarding fills the rest
    return ctx.db.insert("userProfiles", {
      userId: identity.subject,
      accountType: "user",
      fullName: args.fullName,
      email: args.email,
      avatar: args.avatar,
      isOnboarded: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Create or complete onboarding profile */
export const completeOnboarding = mutation({
  args: {
    accountType: v.union(v.literal("user"), v.literal("driver")),
    phone: v.optional(v.string()),
    fullName: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    vehicleType: v.optional(
      v.union(v.literal("bus"), v.literal("minibus"), v.literal("matatu"), v.literal("coach"))
    ),
    vehicleNumber: v.optional(v.string()),
    vehicleCapacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) {
      await ctx.db.patch("userProfiles", existing._id, {
        accountType: args.accountType,
        phone: args.phone,
        fullName: args.fullName,
        licenseNumber: args.licenseNumber,
        vehicleType: args.vehicleType,
        vehicleNumber: args.vehicleNumber,
        vehicleCapacity: args.vehicleCapacity,
        isOnboarded: true,
        isVerifiedDriver: args.accountType === "driver" ? false : undefined,
        updatedAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("userProfiles", {
      userId: identity.subject,
      accountType: args.accountType,
      phone: args.phone,
      fullName: args.fullName,
      licenseNumber: args.licenseNumber,
      vehicleType: args.vehicleType,
      vehicleNumber: args.vehicleNumber,
      vehicleCapacity: args.vehicleCapacity,
      isOnboarded: true,
      isVerifiedDriver: args.accountType === "driver" ? false : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Update profile details */
export const updateProfile = mutation({
  args: {
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()),
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch("userProfiles", profile._id, { ...args, updatedAt: Date.now() });
  },
});

/** Verify a driver (admin only) */
export const verifyDriver = mutation({
  args: { userId: v.string(), verified: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const adminProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!adminProfile || adminProfile.accountType !== "admin") {
      throw new Error("Forbidden: admin access required");
    }

    const driverProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!driverProfile) throw new Error("Driver profile not found");

    await ctx.db.patch("userProfiles", driverProfile._id, {
      isVerifiedDriver: args.verified,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: args.verified ? "driver_verified" : "driver_unverified",
      resource: "userProfiles",
      resourceId: driverProfile._id,
      createdAt: Date.now(),
    });
  },
});

/** Set account type (admin only) */
export const setAccountType = mutation({
  args: {
    userId: v.string(),
    accountType: v.union(v.literal("user"), v.literal("driver"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const adminProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!adminProfile || adminProfile.accountType !== "admin") {
      throw new Error("Forbidden: admin access required");
    }

    const targetProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!targetProfile) throw new Error("Profile not found");

    await ctx.db.patch("userProfiles", targetProfile._id, {
      accountType: args.accountType,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "account_type_changed",
      resource: "userProfiles",
      resourceId: targetProfile._id,
      details: { newAccountType: args.accountType },
      createdAt: Date.now(),
    });
  },
});

/** Update user password */
export const updateUserPassword = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    await auth.api.changePassword({
      body: {
        currentPassword: args.currentPassword,
        newPassword: args.newPassword,
      },
      headers,
    });
  },
});
// ── Gemini API key management ─────────────────────────────────
// The key is stored server-side only.
// getMyGeminiKeyStatus returns a boolean so the UI can show
// "key saved" without ever exposing the actual key to the client.

/** Returns whether the current user has a personal Gemini API key stored. */
export const getMyGeminiKeyStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { hasKey: false };
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    return { hasKey: !!profile?.geminiApiKey?.trim() };
  },
});

/**
 * Save or clear a personal Gemini API key.
 * Pass key="" or key=undefined to remove the key.
 * The key is never returned to the client — only hasKey (boolean) is exposed.
 */
export const setMyGeminiKey = mutation({
  args: { key: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!profile) throw new Error("Profile not found");
    const trimmed = args.key?.trim() || undefined;
    await ctx.db.patch("userProfiles", profile._id, {
      geminiApiKey: trimmed,
      updatedAt: Date.now(),
    });
    return { saved: !!trimmed };
  },
});
