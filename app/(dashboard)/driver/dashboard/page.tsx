"use client";

import React from "react";
import { useQuery, useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  Bus,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Navigation,
  Cpu,
  ChevronRight,
  Timer,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ── Local shape type ──────────────────────────────────────────
interface Schedule {
  _id: Id<"schedules">;
  status: string;
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  availableSeats: number;
  date?: string | null;
}

// ─────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

function formatMins(mins: number): string {
  if (Math.abs(mins) < 1) return "now";
  const abs = Math.abs(Math.round(mins));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const sign = mins < 0 ? "ago" : "in";
  if (h > 0) return `${h}h ${m}m ${sign}`;
  return `${m}m ${sign}`;
}

function useNow() {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function AgentStatusCard({
  scheduleId,
  departureTime,
  arrivalTime,
  status,
}: {
  scheduleId: string;
  departureTime: string;
  arrivalTime: string;
  status: string;
}) {
  const getStatus = useAction(api.schedulerAgent.getDriverScheduleStatus);
  const [info, setInfo] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const now = useNow();

  const refresh = React.useCallback(async () => {
    try {
      const r = await getStatus({ scheduleId: scheduleId as Id<"schedules"> });
      setInfo(r as Record<string, unknown>);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [scheduleId, getStatus]);

  React.useEffect(() => {
    refresh();
  }, [refresh, now]);

  if (loading)
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 text-xs text-muted-foreground">
        <Cpu className="size-3.5 animate-pulse" /> Checking agent status…
      </div>
    );
  if (!info) return null;

  const totalConfirmed = Number(info.totalConfirmed ?? 0);
  const checkedIn = Number(info.checkedIn ?? 0);
  const minsToDepart = Number(info.minsToDepart ?? 0);
  const minsToArrive = Number(info.minsToArrive ?? 0);
  const reason = String(info.reason ?? "");
  const suggestedNext = info.suggestedNext ? String(info.suggestedNext) : null;

  return (
    <div className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Cpu className="size-3.5 text-violet-400 shrink-0" />
        <p className="text-xs font-semibold text-violet-400">Auto-Status Agent</p>
        <span className="ml-auto text-[10px] text-violet-400/60">updates every 5 min</span>
      </div>

      {totalConfirmed > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Passenger check-ins</span>
            <span className="font-bold">
              {checkedIn}/{totalConfirmed}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-400 rounded-full transition-all duration-500"
              style={{ width: `${totalConfirmed > 0 ? (checkedIn / totalConfirmed) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{reason}</span>
        {suggestedNext && (
          <span className="text-violet-400 font-semibold capitalize">
            → {suggestedNext.replace("_", " ")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div
          className={cn(
            "rounded-lg p-2 text-center",
            minsToDepart <= 15 && minsToDepart >= 0 ? "bg-amber-400/10" : "bg-muted/30"
          )}
        >
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Departure</p>
          <p
            className={cn(
              "text-xs font-bold mt-0.5",
              minsToDepart < 0
                ? "text-blue-400"
                : minsToDepart <= 15
                  ? "text-amber-400"
                  : "text-foreground"
            )}
          >
            {formatMins(minsToDepart)}
          </p>
        </div>
        <div
          className={cn(
            "rounded-lg p-2 text-center",
            minsToArrive <= 30 && minsToArrive >= 0 ? "bg-emerald-400/10" : "bg-muted/30"
          )}
        >
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Arrival</p>
          <p
            className={cn(
              "text-xs font-bold mt-0.5",
              minsToArrive < 0
                ? "text-emerald-400"
                : minsToArrive <= 30
                  ? "text-emerald-400"
                  : "text-foreground"
            )}
          >
            {formatMins(minsToArrive)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const schedules = useQuery(api.schedules.getMySchedules, !isAuthenticated ? "skip" : {});
  const vehicle = useQuery(api.vehicles.getMyVehicle, !isAuthenticated ? "skip" : {});
  const summary = useQuery(api.driverEarnings.getMyEarningsSummary, !isAuthenticated ? "skip" : {});

  const updateStatus = useMutation(api.schedules.updateMyScheduleStatus);
  const [updating, setUpdating] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile && profile.accountType !== "driver") router.replace("/dashboard");
  }, [profile, router]);

  if (!profile || schedules === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  // Cast to typed list — eliminates implicit any on .find() callback
  const scheduleList: Schedule[] = (schedules ?? []) as unknown as Schedule[];

  const activeSchedule: Schedule | undefined = scheduleList.find((s: Schedule) =>
    ["scheduled", "boarding", "in_transit"].includes(s.status)
  );

  const doUpdateStatus = async (scheduleId: string, status: string) => {
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

  const STATUS_NEXT: Record<string, { status: string; label: string; color: string }> = {
    scheduled: {
      status: "boarding",
      label: "Open Boarding",
      color: "bg-amber-400/10 text-amber-400 border-amber-400/20 hover:bg-amber-400/20",
    },
    boarding: {
      status: "in_transit",
      label: "Depart Now",
      color: "bg-blue-400/10 text-blue-400 border-blue-400/20 hover:bg-blue-400/20",
    },
    in_transit: {
      status: "arrived",
      label: "Mark Arrived",
      color: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/20",
    },
  };

  const STATUS_DOT: Record<string, string> = {
    scheduled: "bg-emerald-400",
    boarding: "bg-amber-400 animate-pulse",
    in_transit: "bg-blue-400 animate-pulse",
  };

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Driver Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {profile.isVerifiedDriver ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="size-3" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <AlertCircle className="size-3" /> Pending verification
              </span>
            )}
            {vehicle && (
              <span className="text-xs text-muted-foreground">· {vehicle.registrationNumber}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-400/10 border border-violet-400/20">
          <Cpu className="size-3.5 text-violet-400" />
          <span className="text-[10px] text-violet-400 font-medium">Agent Active</span>
        </div>
      </div>

      {/* Verification warning */}
      {!profile.isVerifiedDriver && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-400/20 bg-amber-400/5">
          <AlertCircle className="size-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Account Pending Verification</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Admin will verify your account once your license details are reviewed.
            </p>
          </div>
        </div>
      )}

      {/* Earnings */}
      {summary && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "This Month", value: fmt(summary.thisMonth), color: "text-primary" },
            { label: "Pending", value: fmt(summary.pending), color: "text-amber-400" },
            { label: "Trips", value: summary.tripCount, color: "text-foreground" },
            { label: "Total Earned", value: fmt(summary.totalNet), color: "text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-3 text-center">
              <p
                className={cn("text-base font-black", color)}
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Active trip */}
      {activeSchedule ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  STATUS_DOT[activeSchedule.status] ?? "bg-muted"
                )}
              />
              <p className="font-bold text-foreground capitalize text-sm">
                {activeSchedule.status.replace("_", " ")}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {activeSchedule.departureTime} → {activeSchedule.arrivalTime}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              <span className="font-bold text-foreground">
                {activeSchedule.totalSeats - activeSchedule.availableSeats}
              </span>
              /{activeSchedule.totalSeats} passengers aboard
            </span>
            <Link
              href="/driver/passengers"
              className="ml-auto text-xs text-primary flex items-center gap-1 hover:underline"
            >
              Manifest <ChevronRight className="size-3" />
            </Link>
          </div>

          <AgentStatusCard
            scheduleId={activeSchedule._id}
            departureTime={activeSchedule.departureTime}
            arrivalTime={activeSchedule.arrivalTime}
            status={activeSchedule.status}
          />

          {STATUS_NEXT[activeSchedule.status] && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-widest">
                Manual override
              </p>
              <button
                onClick={() =>
                  doUpdateStatus(activeSchedule._id, STATUS_NEXT[activeSchedule.status].status)
                }
                disabled={updating === activeSchedule._id}
                className={cn(
                  "w-full h-10 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-colors disabled:opacity-50",
                  STATUS_NEXT[activeSchedule.status].color
                )}
              >
                {updating === activeSchedule._id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Navigation className="size-4" />
                )}
                {STATUS_NEXT[activeSchedule.status].label}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-border rounded-2xl space-y-2">
          <Bus className="size-7 text-muted-foreground mx-auto opacity-40" />
          <p className="text-sm text-muted-foreground">No active trip right now</p>
          <p className="text-xs text-muted-foreground/60">
            The agent will open boarding 15 min before your next departure
          </p>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: "/driver/schedule", icon: Clock, label: "My Schedule" },
          { href: "/driver/passengers", icon: Users, label: "Passengers" },
          { href: "/driver/earnings", icon: TrendingUp, label: "Earnings" },
          { href: "/driver/vehicle", icon: Bus, label: "My Vehicle" },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all"
          >
            <Icon className="size-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">{label}</span>
            <ArrowRight className="size-3.5 text-muted-foreground ml-auto" />
          </Link>
        ))}
      </div>
    </div>
  );
}
