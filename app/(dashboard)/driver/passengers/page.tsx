"use client";

import React from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2, Users, Bus, Search, MapPin, CheckCircle2, Circle, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DriverPassengersPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const schedules = useQuery(api.schedules.getMySchedules, !isAuthenticated ? "skip" : {});
  const routes = useQuery(api.routes.getActiveRoutes, !isAuthenticated ? "skip" : {});

  const updateStatus = useMutation(api.schedules.updateMyScheduleStatus);
  const checkinPax = useMutation(api.bookings.checkinPassenger);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [checkingIn, setCheckingIn] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile && profile.accountType !== "driver") router.replace("/dashboard");
  }, [profile, router]);

  React.useEffect(() => {
    if (schedules && !selectedId) {
      const active = schedules.find((s: any) =>
        ["boarding", "scheduled", "in_transit"].includes(s.status)
      );
      if (active) setSelectedId(active._id);
    }
  }, [schedules, selectedId]);

  const selectedSchedule = (schedules ?? []).find((s: any) => s._id === selectedId);
  const bookings = useQuery(
    api.bookings.getBookingsBySchedule,
    selectedId ? { scheduleId: selectedId as Id<"schedules"> } : "skip"
  );

  const confirmedBookings = (bookings ?? []).filter((b: any) => b.status === "confirmed");
  const allPassengers = confirmedBookings.flatMap((b: any) =>
    b.passengers.map((p: any) => ({
      ...p,
      bookingCode: b.bookingCode,
      bookingId: b._id,
      isCheckedIn: b.checkedIn === true,
    }))
  );
  const checkedInCount = confirmedBookings.filter((b: any) => b.checkedIn).length;
  const checkinPct =
    confirmedBookings.length > 0
      ? Math.round((checkedInCount / confirmedBookings.length) * 100)
      : 0;

  const filtered = allPassengers.filter((p: any) => {
    const s = search.toLowerCase();
    return (
      !search ||
      p.name.toLowerCase().includes(s) ||
      (p.seatNumber ?? "").toLowerCase().includes(s) ||
      (p.idNumber ?? "").includes(s)
    );
  });

  const route = selectedSchedule
    ? (routes ?? []).find((r: any) => r._id === selectedSchedule.routeId)
    : null;

  const doUpdateStatus = async (status: string) => {
    if (!selectedId) return;
    try {
      await updateStatus({ scheduleId: selectedId as Id<"schedules">, status: status as any });
      toast.success(`Status → ${status.replace("_", " ")}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const doCheckin = async (bookingId: string, currentCheckedIn: boolean) => {
    setCheckingIn(bookingId);
    try {
      await checkinPax({ bookingId: bookingId as Id<"bookings">, checkedIn: !currentCheckedIn });
      toast.success(currentCheckedIn ? "Check-in removed" : "Passenger checked in ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setCheckingIn(null);
    }
  };

  if (!profile || schedules === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  const activeSchedules = (schedules ?? []).filter((s: any) =>
    ["scheduled", "boarding", "in_transit"].includes(s.status)
  );

  const STATUS_DOT: Record<string, string> = {
    scheduled: "bg-emerald-400",
    boarding: "bg-amber-400 animate-pulse",
    in_transit: "bg-blue-400 animate-pulse",
  };

  return (
    <div className="p-5 lg:p-8 max-w-4xl mx-auto space-y-5 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Passenger Manifest
          </h1>
          <p className="text-sm text-muted-foreground">
            Check in passengers — feeds auto-arrival logic
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-400/10 border border-violet-400/20 shrink-0">
          <Cpu className="size-3 text-violet-400" />
          <span className="text-[10px] text-violet-400 font-medium">≥50% → early arrival</span>
        </div>
      </div>

      {activeSchedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-2xl gap-3">
          <Bus className="size-10 text-muted-foreground opacity-40" />
          <p className="font-semibold text-foreground">No Active Schedules</p>
          <p className="text-sm text-muted-foreground">You have no active trips today.</p>
        </div>
      ) : (
        <>
          {/* Schedule selector */}
          <div className="space-y-2">
            {activeSchedules.map((s: any) => {
              const r = (routes ?? []).find((ro: any) => ro._id === s.routeId);
              return (
                <button
                  key={s._id}
                  onClick={() => setSelectedId(s._id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 p-4 rounded-2xl border-2 text-left transition-all",
                    selectedId === s._id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0",
                        STATUS_DOT[s.status] ?? "bg-muted"
                      )}
                    />
                    <div>
                      <p className="font-semibold text-sm">
                        {r ? `${r.origin} → ${r.destination}` : "Route loading…"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {s.departureTime} → {s.arrivalTime} · {s.status.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary">
                    {s.totalSeats - s.availableSeats}/{s.totalSeats}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedSchedule && (
            <>
              {/* Check-in progress bar */}
              {confirmedBookings.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">Check-in progress</span>
                    <span
                      className={cn(
                        "font-bold",
                        checkinPct >= 50 ? "text-emerald-400" : "text-muted-foreground"
                      )}
                    >
                      {checkedInCount}/{confirmedBookings.length} ({checkinPct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        checkinPct >= 50 ? "bg-emerald-400" : "bg-primary"
                      )}
                      style={{ width: `${checkinPct}%` }}
                    />
                  </div>
                  {checkinPct >= 50 && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <Cpu className="size-3" /> Agent may trigger early arrival within 30 min of
                      scheduled time
                    </p>
                  )}
                </div>
              )}

              {/* Status controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Override status:
                </p>
                {[
                  {
                    s: "boarding",
                    l: "Boarding",
                    c: "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20",
                  },
                  {
                    s: "in_transit",
                    l: "In Transit",
                    c: "text-blue-400 bg-blue-400/10 hover:bg-blue-400/20",
                  },
                  {
                    s: "arrived",
                    l: "Arrived",
                    c: "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20",
                  },
                ].map(({ s, l, c }) => (
                  <button
                    key={s}
                    onClick={() => doUpdateStatus(s)}
                    disabled={selectedSchedule.status === s}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-40",
                      c
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* Route summary */}
              {route && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card text-sm">
                  <MapPin className="size-4 text-primary shrink-0" />
                  <span className="font-medium">{route.origin}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">{route.destination}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {allPassengers.length} passengers
                  </span>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, seat, or ID…"
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Passenger list */}
              {bookings === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 text-primary animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-2xl">
                  <Users className="size-7 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">
                    {search ? "No passengers match search" : "No confirmed passengers yet"}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {filtered.length} passenger{filtered.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">Tap to check in</p>
                  </div>
                  <div className="divide-y divide-border/50">
                    {filtered.map((p: any, i: number) => {
                      const isChecking = checkingIn === p.bookingId;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer",
                            p.isCheckedIn
                              ? "bg-emerald-400/5 hover:bg-emerald-400/10"
                              : "hover:bg-muted/20"
                          )}
                          onClick={() => doCheckin(p.bookingId, p.isCheckedIn)}
                        >
                          {/* Check-in indicator */}
                          <div className="shrink-0">
                            {isChecking ? (
                              <Loader2 className="size-5 text-primary animate-spin" />
                            ) : p.isCheckedIn ? (
                              <CheckCircle2 className="size-5 text-emerald-400" />
                            ) : (
                              <Circle className="size-5 text-muted-foreground/40" />
                            )}
                          </div>
                          {/* Seat number */}
                          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-semibold text-sm",
                                p.isCheckedIn ? "text-emerald-400" : "text-foreground"
                              )}
                            >
                              {p.name}
                            </p>
                            {p.idNumber && (
                              <p className="text-xs text-muted-foreground font-mono">
                                ID: {p.idNumber}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {p.seatNumber && (
                              <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                                {p.seatNumber}
                              </span>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {p.bookingCode}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
