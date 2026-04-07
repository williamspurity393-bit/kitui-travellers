"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Loader2, ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Method = "totp" | "backup";

function TwoFactorContent() {
  const router = useRouter();
  const [method, setMethod] = React.useState<Method>("totp");
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [trustDevice, setTrustDevice] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      if (method === "totp") {
        const result = await authClient.twoFactor.verifyTotp({
          code: code.trim(),
          trustDevice,
        });
        if (result?.error) {
          setError(result.error.message ?? "Invalid code. Please check your authenticator app.");
          setLoading(false);
          return;
        }
      } else {
        const result = await authClient.twoFactor.verifyBackupCode({
          code: code.trim(),
        });
        if (result?.error) {
          setError(result.error.message ?? "Invalid backup code. Try another code.");
          setLoading(false);
          return;
        }
      }

      toast.success("Identity verified!", { description: "Loading your dashboard…" });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
      setLoading(false);
    }
  };

  const switchMethod = (m: Method) => {
    setMethod(m);
    setCode("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Login
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5 text-primary" />
          </div>
          <div>
            <h1
              className="text-2xl font-black text-foreground"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              2-Step Verification
            </h1>
            <p className="text-xs text-muted-foreground">One more step to keep your account safe</p>
          </div>
        </div>

        {/* Method tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-xl border border-border">
          {(["totp", "backup"] as Method[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMethod(m)}
              className={cn(
                "py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200",
                method === m
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "totp" ? "Authenticator App" : "Backup Code"}
            </button>
          ))}
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {method === "totp" ? "6-Digit Code" : "Backup Code"}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
              <input
                type={method === "backup" ? "text" : "tel"}
                inputMode={method === "backup" ? "text" : "numeric"}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                placeholder={method === "totp" ? "000 000" : "xxxxxxxx-xxxx"}
                maxLength={method === "totp" ? 6 : 20}
                pattern={method === "totp" ? "[0-9]*" : undefined}
                required
                autoFocus
                autoComplete="one-time-code"
                className={cn(
                  "w-full h-12 py-3 pl-10 pr-4 rounded-xl border bg-card",
                  "text-center text-lg font-mono tracking-widest",
                  "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200",
                  "placeholder:text-muted-foreground/30 placeholder:text-base placeholder:tracking-normal",
                  error ? "border-destructive ring-1 ring-destructive/30" : "border-input"
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {method === "totp"
                ? "Open your authenticator app and enter the 6-digit code."
                : "Enter one of the backup codes you saved when enabling 2FA. Each code works once."}
            </p>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          {/* Trust device (TOTP only) */}
          {method === "totp" && (
            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="sr-only peer"
                />
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border-2 border-input bg-card",
                    "peer-checked:bg-primary peer-checked:border-primary",
                    "group-hover:border-primary/50 transition-all duration-150"
                  )}
                />
                <svg
                  className="absolute inset-0 w-5 h-5 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity duration-150 pointer-events-none"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M5 10l4 4 6-7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Trust this device for 60 days
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className={cn(
              "relative w-full h-12 rounded-xl font-bold text-sm overflow-hidden",
              "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
              "disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100",
              "transition-all duration-200 shadow-lg shadow-primary/25"
            )}
          >
            {loading && <span className="absolute inset-0 animate-shimmer pointer-events-none" />}
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  Verify & Sign In
                </>
              )}
            </span>
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Lost access to your authenticator?{" "}
          <button
            type="button"
            onClick={() => switchMethod("backup")}
            className="text-primary hover:underline font-medium"
          >
            Use a backup code
          </button>
        </p>
      </div>
    </div>
  );
}

export default function VerifyTwoFactorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      }
    >
      <TwoFactorContent />
    </Suspense>
  );
}
