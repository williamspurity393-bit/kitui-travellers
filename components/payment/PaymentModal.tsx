"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  X,
  Phone,
  Loader2,
  CheckCircle2,
  XCircle,
  Smartphone,
  Shield,
  AlertCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { cn, fmtKES, formatPhoneDisplay, isValidKenyanPhone } from "@/lib/utils";

// ── Props ─────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  bookingId: Id<"bookings">;
  bookingCode: string;
  amount: number;
  defaultPhone?: string;
  onClose: () => void;
  onSuccess: () => void;
  /** When true, the modal cannot be dismissed until payment succeeds/fails */
  forceOpen?: boolean;
}

type ModalState = "idle" | "sending" | "waiting" | "success" | "failed";

// ── Constants ─────────────────────────────────────────────────────────────
// Timing constants — must be coordinated with /api/payments/query/route.ts
const TIMEOUT_SECONDS = 180; // 3 minutes before auto-fail
const FIRST_POLL_DELAY = 8000; // ms — wait for Daraja to process PIN entry
const POLL_INTERVAL = 10000; // ms — 10s avoids Daraja 5-req/min rate limit
const RESEND_AFTER = 45; // seconds before "Resend" button appears

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function PaymentModal({
  bookingId,
  bookingCode,
  amount,
  defaultPhone = "",
  onClose,
  onSuccess,
  forceOpen = false,
}: PaymentModalProps) {
  const [state, setState] = React.useState<ModalState>("idle");
  const [phone, setPhone] = React.useState(defaultPhone);
  const [paymentId, setPaymentId] = React.useState<Id<"payments"> | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = React.useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [elapsed, setElapsed] = React.useState(0);

  // Ref prevents race between Convex subscription (Track A) and polling (Track B)
  const completedRef = React.useRef(false);

  const preparePayment = useMutation(api.payments.preparePayment);

  // ── Track A: Convex live subscription ─────────────────────────────────
  // This is the primary path — fires the instant Daraja posts to our callback
  const convexPayment = useQuery(
    api.payments.getPaymentByCheckoutId,
    checkoutRequestId ? { checkoutRequestId } : "skip"
  );

  React.useEffect(() => {
    if (completedRef.current || !convexPayment) return;
    if (convexPayment.status === "completed") {
      completedRef.current = true;
      setReceiptNumber(convexPayment.mpesaReceiptNumber ?? null);
      setState("success");
      onSuccess();
    } else if (convexPayment.status === "failed") {
      completedRef.current = true;
      setErrorMessage(convexPayment.resultDesc ?? "Payment failed. Please try again.");
      setState("failed");
    }
  }, [convexPayment, onSuccess]);

  // ── Track B: STK Query polling ─────────────────────────────────────────
  // Fallback for when the Daraja webhook doesn't reach us (dev, tunnels, etc.)
  React.useEffect(() => {
    if (state !== "waiting" || !checkoutRequestId || !paymentId) return;

    const poll = async () => {
      if (completedRef.current) return;
      try {
        const res = await fetch("/api/payments/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutRequestId, paymentId }),
        });
        if (!res.ok) return; // transient error — retry next interval
        const data = (await res.json()) as {
          status: string;
          resultCode?: number;
          resultDesc?: string;
        };
        if (completedRef.current) return;
        if (data.status === "completed") {
          completedRef.current = true;
          setState("success");
          onSuccess();
        } else if (data.status === "failed") {
          completedRef.current = true;
          setErrorMessage(data.resultDesc ?? "Payment failed. Please try again.");
          setState("failed");
        }
        // "processing" or "unknown" → keep polling
      } catch {
        // Network error — non-fatal, retry on next interval
      }
    };

    const first = setTimeout(poll, FIRST_POLL_DELAY);
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [state, checkoutRequestId, paymentId, onSuccess]);

  // ── Countdown timer ────────────────────────────────────────────────────
  React.useEffect(() => {
    if (state !== "waiting") {
      setElapsed(0);
      return;
    }

    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    const timeout = setTimeout(() => {
      if (!completedRef.current) {
        setState("failed");
        setErrorMessage(
          "Payment timed out. If you entered your PIN, wait 2 minutes then check My Bookings."
        );
      }
    }, TIMEOUT_SECONDS * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(timeout);
    };
  }, [state]);

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isValidKenyanPhone(phone)) return;
    setState("sending");
    setErrorMessage(null);
    completedRef.current = false;

    try {
      const result = await preparePayment({ bookingId, phoneNumber: phone });
      const pId = result.paymentId as Id<"payments">;
      setPaymentId(pId);

      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: pId,
          phoneNumber: phone,
          amount: result.amount,
          bookingCode: result.bookingCode,
        }),
      });

      const data = (await res.json()) as {
        success: boolean;
        checkoutRequestId?: string;
        error?: string;
      };

      if (data.success && data.checkoutRequestId) {
        setCheckoutRequestId(data.checkoutRequestId);
        setState("waiting");
      } else {
        setErrorMessage(data.error ?? "Failed to send M-Pesa request. Please try again.");
        setState("failed");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Network error. Check your connection.");
      setState("failed");
    }
  };

  const handleRetry = () => {
    completedRef.current = false;
    setCheckoutRequestId(null);
    setPaymentId(null);
    setErrorMessage(null);
    setState("idle");
  };

  const remaining = TIMEOUT_SECONDS - elapsed;
  const canClose = !forceOpen && (state === "idle" || state === "failed" || state === "success");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`M-Pesa payment for booking ${bookingCode}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={canClose ? onClose : undefined}
      />

      {/* Modal card */}
      <div className="relative w-full sm:max-w-md mx-4 mb-4 sm:mb-0 rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="size-4 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">M-Pesa Payment</p>
              <p className="text-xs text-muted-foreground font-mono">{bookingCode}</p>
            </div>
          </div>
          {canClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close payment dialog"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Amount */}
        <div className="px-5 pt-5">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Amount to pay</p>
            <p
              className="text-3xl font-black text-primary"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {fmtKES(amount)}
            </p>
          </div>
        </div>

        <div className="p-5">
          {/* ── IDLE: phone entry ── */}
          {state === "idle" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="mpesa-phone" className="text-sm font-medium text-foreground">
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="mpesa-phone"
                    type="tel"
                    inputMode="tel"
                    value={formatPhoneDisplay(phone)}
                    onChange={(e) => setPhone(e.target.value.replace(/\s/g, ""))}
                    placeholder="0712 345 678"
                    autoComplete="tel"
                    className={cn(
                      "w-full h-11 pl-9 pr-4 rounded-xl border bg-background text-sm",
                      "placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                      !isValidKenyanPhone(phone) && phone.replace(/\D/g, "").length > 6
                        ? "border-destructive"
                        : "border-input"
                    )}
                  />
                </div>
                {!isValidKenyanPhone(phone) && phone.replace(/\D/g, "").length > 6 && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    Enter a valid Safaricom number (07XX or 01XX)
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                <Shield className="size-3.5 mt-0.5 shrink-0 text-emerald-400" />
                <span>
                  You&apos;ll receive an M-Pesa prompt on this number. Processed securely by
                  Safaricom. We never store your PIN.
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!isValidKenyanPhone(phone)}
                className="w-full h-11 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary/20 active:scale-[0.98]"
              >
                Send M-Pesa Request
              </button>
            </div>
          )}

          {/* ── SENDING ── */}
          {state === "sending" && (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="size-6 text-primary animate-spin" />
              </div>
              <p className="font-semibold text-foreground">Connecting to Safaricom…</p>
              <p className="text-xs text-muted-foreground">Sending payment request</p>
            </div>
          )}

          {/* ── WAITING for PIN ── */}
          {state === "waiting" && (
            <div className="flex flex-col items-center py-4 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Smartphone className="size-8 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center animate-pulse">
                  <span className="text-[10px] font-black text-amber-900">!</span>
                </div>
              </div>

              <div className="text-center">
                <p className="font-bold text-foreground">Check your phone</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your M-Pesa PIN on{" "}
                  <span className="font-semibold text-foreground">{formatPhoneDisplay(phone)}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>
                  {elapsed}s elapsed · {remaining > 0 ? `${remaining}s remaining` : "timed out"}
                </span>
              </div>

              <div className="w-full space-y-2">
                {[
                  "Open M-Pesa on your phone",
                  "Enter your M-Pesa PIN when prompted",
                  "This page confirms automatically",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-[10px]">
                      {i + 1}
                    </div>
                    {step}
                  </div>
                ))}
              </div>

              {/* "Resend" button — appears after RESEND_AFTER seconds */}
              {elapsed >= RESEND_AFTER && (
                <button
                  onClick={handleRetry}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Didn&apos;t receive the prompt? Try again
                </button>
              )}

              <p className="text-[10px] text-muted-foreground/60">
                Don&apos;t close this window until confirmed
              </p>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {state === "success" && (
            <div className="flex flex-col items-center py-4 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 flex items-center justify-center">
                <CheckCircle2 className="size-8 text-emerald-400" />
              </div>
              <div>
                <p
                  className="font-black text-foreground text-lg"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Payment Confirmed!
                </p>
                <p className="text-sm text-muted-foreground mt-1">{fmtKES(amount)} received</p>
                {receiptNumber && (
                  <p className="text-xs font-mono text-emerald-400 mt-1">
                    M-Pesa Receipt: {receiptNumber}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-full h-10 rounded-xl bg-emerald-400/10 text-emerald-400 font-bold text-sm hover:bg-emerald-400/20 transition-colors"
              >
                View My Booking
              </button>
            </div>
          )}

          {/* ── FAILED ── */}
          {state === "failed" && (
            <div className="flex flex-col items-center py-4 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <XCircle className="size-8 text-destructive" />
              </div>
              <div>
                <p
                  className="font-black text-foreground text-lg"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Payment Failed
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto leading-relaxed">
                  {errorMessage ?? "Something went wrong. Please try again."}
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="size-4" /> Try Again
              </button>
              {!forceOpen && (
                <button
                  onClick={onClose}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel and go back
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
