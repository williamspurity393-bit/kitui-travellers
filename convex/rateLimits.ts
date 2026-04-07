import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

export const authRateLimiter = new RateLimiter(components.rateLimiter, {
  signIn: { kind: "token bucket", rate: 5, period: 15 * MINUTE, capacity: 5 },

  signUp: { kind: "fixed window", rate: 3, period: HOUR },

  passwordReset: { kind: "fixed window", rate: 3, period: HOUR },

  anonymous: { kind: "token bucket", rate: 10, period: HOUR, capacity: 3 },
});

/** Returns true if auth rate limiting is enabled in system settings (default: true). */
async function isEnabled(ctx: { db: { query: Function } }): Promise<boolean> {
  const setting = await ctx.db
    .query("systemSettings")
    .withIndex("by_key", (q: { eq: Function }) => q.eq("key", "auth_rate_limiting_enabled"))
    .first();
  // Default to ON — only disabled if explicitly set to false
  return (setting?.value as boolean | undefined) !== false;
}

async function requireAdmin(ctx: { auth: { getUserIdentity: Function }; db: { query: Function } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ code: "unauthenticated", message: "Not authenticated" });
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: { eq: Function }) => q.eq("userId", identity.subject))
    .first();
  if (!profile || profile.accountType !== "admin")
    throw new ConvexError({ code: "forbidden", message: "Admin access required" });
  return { identity, profile };
}

export const checkSignInRateLimit = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    if (!(await isEnabled(ctx))) return { ok: true, retryAfter: null };
    const key = args.email.toLowerCase().trim();
    const status = await authRateLimiter.limit(ctx, "signIn", { key });
    return {
      ok: status.ok,
      retryAfter: status.ok ? null : (status.retryAfter ?? 15 * 60 * 1000),
    };
  },
});

export const checkSignUpRateLimit = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    if (!(await isEnabled(ctx))) return { ok: true, retryAfter: null };
    const key = args.email.toLowerCase().trim();
    const status = await authRateLimiter.limit(ctx, "signUp", { key });
    return {
      ok: status.ok,
      retryAfter: status.ok ? null : (status.retryAfter ?? 60 * 60 * 1000),
    };
  },
});

export const checkPasswordResetRateLimit = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    if (!(await isEnabled(ctx))) return { ok: true, retryAfter: null };
    const key = args.email.toLowerCase().trim();
    const status = await authRateLimiter.limit(ctx, "passwordReset", { key });
    return {
      ok: status.ok,
      retryAfter: status.ok ? null : (status.retryAfter ?? 60 * 60 * 1000),
    };
  },
});

export const checkAnonymousRateLimit = mutation({
  args: {},
  handler: async (ctx) => {
    if (!(await isEnabled(ctx))) return { ok: true, retryAfter: null };
    const status = await authRateLimiter.limit(ctx, "anonymous");
    return {
      ok: status.ok,
      retryAfter: status.ok ? null : (status.retryAfter ?? 60 * 60 * 1000),
    };
  },
});

export const getRateLimitStatusForEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: { eq: Function }) => q.eq("userId", identity.subject))
      .first();
    if (!profile || profile.accountType !== "admin") return null;

    const key = args.email.toLowerCase().trim();

    const [signIn, signUp, passwordReset] = await Promise.all([
      authRateLimiter.getValue(ctx, "signIn", { key }).catch(() => null),
      authRateLimiter.getValue(ctx, "signUp", { key }).catch(() => null),
      authRateLimiter.getValue(ctx, "passwordReset", { key }).catch(() => null),
    ]);

    return { signIn, signUp, passwordReset, email: key };
  },
});

export const getRateLimitConfig = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: { eq: Function }) => q.eq("userId", identity.subject))
      .first();
    if (!profile || profile.accountType !== "admin") return null;

    const setting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q: { eq: Function }) => q.eq("key", "auth_rate_limiting_enabled"))
      .first();

    const enabled = (setting?.value as boolean | undefined) !== false;

    return {
      enabled,
      limits: {
        signIn: {
          algorithm: "token bucket",
          rate: 5,
          period: "15 minutes",
          capacity: 5,
          description: "Per email address",
        },
        signUp: {
          algorithm: "fixed window",
          rate: 3,
          period: "1 hour",
          capacity: 3,
          description: "Per email address",
        },
        passwordReset: {
          algorithm: "fixed window",
          rate: 3,
          period: "1 hour",
          capacity: 3,
          description: "Per email address",
        },
        anonymous: {
          algorithm: "token bucket",
          rate: 10,
          period: "1 hour",
          capacity: 3,
          description: "Global",
        },
      },
    };
  },
});

export const resetRateLimitForEmail = mutation({
  args: {
    email: v.string(),
    limitType: v.union(v.literal("signIn"), v.literal("signUp"), v.literal("passwordReset")),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const key = args.email.toLowerCase().trim();
    await authRateLimiter.reset(ctx, args.limitType, { key });
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "rate_limit_reset",
      resource: "rateLimits",
      resourceId: key,
      details: { email: args.email, limitType: args.limitType },
      createdAt: Date.now(),
    });
  },
});

export const resetAllRateLimitsForEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const key = args.email.toLowerCase().trim();
    await Promise.all([
      authRateLimiter.reset(ctx, "signIn", { key }),
      authRateLimiter.reset(ctx, "signUp", { key }),
      authRateLimiter.reset(ctx, "passwordReset", { key }),
    ]);
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "rate_limit_reset_all",
      resource: "rateLimits",
      resourceId: key,
      details: { email: args.email },
      createdAt: Date.now(),
    });
  },
});

export const resetAnonymousRateLimit = mutation({
  args: {},
  handler: async (ctx) => {
    const { identity } = await requireAdmin(ctx);
    await authRateLimiter.reset(ctx, "anonymous");
    await ctx.db.insert("auditLogs", {
      actorId: identity.subject,
      action: "rate_limit_reset_anonymous",
      resource: "rateLimits",
      createdAt: Date.now(),
    });
  },
});
