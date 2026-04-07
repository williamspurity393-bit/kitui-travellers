import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Midnight cleanup — 00:00 EAT = 21:00 UTC
crons.daily(
  "midnight-schedule-cleanup",
  { hourUTC: 21, minuteUTC: 0 },
  internal.schedulerAgent.runMidnightCleanup
);

// AI daily scheduler — 06:00 EAT = 03:00 UTC
crons.daily(
  "ai-daily-scheduler",
  { hourUTC: 3, minuteUTC: 0 },
  internal.schedulerAgent.runSchedulerAgentCron
);

// Driver Status Agent — every 5 minutes
crons.interval(
  "driver-status-agent",
  { minutes: 5 },
  internal.schedulerAgent.runDriverStatusAgentCron
);

export default crons;
