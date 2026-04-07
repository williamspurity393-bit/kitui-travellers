"use client";

import React from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Bus,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  X,
  Check,
  UserCheck,
  Wrench,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ── Local shape types ─────────────────────────────────────────
interface Vehicle {
  _id: Id<"vehicles">;
  registrationNumber: string;
  type: string;
  capacity: number;
  make: string;
  model: string;
  year: number;
  amenities: string[];
  isActive: boolean;
  assignedDriverId?: string | null;
  nextMaintenanceDate?: number | null;
  createdAt: number;
}

interface DriverProfile {
  _id: Id<"userProfiles">;
  userId: string;
  accountType: string;
  phone?: string | null;
  vehicleType?: string | null;
  vehicleNumber?: string | null;
  isVerifiedDriver?: boolean;
}

// ─────────────────────────────────────────────────────────────

const AMENITY_OPTIONS = ["AC", "WiFi", "Charging", "TV", "Toilet", "Reclining Seats"];
const TYPE_OPTIONS = ["bus", "minibus", "matatu", "coach"] as const;

// ── Vehicle form modal ────────────────────────────────────────
function VehicleModal({
  mode,
  initial,
  drivers,
  onClose,
}: {
  mode: "create" | "edit";
  initial?: Vehicle;
  drivers: DriverProfile[];
  onClose: () => void;
}) {
  const createMut = useMutation(api.vehicles.createVehicle);
  const updateMut = useMutation(api.vehicles.updateVehicle);
  const [f, setF] = React.useState({
    registrationNumber: initial?.registrationNumber ?? "",
    type: (initial?.type ?? "matatu") as (typeof TYPE_OPTIONS)[number],
    capacity: initial?.capacity ?? 14,
    make: initial?.make ?? "",
    model: initial?.model ?? "",
    year: initial?.year ?? new Date().getFullYear(),
    amenities: (initial?.amenities ?? []) as string[],
    assignedDriverId: initial?.assignedDriverId ?? "",
    nextMaintenanceDate: initial?.nextMaintenanceDate
      ? new Date(initial.nextMaintenanceDate).toISOString().split("T")[0]
      : "",
  });
  const [saving, setSaving] = React.useState(false);
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const toggleAmenity = (a: string) =>
    setF((p) => ({
      ...p,
      amenities: p.amenities.includes(a) ? p.amenities.filter((x) => x !== a) : [...p.amenities, a],
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.registrationNumber.trim() || !f.make.trim() || !f.model.trim()) {
      toast.error("Registration, Make, and Model are required");
      return;
    }
    setSaving(true);
    try {
      const nextMaintMs = f.nextMaintenanceDate
        ? new Date(f.nextMaintenanceDate).getTime()
        : undefined;
      if (mode === "create") {
        await createMut({
          registrationNumber: f.registrationNumber.toUpperCase().trim(),
          type: f.type,
          capacity: Number(f.capacity),
          make: f.make.trim(),
          model: f.model.trim(),
          year: Number(f.year),
          amenities: f.amenities,
        });
        toast.success("Vehicle added to fleet ✓");
      } else {
        await updateMut({
          vehicleId: initial!._id,
          registrationNumber: f.registrationNumber.toUpperCase().trim(),
          type: f.type,
          capacity: Number(f.capacity),
          make: f.make.trim(),
          model: f.model.trim(),
          year: Number(f.year),
          amenities: f.amenities,
          nextMaintenanceDate: nextMaintMs,
        });
        toast.success("Vehicle updated ✓");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const verifiedDrivers = drivers.filter((d: DriverProfile) => d.isVerifiedDriver);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="font-bold text-foreground">
            {mode === "create" ? "Add Vehicle to Fleet" : `Edit ${initial?.registrationNumber}`}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Reg. No *", key: "registrationNumber", placeholder: "KCA 123A" },
              { label: "Make *", key: "make", placeholder: "Toyota" },
              { label: "Model *", key: "model", placeholder: "Coaster" },
            ].map(({ label, key, placeholder }) => (
              <div
                key={key}
                className={cn(
                  "space-y-1.5",
                  key === "registrationNumber" && "col-span-2 sm:col-span-1"
                )}
              >
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {label}
                </label>
                <input
                  value={String((f as Record<string, unknown>)[key] ?? "")}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  required={label.includes("*")}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Type
              </label>
              <select
                value={f.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Year
              </label>
              <input
                type="number"
                value={f.year}
                onChange={(e) => set("year", e.target.value)}
                min={2000}
                max={2030}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Capacity (seats)
              </label>
              <input
                type="number"
                value={f.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                min={1}
                max={100}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Next Service
              </label>
              <input
                type="date"
                value={f.nextMaintenanceDate}
                onChange={(e) => set("nextMaintenanceDate", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Amenities
            </label>
            <div className="flex gap-2 flex-wrap">
              {AMENITY_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    f.amenities.includes(a)
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-muted"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {mode === "create" && verifiedDrivers.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Assign Driver (optional)
              </label>
              <select
                value={f.assignedDriverId}
                onChange={(e) => set("assignedDriverId", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">No driver assigned</option>
                {verifiedDrivers.map((d: DriverProfile) => (
                  <option key={d._id} value={d.userId}>
                    {d.phone ?? d.userId.slice(0, 16)} · {d.vehicleType ?? "—"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-70 transition-colors"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {mode === "create" ? "Add Vehicle" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Assign Driver Modal ───────────────────────────────────────
function AssignModal({
  vehicle,
  drivers,
  onClose,
}: {
  vehicle: Vehicle;
  drivers: DriverProfile[];
  onClose: () => void;
}) {
  const assignMut = useMutation(api.vehicles.assignVehicleToDriver);
  const unassignMut = useMutation(api.vehicles.unassignVehicle);
  const [driverId, setDriverId] = React.useState(vehicle.assignedDriverId ?? "");
  const [saving, setSaving] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (driverId) {
        await assignMut({ vehicleId: vehicle._id, driverId });
        toast.success("Driver assigned ✓");
      } else {
        await unassignMut({ vehicleId: vehicle._id });
        toast.success("Driver unassigned");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const verifiedDrivers = drivers.filter((d: DriverProfile) => d.isVerifiedDriver);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground text-sm">
            Assign Driver — {vehicle.registrationNumber}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">No driver (unassign)</option>
            {verifiedDrivers.map((d: DriverProfile) => (
              <option key={d._id} value={d.userId}>
                {d.phone ?? d.userId.slice(0, 20)} · {d.vehicleType} · {d.vehicleNumber ?? "—"}
              </option>
            ))}
          </select>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{" "}
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminVehiclesPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const vehicles = useQuery(api.vehicles.getAllVehicles, !isAuthenticated ? "skip" : {});
  const stats = useQuery(api.vehicles.getFleetStats, !isAuthenticated ? "skip" : {});
  const drivers = useQuery(api.admin.getDriverProfiles, !isAuthenticated ? "skip" : {});

  const toggleMut = useMutation(api.vehicles.toggleVehicleActive);
  const deleteMut = useMutation(api.vehicles.deleteVehicle);

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [showAdd, setShowAdd] = React.useState(false);
  const [editing, setEditing] = React.useState<Vehicle | null>(null);
  const [assigning, setAssigning] = React.useState<Vehicle | null>(null);
  const [pending, setPending] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile && profile.accountType !== "admin") router.replace("/dashboard");
  }, [profile, router]);

  // Cast to typed lists — eliminates implicit any in all callbacks
  const vehicleList: Vehicle[] = (vehicles ?? []) as unknown as Vehicle[];
  const driverList: DriverProfile[] = (drivers ?? []) as unknown as DriverProfile[];

  const filtered: Vehicle[] = vehicleList.filter((v: Vehicle) => {
    const s = search.toLowerCase();
    const matchSearch =
      !search ||
      v.registrationNumber.toLowerCase().includes(s) ||
      v.make.toLowerCase().includes(s) ||
      v.model.toLowerCase().includes(s);
    return matchSearch && (typeFilter === "all" || v.type === typeFilter);
  });

  const doToggle = async (id: Id<"vehicles">, active: boolean) => {
    setPending(id);
    try {
      await toggleMut({ vehicleId: id, isActive: active });
      toast.success(active ? "Vehicle activated" : "Vehicle deactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(null);
    }
  };

  const doDelete = async (id: Id<"vehicles">, reg: string) => {
    if (!confirm(`Delete ${reg} from the fleet? This action cannot be undone.`)) return;
    setPending(id);
    try {
      await deleteMut({ vehicleId: id });
      toast.success(`${reg} removed from fleet`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cannot delete — may have active schedules");
    } finally {
      setPending(null);
    }
  };

  const now = Date.now();

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Fleet Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kitui Travellers · {stats ? `${stats.total} vehicles registered` : "Loading…"}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
        >
          <Plus className="size-4" /> Add Vehicle
        </button>
      </div>

      {/* Service alerts */}
      {(stats?.overdueMaintenance ?? 0) > 0 && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-destructive/20 bg-destructive/5">
          <AlertCircle className="size-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">
            {stats!.overdueMaintenance} vehicle{stats!.overdueMaintenance > 1 ? "s" : ""} overdue
            for maintenance
          </p>
        </div>
      )}
      {(stats?.dueSoonMaintenance ?? 0) > 0 && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-400/20 bg-amber-400/5">
          <Wrench className="size-5 text-amber-400 shrink-0" />
          <p className="text-sm font-medium text-amber-400">
            {stats!.dueSoonMaintenance} vehicle{stats!.dueSoonMaintenance > 1 ? "s" : ""} due for
            service within 7 days
          </p>
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Active", value: stats.active, color: "text-emerald-400" },
            { label: "Assigned", value: stats.assigned, color: "text-primary" },
            { label: "Inactive", value: stats.inactive, color: "text-muted-foreground" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center">
              <p
                className={cn("text-2xl font-black", color)}
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search registration, make, model…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex rounded-xl border border-input overflow-hidden bg-background shrink-0">
          {["all", ...TYPE_OPTIONS].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 h-10 text-xs capitalize transition-colors whitespace-nowrap",
                typeFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {vehicles === undefined ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {[
                    "Reg No.",
                    "Type",
                    "Make / Model",
                    "Year",
                    "Seats",
                    "Amenities",
                    "Assigned Driver",
                    "Service Due",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((veh: Vehicle) => {
                  const driver = driverList.find(
                    (d: DriverProfile) => d.userId === veh.assignedDriverId
                  );
                  const overdue = veh.nextMaintenanceDate && veh.nextMaintenanceDate < now;
                  const dueSoon =
                    veh.nextMaintenanceDate &&
                    veh.nextMaintenanceDate >= now &&
                    veh.nextMaintenanceDate < now + 7 * 86400000;
                  const isPending = pending === veh._id;
                  return (
                    <tr
                      key={veh._id}
                      className={cn(
                        "hover:bg-muted/20 transition-colors",
                        !veh.isActive && "opacity-60"
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-mono font-bold text-foreground">
                            {veh.registrationNumber}
                          </p>
                          {overdue && (
                            <span className="text-[10px] text-destructive flex items-center gap-0.5">
                              <Wrench className="size-2.5" /> Overdue
                            </span>
                          )}
                          {dueSoon && (
                            <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                              <Wrench className="size-2.5" /> Due soon
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs capitalize bg-muted px-2 py-0.5 rounded-lg">
                          {veh.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-foreground font-medium">
                        {veh.make} {veh.model}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{veh.year}</td>
                      <td className="px-4 py-3.5 text-foreground">{veh.capacity}</td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {veh.amenities.length > 0
                          ? veh.amenities.slice(0, 3).join(", ") +
                            (veh.amenities.length > 3 ? "…" : "")
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        {driver ? (
                          <span className="font-medium text-foreground">
                            {driver.phone ?? driver.userId.slice(0, 12)}
                          </span>
                        ) : (
                          <span className="text-xs italic text-muted-foreground/50">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {veh.nextMaintenanceDate
                          ? new Date(veh.nextMaintenanceDate).toLocaleDateString("en-KE")
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            veh.isActive
                              ? "bg-emerald-400/10 text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {veh.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditing(veh)}
                            title="Edit"
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setAssigning(veh)}
                            title="Assign driver"
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <UserCheck className="size-3.5" />
                          </button>
                          <button
                            onClick={() => doToggle(veh._id, !veh.isActive)}
                            disabled={isPending}
                            title={veh.isActive ? "Deactivate" : "Activate"}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                          >
                            {isPending ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : veh.isActive ? (
                              <ToggleRight className="size-3.5 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="size-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => doDelete(veh._id, veh.registrationNumber)}
                            disabled={isPending}
                            title="Delete"
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Bus className="size-7 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">
                  {search || typeFilter !== "all"
                    ? "No vehicles match your filters"
                    : "No vehicles in fleet yet. Add one to get started."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {(showAdd || editing) && (
        <VehicleModal
          mode={editing ? "edit" : "create"}
          initial={editing ?? undefined}
          drivers={driverList}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
        />
      )}
      {assigning && (
        <AssignModal vehicle={assigning} drivers={driverList} onClose={() => setAssigning(null)} />
      )}
    </div>
  );
}
