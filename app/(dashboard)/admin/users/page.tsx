"use client";

import React from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  Loader2,
  Crown,
  UserX,
  AlertCircle,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

// ── Local shape types (mirror what the Convex queries return) ──
interface UserProfile {
  _id: Id<"userProfiles">;
  userId: string;
  accountType: "user" | "driver" | "admin";
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  isBanned?: boolean;
  createdAt: number;
}

interface AllowlistEntry {
  _id: Id<"geminiAllowlist">;
  userId: string;
  accountType: string;
  fullName?: string | null;
  email?: string | null;
  grantedAt: number;
  note?: string | null;
}

// ─────────────────────────────────────────────────────────────

const ROLE_COLORS = {
  admin: "bg-primary/10 text-primary",
  driver: "bg-blue-400/10 text-blue-400",
  user: "bg-muted text-muted-foreground",
};

type GeminiMode = "off" | "all" | "allowlist";

function ModeSelector({
  role,
  currentMode,
  onChange,
  disabled,
}: {
  role: "user" | "driver" | "admin";
  currentMode: GeminiMode;
  onChange: (mode: GeminiMode) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border overflow-hidden bg-background">
      {(["off", "all", "allowlist"] as GeminiMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          disabled={disabled}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors capitalize whitespace-nowrap disabled:opacity-50",
            currentMode === m
              ? m === "off"
                ? "bg-muted text-muted-foreground"
                : m === "all"
                  ? "bg-emerald-400/15 text-emerald-400"
                  : "bg-violet-400/15 text-violet-400"
              : "text-muted-foreground hover:bg-muted/60"
          )}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const users = useQuery(api.admin.listAllProfiles, !isAuthenticated ? "skip" : {});
  const modes = useQuery(api.geminiAccess.getGeminiModes, !isAuthenticated ? "skip" : {});
  const allowlist = useQuery(api.geminiAccess.getGeminiAllowlist, !isAuthenticated ? "skip" : {});

  const banMut = useMutation(api.admin.banUser);
  const unbanMut = useMutation(api.admin.unbanUser);
  const deleteMut = useMutation(api.admin.deleteUser);
  const promoteMut = useMutation(api.admin.promoteToAdmin);
  const revokeMut = useMutation(api.admin.revokeAdminAccess);
  const grantAIMut = useMutation(api.geminiAccess.grantGeminiAccess);
  const revokeAIMut = useMutation(api.geminiAccess.revokeGeminiAccess);
  const setModeMut = useMutation(api.geminiAccess.setGeminiMode);

  const [tab, setTab] = React.useState<"users" | "ai">("users");
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | "user" | "driver" | "admin">("all");
  const [pending, setPending] = React.useState<string | null>(null);
  const [modeChanging, setModeChanging] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile && profile.accountType !== "admin") router.replace("/dashboard");
  }, [profile, router]);

  // Cast to local interfaces so every callback parameter is fully typed
  const userList: UserProfile[] = (users ?? []) as unknown as UserProfile[];
  const allowlistList: AllowlistEntry[] = (allowlist ?? []) as unknown as AllowlistEntry[];

  const allowlistSet = React.useMemo(
    () => new Set(allowlistList.map((e: AllowlistEntry) => e.userId)),
    [allowlistList]
  );

  const filtered: UserProfile[] = userList.filter((u: UserProfile) => {
    const matchRole = roleFilter === "all" || u.accountType === roleFilter;
    const s = search.toLowerCase();
    const matchSearch =
      !search ||
      u.userId.toLowerCase().includes(s) ||
      (u.phone ?? "").includes(s) ||
      (u.email ?? "").toLowerCase().includes(s) ||
      (u.fullName ?? "").toLowerCase().includes(s);
    return matchRole && matchSearch;
  });

  const doAction = async (fn: () => Promise<unknown>, successMsg: string, id: string) => {
    setPending(id);
    try {
      await fn();
      toast.success(successMsg);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(null);
    }
  };

  const changeMode = async (role: "user" | "driver" | "admin", mode: GeminiMode) => {
    setModeChanging(role);
    try {
      await setModeMut({ role, mode });
      toast.success(`${role} mode → ${mode}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setModeChanging(null);
    }
  };

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header + tabs */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            User Management
          </h1>
          <p className="text-sm text-muted-foreground">
            {users ? `${users.length} accounts` : "Loading…"}
          </p>
        </div>
        <div className="flex rounded-xl border border-input overflow-hidden bg-background">
          {(["users", "ai"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 h-9 text-sm font-medium transition-colors",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {t === "ai" ? "AI Access" : "Users"}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: USERS ───────────────────────────────────────────── */}
      {tab === "users" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Passengers",
                value: userList.filter((u: UserProfile) => u.accountType === "user").length,
                color: "text-foreground",
              },
              {
                label: "Drivers",
                value: userList.filter((u: UserProfile) => u.accountType === "driver").length,
                color: "text-blue-400",
              },
              {
                label: "Banned",
                value: userList.filter((u: UserProfile) => u.isBanned).length,
                color: "text-destructive",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center">
                <p
                  className={cn("text-2xl font-black", color)}
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {value}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone…"
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex rounded-xl border border-input overflow-hidden bg-background shrink-0">
              {(["all", "user", "driver", "admin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    "px-3 h-10 text-xs capitalize transition-colors",
                    roleFilter === r
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {users === undefined ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      {[
                        "Name / Email",
                        "Phone",
                        "Role",
                        "Joined",
                        "Status",
                        "AI Key",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filtered.map((u: UserProfile) => {
                      const isPending = pending === u.userId;
                      const isMe = u.userId === profile?.userId;
                      const hasAIAccess = allowlistSet.has(u.userId);
                      return (
                        <tr
                          key={u._id}
                          className={cn(
                            "hover:bg-muted/20 transition-colors",
                            u.isBanned && "opacity-60 bg-destructive/5"
                          )}
                        >
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-foreground text-sm">
                              {u.fullName ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {u.email ?? u.userId.slice(0, 16) + "…"}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-foreground">
                            {u.phone ?? "—"}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                                ROLE_COLORS[u.accountType]
                              )}
                            >
                              {u.accountType}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground text-xs">
                            {new Date(u.createdAt).toLocaleDateString("en-KE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3.5">
                            {u.isBanned ? (
                              <span className="text-xs text-destructive font-medium">Banned</span>
                            ) : (
                              <span className="text-xs text-emerald-400">Active</span>
                            )}
                          </td>
                          {/* AI Access */}
                          <td className="px-4 py-3.5">
                            <button
                              disabled={isPending || isMe}
                              onClick={() => {
                                if (hasAIAccess) {
                                  doAction(
                                    () => revokeAIMut({ userId: u.userId }),
                                    "AI access revoked",
                                    u.userId
                                  );
                                } else {
                                  doAction(
                                    () => grantAIMut({ userId: u.userId }),
                                    "AI access granted",
                                    u.userId
                                  );
                                }
                              }}
                              title={
                                hasAIAccess ? "Revoke shared AI access" : "Grant shared AI access"
                              }
                              className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors disabled:opacity-40",
                                hasAIAccess
                                  ? "bg-violet-400/10 text-violet-400 hover:bg-violet-400/20"
                                  : "bg-muted text-muted-foreground hover:bg-muted/70"
                              )}
                            >
                              {isPending ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Sparkles className="size-3" />
                              )}
                              {hasAIAccess ? "Granted" : "Grant"}
                            </button>
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              {!isMe && (
                                <>
                                  {!u.isBanned ? (
                                    <button
                                      disabled={isPending}
                                      title="Ban user"
                                      onClick={() => {
                                        const r = prompt("Ban reason (optional):");
                                        if (r === null) return;
                                        doAction(
                                          () =>
                                            banMut({ userId: u.userId, reason: r || undefined }),
                                          "User banned",
                                          u.userId
                                        );
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-amber-400/10 text-muted-foreground hover:text-amber-400 transition-colors disabled:opacity-40"
                                    >
                                      <ShieldOff className="size-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      disabled={isPending}
                                      title="Lift ban"
                                      onClick={() =>
                                        doAction(
                                          () => unbanMut({ userId: u.userId }),
                                          "Ban lifted",
                                          u.userId
                                        )
                                      }
                                      className="p-1.5 rounded-lg hover:bg-emerald-400/10 text-muted-foreground hover:text-emerald-400 transition-colors disabled:opacity-40"
                                    >
                                      <Shield className="size-3.5" />
                                    </button>
                                  )}
                                  {u.accountType !== "admin" ? (
                                    <button
                                      disabled={isPending}
                                      title="Promote to admin"
                                      onClick={() => {
                                        if (!confirm("Promote to admin?")) return;
                                        doAction(
                                          () => promoteMut({ userId: u.userId }),
                                          "Promoted to admin",
                                          u.userId
                                        );
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                                    >
                                      <Crown className="size-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      disabled={isPending}
                                      title="Revoke admin"
                                      onClick={() => {
                                        if (!confirm("Revoke admin access?")) return;
                                        doAction(
                                          () => revokeMut({ userId: u.userId }),
                                          "Admin access revoked",
                                          u.userId
                                        );
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-amber-400/10 text-muted-foreground hover:text-amber-400 transition-colors disabled:opacity-40"
                                    >
                                      <UserX className="size-3.5" />
                                    </button>
                                  )}
                                  <button
                                    disabled={isPending}
                                    title="Delete user"
                                    onClick={() => {
                                      if (!confirm("Delete permanently?")) return;
                                      doAction(
                                        () => deleteMut({ userId: u.userId }),
                                        "User deleted",
                                        u.userId
                                      );
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                                  >
                                    {isPending ? (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="size-3.5" />
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="size-7 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">No users match your filters</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB: AI ACCESS ───────────────────────────────────────── */}
      {tab === "ai" && (
        <div className="space-y-6">
          {/* Mode selectors */}
          <div className="rounded-2xl border border-violet-400/20 bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-violet-400/15 bg-violet-400/5">
              <Sparkles className="size-3.5 text-violet-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                Shared Key Access Mode — Per Role
              </p>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-400/5 border border-amber-400/15 text-xs text-amber-400">
                <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Free tier: 20 requests/day per model</p>
                  <p>
                    <strong>Off</strong> — nobody in that role uses the shared key; they must add
                    their own. <strong>All</strong> — entire role can use it (subject to device
                    check). <strong>Allowlist</strong> — only users you explicitly grant below can
                    use it.
                  </p>
                </div>
              </div>

              {modes && (
                <div className="space-y-4">
                  {(["user", "driver", "admin"] as const).map((role) => {
                    const modeKey = `${role}Mode` as "userMode" | "driverMode" | "adminMode";
                    const current = modes[modeKey] as GeminiMode;
                    const isChanging = modeChanging === role;
                    const roleCount = allowlistList.filter(
                      (e: AllowlistEntry) => e.accountType === role
                    ).length;
                    return (
                      <div key={role} className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold text-foreground capitalize">
                            {role}s
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {current === "allowlist"
                              ? `${roleCount} user${roleCount !== 1 ? "s" : ""} on allowlist`
                              : current === "all"
                                ? `All ${role}s may use the shared key (device-limited)`
                                : `No ${role}s can use the shared key`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isChanging && (
                            <Loader2 className="size-3.5 text-violet-400 animate-spin" />
                          )}
                          <ModeSelector
                            role={role}
                            currentMode={current}
                            onChange={(m) => changeMode(role, m)}
                            disabled={isChanging}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Allowlist */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Allowlist — {allowlistList.length} users granted
              </p>
            </div>

            {allowlist === undefined ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 text-primary animate-spin" />
              </div>
            ) : allowlistList.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                <Sparkles className="size-6 mx-auto mb-2 opacity-30" />
                No users on the allowlist yet. Grant access from the Users tab or switch a role to
                &quot;All&quot;.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {allowlistList.map((entry: AllowlistEntry) => {
                  const isPending = pending === entry.userId;
                  return (
                    <div key={entry._id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-8 h-8 rounded-xl bg-violet-400/10 flex items-center justify-center shrink-0">
                        <Sparkles className="size-4 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {entry.fullName ?? entry.email ?? entry.userId.slice(0, 20) + "…"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span
                            className={cn(
                              "capitalize px-1.5 py-0.5 rounded text-[10px]",
                              ROLE_COLORS[entry.accountType as keyof typeof ROLE_COLORS]
                            )}
                          >
                            {entry.accountType}
                          </span>
                          {entry.email && <span className="ml-1.5">{entry.email}</span>}
                          <span className="ml-1.5">
                            Granted{" "}
                            {new Date(entry.grantedAt).toLocaleDateString("en-KE", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          {entry.note && (
                            <span className="ml-1.5 italic text-muted-foreground/60">
                              &quot;{entry.note}&quot;
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        disabled={isPending}
                        onClick={() =>
                          doAction(
                            () => revokeAIMut({ userId: entry.userId }),
                            "Access revoked",
                            entry.userId
                          )
                        }
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        title="Revoke access"
                      >
                        {isPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <X className="size-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
