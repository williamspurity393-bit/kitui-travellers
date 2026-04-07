"use client";

import React from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Loader2, Wallet, CreditCard, RefreshCw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

// ── Local shape types ─────────────────────────────────────────
interface MonthlyEntry {
  month: string;
  amount: number;
  trips: number;
}

interface Transaction {
  _id: Id<"walletTransactions">;
  type: string;
  amount: number;
  description: string;
  createdAt: number;
  mpesaReceiptNumber?: string | null;
  paymentId?: string | null;
  bookingId?: string | null;
}

// ─────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

const TYPE_CFG = {
  payment: { label: "Payment", color: "text-foreground", bg: "bg-primary/10", icon: CreditCard },
  refund: { label: "Refund", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: RefreshCw },
  failed: { label: "Failed", color: "text-muted-foreground", bg: "bg-muted", icon: CreditCard },
};

export default function UserSpendingPage() {
  const { isAuthenticated } = useConvexAuth();
  const summary = useQuery(api.payments.getMySpendingSummary, !isAuthenticated ? "skip" : {});
  const txns = useQuery(api.payments.getMyWalletTransactions, !isAuthenticated ? "skip" : {});

  if (summary === undefined || txns === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  // Typed lists — eliminates all implicit any in callbacks
  const breakdown: MonthlyEntry[] = (summary?.monthlyBreakdown ?? []) as unknown as MonthlyEntry[];
  const txnList: Transaction[] = (txns ?? []) as unknown as Transaction[];

  const maxMonth = Math.max(...breakdown.map((m: MonthlyEntry) => m.amount), 1);

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1
          className="text-2xl font-black text-foreground"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          My Spending
        </h1>
        <p className="text-sm text-muted-foreground">M-Pesa payment history</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "This Month", value: fmt(summary.thisMonth), color: "text-primary" },
            { label: "Total Spent", value: fmt(summary.totalSpent), color: "text-foreground" },
            { label: "Refunded", value: fmt(summary.totalRefunded), color: "text-emerald-400" },
            {
              label: "Transactions",
              value: summary.transactionCount,
              color: "text-muted-foreground",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center">
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
      )}

      {breakdown.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Last 6 Months
          </p>
          <div className="space-y-2">
            {breakdown.map(({ month, amount }: MonthlyEntry) => (
              <div key={month} className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-8">{month}</span>
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${(amount / maxMonth) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground w-24 text-right">
                  {fmt(amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions list */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Transactions
        </p>
        {txnList.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-2xl">
            <Wallet className="size-7 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txnList.map((t: Transaction) => {
              const cfg = TYPE_CFG[t.type as keyof typeof TYPE_CFG] ?? TYPE_CFG.payment;
              const Icon = cfg.icon;
              const detailHref = t.paymentId ? `/user/transactions/${t.paymentId}` : null;
              const bookingHref = t.bookingId ? `/user/bookings/${t.bookingId}` : null;

              const content = (
                <>
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      cfg.bg
                    )}
                  >
                    <Icon className={cn("size-4", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {t.mpesaReceiptNumber && (
                        <span className="font-mono ml-1 text-emerald-400">
                          {" "}
                          · {t.mpesaReceiptNumber}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <p
                        className={cn(
                          "font-black text-sm",
                          t.type === "refund"
                            ? "text-emerald-400"
                            : t.type === "failed"
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                        )}
                        style={{ fontFamily: "var(--font-syne)" }}
                      >
                        {t.type === "refund" ? "+" : ""}
                        {fmt(t.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground capitalize">{cfg.label}</p>
                    </div>
                    {(detailHref || bookingHref) && (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </>
              );

              const linkHref = detailHref ?? bookingHref;
              return linkHref ? (
                <Link
                  key={t._id}
                  href={linkHref}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={t._id}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card"
                >
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
