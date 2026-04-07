import { query } from "./_generated/server";

export const getAISchedulerEnabled = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const row = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", "ai_scheduler_enabled"))
      .first();
    return (row?.value as boolean) ?? false;
  },
});

export const getLastAgentRun = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    // Use .order("desc").first() instead of .collect() + JS sort —
    // reads one row instead of the entire auditLogs table for "ai_scheduler"
    return ctx.db
      .query("auditLogs")
      .withIndex("by_actorId", (q) => q.eq("actorId", "ai_scheduler"))
      .order("desc")
      .first();
  },
});
