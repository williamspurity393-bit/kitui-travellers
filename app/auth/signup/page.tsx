"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormValues } from "@/lib/validations";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  User,
  Mail,
  Lock,
  ShieldCheck,
  UserX,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Countdown hook (same as login) ────────────────────────────────────────
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

function RateLimitBanner({ retryAfterMs, context }: { retryAfterMs: number; context: string }) {
  const { active, formatted } = useCountdown(retryAfterMs);
  if (!active) return null;
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-400/30 bg-amber-400/5 animate-in fade-in duration-300">
      <ShieldAlert className="size-4 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-400">Too many attempts</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {context} blocked for security. Try again in{" "}
          <span className="font-mono font-bold text-amber-400">{formatted}</span>.
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Clock className="size-3 text-amber-400" />
        <span className="text-xs font-mono font-bold text-amber-400">{formatted}</span>
      </div>
    </div>
  );
}

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

// ── Password strength ─────────────────────────────────────────────────────
const PASSWORD_RULES = [
  { id: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "num", label: "One number", test: (p: string) => /[0-9]/.test(p) },
];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Strong"];
const STRENGTH_COLORS = ["bg-border", "bg-destructive", "bg-amber-400", "bg-emerald-400"];

function PasswordStrengthBar({ password }: { password: string }) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (!password) return null;
  return (
    <div className="space-y-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={cn(
              "flex-1 h-1 rounded-full transition-all duration-500",
              passed >= level ? STRENGTH_COLORS[passed] : "bg-border"
            )}
          />
        ))}
        <span
          className={cn(
            "text-xs font-semibold ml-1 transition-colors",
            passed === 1 && "text-destructive",
            passed === 2 && "text-amber-400",
            passed === 3 && "text-emerald-400"
          )}
        >
          {STRENGTH_LABELS[passed]}
        </span>
      </div>
      <ul className="space-y-1">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.id} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0 transition-all duration-300",
                  ok ? "bg-emerald-400/20 text-emerald-400" : "bg-muted text-muted-foreground"
                )}
              >
                {ok ? (
                  <Check className="size-2.5" strokeWidth={3} />
                ) : (
                  <X className="size-2.5" strokeWidth={3} />
                )}
              </span>
              <span
                className={cn(
                  "text-xs transition-colors duration-300",
                  ok ? "text-emerald-400" : "text-muted-foreground"
                )}
              >
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
function SignupContent() {
  const router = useRouter();

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [guestLoading, setGuestLoading] = React.useState(false);

  // Rate limit state
  const [signUpRetryAfter, setSignUpRetryAfter] = React.useState<number | null>(null);
  const { active: signUpBlocked } = useCountdown(signUpRetryAfter);

  const checkSignUp = useMutation(api.rateLimits.checkSignUpRateLimit);
  const checkAnonymous = useMutation(api.rateLimits.checkAnonymousRateLimit);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", agreeToTerms: false },
    mode: "onTouched",
  });

  const password = watch("password", "");
  const confirmPassword = watch("confirmPassword", "");
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const onSubmit = async (data: SignupFormValues) => {
    // 1. Check rate limit
    try {
      const rl = await checkSignUp({ email: data.email });
      if (!rl.ok && rl.retryAfter) {
        setSignUpRetryAfter(rl.retryAfter);
        toast.warning("Sign-up rate limit reached", {
          description: "Too many accounts created. Please wait before trying again.",
        });
        return;
      }
    } catch {
      /* fail open */
    }

    // 2. Attempt sign-up
    try {
      const result = await authClient.signUp.email({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      if (result.error) {
        const msg = result.error.message ?? "";
        const code = result.error.code ?? "";
        if (msg.toLowerCase().includes("email") && msg.toLowerCase().includes("exist")) {
          setError("email", { message: "This email is already registered. Sign in instead?" });
          toast.error("Email already in use", {
            description: "Try signing in or use a different email.",
            action: { label: "Sign in", onClick: () => router.push("/auth/login") },
          });
        } else if (code === "RATE_LIMIT_EXCEEDED" || result.error.status === 429) {
          setSignUpRetryAfter(60000);
          toast.warning("Slow down!", { description: "Too many signup attempts. Wait a moment." });
        } else {
          toast.error("Couldn't create account", { description: msg || "Something went wrong." });
        }
        return;
      }

      toast.success("Account created! 🎉", { description: "Setting up your profile…" });
      setIsRedirecting(true);
      router.push("/auth/onboarding");
      router.refresh();
    } catch {
      toast.error("Connection error", {
        description: "Check your internet connection and try again.",
      });
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const callbackURL = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`;
      await authClient.signIn.social({ provider: "google", callbackURL });
    } catch {
      toast.error("Google sign-up failed", { description: "Please try again." });
      setGoogleLoading(false);
    }
  };

  const handleGuestSignUp = async () => {
    try {
      const rl = await checkAnonymous({});
      if (!rl.ok && rl.retryAfter) {
        setSignUpRetryAfter(rl.retryAfter);
        toast.warning("Guest sign-in limit reached", { description: "Try again later." });
        return;
      }
    } catch {
      /* fail open */
    }

    setGuestLoading(true);
    try {
      const result = await authClient.signIn.anonymous();
      if (result?.error) {
        toast.error("Could not sign in as guest", { description: result.error.message ?? "" });
        setGuestLoading(false);
        return;
      }
      toast.success("Signed in as guest");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Guest sign-in failed");
      setGuestLoading(false);
    }
  };

  const isPending = isSubmitting || isRedirecting;
  const anyLoading = isPending || googleLoading || guestLoading;

  const FieldIcon = ({
    icon: Icon,
    valid,
    dirty,
  }: {
    icon: React.ElementType;
    valid: boolean;
    dirty: boolean;
  }) => (
    <span
      className={cn(
        "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300",
        dirty && valid
          ? "text-emerald-400"
          : dirty && !valid
            ? "text-destructive"
            : "text-muted-foreground/60"
      )}
    >
      <Icon className="size-4" />
    </span>
  );

  return (
    <div className="w-full space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Free forever
          </span>
        </div>
        <h1
          className="text-3xl font-black text-foreground tracking-tight"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join 200,000+ travellers — takes less than a minute.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-6 h-1.5 rounded-full bg-primary" />
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
        </div>
        <span className="text-xs text-muted-foreground font-mono">Account details</span>
      </div>

      {/* Rate limit banner */}
      {signUpBlocked && signUpRetryAfter && (
        <RateLimitBanner retryAfterMs={signUpRetryAfter} context="Account creation" />
      )}

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={anyLoading}
        className={cn(
          "w-full h-12 rounded-xl border-2 border-border bg-card flex items-center justify-center gap-3 text-sm font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
        )}
      >
        {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
        {googleLoading ? "Redirecting to Google…" : "Sign up with Google"}
      </button>

      {/* Guest */}
      <button
        type="button"
        onClick={handleGuestSignUp}
        disabled={anyLoading}
        className={cn(
          "w-full h-12 rounded-xl border-2 border-dashed border-border bg-transparent flex items-center justify-center gap-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
        )}
      >
        {guestLoading ? <Loader2 className="size-4 animate-spin" /> : <UserX className="size-4" />}
        {guestLoading ? "Signing in as guest…" : "Continue as Guest"}
      </button>

      <div className="relative flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          OR SIGN UP WITH EMAIL
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Full name
          </label>
          <div className="relative">
            <FieldIcon icon={User} valid={!errors.name} dirty={Boolean(dirtyFields.name)} />
            <input
              id="name"
              type="text"
              autoComplete="name"
              autoFocus
              placeholder="Jane Doe"
              disabled={anyLoading}
              {...register("name")}
              className={cn(
                "w-full h-12 pl-10 pr-4 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60 transition-all duration-200",
                errors.name ? "border-destructive ring-1 ring-destructive/20" : "border-input"
              )}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1">
              <X className="size-3" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Email address
          </label>
          <div className="relative">
            <FieldIcon icon={Mail} valid={!errors.email} dirty={Boolean(dirtyFields.email)} />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={anyLoading}
              {...register("email")}
              className={cn(
                "w-full h-12 pl-10 pr-4 rounded-xl border bg-card text-sm text-foreground font-mono placeholder:text-muted-foreground/50 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60 transition-all duration-200",
                errors.email ? "border-destructive ring-1 ring-destructive/20" : "border-input"
              )}
            />
            {dirtyFields.email && !errors.email && (
              <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-emerald-400 animate-in zoom-in duration-200" />
            )}
          </div>
          {errors.email && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1">
              <X className="size-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Password
          </label>
          <div className="relative">
            <FieldIcon
              icon={Lock}
              valid={!errors.password && Boolean(dirtyFields.password)}
              dirty={Boolean(dirtyFields.password)}
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              disabled={anyLoading}
              {...register("password")}
              className={cn(
                "w-full h-12 pl-10 pr-12 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60 transition-all duration-200",
                errors.password ? "border-destructive ring-1 ring-destructive/20" : "border-input"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={anyLoading}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
              aria-label={showPassword ? "Hide" : "Show"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <PasswordStrengthBar password={password} />
          {errors.password && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1">
              <X className="size-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Confirm password
          </label>
          <div className="relative">
            <FieldIcon
              icon={ShieldCheck}
              valid={passwordsMatch}
              dirty={Boolean(dirtyFields.confirmPassword)}
            />
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your password"
              disabled={anyLoading}
              {...register("confirmPassword")}
              className={cn(
                "w-full h-12 pl-10 pr-12 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60 transition-all duration-200",
                passwordsMismatch || errors.confirmPassword
                  ? "border-destructive ring-1 ring-destructive/20"
                  : passwordsMatch
                    ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                    : "border-input"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              disabled={anyLoading}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {passwordsMatch && (
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <Check className="size-3" /> Passwords match
            </p>
          )}
          {(passwordsMismatch || errors.confirmPassword) && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1">
              <X className="size-3" />
              {errors.confirmPassword?.message ?? "Passwords do not match"}
            </p>
          )}
        </div>

        {/* Terms */}
        <div className="space-y-1 pt-1">
          <label className="flex items-start gap-3 cursor-pointer group select-none">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                disabled={anyLoading}
                {...register("agreeToTerms")}
                className="sr-only peer"
              />
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 border-input bg-card peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary/50 transition-all duration-200",
                  errors.agreeToTerms ? "border-destructive" : ""
                )}
              />
              <svg
                className="absolute inset-0 w-5 h-5 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-all duration-200 pointer-events-none scale-50 peer-checked:scale-100"
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
            <span className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-primary hover:underline font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-primary hover:underline font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1 pl-8">
              <X className="size-3" />
              {errors.agreeToTerms.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={anyLoading || signUpBlocked}
          className={cn(
            "relative w-full h-12 rounded-xl font-bold text-sm mt-2 overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200 shadow-lg shadow-primary/25"
          )}
        >
          {isPending && <span className="absolute inset-0 animate-shimmer pointer-events-none" />}
          <span className="relative flex items-center justify-center gap-2">
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {isRedirecting ? "Almost there…" : "Creating account…"}
              </>
            ) : signUpBlocked ? (
              <>
                <Clock className="size-4" />
                Rate limited — wait before retrying
              </>
            ) : (
              "Create Account — It's Free"
            )}
          </span>
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-primary hover:text-primary/80 font-semibold transition-colors"
        >
          Sign in →
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full flex items-center justify-center min-h-[60vh]">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
