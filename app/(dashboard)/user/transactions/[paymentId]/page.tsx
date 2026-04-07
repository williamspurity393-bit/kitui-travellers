"use client";

import React from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Bus,
} from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const { isAuthenticated } = useConvexAuth();
  const paymentId = params.paymentId as Id<"payments">;
  const payment = useQuery(api.payments.getPayment, !isAuthenticated ? "skip" : { paymentId });

  if (payment === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }
  if (!payment) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="size-8 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="font-semibold text-foreground">Transaction not found</p>
        <Link href="/user/spending" className="text-sm text-primary hover:underline mt-2 block">
          ← Back to spending
        </Link>
      </div>
    );
  }

  const STATUS_CFG = {
    pending: {
      icon: AlertCircle,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      label: "Pending",
    },
    processing: {
      icon: AlertCircle,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      label: "Processing",
    },
    completed: {
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      label: "Paid",
    },
    failed: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Failed" },
    refunded: {
      icon: CheckCircle2,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      label: "Refunded",
    },
  };
  const cfg = STATUS_CFG[payment.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
  const Icon = cfg.icon;

  return (
    <div className="p-5 lg:p-8 max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Link href="/user/spending" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="size-4 text-muted-foreground" />
        </Link>
        <div>
          <h1
            className="text-xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Transaction Detail
          </h1>
          <p className="text-xs text-muted-foreground">
            {new Date(payment.createdAt).toLocaleString("en-KE", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Amount + status */}
      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium",
            cfg.bg,
            cfg.color
          )}
        >
          <Icon className="size-3.5" /> {cfg.label}
        </span>
        <p
          className="text-4xl font-black text-foreground"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {fmt(payment.amount)}
        </p>
        <p className="text-sm text-muted-foreground">M-Pesa Payment</p>
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Payment Details
          </p>
        </div>
        <div className="divide-y divide-border/50">
          {[
            { label: "Phone", value: payment.phoneNumber },
            { label: "Status", value: cfg.label },
            payment.mpesaReceiptNumber && {
              label: "M-Pesa Receipt",
              value: payment.mpesaReceiptNumber,
              green: true,
              mono: true,
            },
            payment.checkoutRequestId && {
              label: "Checkout ID",
              value: payment.checkoutRequestId.slice(0, 28) + "…",
              mono: true,
            },
            { label: "Attempts", value: String(payment.attemptCount) },
            payment.failureReason && { label: "Failure Reason", value: payment.failureReason },
          ]
            .filter(Boolean)
            .map((row: any) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-5 py-3.5 text-sm gap-4"
              >
                <span className="text-muted-foreground shrink-0">{row.label}</span>
                <span
                  className={cn(
                    "text-right font-medium text-foreground break-all",
                    row.green && "text-emerald-400",
                    row.mono && "font-mono text-xs"
                  )}
                >
                  {row.value}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Link to booking */}
      <Link
        href={`/user/bookings/${payment.bookingId}`}
        className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-medium text-foreground"
      >
        <Bus className="size-4 text-primary" /> View Related Booking →
      </Link>
    </div>
  );
}
