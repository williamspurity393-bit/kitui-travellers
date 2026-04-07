"use client";

import React from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, TrendingUp, Clock, CheckCircle2, AlertCircle, Bus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// ── Local shape types ─────────────────────────────────────────
interface MonthlyBreakdownEntry {
  month: string;
  gross: number;
  net: number;
}

interface EarningRecord {
  _id: string;
  grossAmount: number;
  netAmount: number;
  commissionAmount: number;
  status: string;
  createdAt: number;
}

// ─────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

export default function DriverEarningsPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const summary = useQuery(api.driverEarnings.getMyEarningsSummary, !isAuthenticated ? "skip" : {});
  const earnings = useQuery(api.driverEarnings.getMyEarnings, !isAuthenticated ? "skip" : {});

  React.useEffect(() => {
    if (profile && profile.accountType !== "driver") router.replace("/dashboard");
  }, [profile, router]);

  const COMMISSION_RATE = summary?.commissionRate ?? 0.15;

  if (!profile || summary == null || earnings === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  // Cast to typed lists so callbacks are never implicit any
  const breakdown: MonthlyBreakdownEntry[] = (summary.monthlyBreakdown ??
    []) as unknown as MonthlyBreakdownEntry[];
  const earningList: EarningRecord[] = (earnings ?? []) as unknown as EarningRecord[];
  const maxGross = Math.max(...breakdown.map((m: MonthlyBreakdownEntry) => m.gross), 1);

  return (
    <div className="p-5 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black text-foreground"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          My Earnings
        </h1>
        <p className="text-sm text-muted-foreground">
          {(1 - COMMISSION_RATE) * 100}% of each fare · {COMMISSION_RATE * 100}% admin commission
          deducted
        </p>
      </div>

      {/* TODO notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-400/20 bg-amber-400/5">
        <AlertCircle className="size-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-400">Pending Disbursements</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Earnings marked &quot;Pending&quot; will be sent to your M-Pesa when admin processes the
            payment.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "This Month",
            value: fmt(summary.thisMonth),
            color: "text-primary",
            icon: TrendingUp,
          },
          { label: "Pending", value: fmt(summary.pending), color: "text-amber-400", icon: Clock },
          {
            label: "Total Earned",
            value: fmt(summary.totalNet),
            color: "text-emerald-400",
            icon: CheckCircle2,
          },
          {
            label: "Total Trips",
            value: String(summary.tripCount),
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

      {/* Monthly breakdown */}
      {breakdown.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Last 6 Months
          </p>
          <div className="space-y-2">
            {breakdown.map(({ month, gross, net }: MonthlyBreakdownEntry) => (
              <div key={month} className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-8">{month}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-full transition-all duration-500"
                    style={{ width: `${(net / maxGross) * 100}%` }}
                  />
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-foreground">{fmt(net)}</p>
                  <p className="text-[10px] text-muted-foreground">of {fmt(gross)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earnings list */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          All Trips
        </p>
        {earningList.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl">
            <TrendingUp className="size-7 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">
              No earnings yet. Complete trips to earn.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {earningList.map((e: EarningRecord) => (
              <div
                key={e._id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:bg-muted/20 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Bus className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{fmt(e.grossAmount)} fare</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}−{fmt(e.commissionAmount)} commission
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="font-black text-sm text-foreground"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {fmt(e.netAmount)}
                  </p>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      e.status === "disbursed"
                        ? "bg-emerald-400/10 text-emerald-400"
                        : e.status === "pending"
                          ? "bg-amber-400/10 text-amber-400"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {e.status === "disbursed"
                      ? "Paid"
                      : e.status === "pending"
                        ? "Pending"
                        : e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
