"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema } from "@/lib/validations";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Bus,
  Users,
  Loader2,
  ChevronRight,
  CheckCircle2,
  Phone,
  FileText,
  Hash,
  AlertTriangle,
  X,
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AccountType = "user" | "driver";

const VEHICLE_TYPES = [
  { value: "bus", label: "🚌 Bus", desc: "30+ passengers" },
  { value: "minibus", label: "🚐 Minibus", desc: "14–29 passengers" },
  { value: "matatu", label: "🚌 Matatu", desc: "Up to 14 passengers" },
  { value: "coach", label: "🚎 Coach", desc: "Luxury · 40+ seats" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [accountType, setAccountType] = React.useState<AccountType>("user");
  const [submitted, setSubmitted] = React.useState(false);

  // Use Convex auth state — safe to call Convex queries once this is true
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  // Redirect unauthenticated visitors to login
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Live subscription — updates automatically when completeOnboarding writes
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});

  /**
   * KEY FIX: watch the live profile subscription.
   * Only navigate to /dashboard AFTER Convex confirms isOnboarded=true.
   * This breaks the loop caused by navigating before the write propagates.
   */
  React.useEffect(() => {
    if (submitted && profile?.isOnboarded) {
      router.replace("/dashboard");
    }
  }, [submitted, profile?.isOnboarded, router]);

  // If already onboarded and we haven't just submitted, go straight to dashboard
  React.useEffect(() => {
    if (!submitted && profile?.isOnboarded) {
      router.replace("/dashboard");
    }
  }, [submitted, profile?.isOnboarded, router]);

  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { accountType: "user" as AccountType },
    mode: "onTouched",
  });

  const selectedVehicleType = watch("vehicleType");
  const e = errors as Record<string, { message?: string }>;

  const handleAccountTypeChange = (type: AccountType) => {
    setAccountType(type);
    setValue("accountType", type, { shouldDirty: true });
  };

  const onSubmit = async (data: unknown) => {
    const values = data as {
      accountType: AccountType;
      phone?: string;
      licenseNumber?: string;
      vehicleType?: "bus" | "minibus" | "matatu" | "coach";
      vehicleNumber?: string;
      vehicleCapacity?: number;
    };

    try {
      await completeOnboarding({
        accountType: values.accountType,
        phone: values.phone?.trim() || undefined,
        licenseNumber: values.licenseNumber?.trim(),
        vehicleType: values.vehicleType,
        vehicleNumber: values.vehicleNumber?.trim().toUpperCase(),
        vehicleCapacity: values.vehicleCapacity,
      });

      toast.success(
        values.accountType === "driver" ? "Driver profile submitted! 🚌" : "Welcome aboard! 🎉",
        {
          description:
            values.accountType === "driver"
              ? "Our team will review your details within 24 hours."
              : "You're ready to book your first trip.",
        }
      );

      // Mark as submitted — the useEffect above will redirect once
      // the live Convex subscription reflects isOnboarded=true
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast.error("Setup failed", { description: message });
    }
  };

  const isPending = isSubmitting || submitted;

  // Spinner while auth resolves or profile is loading
  if (authLoading || (isAuthenticated && profile === undefined)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  // Waiting for Convex subscription to confirm isOnboarded after submit
  if (submitted && !profile?.isOnboarded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-6 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Setting up your dashboard…</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="w-full space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <span className="w-6 h-1.5 rounded-full bg-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-mono">Step 3 — Profile setup</span>
        </div>
        <h1
          className="text-3xl font-black text-foreground tracking-tight"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          One last thing
        </h1>
        <p className="text-sm text-muted-foreground">
          How will you use TransportMe? This shapes your dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Account type */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleAccountTypeChange("user")}
            disabled={isPending}
            className={cn(
              "relative p-5 rounded-2xl border-2 text-left transition-all duration-200 disabled:opacity-60",
              accountType === "user"
                ? "border-primary bg-primary/8 shadow-md shadow-primary/10"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <div
              className={cn(
                "absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                accountType === "user" ? "border-primary bg-primary" : "border-border opacity-0"
              )}
            >
              <CheckCircle2 className="size-3 text-primary-foreground" />
            </div>
            <Users
              className={cn(
                "size-8 mb-3",
                accountType === "user" ? "text-primary" : "text-muted-foreground"
              )}
            />
            <p
              className={cn(
                "font-bold text-sm mb-1",
                accountType === "user" ? "text-primary" : "text-foreground"
              )}
            >
              Traveller
            </p>
            <p className="text-xs text-muted-foreground leading-snug">
              Browse routes, book tickets, manage trips
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleAccountTypeChange("driver")}
            disabled={isPending}
            className={cn(
              "relative p-5 rounded-2xl border-2 text-left transition-all duration-200 disabled:opacity-60",
              accountType === "driver"
                ? "border-primary bg-primary/8 shadow-md shadow-primary/10"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <div
              className={cn(
                "absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                accountType === "driver" ? "border-primary bg-primary" : "border-border opacity-0"
              )}
            >
              <CheckCircle2 className="size-3 text-primary-foreground" />
            </div>
            <Bus
              className={cn(
                "size-8 mb-3",
                accountType === "driver" ? "text-primary" : "text-muted-foreground"
              )}
            />
            <p
              className={cn(
                "font-bold text-sm mb-1",
                accountType === "driver" ? "text-primary" : "text-foreground"
              )}
            >
              Driver
            </p>
            <p className="text-xs text-muted-foreground leading-snug">
              Manage routes, passengers &amp; earnings
            </p>
          </button>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label
            htmlFor="phone"
            className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Phone number
            {accountType === "user" && (
              <span className="normal-case font-normal text-muted-foreground/70"> (optional)</span>
            )}
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="+254 700 000 000"
              disabled={isPending}
              {...register("phone")}
              className={cn(
                "w-full h-12 pl-10 pr-4 rounded-xl border bg-card text-sm font-mono",
                "placeholder:text-muted-foreground/50 placeholder:font-sans",
                "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
                "disabled:opacity-60 transition-all",
                e["phone"] ? "border-destructive" : "border-input"
              )}
            />
          </div>
          {e["phone"] && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <X className="size-3" />
              {e["phone"].message}
            </p>
          )}
        </div>

        {/* Driver fields */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-500",
            accountType === "driver" ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="space-y-5 p-5 rounded-2xl border border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <Bus className="size-4 text-primary" />
              <h3 className="text-sm font-bold">Vehicle &amp; License Details</h3>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="licenseNumber"
                className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Driving License No.
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                <input
                  id="licenseNumber"
                  type="text"
                  placeholder="e.g. DL123456"
                  disabled={isPending}
                  {...register("licenseNumber")}
                  className={cn(
                    "w-full h-12 pl-10 pr-4 rounded-xl border bg-background text-sm font-mono placeholder:text-muted-foreground/50 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60 transition-all",
                    e["licenseNumber"] ? "border-destructive" : "border-input"
                  )}
                />
              </div>
              {e["licenseNumber"] && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <X className="size-3" />
                  {e["licenseNumber"].message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Vehicle Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_TYPES.map((vt) => {
                  const selected = selectedVehicleType === vt.value;
                  return (
                    <button
                      key={vt.value}
                      type="button"
                      onClick={() => setValue("vehicleType", vt.value, { shouldDirty: true })}
                      disabled={isPending}
                      className={cn(
                        "p-3.5 rounded-xl border-2 text-left transition-all disabled:opacity-60",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/30"
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm font-bold",
                          selected ? "text-primary" : "text-foreground"
                        )}
                      >
                        {vt.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{vt.desc}</p>
                    </button>
                  );
                })}
              </div>
              {e["vehicleType"] && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <X className="size-3" />
                  {e["vehicleType"].message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="vehicleNumber"
                  className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Reg. Number
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                  <input
                    id="vehicleNumber"
                    type="text"
                    placeholder="KCA 123A"
                    disabled={isPending}
                    {...register("vehicleNumber")}
                    className={cn(
                      "w-full h-12 pl-10 pr-3 rounded-xl border bg-background text-sm font-mono uppercase placeholder:normal-case placeholder:text-muted-foreground/50 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60 transition-all",
                      e["vehicleNumber"] ? "border-destructive" : "border-input"
                    )}
                  />
                </div>
                {e["vehicleNumber"] && (
                  <p className="text-xs text-destructive">{e["vehicleNumber"].message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="vehicleCapacity"
                  className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Seat Count
                </label>
                <input
                  id="vehicleCapacity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  placeholder="14"
                  disabled={isPending}
                  {...register("vehicleCapacity", { valueAsNumber: true })}
                  className={cn(
                    "w-full h-12 px-4 rounded-xl border bg-background text-sm font-mono placeholder:text-muted-foreground/50 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60 transition-all",
                    e["vehicleCapacity"] ? "border-destructive" : "border-input"
                  )}
                />
                {e["vehicleCapacity"] && (
                  <p className="text-xs text-destructive">{e["vehicleCapacity"].message}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-400/8 border border-amber-400/20">
              <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your details will be reviewed by our team.{" "}
                <span className="text-amber-400 font-medium">
                  Expect a response within 24 hours.
                </span>
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "relative w-full h-12 rounded-xl font-bold text-sm overflow-hidden flex items-center justify-center gap-2",
            "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
            "disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100",
            "transition-all shadow-lg shadow-primary/25"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Setting up…
            </>
          ) : (
            <>
              Finish Setup <ChevronRight className="size-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          You can change these settings anytime from your profile.
        </p>
      </form>
    </div>
  );
}
