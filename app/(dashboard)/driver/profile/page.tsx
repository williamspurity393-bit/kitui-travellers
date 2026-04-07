"use client";

import React from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Loader2,
  User,
  Phone,
  FileText,
  Bus,
  Check,
  Pencil,
  X,
  Shield,
  Key,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ── Gemini Key Section ────────────────────────────────────────

function GeminiKeySection() {
  const { isAuthenticated } = useConvexAuth();
  const keyStatus = useQuery(api.users.getMyGeminiKeyStatus, !isAuthenticated ? "skip" : {});
  const geminiAccess = useQuery(
    api.systemSettings.getGeminiAccessForRole,
    !isAuthenticated ? "skip" : { accountType: "driver" }
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
        {/* Access status */}
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
              ? "Admin has enabled the shared Gemini key for drivers. Your personal key takes priority if set."
              : "Admin has not enabled the shared Gemini key for drivers. Add your own key to use the AI assistant."}
          </p>
        </div>

        {/* Key status row */}
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
                )}{" "}
                Save Key
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function DriverProfilePage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const vehicle = useQuery(api.vehicles.getMyVehicle, !isAuthenticated ? "skip" : {});
  const updateMut = useMutation(api.users.updateProfile);

  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    phone: "",
    licenseNumber: "",
    vehicleType: "matatu" as "bus" | "minibus" | "matatu" | "coach",
    vehicleNumber: "",
    vehicleCapacity: 14,
  });

  React.useEffect(() => {
    if (profile && profile.accountType !== "driver") router.replace("/dashboard");
  }, [profile, router]);

  React.useEffect(() => {
    if (profile)
      setForm({
        phone: profile.phone ?? "",
        licenseNumber: profile.licenseNumber ?? "",
        vehicleType: (profile.vehicleType as any) ?? "matatu",
        vehicleNumber: profile.vehicleNumber ?? "",
        vehicleCapacity: profile.vehicleCapacity ?? 14,
      });
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMut({
        phone: form.phone.trim() || undefined,
        fullName: undefined,
      });
      toast.success("Profile updated ✓");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
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

  return (
    <div className="p-5 lg:p-8 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            My Profile
          </h1>
          <p className="text-sm text-muted-foreground">Driver account details</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <Pencil className="size-4" /> Edit
          </button>
        )}
      </div>

      {/* Verification badge */}
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-2xl border",
          profile.isVerifiedDriver
            ? "border-emerald-400/20 bg-emerald-400/5"
            : "border-amber-400/20 bg-amber-400/5"
        )}
      >
        <Shield
          className={cn(
            "size-5 shrink-0",
            profile.isVerifiedDriver ? "text-emerald-400" : "text-amber-400"
          )}
        />
        <div>
          <p
            className={cn(
              "text-sm font-semibold",
              profile.isVerifiedDriver ? "text-emerald-400" : "text-amber-400"
            )}
          >
            {profile.isVerifiedDriver ? "Verified Driver" : "Verification Pending"}
          </p>
          <p className="text-xs text-muted-foreground">
            {profile.isVerifiedDriver
              ? "Your account is verified. You can be assigned to routes."
              : "Admin will verify your account once your license details are reviewed."}
          </p>
        </div>
      </div>

      {editing ? (
        <form onSubmit={save} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <p className="font-semibold text-foreground">Edit Profile</p>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="p-1.5 rounded-lg hover:bg-muted"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+254 7XX XXX XXX"
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <div className="px-5 pb-5 flex gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{" "}
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border/50">
            {[
              { icon: Phone, label: "Phone", value: profile.phone ?? "Not set" },
              { icon: User, label: "Account Type", value: "Driver", cap: true },
              {
                icon: FileText,
                label: "License Number",
                value: profile.licenseNumber ?? "Not set",
              },
              {
                icon: Bus,
                label: "Vehicle Type",
                value: profile.vehicleType ?? "Not set",
                cap: true,
              },
              {
                icon: Bus,
                label: "Vehicle Reg. No",
                value: profile.vehicleNumber?.toUpperCase() ?? "Not set",
              },
              {
                icon: Bus,
                label: "Seat Capacity",
                value: profile.vehicleCapacity ? `${profile.vehicleCapacity} seats` : "Not set",
              },
            ].map(({ icon: Icon, label, value, cap }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-4">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={cn("text-sm font-medium text-foreground", cap && "capitalize")}>
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fleet assignment */}
      {vehicle && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Fleet Assignment
          </p>
          <div className="flex items-center gap-3">
            <Bus className="size-5 text-primary" />
            <div>
              <p className="font-mono font-black text-foreground">{vehicle.registrationNumber}</p>
              <p className="text-xs text-muted-foreground">
                {vehicle.make} {vehicle.model} · {vehicle.capacity} seats
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Settings */}
      <GeminiKeySection />
    </div>
  );
}
