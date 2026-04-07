"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, KeyRound } from "lucide-react";

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (result?.error) {
        setError(result.error.message ?? "Reset failed. Your link may have expired.");
        return;
      }

      setDone(true);
      // Auto-redirect to login after 3 seconds
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Reset failed. Your link may have expired — please request a new one."
      );
    } finally {
      setLoading(false);
    }
  };

  // No token in URL — show error
  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-4">
            <p className="text-base font-bold text-destructive">Invalid or expired reset link</p>
            <p className="text-sm text-muted-foreground">
              This link has expired or is invalid. Please request a new one.
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6 text-center space-y-4">
            <CheckCircle2 className="size-12 text-emerald-400 mx-auto" />
            <div>
              <p className="font-bold text-foreground text-lg">Password updated!</p>
              <p className="text-sm text-muted-foreground mt-1">Redirecting you to login…</p>
            </div>
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
            New Password
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a strong password for your account.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {[
            { label: "New Password", id: "pw", value: password, set: setPassword },
            { label: "Confirm Password", id: "conf", value: confirm, set: setConfirm },
          ].map(({ label, id, value, set }) => (
            <div key={id} className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {label}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
                <input
                  type={showPw ? "text" : "password"}
                  value={value}
                  onChange={(e) => {
                    set(e.target.value);
                    setError("");
                  }}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full h-11 pl-9 pr-10 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                />
                {id === "pw" && (
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
