"use client";

import React from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Bus,
  TrendingUp,
  Shield,
  ShieldOff,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

function DriverRow({
  driver,
  vehicles,
  onAction,
}: {
  driver: any;
  vehicles: any[];
  onAction: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const earnings = useQuery(
    api.driverEarnings.getAllEarnings,
    expanded ? { driverId: driver.userId } : "skip"
  );
  const verifyMut = useMutation(api.admin.verifyDriver);
  const assignMut = useMutation(api.vehicles.assignVehicleToDriver);
  const unassignMut = useMutation(api.vehicles.unassignVehicle);
  const banMut = useMutation(api.admin.banUser);
  const unbanMut = useMutation(api.admin.unbanUser);
  const disburseMut = useMutation(api.driverEarnings.bulkDisburseDriver);
  const [pending, setPending] = React.useState(false);

  const assignedVehicle = vehicles.find((v) => v.assignedDriverId === driver.userId);
  const totalEarnings = earnings?.reduce((s: number, e: any) => s + e.netAmount, 0) ?? 0;
  const pendingEarnings =
    earnings
      ?.filter((e: any) => e.status === "pending")
      .reduce((s: number, e: any) => s + e.netAmount, 0) ?? 0;

  const doVerify = async (verified: boolean) => {
    setPending(true);
    try {
      await verifyMut({ userId: driver.userId, isVerified: verified });
      toast.success(verified ? "Driver verified ✓" : "Verification removed");
      onAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  };

  const doDisburse = async () => {
    if (
      !confirm(
        `Disburse all pending earnings for this driver? (${fmt(pendingEarnings)})\n\nNote: This will mark earnings as disbursed in the system. Real M-Pesa B2C payment is not yet implemented.`
      )
    )
      return;
    setPending(true);
    try {
      const result = await disburseMut({ driverId: driver.userId });
      toast.success(`${(result as any).count} earning(s) marked as disbursed ✓`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  };

  const doBan = async () => {
    const reason = prompt("Reason for ban (leave blank for default):");
    if (reason === null) return; // cancelled
    setPending(true);
    try {
      await banMut({ userId: driver.userId, reason: reason || undefined });
      toast.success("Driver banned");
      onAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-all duration-200",
        driver.isBanned
          ? "border-destructive/30 bg-destructive/5"
          : "border-border hover:border-primary/30"
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Users className="size-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-foreground">
              {driver.phone ?? driver.userId.slice(0, 16)}
            </p>
            {driver.isVerifiedDriver ? (
              <span className="text-[10px] bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                <CheckCircle2 className="size-2.5" /> Verified
              </span>
            ) : (
              <span className="text-[10px] bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                Pending
              </span>
            )}
            {driver.isBanned && (
              <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                Banned
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-muted-foreground">
            {driver.vehicleType && <span className="capitalize">{driver.vehicleType}</span>}
            {driver.vehicleNumber && <span className="font-mono">{driver.vehicleNumber}</span>}
            {driver.licenseNumber && <span>Lic: {driver.licenseNumber}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!driver.isVerifiedDriver && !driver.isBanned && (
            <button
              onClick={() => doVerify(true)}
              disabled={pending}
              title="Verify driver"
              className="p-1.5 rounded-lg hover:bg-emerald-400/10 text-muted-foreground hover:text-emerald-400 transition-colors disabled:opacity-40"
            >
              <CheckCircle2 className="size-4" />
            </button>
          )}
          {driver.isVerifiedDriver && (
            <button
              onClick={() => doVerify(false)}
              disabled={pending}
              title="Remove verification"
              className="p-1.5 rounded-lg hover:bg-amber-400/10 text-muted-foreground hover:text-amber-400 transition-colors disabled:opacity-40"
            >
              <XCircle className="size-4" />
            </button>
          )}
          {!driver.isBanned ? (
            <button
              onClick={doBan}
              disabled={pending}
              title="Ban driver"
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
            >
              <ShieldOff className="size-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setPending(true);
                unbanMut({ userId: driver.userId })
                  .then(() => {
                    toast.success("Ban lifted");
                    onAction();
                  })
                  .catch((e) => toast.error(e.message))
                  .finally(() => setPending(false));
              }}
              disabled={pending}
              title="Lift ban"
              className="p-1.5 rounded-lg hover:bg-emerald-400/10 text-muted-foreground hover:text-emerald-400 transition-colors disabled:opacity-40"
            >
              <Shield className="size-4" />
            </button>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Vehicle assignment */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Assigned Vehicle
            </p>
            {assignedVehicle ? (
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <Bus className="size-4 text-primary" />
                  <div>
                    <p className="text-sm font-mono font-bold text-foreground">
                      {assignedVehicle.registrationNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {assignedVehicle.make} {assignedVehicle.model} · {assignedVehicle.capacity}{" "}
                      seats
                    </p>
                  </div>
                </div>
                <button
                  disabled={pending}
                  onClick={() => {
                    setPending(true);
                    unassignMut({ vehicleId: assignedVehicle._id })
                      .then(() => {
                        toast.success("Vehicle unassigned");
                        onAction();
                      })
                      .catch((e) => toast.error(e.message))
                      .finally(() => setPending(false));
                  }}
                  className="text-xs text-destructive hover:underline disabled:opacity-40"
                >
                  Unassign
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  No vehicle assigned. Select one:
                </p>
                <select
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setPending(true);
                    assignMut({
                      vehicleId: e.target.value as Id<"vehicles">,
                      driverId: driver.userId,
                    })
                      .then(() => {
                        toast.success("Vehicle assigned ✓");
                        onAction();
                      })
                      .catch((err) => toast.error(err.message))
                      .finally(() => setPending(false));
                    e.target.value = "";
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select a vehicle…</option>
                  {vehicles
                    .filter((v) => v.isActive && !v.assignedDriverId)
                    .map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.registrationNumber} — {v.make} {v.model} ({v.capacity} seats)
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Earnings summary */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Earnings
            </p>
            {earnings === undefined ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Loading…
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                  <p
                    className="font-black text-foreground text-sm"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {fmt(totalEarnings)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Total Earned</p>
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-center">
                  <p
                    className="font-black text-amber-400 text-sm"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {fmt(pendingEarnings)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Pending Payout</p>
                </div>
              </div>
            )}
            {pendingEarnings > 0 && (
              <button
                onClick={doDisburse}
                disabled={pending}
                className="mt-2 w-full h-9 rounded-xl bg-amber-400/10 text-amber-400 text-xs font-bold hover:bg-amber-400/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {pending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <TrendingUp className="size-3" />
                )}
                {/* TODO: Replace with real M-Pesa B2C when implemented */}
                Disburse {fmt(pendingEarnings)} (Mark as Paid)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDriversPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const drivers = useQuery(api.admin.getDriverProfiles, !isAuthenticated ? "skip" : {});
  const vehicles = useQuery(api.vehicles.getAllVehicles, !isAuthenticated ? "skip" : {});
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "verified" | "pending" | "banned">("all");
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    if (profile && profile.accountType !== "admin") router.replace("/dashboard");
  }, [profile, router]);

  // FIX: cast drivers to any[] so TypeScript doesn't complain about the 'd' parameter
  const filtered = ((drivers ?? []) as any[]).filter((d: any) => {
    const matchFilter =
      filter === "all" ||
      (filter === "verified" && d.isVerifiedDriver) ||
      (filter === "pending" && !d.isVerifiedDriver && !d.isBanned) ||
      (filter === "banned" && d.isBanned);
    const s = search.toLowerCase();
    const matchSearch =
      !search ||
      (d.phone ?? "").includes(s) ||
      (d.vehicleNumber ?? "").toLowerCase().includes(s) ||
      d.userId.toLowerCase().includes(s);
    return matchFilter && matchSearch;
  });

  const pendingCount = ((drivers ?? []) as any[]).filter(
    (d: any) => !d.isVerifiedDriver && !d.isBanned
  ).length;

  return (
    <div className="p-5 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1
          className="text-2xl font-black text-foreground"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Driver Management
        </h1>
        <p className="text-sm text-muted-foreground">
          {drivers ? `${(drivers as any[]).length} drivers registered` : "Loading…"}
        </p>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-400/20 bg-amber-400/5">
          <AlertCircle className="size-5 text-amber-400 shrink-0" />
          <p className="text-sm font-medium text-amber-400">
            {pendingCount} driver{pendingCount > 1 ? "s" : ""} awaiting verification
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: ((drivers ?? []) as any[]).length, color: "text-foreground" },
          {
            label: "Verified",
            value: ((drivers ?? []) as any[]).filter((d: any) => d.isVerifiedDriver).length,
            color: "text-emerald-400",
          },
          { label: "Pending", value: pendingCount, color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <p
              className={cn("text-2xl font-black", color)}
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone, vehicle number…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex rounded-xl border border-input overflow-hidden bg-background shrink-0">
          {(["all", "verified", "pending", "banned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 h-10 text-xs capitalize transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Driver list */}
      {drivers === undefined ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl">
          <Users className="size-7 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">
            {search || filter !== "all"
              ? "No drivers match your filters"
              : "No drivers registered yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <DriverRow
              key={d._id}
              driver={d}
              vehicles={(vehicles ?? []) as any[]}
              onAction={() => setRefreshKey((k) => k + 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
