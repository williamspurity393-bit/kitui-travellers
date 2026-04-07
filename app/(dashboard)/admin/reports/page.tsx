"use client";

import React from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, TrendingUp, Bus, Users, CreditCard, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const stats = useQuery(api.admin.getDashboardStats, !isAuthenticated ? "skip" : {});
  const commission = useQuery(
    api.driverEarnings.getAdminCommissionSummary,
    !isAuthenticated ? "skip" : {}
  );
  const bookings = useQuery(api.admin.getAllBookingsAdmin, !isAuthenticated ? "skip" : {});

  React.useEffect(() => {
    if (profile && profile.accountType !== "admin") router.replace("/dashboard");
  }, [profile, router]);

  const totalBookings = (bookings ?? []).length;
  const paidBookings = (bookings ?? []).filter((b: any) => b.paymentStatus === "paid").length;
  const cancelledBookings = (bookings ?? []).filter((b: any) => b.status === "cancelled").length;
  const conversionRate = totalBookings > 0 ? Math.round((paidBookings / totalBookings) * 100) : 0;

  if (!profile || stats == null || commission == null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black text-foreground"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Revenue Reports
        </h1>
        <p className="text-sm text-muted-foreground">Kitui Travellers financial overview</p>
      </div>

      {/* TODO: B2C notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-400/20 bg-amber-400/5">
        <AlertCircle className="size-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-400">Driver disbursements are manual</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {/* TODO: Replace manual disbursement with M-Pesa B2C API */}
            Go to Drivers → select a driver → "Disburse Earnings" to mark their pending earnings as
            paid. Real M-Pesa B2C disbursement is a future feature.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Revenue",
            value: fmt(stats.totalRevenue),
            color: "text-emerald-400",
            icon: TrendingUp,
          },
          {
            label: "Admin Commission",
            value: fmt(commission.totalCommission),
            color: "text-primary",
            icon: CreditCard,
          },
          {
            label: "Pending Payout",
            value: fmt(commission.pendingPayout),
            color: "text-amber-400",
            icon: AlertCircle,
          },
          {
            label: "Active Routes",
            value: stats.activeRoutes,
            color: "text-foreground",
            icon: Bus,
          },
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

      {/* Booking stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Bookings", value: totalBookings, color: "text-foreground" },
          { label: "Paid", value: paidBookings, color: "text-emerald-400" },
          { label: "Cancelled", value: cancelledBookings, color: "text-destructive" },
          { label: "Conversion Rate", value: `${conversionRate}%`, color: "text-primary" },
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

      {/* Monthly revenue chart */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Monthly Revenue (Last 6 Months)
        </p>
        <div className="space-y-3">
          {stats.monthlyRevenue.map(({ month, value }: { month: string; value: number }) => {
            const maxVal = Math.max(...stats.monthlyRevenue.map((m: any) => m.value), 1);
            return (
              <div key={month} className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-8">{month}</span>
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${(value / maxVal) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground w-24 text-right">
                  {fmt(value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commission monthly */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Admin Commission (Last 6 Months)
          </p>
          <span className="text-xs text-muted-foreground">
            {commission.commissionRate * 100}% of gross
          </span>
        </div>
        <div className="space-y-3">
          {commission.monthlyBreakdown.map(({ month, commission: c, gross }: any) => {
            const maxGross = Math.max(...commission.monthlyBreakdown.map((m: any) => m.gross), 1);
            return (
              <div key={month} className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-8">{month}</span>
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-400/70 rounded-full transition-all duration-700"
                    style={{ width: `${(c / maxGross) * 100}%` }}
                  />
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-foreground">{fmt(c)}</p>
                  <p className="text-[10px] text-muted-foreground">of {fmt(gross)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
