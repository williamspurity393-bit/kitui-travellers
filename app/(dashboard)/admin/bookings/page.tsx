"use client";

import React from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  Bus,
  Filter,
  Users,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ── CSV Export ────────────────────────────────────────────────
function downloadCSV(bookings: any[]) {
  const headers = [
    "Booking Code",
    "Status",
    "Payment Status",
    "Passengers",
    "Total (KES)",
    "M-Pesa Receipt",
    "Promo Code",
    "Booked At",
  ];
  const rows = bookings.map((b) => [
    b.bookingCode,
    b.status,
    b.paymentStatus,
    b.passengers.map((p: any) => p.name).join("; "),
    b.totalAmount,
    b.paymentReference ?? "",
    b.promoCode ?? "",
    new Date(b.createdAt).toLocaleDateString("en-KE"),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kitui-travellers-bookings-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Booking row ───────────────────────────────────────────────
function BookingRow({
  booking,
  selected,
  onSelect,
  onRefresh,
}: {
  booking: any;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const cancelMut = useMutation(api.admin.cancelBookingAdmin);
  const completeMut = useMutation(api.bookings.adminCompleteBooking);

  const schedule = useQuery(
    api.schedules.getSchedule,
    expanded ? { scheduleId: booking.scheduleId } : "skip"
  );
  const route = useQuery(
    api.routes.getRoute,
    expanded && schedule?.routeId ? { routeId: schedule.routeId } : "skip"
  );

  const doCancel = async () => {
    const reason = prompt("Reason for cancellation (optional):");
    if (reason === null) return;
    setPending(true);
    try {
      await cancelMut({ bookingId: booking._id, reason: reason || undefined });
      toast.success("Booking cancelled");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  };

  const doComplete = async () => {
    if (!confirm("Mark this booking as completed?")) return;
    setPending(true);
    try {
      await completeMut({ bookingId: booking._id });
      toast.success("Booking completed");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-400/10 text-amber-400",
    confirmed: "bg-blue-400/10 text-blue-400",
    completed: "bg-emerald-400/10 text-emerald-400",
    cancelled: "bg-muted text-muted-foreground",
    refunded: "bg-purple-400/10 text-purple-400",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-all",
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(booking._id, e.target.checked)}
          className="rounded border-border w-4 h-4 accent-primary shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-black text-primary text-sm">{booking.bookingCode}</span>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium capitalize",
                STATUS_COLORS[booking.status]
              )}
            >
              {booking.status}
            </span>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium",
                booking.paymentStatus === "paid"
                  ? "bg-emerald-400/10 text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {booking.paymentStatus}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {booking.passengers.length} passenger{booking.passengers.length !== 1 ? "s" : ""} ·{" "}
            <span className="font-medium text-foreground">
              KES {booking.totalAmount.toLocaleString()}
            </span>
            {booking.paymentReference && (
              <span className="ml-1 font-mono text-emerald-400"> · {booking.paymentReference}</span>
            )}{" "}
            ·{" "}
            {new Date(booking.createdAt).toLocaleDateString("en-KE", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {booking.status === "confirmed" && (
            <>
              <button
                onClick={doComplete}
                disabled={pending}
                title="Complete"
                className="p-1.5 rounded-lg hover:bg-emerald-400/10 text-muted-foreground hover:text-emerald-400 transition-colors disabled:opacity-40"
              >
                <CheckCircle2 className="size-3.5" />
              </button>
              <button
                onClick={doCancel}
                disabled={pending}
                title="Cancel"
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
              >
                <XCircle className="size-3.5" />
              </button>
            </>
          )}
          {pending && <Loader2 className="size-4 text-primary animate-spin" />}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border p-4 space-y-3 text-sm">
          {route && schedule && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bus className="size-3.5 text-primary shrink-0" />
              <span>
                {route.origin} → {route.destination}
              </span>
              <span>·</span>
              <span>{schedule.departureTime}</span>
            </div>
          )}
          <div className="space-y-1">
            {booking.passengers.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-foreground font-medium">{p.name}</span>
                <div className="flex gap-2 text-muted-foreground">
                  {p.idNumber && <span className="font-mono">{p.idNumber}</span>}
                  {p.seatNumber && (
                    <span className="font-mono text-primary">Seat {p.seatNumber}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {booking.promoCode && (
            <p className="text-xs text-muted-foreground">
              Promo: <span className="font-mono text-primary">{booking.promoCode}</span>
            </p>
          )}
          {booking.cancelReason && (
            <p className="text-xs text-muted-foreground">Cancel reason: {booking.cancelReason}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function AdminBookingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const allBookings = useQuery(api.admin.getAllBookingsAdmin, !isAuthenticated ? "skip" : {});

  const bulkCancelMut = useMutation(api.bookings.bulkCancelBookings);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    if (profile && profile.accountType !== "admin") router.replace("/dashboard");
  }, [profile, router]);

  const filtered = (allBookings ?? []).filter((b: any) => {
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const s = search.toLowerCase();
    const matchSearch =
      !search ||
      b.bookingCode.toLowerCase().includes(s) ||
      b.passengers.some((p: any) => p.name.toLowerCase().includes(s)) ||
      (b.paymentReference ?? "").toLowerCase().includes(s);
    return matchStatus && matchSearch;
  });

  const paidCount = (allBookings ?? []).filter((b: any) => b.paymentStatus === "paid").length;
  const pendingCount = (allBookings ?? []).filter((b: any) => b.status === "pending").length;
  const confirmedCount = (allBookings ?? []).filter((b: any) => b.status === "confirmed").length;
  const revenue = (allBookings ?? [])
    .filter((b: any) => b.paymentStatus === "paid")
    .reduce((s: number, b: any) => s + b.totalAmount, 0);

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const selectAll = () => {
    const cancelable = filtered
      .filter((b: any) => ["pending", "confirmed"].includes(b.status))
      .map((b: any) => b._id);
    setSelected(new Set(cancelable));
  };

  const doBulkCancel = async () => {
    if (selected.size === 0) return;
    const reason = prompt(`Cancel ${selected.size} booking(s)? Enter reason:`);
    if (reason === null) return;
    setBulkPending(true);
    try {
      const result = await bulkCancelMut({
        bookingIds: Array.from(selected) as Id<"bookings">[],
        reason: reason || "Cancelled by admin",
      });
      toast.success(`${(result as any).cancelled} booking(s) cancelled`);
      setSelected(new Set());
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBulkPending(false);
    }
  };

  return (
    <div className="p-5 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Bookings
          </h1>
          <p className="text-sm text-muted-foreground">
            {allBookings
              ? `${(allBookings as any[]).length} total · KES ${revenue.toLocaleString()} revenue`
              : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={doBulkCancel}
              disabled={bulkPending}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
            >
              {bulkPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )}
              Cancel {selected.size}
            </button>
          )}
          <button
            onClick={() => downloadCSV(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Download className="size-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: (allBookings ?? []).length, color: "text-foreground" },
          { label: "Confirmed", value: confirmedCount, color: "text-blue-400" },
          { label: "Pending", value: pendingCount, color: "text-amber-400" },
          { label: "Revenue", value: `KES ${revenue.toLocaleString()}`, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <p
              className={cn("text-xl font-black", color)}
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
            placeholder="Search code, passenger name, receipt…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex overflow-x-auto rounded-xl border border-input bg-background shrink-0">
          {["all", "pending", "confirmed", "completed", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-3 h-10 text-xs capitalize transition-colors whitespace-nowrap",
                statusFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Select all */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3">
          <button onClick={selectAll} className="text-xs text-primary hover:underline">
            Select all cancelable (
            {filtered.filter((b: any) => ["pending", "confirmed"].includes(b.status)).length})
          </button>
          {selected.size > 0 && (
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted-foreground hover:underline"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      {/* List */}
      {allBookings === undefined ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl">
          <Bus className="size-7 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No bookings match your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b: any) => (
            <BookingRow
              key={b._id}
              booking={b}
              selected={selected.has(b._id)}
              onSelect={toggleSelect}
              onRefresh={() => setRefreshKey((k) => k + 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
