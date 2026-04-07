"use client";

import React from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Bus,
  MapPin,
  Wallet,
  Bell,
  Star,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Ticket,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

// ── Local shape type ──────────────────────────────────────────
interface Booking {
  _id: Id<"bookings">;
  bookingCode: string;
  status: string;
  totalAmount: number;
  passengers: { name: string }[];
}

// ─────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const STATUS_CFG = {
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
  pending: { color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock, label: "Pending" },
  cancelled: { color: "text-muted-foreground", bg: "bg-muted", icon: XCircle, label: "Cancelled" },
  refunded: {
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    icon: AlertCircle,
    label: "Refunded",
  },
};

export default function UserDashboard() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const bookings = useQuery(api.bookings.getMyBookings, !isAuthenticated ? "skip" : {});
  const spending = useQuery(api.payments.getMySpendingSummary, !isAuthenticated ? "skip" : {});
  const unreadCount = useQuery(api.notifications.getUnreadCount, !isAuthenticated ? "skip" : {});

  if (!profile || bookings === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  const displayName: string | null = profile.fullName
    ? firstName(profile.fullName)
    : profile.email
      ? firstName(profile.email.split("@")[0].replace(/[._-]/g, " "))
      : profile.phone
        ? profile.phone
        : null;

  // Typed list — eliminates implicit any on all callbacks
  const bookingList: Booking[] = (bookings ?? []) as unknown as Booking[];

  const recentBookings: Booking[] = bookingList.slice(0, 4);
  const confirmedCount = bookingList.filter((b: Booking) => b.status === "confirmed").length;
  const completedCount = bookingList.filter((b: Booking) => b.status === "completed").length;
  const needsReview = bookingList.filter((b: Booking) => b.status === "completed").length;

  return (
    <div className="p-5 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()}</p>
          <h1
            className="text-2xl font-black text-foreground mt-0.5"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {displayName ? (
              <>
                Welcome back, <span className="text-primary">{displayName}</span> 👋
              </>
            ) : (
              "Welcome back 👋"
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {profile.fullName && profile.phone
              ? profile.phone
              : profile.email && !profile.fullName
                ? profile.email
                : "Kitui Travellers passenger"}
          </p>
        </div>
      </div>

      {/* Ban notice */}
      {profile.isBanned && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-destructive/20 bg-destructive/5">
          <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">Account Suspended</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profile.banReason ?? "Contact support for details."}
            </p>
          </div>
        </div>
      )}

      {/* Review prompt */}
      {needsReview > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-400/20 bg-amber-400/5">
          <Star className="size-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-400">
              Rate your recent trip{needsReview > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your feedback helps other Kitui travellers choose the right departure.
            </p>
          </div>
          <Link
            href="/user/bookings"
            className="text-xs text-amber-400 font-bold hover:underline shrink-0 flex items-center gap-1"
          >
            View <ArrowRight className="size-3" />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Confirmed", value: confirmedCount, color: "text-blue-400", icon: CheckCircle2 },
          {
            label: "Completed",
            value: completedCount,
            color: "text-emerald-400",
            icon: CheckCircle2,
          },
          {
            label: "Total Spent",
            value: fmt(spending?.netSpent ?? 0),
            color: "text-primary",
            icon: Wallet,
          },
          { label: "Notifications", value: unreadCount ?? 0, color: "text-amber-400", icon: Bell },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4">
            <Icon className={cn("size-4 mb-2", color)} />
            <p
              className={cn("text-xl font-black", color)}
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Recent Bookings
          </p>
          <Link
            href="/user/bookings"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            All bookings <ArrowRight className="size-3" />
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-2xl">
            <Ticket className="size-7 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No bookings yet</p>
            <Link
              href="/user/routes"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Browse Routes <ArrowRight className="size-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentBookings.map((b: Booking) => {
              const cfg = STATUS_CFG[b.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
              const StatusIcon = cfg.icon;
              return (
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
                    <p className="font-mono font-black text-sm text-primary">{b.bookingCode}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.passengers.length} passenger{b.passengers.length !== 1 ? "s" : ""} ·{" "}
                      <span className="font-medium text-foreground">{fmt(b.totalAmount)}</span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0",
                      cfg.bg,
                      cfg.color
                    )}
                  >
                    <StatusIcon className="size-2.5" /> {cfg.label}
                  </span>
                  <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: "/user/routes", icon: MapPin, label: "Find Routes", color: "text-primary" },
          {
            href: "/user/spending",
            icon: TrendingUp,
            label: "My Spending",
            color: "text-emerald-400",
          },
          {
            href: "/user/notifications",
            icon: Bell,
            label: `${unreadCount ?? 0} Alerts`,
            color: "text-amber-400",
          },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all"
          >
            <Icon className={cn("size-5 shrink-0", color)} />
            <span className="text-sm font-medium text-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
