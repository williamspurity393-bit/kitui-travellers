"use client";

import React from "react";
import { useQuery, useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Calendar, Clock, Bus, Users, Navigation, Loader2, CheckCircle2, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ── Local shape types ─────────────────────────────────────────
interface Schedule {
  _id: Id<"schedules">;
  status: string;
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  availableSeats: number;
  routeId: string;
  date?: string | null;
}

interface Route {
  _id: string;
  origin: string;
  destination: string;
}

// ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  boarding: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  in_transit: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  arrived: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-emerald-400",
  boarding: "bg-amber-400 animate-pulse",
  in_transit: "bg-blue-400 animate-pulse",
  arrived: "bg-muted-foreground",
  cancelled: "bg-destructive",
};

const NEXT_STATUS: Record<string, { value: string; label: string }> = {
  scheduled: { value: "boarding", label: "Open Boarding" },
  boarding: { value: "in_transit", label: "Depart" },
  in_transit: { value: "arrived", label: "Mark Arrived" },
};

// ── Agent status mini-badge ───────────────────────────────────
function AgentBadge({ scheduleId }: { scheduleId: string }) {
  const getStatus = useAction(api.schedulerAgent.getDriverScheduleStatus);
  const [info, setInfo] = React.useState<Record<string, unknown> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getStatus({ scheduleId: scheduleId as Id<"schedules"> })
      .then((r) => {
        if (!cancelled) setInfo(r as Record<string, unknown>);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [scheduleId, getStatus]);

  if (!info) return null;

  const suggestedNext = info.suggestedNext ? String(info.suggestedNext) : null;
  const minsToDepart = Number(info.minsToDepart ?? 0);
  const minsToArrive = Number(info.minsToArrive ?? 0);

  const mins =
    suggestedNext === "boarding"
      ? minsToDepart - 15
      : suggestedNext === "in_transit"
        ? minsToDepart
        : suggestedNext === "arrived"
          ? minsToArrive
          : null;

  if (mins === null || !suggestedNext)
    return (
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Cpu className="size-2.5" /> Agent monitoring
      </div>
    );

  const label = suggestedNext.replace("_", " ");
  const soon = mins <= 5;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-[10px] font-medium",
        soon ? "text-amber-400" : "text-violet-400"
      )}
    >
      <Cpu className="size-2.5" />
      Auto-{label} {mins <= 0 ? "now" : `in ~${Math.round(Math.max(0, mins))}m`}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function DriverSchedulePage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const schedules = useQuery(api.schedules.getMySchedules, !isAuthenticated ? "skip" : {});
  const routes = useQuery(api.routes.getActiveRoutes, !isAuthenticated ? "skip" : {});
  const updateStatus = useMutation(api.schedules.updateMyScheduleStatus);
  const [updating, setUpdating] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile && profile.accountType !== "driver") router.replace("/dashboard");
  }, [profile, router]);

  const doUpdate = async (scheduleId: string, status: string) => {
    setUpdating(scheduleId);
    try {
      await updateStatus({
        scheduleId: scheduleId as Id<"schedules">,
        status: status as "boarding" | "in_transit" | "arrived" | "cancelled",
      });
      toast.success(`Status → ${status.replace("_", " ")}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setUpdating(null);
    }
  };

  if (!profile || schedules === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  // Typed lists — no implicit any on any callback
  const scheduleList: Schedule[] = (schedules ?? []) as unknown as Schedule[];
  const routeList: Route[] = (routes ?? []) as unknown as Route[];

  const active: Schedule[] = scheduleList
    .filter((s: Schedule) => ["scheduled", "boarding", "in_transit"].includes(s.status))
    .sort((a: Schedule, b: Schedule) => a.departureTime.localeCompare(b.departureTime));

  const history: Schedule[] = scheduleList
    .filter((s: Schedule) => ["arrived", "cancelled"].includes(s.status))
    .slice(0, 8);

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            My Schedule
          </h1>
          <p className="text-sm text-muted-foreground">
            {active.length} active · {history.length} recent
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-400/10 border border-violet-400/20">
          <Cpu className="size-3 text-violet-400" />
          <span className="text-[10px] text-violet-400 font-medium">Auto-status on</span>
        </div>
      </div>

      {/* Active trips */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Active Trips
        </p>
        {active.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-2xl">
            <Calendar className="size-7 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No active trips today</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              The agent will auto-open boarding 15 min before departure
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((s: Schedule) => {
              const route = routeList.find((r: Route) => r._id === s.routeId);
              const nextSt = NEXT_STATUS[s.status];
              const isUpdating = updating === s._id;
              return (
                <div
                  key={s._id}
                  className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn("w-2.5 h-2.5 rounded-full shrink-0", STATUS_DOT[s.status])}
                      />
                      <span className="font-bold text-foreground text-sm">
                        {route ? `${route.origin} → ${route.destination}` : "Loading…"}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-semibold border capitalize",
                        STATUS_COLORS[s.status]
                      )}
                    >
                      {s.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {s.departureTime} → {s.arrivalTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3" />
                      {s.totalSeats - s.availableSeats}/{s.totalSeats}
                    </span>
                    {s.date && <span className="ml-auto text-muted-foreground/60">{s.date}</span>}
                  </div>

                  <AgentBadge scheduleId={s._id} />

                  {nextSt && (
                    <button
                      onClick={() => doUpdate(s._id, nextSt.value)}
                      disabled={isUpdating}
                      className="w-full h-9 rounded-xl border border-border bg-background text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted transition-colors disabled:opacity-50 text-foreground"
                    >
                      {isUpdating ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Navigation className="size-4" />
                      )}
                      {nextSt.label} manually
                    </button>
                  )}

                  {s.status === "arrived" && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> Trip completed — passengers can rate now
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* History */}
      {history.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Recent History
          </p>
          <div className="space-y-1.5">
            {history.map((s: Schedule) => {
              const route = routeList.find((r: Route) => r._id === s.routeId);
              return (
                <div
                  key={s._id}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card"
                >
                  <div className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT[s.status])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {route ? `${route.origin} → ${route.destination}` : "Unknown route"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.departureTime}
                      {s.date ? ` · ${s.date}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium border capitalize shrink-0",
                      STATUS_COLORS[s.status]
                    )}
                  >
                    {s.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
