"use client";

import React from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Loader2,
  Bus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Ticket,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

const STATUS_CFG = {
  pending: {
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    icon: Clock,
    label: "Pending Payment",
  },
  confirmed: {
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    icon: CheckCircle2,
    label: "Confirmed",
  },
  completed: {
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    icon: CheckCircle2,
    label: "Completed",
  },
  cancelled: { color: "text-muted-foreground", bg: "bg-muted", icon: XCircle, label: "Cancelled" },
  refunded: {
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    icon: AlertCircle,
    label: "Refunded",
  },
};

export default function UserBookingsPage() {
  const { isAuthenticated } = useConvexAuth();
  const bookings = useQuery(api.bookings.getMyBookings, !isAuthenticated ? "skip" : {});
  const [statusFilter, setStatusFilter] = React.useState("all");

  const filtered = (bookings ?? []).filter(
    (b: any) => statusFilter === "all" || b.status === statusFilter
  );

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black text-foreground"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          My Bookings
        </h1>
        <p className="text-sm text-muted-foreground">
          {bookings ? `${bookings.length} booking${bookings.length !== 1 ? "s" : ""}` : "Loading…"}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex overflow-x-auto rounded-xl border border-input bg-background w-full">
        {["all", "confirmed", "completed", "pending", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={cn(
              "px-3 sm:px-4 h-10 text-xs capitalize transition-colors whitespace-nowrap flex-1",
              statusFilter === f
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {bookings === undefined ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl">
          <Ticket className="size-7 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">
            {statusFilter !== "all" ? `No ${statusFilter} bookings` : "No bookings yet"}
          </p>
          {statusFilter === "all" && (
            /* FIX: was /routes — corrected to /user/routes */
            <Link
              href="/user/routes"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Browse Routes <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b: any) => {
            const cfg = STATUS_CFG[b.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
            const StatusIcon = cfg.icon;
            return (
              /* FIX 4: links to booking detail page */
              <Link
                key={b._id}
                href={`/user/bookings/${b._id}`}
                className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    cfg.bg
                  )}
                >
                  <Bus className={cn("size-4", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-sm text-primary">
                      {b.bookingCode}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
                        cfg.bg,
                        cfg.color
                      )}
                    >
                      <StatusIcon className="size-2.5" /> {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {b.passengers.length} passenger{b.passengers.length !== 1 ? "s" : ""} ·{" "}
                    <span className="font-medium text-foreground">{fmt(b.totalAmount)}</span> ·{" "}
                    {new Date(b.createdAt).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
