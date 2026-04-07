"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Mail, Loader2, CheckCircle2, Clock, ShieldAlert } from "lucide-react";

function useCountdown(initialMs: number | null) {
  const [remaining, setRemaining] = React.useState<number>(initialMs ?? 0);
  React.useEffect(() => {
    if (!initialMs) {
      setRemaining(0);
      return;
    }
    setRemaining(initialMs);
    const end = Date.now() + initialMs;
    const interval = setInterval(() => {
      const left = end - Date.now();
      if (left <= 0) {
        setRemaining(0);
        clearInterval(interval);
      } else setRemaining(left);
    }, 1000);
    return () => clearInterval(interval);
  }, [initialMs]);
  const active = remaining > 0;
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return { active, formatted: `${minutes}:${String(seconds).padStart(2, "0")}` };
}

function ForgotPasswordContent() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState("");
  const [retryAfter, setRetryAfter] = React.useState<number | null>(null);

  const { active: rateLimited, formatted: countdown } = useCountdown(retryAfter);
  const checkPasswordReset = useMutation(api.rateLimits.checkPasswordResetRateLimit);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    // 1. Check rate limit
    try {
      const rl = await checkPasswordReset({ email: trimmed });
      if (!rl.ok && rl.retryAfter) {
        setRetryAfter(rl.retryAfter);
        setError(
          `Too many reset requests. Wait ${Math.ceil(rl.retryAfter / 60000)} minute(s) before trying again.`
        );
        return;
      }
    } catch {
      /* fail open */
    }

    setLoading(true);
    setError("");

    try {
      const result = await (
        authClient as unknown as {
          requestPasswordReset: (opts: { email: string; redirectTo: string }) => Promise<{
            data: unknown;
            error: { message?: string } | null;
          }>;
        }
      ).requestPasswordReset({
        email: trimmed,
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      });

      if (result?.error) {
        setError(result.error.message ?? "Failed to send reset email. Please try again.");
        return;
      }

      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to Login
          </Link>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6 text-center space-y-4">
            <CheckCircle2 className="size-12 text-emerald-400 mx-auto" />
            <div>
              <p className="font-bold text-foreground text-lg">Check your inbox</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                If an account exists for{" "}
                <span className="font-medium text-foreground">{email}</span>, you&apos;ll receive a
                reset link shortly. Check your spam folder if it doesn&apos;t arrive.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Login
        </Link>

        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {/* Rate limit banner */}
        {rateLimited && retryAfter && (
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-400/30 bg-amber-400/5 animate-in fade-in duration-300">
            <ShieldAlert className="size-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-400">Reset limit reached</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                For security, password reset emails are limited. Try again in{" "}
                <span className="font-mono font-bold text-amber-400">{countdown}</span>.
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="size-3 text-amber-400" />
              <span className="text-xs font-mono font-bold text-amber-400">{countdown}</span>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
                autoFocus
                placeholder="you@example.com"
                disabled={loading || rateLimited}
                className="w-full h-11 pl-9 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/50 disabled:opacity-50"
              />
            </div>
          </div>

          {error && !rateLimited && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || rateLimited}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : rateLimited ? (
              <>
                <Clock className="size-4" />
                Rate limited — wait {countdown}
              </>
            ) : (
              <>
                <Mail className="size-4" />
                Send Reset Link
              </>
            )}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
