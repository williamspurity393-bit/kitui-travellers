"use client";

import React from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Loader2,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Save,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  X,
  Shield,
  ShieldOff,
  Search,
  RefreshCw,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────
interface SettingsField {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  step?: string;
  min?: string;
  max?: string;
}
interface SettingsToggle {
  key: string;
  label: string;
  desc: string;
}
interface SettingsSection {
  title: string;
  isAI?: boolean;
  isGeminiControl?: boolean;
  isRateLimit?: boolean;
  fields?: SettingsField[];
  toggles?: SettingsToggle[];
}

// ── Admin personal Gemini key section ────────────────────────
function AdminGeminiKeySection() {
  const { isAuthenticated } = useConvexAuth();
  const keyStatus = useQuery(api.users.getMyGeminiKeyStatus, !isAuthenticated ? "skip" : {});
  const setKey = useMutation(api.users.setMyGeminiKey);
  const [editing, setEditing] = React.useState(false);
  const [keyInput, setKeyInput] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const hasKey = keyStatus?.hasKey ?? false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      toast.error("Enter a valid API key");
      return;
    }
    setSaving(true);
    try {
      await setKey({ key: keyInput.trim() });
      toast.success("Gemini API key saved ✓");
      setEditing(false);
      setKeyInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remove your personal Gemini API key?")) return;
    setSaving(true);
    try {
      await setKey({ key: undefined });
      toast.success("Key removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-violet-400/10 pt-4 mt-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Your Personal API Key
      </p>
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30">
        <div className="flex items-center gap-2">
          <Key className={cn("size-4", hasKey ? "text-violet-400" : "text-muted-foreground")} />
          <p className="text-sm font-medium text-foreground">
            {hasKey ? "Personal key saved" : "No personal key set"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {hasKey && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              title="Remove"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
            </button>
          )}
          <button
            onClick={() => setEditing((v) => !v)}
            className="flex items-center gap-1 text-xs text-violet-400 hover:underline font-medium"
          >
            {editing ? (
              <>
                <X className="size-3" /> Cancel
              </>
            ) : (
              <>
                <Pencil className="size-3" /> {hasKey ? "Update" : "Add"}
              </>
            )}
          </button>
        </div>
      </div>
      {editing && (
        <form onSubmit={handleSave} className="space-y-3">
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 pointer-events-none" />
            <input
              type={show ? "text" : "password"}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIza..."
              className="w-full h-10 pl-9 pr-10 rounded-xl border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setKeyInput("");
              }}
              className="flex-1 h-9 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !keyInput.trim()}
              className="flex-1 h-9 rounded-xl bg-violet-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-violet-600 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{" "}
              Save Key
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Rate Limiting Section ─────────────────────────────────────
function RateLimitingSection({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const [lookupEmail, setLookupEmail] = React.useState("");
  const [searchEmail, setSearchEmail] = React.useState<string | null>(null);
  const [resetting, setResetting] = React.useState<string | null>(null);

  const status = useQuery(
    api.rateLimits.getRateLimitStatusForEmail,
    searchEmail ? { email: searchEmail } : "skip"
  );
  const config = useQuery(api.rateLimits.getRateLimitConfig);
  const resetAll = useMutation(api.rateLimits.resetAllRateLimitsForEmail);
  const resetAnon = useMutation(api.rateLimits.resetAnonymousRateLimit);
  const resetOne = useMutation(api.rateLimits.resetRateLimitForEmail);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) return;
    setSearchEmail(lookupEmail.trim().toLowerCase());
  };

  const handleResetAll = async () => {
    if (!searchEmail) return;
    setResetting("all");
    try {
      await resetAll({ email: searchEmail });
      toast.success(`All rate limits reset for ${searchEmail}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setResetting(null);
    }
  };

  const handleResetOne = async (limitType: "signIn" | "signUp" | "passwordReset") => {
    if (!searchEmail) return;
    setResetting(limitType);
    try {
      await resetOne({ email: searchEmail, limitType });
      toast.success(`${limitType} limit reset for ${searchEmail}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setResetting(null);
    }
  };

  const handleResetAnon = async () => {
    setResetting("anonymous");
    try {
      await resetAnon({});
      toast.success("Anonymous sign-in rate limit reset");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setResetting(null);
    }
  };

  const limits = config?.limits;

  return (
    <div className="space-y-6">
      {/* Global toggle */}
      <div className="flex items-center justify-between gap-4 py-1">
        <div>
          <p className="text-sm font-medium text-foreground">Enable Auth Rate Limiting</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Globally enables/disables all auth rate limits. Turn off only for debugging — always
            keep ON in production.
          </p>
        </div>
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0",
            enabled
              ? "bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          )}
        >
          {enabled ? (
            <>
              <ToggleRight className="size-4" /> On
            </>
          ) : (
            <>
              <ToggleLeft className="size-4" /> Off
            </>
          )}
        </button>
      </div>

      {/* Configured limits info */}
      {limits && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Configured Limits
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(limits).map(([name, limit]) => (
              <div key={name} className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground capitalize">{name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    {(limit as { algorithm: string }).algorithm}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {(limit as { rate: number }).rate}
                  </span>{" "}
                  per{" "}
                  <span className="font-medium text-foreground">
                    {(limit as { period: string }).period}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  {(limit as { description: string }).description}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-400/5 border border-blue-400/15">
            <Info className="size-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Limits are defined in{" "}
              <code className="text-blue-400 font-mono">convex/rateLimits.ts</code>. To change the
              numbers, update the config there and redeploy.
            </p>
          </div>
        </div>
      )}

      {/* Email lookup */}
      <div className="space-y-3 border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Look Up / Reset by Email
        </p>
        <p className="text-xs text-muted-foreground">
          Use this to check if a user is currently rate limited, or to reset their limits after
          confirming they&apos;re legitimate.
        </p>
        <form onSubmit={handleLookup} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 pointer-events-none" />
            <input
              type="email"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="submit"
            disabled={!lookupEmail.trim()}
            className="px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            Look up
          </button>
        </form>

        {searchEmail && status !== undefined && (
          <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
              <p className="text-xs font-mono text-muted-foreground">{searchEmail}</p>
              <button
                onClick={handleResetAll}
                disabled={resetting === "all"}
                className="flex items-center gap-1.5 text-xs text-destructive hover:underline font-medium disabled:opacity-50"
              >
                {resetting === "all" ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RefreshCw className="size-3" />
                )}
                Reset all
              </button>
            </div>
            <div className="divide-y divide-border/50">
              {status === null ? (
                <p className="px-4 py-3 text-xs text-muted-foreground">
                  No rate limit data found for this email.
                </p>
              ) : (
                (["signIn", "signUp", "passwordReset"] as const).map((limitType) => {
                  const data = (status as Record<string, unknown>)[limitType] as
                    | { value?: number; config?: { rate?: number; capacity?: number } }
                    | null
                    | undefined;
                  const capacity = data?.config?.capacity ?? data?.config?.rate ?? "—";
                  const remaining = data?.value != null ? Math.max(0, Math.floor(data.value)) : "—";
                  return (
                    <div
                      key={limitType}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="text-xs font-medium text-foreground capitalize">
                          {limitType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {remaining} / {capacity} remaining
                        </p>
                      </div>
                      <button
                        onClick={() => handleResetOne(limitType)}
                        disabled={resetting === limitType}
                        className="flex items-center gap-1 text-xs text-primary hover:underline font-medium disabled:opacity-50"
                      >
                        {resetting === limitType ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <RefreshCw className="size-3" />
                        )}
                        Reset
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Anonymous reset */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
        <div>
          <p className="text-sm font-medium text-foreground">Anonymous Sign-in Limit</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Global limit — 10 per hour. Reset if legitimate users are blocked.
          </p>
        </div>
        <button
          onClick={handleResetAnon}
          disabled={resetting === "anonymous"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {resetting === "anonymous" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Reset
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const settings = useQuery(api.systemSettings.getAllSettings, !isAuthenticated ? "skip" : {});
  const lastRun = useQuery(api.agentSettings.getLastAgentRun, !isAuthenticated ? "skip" : {});
  const updateBulk = useMutation(api.systemSettings.bulkUpdateSettings);

  const [form, setForm] = React.useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (profile && profile.accountType !== "admin") router.replace("/dashboard");
  }, [profile, router]);

  React.useEffect(() => {
    if (settings && !form) setForm({ ...(settings as Record<string, unknown>) });
  }, [settings, form]);

  const strVal = (key: string): string => String(form?.[key] ?? "");
  const boolVal = (key: string): boolean => Boolean(form?.[key]);

  const set = (key: string, value: unknown) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setDirty(true);
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await updateBulk({ settings: Object.entries(form).map(([key, value]) => ({ key, value })) });
      toast.success("Settings saved ✓");
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  const SECTIONS: SettingsSection[] = [
    {
      title: "Company Info",
      fields: [
        {
          key: "company_name",
          label: "Company Name",
          type: "text",
          placeholder: "Kitui Travellers",
        },
        {
          key: "support_phone",
          label: "Support Phone",
          type: "text",
          placeholder: "+254 700 000000",
        },
        { key: "support_email", label: "Support Email", type: "email", placeholder: "support@…" },
        {
          key: "booking_code_prefix",
          label: "Booking Code Prefix",
          type: "text",
          placeholder: "KT",
        },
      ],
    },
    {
      title: "Business Rules",
      fields: [
        {
          key: "commission_rate",
          label: "Admin Commission Rate (0–1)",
          type: "number",
          step: "0.01",
          min: "0",
          max: "1",
        },
        {
          key: "max_passengers_per_booking",
          label: "Max Passengers Per Booking",
          type: "number",
          min: "1",
          max: "50",
        },
        {
          key: "cancellation_window_hours",
          label: "Cancellation Window (hours)",
          type: "number",
          min: "0",
        },
      ],
    },
    {
      title: "Feature Flags",
      toggles: [
        {
          key: "maintenance_mode",
          label: "Maintenance Mode",
          desc: "Blocks all new bookings and shows a maintenance notice to users",
        },
        {
          key: "allow_new_registrations",
          label: "Allow New Registrations",
          desc: "If disabled, no new accounts can be created",
        },
      ],
    },
    { title: "Rate Limiting", isRateLimit: true },
    {
      title: "AI Scheduling Agent",
      isAI: true,
      toggles: [
        {
          key: "ai_scheduler_enabled",
          label: "Auto-Schedule Daily (6:00 AM EAT)",
          desc: "When ON, the AI generates each day's schedules at 6 AM EAT.",
        },
      ],
    },
    {
      title: "AI Chat — Shared Key Access Control",
      isAI: true,
      isGeminiControl: true,
      toggles: [],
    },
  ];

  // Pre-extract lastRun details
  const lastRunDate = lastRun
    ? new Date(lastRun.createdAt).toLocaleString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const lastRunDetails = lastRun?.details as Record<string, unknown> | undefined;
  const cleanup = lastRunDetails?.cleanup as Record<string, unknown> | undefined;
  const warnings = Array.isArray(lastRunDetails?.warnings)
    ? (lastRunDetails.warnings as string[])
    : [];
  const schedulesCreated =
    lastRunDetails?.schedulesCreated != null ? String(lastRunDetails.schedulesCreated) : null;
  const isPlural = lastRunDetails?.schedulesCreated !== 1;
  const triggeredBy = String(lastRunDetails?.triggeredBy ?? "unknown");
  const reasoning = lastRunDetails?.reasoning != null ? String(lastRunDetails.reasoning) : null;
  const cleanupDeleted = cleanup != null ? String(cleanup.deleted ?? 0) : null;
  const cleanupCompleted = cleanup != null ? String(cleanup.completed ?? 0) : null;

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            System Settings
          </h1>
          <p className="text-sm text-muted-foreground">Global configuration for Kitui Travellers</p>
        </div>
        {dirty && (
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-70"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Changes
          </button>
        )}
      </div>

      {boolVal("maintenance_mode") && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-destructive/20 bg-destructive/5">
          <AlertCircle className="size-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">
            Maintenance mode is ON — passengers cannot make bookings
          </p>
        </div>
      )}

      {!boolVal("auth_rate_limiting_enabled") && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-400/30 bg-amber-400/5">
          <ShieldOff className="size-5 text-amber-400 shrink-0" />
          <p className="text-sm font-medium text-amber-400">
            Auth rate limiting is OFF — brute-force protection is disabled
          </p>
        </div>
      )}

      {SECTIONS.map((section) => (
        <div
          key={section.title}
          className={cn(
            "rounded-2xl border bg-card overflow-hidden",
            section.isAI || section.isRateLimit ? "border-violet-400/20" : "border-border"
          )}
        >
          <div
            className={cn(
              "px-5 py-3.5 border-b flex items-center gap-2",
              section.isAI || section.isRateLimit
                ? "border-violet-400/20 bg-violet-400/5"
                : "border-border bg-muted/20"
            )}
          >
            {(section.isAI || section.isRateLimit) &&
              (section.isRateLimit ? (
                <Shield className="size-3.5 text-violet-400" />
              ) : (
                <Sparkles className="size-3.5 text-violet-400" />
              ))}
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-widest",
                section.isAI || section.isRateLimit ? "text-violet-400" : "text-muted-foreground"
              )}
            >
              {section.title}
            </p>
          </div>

          <div className="p-5 space-y-4">
            {/* Text fields */}
            {section.fields?.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{field.label}</label>
                <input
                  type={field.type}
                  value={strVal(field.key)}
                  placeholder={field.placeholder}
                  onChange={(e) =>
                    set(
                      field.key,
                      field.type === "number" ? Number(e.target.value) : e.target.value
                    )
                  }
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            ))}

            {/* Toggles */}
            {section.toggles?.map(({ key, label, desc }) => {
              const on = boolVal(key);
              const isViolet = key.startsWith("gemini_enabled") || key === "ai_scheduler_enabled";
              return (
                <div key={key} className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => set(key, !boolVal(key))}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0",
                      on
                        ? isViolet
                          ? "bg-violet-400/10 text-violet-400 hover:bg-violet-400/20"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    )}
                  >
                    {on ? (
                      <>
                        <ToggleRight className="size-4" /> On
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="size-4" /> Off
                      </>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Rate Limiting section */}
            {section.isRateLimit && (
              <RateLimitingSection
                enabled={boolVal("auth_rate_limiting_enabled")}
                onToggle={() =>
                  set("auth_rate_limiting_enabled", !boolVal("auth_rate_limiting_enabled"))
                }
              />
            )}

            {/* Gemini control */}
            {section.isGeminiControl && (
              <>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-400/5 border border-violet-400/15 text-sm">
                  <AlertCircle className="size-4 mt-0.5 shrink-0 text-violet-400" />
                  <div>
                    <p className="font-semibold text-violet-400 mb-1">
                      Managed in Users → AI Access
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Per-role mode and per-user grants are controlled in the{" "}
                      <a
                        href="/admin/users"
                        className="text-violet-400 hover:underline font-medium"
                      >
                        User Management → AI Access tab
                      </a>
                      .
                    </p>
                  </div>
                </div>
                <AdminGeminiKeySection />
              </>
            )}

            {/* AI scheduler last run */}
            {section.isAI && !section.isGeminiControl && (
              <div className="pt-3 border-t border-violet-400/10 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Last Agent Run
                </p>
                {lastRun ? (
                  <div className="rounded-xl bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{lastRunDate}</span>
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium",
                          lastRun.action === "ai_scheduler_ran"
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {lastRun.action === "ai_scheduler_ran" ? "Success" : "Failed"}
                      </span>
                    </div>
                    {schedulesCreated !== null && (
                      <p className="text-xs text-foreground">
                        <span className="font-semibold">{schedulesCreated}</span> schedule
                        {isPlural ? "s" : ""} created · triggered by{" "}
                        <span className="capitalize">{triggeredBy}</span>
                      </p>
                    )}
                    {cleanupDeleted !== null && (
                      <p className="text-xs text-muted-foreground">
                        Cleanup: {cleanupDeleted} deleted, {cleanupCompleted} completed
                      </p>
                    )}
                    {reasoning !== null && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{reasoning}</p>
                    )}
                    {warnings.length > 0 && (
                      <ul className="space-y-0.5">
                        {warnings.map((w, i) => (
                          <li key={i} className="text-xs text-amber-400 flex items-center gap-1">
                            <AlertCircle className="size-2.5 shrink-0" /> {w}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No runs yet. Trigger from the{" "}
                    <a href="/admin/schedules" className="text-violet-400 hover:underline">
                      Schedules page
                    </a>{" "}
                    or enable auto-scheduling above.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {dirty && (
        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-70"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Save All Changes
          </button>
        </div>
      )}
    </div>
  );
}
