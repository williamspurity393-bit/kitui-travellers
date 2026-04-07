"use client";

import React from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Bus,
  Map,
  Calendar,
  BarChart3,
  UserCheck,
  Loader2,
  ArrowRight,
  AlertCircle,
  Ticket,
  Tag,
  Star,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const stats = useQuery(api.admin.getDashboardStats, !isAuthenticated ? "skip" : {});
  const recent = useQuery(api.admin.getRecentBookings, !isAuthenticated ? "skip" : { limit: 5 });
  const drivers = useQuery(
    api.admin.getDriverProfiles,
    !isAuthenticated ? "skip" : { verified: false }
  );
  const reviews = useQuery(api.reviews.getReviewStats, !isAuthenticated ? "skip" : {});
  const commission = useQuery(
    api.driverEarnings.getAdminCommissionSummary,
    !isAuthenticated ? "skip" : {}
  );

  React.useEffect(() => {
    if (profile && profile.accountType !== "admin") router.replace("/dashboard");
  }, [profile, router]);

  if (!profile || stats == null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  // FIX: cast drivers to any[] so TypeScript doesn't complain about the 'd' parameter
  const pendingDrivers = ((drivers ?? []) as any[]).filter(
    (d: any) => !d.isVerifiedDriver && !d.isBanned
  );
  const pendingReviews = (reviews as any)?.pending ?? 0;

  return (
    <div className="p-5 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Kitui Travellers Management Portal</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-400/10 border border-violet-400/20">
          <Cpu className="size-3 text-violet-400" />
          <span className="text-[10px] text-violet-400 font-medium">
            Status agent running · every 5 min
          </span>
        </div>
      </div>

      {/* Action alerts */}
      {(pendingDrivers.length > 0 || pendingReviews > 0) && (
        <div className="space-y-2">
          {pendingDrivers.length > 0 && (
            <Link
              href="/admin/drivers"
              className="flex items-center gap-3 p-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 hover:bg-amber-400/10 transition-colors"
            >
              <AlertCircle className="size-5 text-amber-400 shrink-0" />
              <p className="text-sm font-medium text-amber-400 flex-1">
                {pendingDrivers.length} driver{pendingDrivers.length > 1 ? "s" : ""} awaiting
                verification
              </p>
              <ArrowRight className="size-4 text-amber-400" />
            </Link>
          )}
          {pendingReviews > 0 && (
            <Link
              href="/admin/reviews"
              className="flex items-center gap-3 p-4 rounded-2xl border border-blue-400/20 bg-blue-400/5 hover:bg-blue-400/10 transition-colors"
            >
              <Star className="size-5 text-blue-400 shrink-0" />
              <p className="text-sm font-medium text-blue-400 flex-1">
                {pendingReviews} review{pendingReviews > 1 ? "s" : ""} pending
              </p>
              <ArrowRight className="size-4 text-blue-400" />
            </Link>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Revenue",
            value: fmt(stats.totalRevenue),
            color: "text-emerald-400",
            icon: TrendingUp,
          },
          {
            label: "Commission",
            value: fmt(commission?.totalCommission ?? 0),
            color: "text-primary",
            icon: BarChart3,
          },
          {
            label: "Active Bookings",
            value: stats.activeBookings,
            color: "text-blue-400",
            icon: Ticket,
          },
          { label: "Total Users", value: stats.totalUsers, color: "text-foreground", icon: Users },
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Monthly Revenue
          </p>
          <div className="space-y-2">
            {stats.monthlyRevenue.map(({ month, value }: any) => {
              const maxVal = Math.max(...stats.monthlyRevenue.map((m: any) => m.value), 1);
              return (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-8">{month}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(value / maxVal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground w-20 text-right">
                    {fmt(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Quick Actions
          </p>
          {[
            { href: "/admin/routes/new", icon: Map, label: "Add Route", color: "text-primary" },
            {
              href: "/admin/schedules",
              icon: Calendar,
              label: "Schedules",
              color: "text-blue-400",
            },
            { href: "/admin/drivers", icon: UserCheck, label: "Drivers", color: "text-amber-400" },
            { href: "/admin/vehicles", icon: Bus, label: "Fleet", color: "text-emerald-400" },
            { href: "/admin/promos", icon: Tag, label: "Promo Codes", color: "text-purple-400" },
            {
              href: "/admin/reports",
              icon: BarChart3,
              label: "Reports",
              color: "text-muted-foreground",
            },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
            >
              <Icon className={cn("size-4 shrink-0", color)} />
              <span className="text-sm text-foreground">{label}</span>
              <ArrowRight className="size-3 text-muted-foreground ml-auto" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Recent Bookings
          </p>
          <Link
            href="/admin/bookings"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            All <ArrowRight className="size-3" />
          </Link>
        </div>
        {recent === undefined ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Loader2 className="size-3 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border/50">
              {(recent as any[]).map((b) => (
                <div
                  key={b._id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  <span className="font-mono text-xs font-black text-primary shrink-0">
                    {b.bookingCode}
                  </span>
                  <span className="text-xs text-muted-foreground flex-1">
                    {b.passengers?.length ?? 0} pax · {fmt(b.totalAmount)}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium capitalize shrink-0",
                      b.status === "confirmed"
                        ? "bg-blue-400/10 text-blue-400"
                        : b.status === "completed"
                          ? "bg-emerald-400/10 text-emerald-400"
                          : b.status === "pending"
                            ? "bg-amber-400/10 text-amber-400"
                            : "bg-muted text-muted-foreground"
                    )}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
              {(recent as any[]).length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No bookings yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
