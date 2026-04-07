"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validations";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Eye, EyeOff, Loader2, UserX, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Google icon ───────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 262">
      <path
        fill="#4285F4"
        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
      />
      <path
        fill="#34A853"
        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
      />
      <path
        fill="#FBBC05"
        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
      />
      <path
        fill="#EB4335"
        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
      />
    </svg>
  );
}

// ── Countdown hook ────────────────────────────────────────────────────────
/**
 * Counts down from `initialMs` milliseconds to 0.
 * Returns the remaining seconds as a formatted string (e.g. "14:32") and
 * a boolean indicating whether the countdown is still active.
 */
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
  const formatted = `${minutes}:${String(seconds).padStart(2, "0")}`;

  return { active, formatted, remaining };
}

// ── Rate limit banner ─────────────────────────────────────────────────────
function RateLimitBanner({ retryAfterMs, context }: { retryAfterMs: number; context: string }) {
  const { active, formatted } = useCountdown(retryAfterMs);
  if (!active) return null;
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-400/30 bg-amber-400/5 animate-in fade-in duration-300">
      <ShieldAlert className="size-4 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-400">Too many attempts</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {context} blocked for security. Try again in{" "}
          <span className="font-mono font-bold text-amber-400">{formatted}</span>.
        </p>
      </div>
      <div className="ml-auto flex items-center gap-1 shrink-0">
        <Clock className="size-3 text-amber-400" />
        <span className="text-xs font-mono font-bold text-amber-400">{formatted}</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";

  const [showPassword, setShowPassword] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [guestLoading, setGuestLoading] = React.useState(false);

  // Rate limit state — null means not rate limited
  const [signInRetryAfter, setSignInRetryAfter] = React.useState<number | null>(null);
  const [guestRetryAfter, setGuestRetryAfter] = React.useState<number | null>(null);

  // Convex rate limit mutations
  const checkSignIn = useMutation(api.rateLimits.checkSignInRateLimit);
  const checkAnonymous = useMutation(api.rateLimits.checkAnonymousRateLimit);

  const { active: signInBlocked } = useCountdown(signInRetryAfter);
  const { active: guestBlocked } = useCountdown(guestRetryAfter);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const email = watch("email");

  // ── Email / Password sign-in ─────────────────────────────────────────
  const onSubmit = async (data: LoginFormValues) => {
    // 1. Check rate limit before attempting sign-in
    try {
      const rl = await checkSignIn({ email: data.email });
      if (!rl.ok && rl.retryAfter) {
        setSignInRetryAfter(rl.retryAfter);
        return;
      }
    } catch {
      // Rate limit check failed — proceed anyway (fail open for UX)
    }

    // 2. Attempt sign-in
    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (result.error) {
        const msg = (result.error.message ?? "").toLowerCase();
        if (msg.includes("password") || msg.includes("credentials") || msg.includes("invalid")) {
          setError("password", { message: "Incorrect email or password." });
          setError("email", { message: " " });
        } else if (msg.includes("banned")) {
          toast.error("Account suspended", {
            description: "Contact support@kuittravellers.co.ke for assistance.",
            duration: 8000,
          });
        } else if (msg.includes("rate") || result.error.status === 429) {
          // Server-side rate limit hit (Better Auth's own limiter)
          setSignInRetryAfter(60000);
          toast.warning("Too many attempts", {
            description: "Please wait a minute and try again.",
          });
        } else {
          toast.error("Sign in failed", {
            description: result.error.message || "Please try again.",
          });
        }
        return;
      }

      const resultData = result.data as
        | (typeof result.data & { twoFactorRedirect?: boolean })
        | null;

      if (resultData?.twoFactorRedirect) {
        router.push("/auth/verify-2fa");
        return;
      }

      toast.success("Welcome back!", { description: "Taking you to your dashboard…" });
      setIsRedirecting(true);
      router.push(from);
      router.refresh();
    } catch {
      toast.error("Connection error", {
        description: "Check your internet connection and try again.",
      });
    }
  };

  // ── Google sign-in ───────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const callbackURL = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`;
      await authClient.signIn.social({ provider: "google", callbackURL });
    } catch {
      toast.error("Google sign-in failed", {
        description: "Please try again or use email/password.",
      });
      setGoogleLoading(false);
    }
  };

  // ── Anonymous / Guest sign-in ────────────────────────────────────────
  const handleGuestSignIn = async () => {
    // Check anonymous rate limit before proceeding
    try {
      const rl = await checkAnonymous({});
      if (!rl.ok && rl.retryAfter) {
        setGuestRetryAfter(rl.retryAfter);
        toast.warning("Guest sign-in limit reached", {
          description: "Too many anonymous accounts created. Try again later.",
        });
        return;
      }
    } catch {
      // Fail open
    }

    setGuestLoading(true);
    try {
      const result = await authClient.signIn.anonymous();
      if (result?.error) {
        toast.error("Could not sign in as guest", {
          description: result.error.message ?? "Please try again.",
        });
        setGuestLoading(false);
        return;
      }
      toast.success("Signed in as guest", {
        description: "You can create a full account anytime from settings.",
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Guest sign-in failed", { description: "Please try again." });
      setGuestLoading(false);
    }
  };

  const isPending = isSubmitting || isRedirecting;
  const anyLoading = isPending || googleLoading || guestLoading;

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1
          className="text-3xl font-black text-foreground tracking-tight"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Sign in
        </h1>
        <p className="text-sm text-muted-foreground">
          Good to have you back — enter your details below.
        </p>
      </div>

      {/* Rate limit banners */}
      {signInBlocked && signInRetryAfter && (
        <RateLimitBanner retryAfterMs={signInRetryAfter} context="Sign-in" />
      )}
      {guestBlocked && guestRetryAfter && (
        <RateLimitBanner retryAfterMs={guestRetryAfter} context="Guest sign-in" />
      )}

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={anyLoading}
        className={cn(
          "w-full h-12 rounded-xl border-2 border-border bg-card",
          "flex items-center justify-center gap-3",
          "text-sm font-semibold text-foreground",
          "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
          "disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
        )}
      >
        {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
        {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
      </button>

      {/* Guest */}
      <button
        type="button"
        onClick={handleGuestSignIn}
        disabled={anyLoading || guestBlocked}
        className={cn(
          "w-full h-12 rounded-xl border-2 border-dashed border-border bg-transparent",
          "flex items-center justify-center gap-3",
          "text-sm font-medium text-muted-foreground",
          "hover:border-primary/40 hover:text-foreground hover:bg-muted/30",
          "disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
        )}
      >
        {guestLoading ? <Loader2 className="size-4 animate-spin" /> : <UserX className="size-4" />}
        {guestLoading ? "Signing in as guest…" : "Continue as Guest"}
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          OR SIGN IN WITH EMAIL
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Email / Password form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            disabled={anyLoading}
            {...register("email")}
            className={cn(
              "w-full h-12 px-4 rounded-xl border bg-card text-sm text-foreground font-mono",
              "placeholder:text-muted-foreground/50 placeholder:font-sans",
              "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
              "disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200",
              errors.email?.message?.trim()
                ? "border-destructive ring-1 ring-destructive/30"
                : "border-input"
            )}
          />
          {errors.email?.message?.trim() && (
            <p className="text-xs text-destructive font-medium animate-in fade-in duration-200">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              tabIndex={anyLoading ? -1 : 0}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              disabled={anyLoading}
              {...register("password")}
              className={cn(
                "w-full h-12 px-4 pr-12 rounded-xl border bg-card text-sm text-foreground",
                "placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
                "disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200",
                errors.password?.message?.trim()
                  ? "border-destructive ring-1 ring-destructive/30"
                  : "border-input"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={anyLoading}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors rounded disabled:pointer-events-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password?.message?.trim() && (
            <p className="text-xs text-destructive font-medium animate-in fade-in duration-200">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-3 cursor-pointer group select-none">
          <div className="relative shrink-0">
            <input
              type="checkbox"
              disabled={anyLoading}
              {...register("rememberMe")}
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
            Keep me signed in for 30 days
          </span>
        </label>

        <button
          type="submit"
          disabled={anyLoading || signInBlocked}
          className={cn(
            "relative w-full h-12 rounded-xl font-bold text-sm overflow-hidden",
            "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
            "disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100",
            "transition-all duration-200 shadow-lg shadow-primary/25"
          )}
        >
          {isPending && <span className="absolute inset-0 animate-shimmer pointer-events-none" />}
          <span className="relative flex items-center justify-center gap-2">
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {isRedirecting ? "Redirecting…" : "Signing in…"}
              </>
            ) : signInBlocked ? (
              <>
                <Clock className="size-4" />
                Rate limited — wait before retrying
              </>
            ) : (
              "Sign In with Email"
            )}
          </span>
        </button>
      </form>

      <div className="relative flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-mono">NEW HERE?</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Link
        href="/auth/signup"
        className={cn(
          "flex items-center justify-center w-full h-12 rounded-xl",
          "border-2 border-border text-sm font-bold text-foreground",
          "hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
          "transition-all duration-200 group"
        )}
      >
        Create a free account
        <span className="ml-2 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
          →
        </span>
      </Link>
    </div>
  );
}
