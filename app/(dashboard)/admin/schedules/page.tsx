"use client";

import React from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexAuth } from "convex/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Calendar,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  Users,
  X,
  Check,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Cpu,
} from "lucide-react";

type Status = "scheduled" | "boarding" | "in_transit" | "arrived" | "cancelled";

const STATUS_STYLES: Record<Status, string> = {
  scheduled: "bg-primary/10 text-primary",
  boarding: "bg-amber-400/10 text-amber-400",
  in_transit: "bg-blue-400/10 text-blue-400",
  arrived: "bg-emerald-400/10 text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive",
};

const STATUS_OPTIONS: Status[] = ["scheduled", "boarding", "in_transit", "arrived", "cancelled"];

function driverLabel(d: { userId: string; phone?: string; fullName?: string }) {
  return d.fullName ?? d.phone ?? d.userId.slice(0, 10) + "…";
}

function ScheduleModal({
  mode,
  initial,
  routes,
  drivers,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  initial?: any;
  routes: any[];
  drivers: any[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [form, setForm] = React.useState({
    routeId: initial?.routeId ?? "",
    driverId: initial?.driverId ?? "",
    departureTime: initial?.departureTime ?? "",
    arrivalTime: initial?.arrivalTime ?? "",
    totalSeats: initial?.totalSeats ?? 14,
    status: (initial?.status ?? "scheduled") as Status,
  });
  const [saving, setSaving] = React.useState(false);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.routeId || !form.departureTime || !form.arrivalTime) {
      toast.error("Fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        routeId: form.routeId as Id<"routes">,
        driverId: form.driverId || undefined,
        totalSeats: Number(form.totalSeats),
      });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-foreground">
            {mode === "create" ? "Create Schedule" : "Edit Schedule"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Route *
            </label>
            <select
              value={form.routeId}
              onChange={(e) => set("routeId", e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select a route…</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.origin} → {r.destination} ({r.vehicleType})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Departure *", "departureTime", "time"],
              ["Arrival *", "arrivalTime", "time"],
            ].map(([label, key, type]) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {label}
                </label>
                <input
                  type={type}
                  value={(form as any)[key]}
                  onChange={(e) => set(key, e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Seats *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.totalSeats}
                onChange={(e) => set("totalSeats", e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as Status)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Driver{" "}
              <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
            </label>
            <select
              value={form.driverId}
              onChange={(e) => set("driverId", e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">No driver assigned</option>
              {drivers.map((d) => (
                <option key={d._id} value={d.userId}>
                  {driverLabel(d)} — {d.vehicleNumber ?? "no vehicle"}
                </option>
              ))}
            </select>
          </div>
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
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminSchedulesPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const schedules = useQuery(api.schedules.getAllSchedules, !isAuthenticated ? "skip" : {});
  const routes = useQuery(api.routes.getActiveRoutes, {});
  const drivers = useQuery(api.admin.getDriverProfiles, !isAuthenticated ? "skip" : {});

  const createSchedule = useMutation(api.schedules.createSchedule);
  const updateSchedule = useMutation(api.schedules.updateSchedule);
  const deleteSchedule = useMutation(api.schedules.deleteSchedule);
  const runAgent = useAction(api.schedulerAgent.runSchedulerAgent);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [showModal, setShowModal] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<any>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [agentRunning, setAgentRunning] = React.useState(false);
  const [agentResult, setAgentResult] = React.useState<any>(null);

  const filtered = (schedules ?? []).filter((s: any) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.route?.origin?.toLowerCase().includes(q) ||
      s.route?.destination?.toLowerCase().includes(q) ||
      s.departureTime?.includes(q);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async (data: any) => {
    await createSchedule(data);
    toast.success("Schedule created");
  };
  const handleEdit = async (data: any) => {
    await updateSchedule({ scheduleId: editTarget._id, ...data });
    toast.success("Updated");
    setEditTarget(null);
  };

  const handleDelete = async (id: Id<"schedules">) => {
    if (!confirm("Delete this schedule?")) return;
    setDeleting(id);
    try {
      await deleteSchedule({ scheduleId: id });
      toast.success("Deleted");
    } catch {
      toast.error("Cannot delete — may have bookings");
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (scheduleId: Id<"schedules">, status: Status) => {
    try {
      await updateSchedule({ scheduleId, status });
      toast.success(`→ ${status.replace("_", " ")}`);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleRunAgent = async () => {
    if (
      !confirm(
        "Run AI Scheduler?\n\nThis will clean up past schedules and generate today's schedule using Gemini. Takes 15–30 seconds."
      )
    )
      return;
    setAgentRunning(true);
    setAgentResult(null);
    try {
      const r = await runAgent({ triggeredBy: "manual" });
      setAgentResult(r);
      if (r.success && r.schedulesCreated > 0)
        toast.success(
          `AI created ${r.schedulesCreated} schedule${r.schedulesCreated !== 1 ? "s" : ""} ✨`
        );
      else if (r.success) toast.info("AI ran — today already scheduled.");
      else toast.error("AI encountered an issue.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI failed";
      toast.error(msg);
      setAgentResult({
        success: false,
        schedulesCreated: 0,
        reasoning: msg,
        warnings: [],
        error: msg,
      });
    } finally {
      setAgentRunning(false);
    }
  };

  const isLoading = authLoading || schedules === undefined;

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Schedules
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : `${filtered.length} schedule${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-400/10 border border-violet-400/20">
            <Cpu className="size-3 text-violet-400" />
            <span className="text-[10px] text-violet-400 font-medium">
              Status agent: every 5 min
            </span>
          </div>
          <button
            onClick={handleRunAgent}
            disabled={agentRunning}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-violet-600 hover:to-purple-700 transition-all shadow-sm shadow-purple-500/20 disabled:opacity-60"
          >
            {agentRunning ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {agentRunning ? "AI Scheduling…" : "Run AI Scheduler"}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" /> New Schedule
          </button>
        </div>
      </div>

      {/* Agent result */}
      {agentResult && (
        <div
          className={cn(
            "rounded-2xl border p-4 space-y-2 animate-in fade-in duration-300",
            agentResult.success
              ? "border-violet-400/20 bg-violet-400/5"
              : "border-destructive/20 bg-destructive/5"
          )}
        >
          <div className="flex items-center gap-2">
            {agentResult.success ? (
              <CheckCircle2 className="size-4 text-violet-400 shrink-0" />
            ) : (
              <AlertTriangle className="size-4 text-destructive shrink-0" />
            )}
            <p
              className={cn(
                "text-sm font-semibold",
                agentResult.success ? "text-violet-400" : "text-destructive"
              )}
            >
              {agentResult.success
                ? agentResult.schedulesCreated > 0
                  ? `AI created ${agentResult.schedulesCreated} schedules`
                  : "AI ran — no new schedules needed"
                : "AI Scheduler failed"}
            </p>
            <button
              onClick={() => setAgentResult(null)}
              className="ml-auto p-1 rounded text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
          {agentResult.cleanup &&
            (agentResult.cleanup.deleted > 0 || agentResult.cleanup.completed > 0) && (
              <div className="pl-6 flex gap-4 flex-wrap">
                {agentResult.cleanup.deleted > 0 && (
                  <span className="text-xs text-muted-foreground">
                    🗑 {agentResult.cleanup.deleted} removed
                  </span>
                )}
                {agentResult.cleanup.completed > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ✓ {agentResult.cleanup.completed} completed
                  </span>
                )}
              </div>
            )}
          {agentResult.reasoning && (
            <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
              {agentResult.reasoning}
            </p>
          )}
          {agentResult.warnings?.length > 0 && (
            <ul className="pl-6 space-y-0.5">
              {agentResult.warnings.map((w: string, i: number) => (
                <li key={i} className="text-xs text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="size-2.5 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search routes…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex rounded-xl border border-input overflow-hidden shrink-0">
          {["all", ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 h-10 text-xs capitalize transition-colors whitespace-nowrap",
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-border rounded-2xl">
          <Calendar className="size-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-foreground mb-1">No schedules found</p>
          <p className="text-sm text-muted-foreground mb-4">
            {search || statusFilter !== "all"
              ? "Adjust filters."
              : "Use AI Scheduler or create manually."}
          </p>
          {!search && statusFilter === "all" && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRunAgent}
                disabled={agentRunning}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-60"
              >
                <Sparkles className="size-4" /> Run AI Scheduler
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90"
              >
                <Plus className="size-4" /> Create Manually
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Route", "Time / Date", "Seats", "Driver", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-muted-foreground px-5 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr
                    key={s._id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-foreground">
                        {s.route?.origin ?? "—"} → {s.route?.destination ?? "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground capitalize">
                          {s.route?.vehicleType ?? ""}
                        </p>
                        {s.notes?.startsWith("[AI Scheduled]") && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] bg-violet-400/10 text-violet-400 px-1.5 py-0.5 rounded-full font-medium">
                            <Sparkles className="size-2.5" /> AI
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Clock className="size-3.5 text-muted-foreground" />
                        {s.departureTime} → {s.arrivalTime}
                      </div>
                      {s.date && <p className="text-xs text-muted-foreground mt-0.5">{s.date}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span
                          className={cn(
                            "font-semibold",
                            s.availableSeats === 0
                              ? "text-destructive"
                              : s.availableSeats <= 3
                                ? "text-amber-400"
                                : "text-foreground"
                          )}
                        >
                          {s.availableSeats}
                        </span>
                        <span className="text-muted-foreground">/ {s.totalSeats}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {s.driverId ? (
                        <span className="text-foreground font-medium">
                          {(() => {
                            const d = (drivers ?? []).find((dr: any) => dr.userId === s.driverId);
                            return d ? driverLabel(d) : s.driverId.slice(0, 8) + "…";
                          })()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 italic text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={s.status}
                        onChange={(e) => handleStatusChange(s._id, e.target.value as Status)}
                        className={cn(
                          "text-xs px-2 py-1 rounded-full font-semibold border-0 cursor-pointer appearance-none",
                          STATUS_STYLES[s.status as Status]
                        )}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditTarget(s)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          disabled={deleting === s._id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === s._id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <ScheduleModal
          mode="create"
          routes={routes ?? []}
          drivers={drivers ?? []}
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
        />
      )}
      {editTarget && (
        <ScheduleModal
          mode="edit"
          initial={editTarget}
          routes={routes ?? []}
          drivers={drivers ?? []}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
}
