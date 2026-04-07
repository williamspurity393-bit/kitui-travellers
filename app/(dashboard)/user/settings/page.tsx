"use client";

import React from "react";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  Loader2,
  KeyRound,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import QRCode from "react-qr-code";

type SetupStep = "idle" | "enter-password" | "qr-scan" | "show-backup";

// ── Section wrapper ───────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div>
        <h2 className="font-bold text-base text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

// ── 2FA Section ───────────────────────────────────────────────────────────
function TwoFactorSection({ twoFactorEnabled }: { twoFactorEnabled?: boolean | null }) {
  const [step, setStep] = React.useState<SetupStep>("idle");
  const [password, setPassword] = React.useState("");
  const [totpUri, setTotpUri] = React.useState("");
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [verifyCode, setVerifyCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [disablePassword, setDisablePassword] = React.useState("");
  const [showDisable, setShowDisable] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleEnable = async () => {
    if (!password) return;
    setLoading(true);
    try {
      const result = await authClient.twoFactor.enable({ password });
      if (result?.error) {
        toast.error("Could not enable 2FA", {
          description: result.error.message ?? "Check your password and try again.",
        });
        return;
      }
      const data = result?.data as { totpURI?: string; backupCodes?: string[] } | null;
      if (data?.totpURI) {
        setTotpUri(data.totpURI);
        setBackupCodes(data.backupCodes ?? []);
        setStep("qr-scan");
      }
    } catch (err) {
      toast.error("Failed to enable 2FA", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode.trim()) return;
    setLoading(true);
    try {
      const result = await authClient.twoFactor.verifyTotp({ code: verifyCode.trim() });
      if (result?.error) {
        toast.error("Invalid code", {
          description: "Check your authenticator app and try again.",
        });
        return;
      }
      toast.success("2FA enabled! 🔐", { description: "Your account is now protected." });
      setStep("show-backup");
    } catch (err) {
      toast.error("Verification failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disablePassword) return;
    setLoading(true);
    try {
      const result = await authClient.twoFactor.disable({ password: disablePassword });
      if (result?.error) {
        toast.error("Could not disable 2FA", {
          description: result.error.message ?? "Check your password.",
        });
        return;
      }
      toast.success("2FA disabled", {
        description: "Two-factor authentication has been turned off.",
      });
      setShowDisable(false);
      setDisablePassword("");
      window.location.reload();
    } catch (err) {
      toast.error("Failed to disable 2FA", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    if (!backupCodes.length) return;
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setStep("idle");
    setPassword("");
    setTotpUri("");
    setBackupCodes([]);
    setVerifyCode("");
  };

  if (twoFactorEnabled && step === "idle") {
    return (
      <Section
        title="Two-Factor Authentication"
        description="Your account has an extra layer of protection. You'll need your authenticator app to sign in."
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 w-fit">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">2FA is enabled</span>
        </div>

        {showDisable ? (
          <div className="space-y-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <p className="text-sm text-muted-foreground">
              Enter your password to confirm disabling 2FA.
            </p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Your current password"
                className="w-full h-10 px-3 pr-10 rounded-xl border border-destructive/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDisable}
                disabled={loading || !disablePassword}
                className="px-4 py-2 rounded-xl bg-destructive text-white text-sm font-bold hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Loader2 className="size-3 animate-spin" />}
                Disable 2FA
              </button>
              <button
                onClick={() => {
                  setShowDisable(false);
                  setDisablePassword("");
                }}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDisable(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
          >
            <ShieldOff className="size-4" />
            Disable 2FA
          </button>
        )}
      </Section>
    );
  }

  return (
    <Section
      title="Two-Factor Authentication"
      description="Add an extra layer of security. When enabled, you'll need a code from your authenticator app to sign in."
    >
      {step === "idle" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 w-fit">
            <ShieldOff className="size-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">2FA is not enabled</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We recommend enabling 2FA to protect your account. You&apos;ll need an authenticator app
            like <strong className="text-foreground">Google Authenticator</strong> or{" "}
            <strong className="text-foreground">Authy</strong>.
          </p>
          <button
            onClick={() => setStep("enter-password")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
          >
            <ShieldCheck className="size-4" />
            Enable 2FA
          </button>
        </div>
      )}

      {step === "enter-password" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Enter your current password to continue.</p>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your current password"
              autoFocus
              className="w-full h-11 px-3 pr-10 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={loading || !password}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="size-3 animate-spin" />}
              Continue
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === "qr-scan" && totpUri && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Scan with your authenticator app
            </p>
            <p className="text-xs text-muted-foreground">
              Open Google Authenticator, Authy, or any TOTP app and scan the QR code.
            </p>
          </div>
          <div className="p-5 bg-white rounded-2xl w-fit mx-auto">
            <QRCode value={totpUri} size={160} />
          </div>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground transition-colors">
              Can&apos;t scan? Enter the secret manually
            </summary>
            <code className="block mt-2 p-2 bg-muted rounded-lg font-mono text-xs break-all text-foreground">
              {totpUri.match(/secret=([^&]+)/)?.[1] ?? ""}
            </code>
          </details>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Enter the 6-digit code to verify
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="000 000"
              maxLength={6}
              className="w-full h-12 px-4 rounded-xl border border-input bg-background text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleVerify}
              disabled={loading || verifyCode.length < 6}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="size-3 animate-spin" />}
              Verify & Activate
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === "show-backup" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/20">
            <p className="text-sm font-semibold text-amber-400 mb-1">
              ⚠️ Save these backup codes now
            </p>
            <p className="text-xs text-muted-foreground">
              If you lose your phone, these one-time codes are your only way back in.
            </p>
          </div>
          <div className="relative p-4 bg-muted rounded-xl font-mono text-xs grid grid-cols-2 gap-1.5">
            {backupCodes.map((code, i) => (
              <span key={i} className="text-foreground tracking-wide">
                {code}
              </span>
            ))}
            <button
              onClick={copyBackupCodes}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
            >
              {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
            </button>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-2"
          >
            <Check className="size-4" />
            Done — I&apos;ve saved my backup codes
          </button>
        </div>
      )}
    </Section>
  );
}

// ── Change Password Section ───────────────────────────────────────────────
function ChangePasswordSection() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [show, setShow] = React.useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (next.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const result = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      });
      if (result?.error) {
        toast.error("Could not change password", { description: result.error.message ?? "" });
        return;
      }
      toast.success("Password updated!", { description: "Your new password is active." });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.error("Failed", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section
      title="Change Password"
      description="Update your password. You'll be kept signed in on this device."
    >
      <form onSubmit={handleChange} className="space-y-3">
        {[
          { label: "Current Password", value: current, set: setCurrent, id: "cur" },
          { label: "New Password", value: next, set: setNext, id: "new" },
          { label: "Confirm New Password", value: confirm, set: setConfirm, id: "conf" },
        ].map(({ label, value, set, id }) => (
          <div key={id} className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => set(e.target.value)}
                required
                className="w-full h-10 px-3 pr-10 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              {id === "cur" && (
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          type="submit"
          disabled={loading || !current || !next || !confirm}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <Loader2 className="size-3.5 animate-spin" />}
          <KeyRound className="size-3.5" />
          Update Password
        </button>
      </form>
    </Section>
  );
}

// ── Delete Account Section ────────────────────────────────────────────────
function DangerZoneSection() {
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    if (confirm !== "DELETE") {
      toast.error("Type DELETE to confirm");
      return;
    }
    if (!window.confirm("This is permanent and cannot be undone. Are you absolutely sure?")) return;
    setLoading(true);
    try {
      await authClient.deleteUser();
      window.location.href = "/";
    } catch (err) {
      toast.error("Could not delete account", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <Section
      title="Danger Zone"
      description="Permanently delete your account and all associated data. This cannot be undone."
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/5 border border-destructive/20">
          <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            All your bookings, profile data, and payment history will be permanently deleted.{" "}
            <strong className="text-destructive">This action is irreversible.</strong>
          </p>
        </div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Type <code className="text-destructive font-mono">DELETE</code> to confirm
        </label>
        <div className="flex gap-2">
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="flex-1 h-10 px-3 rounded-xl border border-destructive/30 bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-destructive/30"
          />
          <button
            onClick={handleDelete}
            disabled={loading || confirm !== "DELETE"}
            className="px-4 py-2 rounded-xl bg-destructive text-white text-sm font-bold hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Delete Account
          </button>
        </div>
      </div>
    </Section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function UserSettingsPage() {
  // ── FIX: read twoFactorEnabled from the Better Auth user, not userProfiles ──
  // twoFactorEnabled is stored in Better Auth's `user` table.
  // api.auth.getCurrentUser calls authComponent.getAuthUser(ctx) which
  // returns the Better Auth user row — the one that has twoFactorEnabled.
  // userProfiles is your app's own table and does NOT have this field.
  const authUser = useQuery(api.auth.getCurrentUser);
  const { data: session } = authClient.useSession();

  // Check if this user has an email/password account (vs Google-only / anonymous)
  const [hasPassword, setHasPassword] = React.useState<boolean | null>(null);
  const [isAnonymous, setIsAnonymous] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    authClient
      .listAccounts()
      .then((result) => {
        const accounts = (result as { data?: { providerId: string }[] })?.data ?? [];
        setHasPassword(accounts.some((a) => a.providerId === "credential"));
        setIsAnonymous(
          accounts.length === 0 || accounts.every((a) => a.providerId === "anonymous")
        );
      })
      .catch(() => {
        setHasPassword(false);
        setIsAnonymous(false);
      });
  }, []);

  // twoFactorEnabled from the Better Auth user object
  const twoFactorEnabled = (authUser as Record<string, unknown> | null)?.twoFactorEnabled as
    | boolean
    | null
    | undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1
          className="text-2xl font-black text-foreground"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your security preferences and account.
        </p>
        {session?.user?.email && (
          <p className="text-xs text-muted-foreground mt-1 font-mono">{session.user.email}</p>
        )}
        {isAnonymous && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-400/10 border border-blue-400/20 w-fit">
            <span className="text-xs font-semibold text-blue-400">
              👤 You are signed in as a guest
            </span>
          </div>
        )}
      </div>

      {/* 2FA — only for non-anonymous users with a password */}
      {!isAnonymous && hasPassword && <TwoFactorSection twoFactorEnabled={twoFactorEnabled} />}

      {/* Password change — only for email/password accounts */}
      {hasPassword && <ChangePasswordSection />}

      {/* Anonymous users — prompt to create a full account */}
      {isAnonymous && (
        <Section
          title="Create a Full Account"
          description="You are currently a guest. Create an account to save your bookings and access all features."
        >
          <a
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Create Account
          </a>
        </Section>
      )}

      {/* Danger zone — always visible */}
      <DangerZoneSection />
    </div>
  );
}
