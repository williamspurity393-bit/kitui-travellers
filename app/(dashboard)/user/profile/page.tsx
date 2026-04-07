"use client";

import React from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import {
  User,
  Phone,
  Mail,
  Loader2,
  Check,
  Pencil,
  X,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  Bus,
  Star,
  Calendar,
  IdCard,
  MapPin,
  ChevronRight,
  Sparkles,
  Key,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────

function initials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "KT";
}

function displayName(profile: {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}): string {
  if (profile.fullName) return profile.fullName;
  if (profile.email) return profile.email.split("@")[0].replace(/[._-]/g, " ");
  if (profile.phone) return profile.phone;
  return "Kitui Traveller";
}

// ── Gemini Key Section ────────────────────────────────────────

function GeminiKeySection() {
  const { isAuthenticated } = useConvexAuth();
  const keyStatus = useQuery(api.users.getMyGeminiKeyStatus, !isAuthenticated ? "skip" : {});
  const geminiAccess = useQuery(
    api.systemSettings.getGeminiAccessForRole,
    !isAuthenticated ? "skip" : { accountType: "user" }
  );
  const setKey = useMutation(api.users.setMyGeminiKey);

  const [editing, setEditing] = React.useState(false);
  const [keyInput, setKeyInput] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const hasKey = keyStatus?.hasKey ?? false;
  const sharedEnabled = geminiAccess ?? false;

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
      toast.error(err instanceof Error ? err.message : "Failed to save key");
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
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/20">
        <Sparkles className="size-3.5 text-violet-400" />
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
          AI Assistant Settings
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Access status info */}
        <div
          className={cn(
            "flex items-start gap-3 p-3 rounded-xl text-xs",
            sharedEnabled
              ? "bg-emerald-400/5 border border-emerald-400/15"
              : "bg-amber-400/5 border border-amber-400/15"
          )}
        >
          <AlertCircle
            className={cn(
              "size-3.5 mt-0.5 shrink-0",
              sharedEnabled ? "text-emerald-400" : "text-amber-400"
            )}
          />
          <p className={cn(sharedEnabled ? "text-emerald-400" : "text-amber-400")}>
            {sharedEnabled
              ? "The admin has enabled the shared Gemini key for your account. Your personal key (if set) takes priority."
              : "The admin has not enabled the shared Gemini key for your account type. Add your own key below to use the AI assistant."}
          </p>
        </div>

        {/* Current key status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                hasKey ? "bg-violet-400/10" : "bg-muted"
              )}
            >
              <Key className={cn("size-4", hasKey ? "text-violet-400" : "text-muted-foreground")} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Personal API Key</p>
              <p className="text-xs text-muted-foreground">
                {hasKey ? "Key saved — stored securely, never shown" : "No personal key saved"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasKey && (
              <button
                onClick={handleRemove}
                disabled={saving}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                title="Remove key"
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
                  <Pencil className="size-3" /> {hasKey ? "Update" : "Add Key"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Key input form */}
        {editing && (
          <form onSubmit={handleSave} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Gemini API Key
              </label>
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
              <p className="text-xs text-muted-foreground">
                Get a free key at{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-400 hover:underline"
                >
                  aistudio.google.com/apikey
                </a>{" "}
                — free tier: 1,500 requests/day.
              </p>
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
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Save Key
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function UserProfilePage() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const updateMut = useMutation(api.users.updateProfile);

  const [section, setSection] = React.useState<"info" | "password" | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ fullName: "", phone: "" });
  const [pw, setPw] = React.useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = React.useState(false);

  React.useEffect(() => {
    if (profile) setForm({ fullName: profile.fullName ?? "", phone: profile.phone ?? "" });
  }, [profile]);

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMut({
        fullName: form.fullName.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      toast.success("Profile updated ✓");
      setSection(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await authClient.changePassword({ currentPassword: pw.current, newPassword: pw.next });
      toast.success("Password changed ✓");
      setSection(null);
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Incorrect current password");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  const name = displayName(profile);
  const inits = initials(profile.fullName, profile.email);
  const joined = new Date(profile.createdAt).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-5 lg:p-8 max-w-2xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Hero card */}
      <div className="relative rounded-3xl overflow-hidden border border-border bg-card">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-transparent" />
        <div className="p-6 flex items-start gap-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <span
                className="text-xl font-black text-primary"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {inits}
              </span>
            </div>
            <span className="absolute -bottom-1.5 -right-1.5 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-primary/10 border-primary/20 text-primary">
              {profile.accountType}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className="text-lg font-black text-foreground truncate"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {name}
            </h1>
            {profile.email && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile.email}</p>
            )}
            {profile.phone && <p className="text-xs text-muted-foreground">{profile.phone}</p>}
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground/70">
              <Calendar className="size-3" />
              <span>Member since {joined}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
          {[
            { label: "Account", value: profile.accountType, cap: true },
            {
              label: "Status",
              value: profile.isBanned ? "Suspended" : "Active",
              className: profile.isBanned ? "text-destructive" : "text-emerald-400",
            },
            {
              label: "Trips",
              value: profile.totalTrips != null ? String(profile.totalTrips) : "—",
            },
          ].map(({ label, value, cap, className }) => (
            <div key={label} className="px-4 py-3 text-center">
              <p
                className={cn("text-sm font-bold text-foreground", cap && "capitalize", className)}
              >
                {value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Details */}
      <SectionCard
        title="Personal Details"
        open={section === "info"}
        onEdit={() => setSection(section === "info" ? null : "info")}
        editLabel="Edit"
      >
        {section === "info" ? (
          <form onSubmit={saveInfo} className="p-5 space-y-4">
            <Field label="Full Name" icon={User}>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Your full name"
                className={inputCls}
              />
            </Field>
            <Field label="Phone Number" icon={Phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+254 7XX XXX XXX"
                className={inputCls}
              />
            </Field>
            <FormActions saving={saving} onCancel={() => setSection(null)} />
          </form>
        ) : (
          <div className="divide-y divide-border/50">
            <InfoRow
              icon={User}
              label="Full Name"
              value={profile.fullName ?? "Not set"}
              dim={!profile.fullName}
            />
            <InfoRow
              icon={Mail}
              label="Email"
              value={profile.email ?? "Not set"}
              dim={!profile.email}
            />
            <InfoRow
              icon={Phone}
              label="Phone"
              value={profile.phone ?? "Not set"}
              dim={!profile.phone}
            />
            <InfoRow icon={IdCard} label="Account Type" value={profile.accountType} capitalize />
          </div>
        )}
      </SectionCard>

      {/* Password & Security */}
      <SectionCard
        title="Password & Security"
        open={section === "password"}
        onEdit={() => setSection(section === "password" ? null : "password")}
        editLabel="Change"
      >
        {section === "password" ? (
          <form onSubmit={savePassword} className="p-5 space-y-4">
            {(
              [
                { label: "Current Password", key: "current" },
                { label: "New Password", key: "next" },
                { label: "Confirm New", key: "confirm" },
              ] as const
            ).map(({ label, key }) => (
              <Field key={key} label={label} icon={KeyRound}>
                <input
                  type={showPw ? "text" : "password"}
                  value={pw[key]}
                  required
                  minLength={key !== "current" ? 8 : 1}
                  onChange={(e) => setPw((p) => ({ ...p, [key]: e.target.value }))}
                  className={cn(inputCls, "pr-10")}
                />
                {key === "confirm" && (
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                )}
              </Field>
            ))}
            <FormActions
              saving={saving}
              onCancel={() => {
                setSection(null);
                setPw({ current: "", next: "", confirm: "" });
              }}
            />
          </form>
        ) : (
          <div className="px-5 py-4 flex items-center gap-3 text-sm text-muted-foreground">
            <Shield className="size-4 text-primary shrink-0" />
            <span>Password is set — keep it secure</span>
          </div>
        )}
      </SectionCard>

      {/* AI Settings — Gemini key */}
      <GeminiKeySection />

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: "/user/bookings", icon: Bus, label: "My Bookings", sub: "View all trips" },
          {
            href: "/user/notifications",
            icon: Sparkles,
            label: "Notifications",
            sub: "Check your alerts",
          },
        ].map(({ href, icon: Icon, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-[11px] text-muted-foreground">{sub}</p>
            </div>
            <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

const inputCls =
  "relative w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow";

function SectionCard({
  title,
  open,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  open: boolean;
  onEdit: () => void;
  editLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          {open ? (
            <>
              <X className="size-3" /> Cancel
            </>
          ) : (
            <>
              <Pencil className="size-3" /> {editLabel}
            </>
          )}
        </button>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        {children}
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  capitalize,
  dim,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  capitalize?: boolean;
  dim?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-sm font-medium text-foreground truncate",
            capitalize && "capitalize",
            dim && "text-muted-foreground/50 italic"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function FormActions({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-3 pt-1">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save
      </button>
    </div>
  );
}
