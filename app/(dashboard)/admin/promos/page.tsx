"use client";

import React from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Tag,
  Plus,
  Loader2,
  X,
  Check,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function PromoModal({
  mode,
  initial,
  onClose,
}: {
  mode: "create" | "edit";
  initial?: any;
  onClose: () => void;
}) {
  const createMut = useMutation(api.admin.createPromoCode);
  const updateMut = useMutation(api.admin.updatePromoCode);
  const [f, setF] = React.useState({
    code: initial?.code ?? "",
    discountType: (initial?.discountType ?? "percentage") as "percentage" | "fixed",
    discountValue: initial?.discountValue ?? 10,
    description: initial?.description ?? "",
    maxUses: initial?.maxUses ?? "",
    expiresAt: initial?.expiresAt ? new Date(initial.expiresAt).toISOString().split("T")[0] : "",
  });
  const [saving, setSaving] = React.useState(false);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.code.trim()) {
      toast.error("Code is required");
      return;
    }
    if (!f.discountValue || Number(f.discountValue) <= 0) {
      toast.error("Discount value must be positive");
      return;
    }
    if (f.discountType === "percentage" && Number(f.discountValue) > 100) {
      toast.error("Percentage cannot exceed 100");
      return;
    }
    setSaving(true);
    try {
      const args = {
        code: f.code.toUpperCase().trim().replace(/\s+/g, ""),
        discountType: f.discountType,
        discountValue: Number(f.discountValue),
        description: f.description.trim() || undefined,
        maxUses: f.maxUses ? Number(f.maxUses) : undefined,
        expiresAt: f.expiresAt ? new Date(f.expiresAt).getTime() : undefined,
      };
      if (mode === "create") {
        await createMut(args);
        toast.success(`Promo code ${args.code} created ✓`);
      } else {
        await updateMut({ promoId: initial._id, ...args });
        toast.success("Promo code updated ✓");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="font-bold text-foreground">
            {mode === "create" ? "Create Promo Code" : `Edit ${initial?.code}`}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Code *
            </label>
            <input
              value={f.code}
              onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))}
              placeholder="SAVE20"
              required
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Description
            </label>
            <input
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="e.g. Student discount, Festive offer…"
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Type
              </label>
              <select
                value={f.discountType}
                onChange={(e) => set("discountType", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (KES)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Value {f.discountType === "percentage" ? "(%)" : "(KES)"} *
              </label>
              <input
                type="number"
                value={f.discountValue}
                onChange={(e) => set("discountValue", e.target.value)}
                min={1}
                max={f.discountType === "percentage" ? 100 : undefined}
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Max Uses
              </label>
              <input
                type="number"
                value={f.maxUses}
                onChange={(e) => set("maxUses", e.target.value)}
                min={1}
                placeholder="Unlimited"
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Expires
              </label>
              <input
                type="date"
                value={f.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPromosPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const promos = useQuery(api.admin.listPromoCodes, !isAuthenticated ? "skip" : {});

  const toggleMut = useMutation(api.admin.togglePromoCode);
  const deleteMut = useMutation(api.admin.deletePromoCode);

  const [showAdd, setShowAdd] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);
  const [pending, setPending] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile && profile.accountType !== "admin") router.replace("/dashboard");
  }, [profile, router]);

  const doToggle = async (id: Id<"promoCodes">, isActive: boolean) => {
    setPending(id);
    try {
      await toggleMut({ promoId: id, isActive });
      toast.success(isActive ? "Promo activated" : "Promo deactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(null);
    }
  };

  const doDelete = async (id: Id<"promoCodes">, code: string) => {
    if (!confirm(`Delete promo code ${code}?`)) return;
    setPending(id);
    try {
      await deleteMut({ promoId: id });
      toast.success(`${code} deleted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="p-5 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Promo Codes
          </h1>
          <p className="text-sm text-muted-foreground">
            {promos ? `${(promos as any[]).length} codes` : "Loading…"}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
        >
          <Plus className="size-4" /> Create Promo
        </button>
      </div>

      {promos === undefined ? (
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
                    "Code",
                    "Description",
                    "Discount",
                    "Used / Limit",
                    "Expires",
                    "Status",
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
                {/* FIX: cast promos to any[] so TypeScript doesn't complain about the 'p' parameter */}
                {((promos ?? []) as any[]).map((p: any) => {
                  const expired = p.expiresAt && p.expiresAt < Date.now();
                  const exhausted = p.maxUses && p.usedCount >= p.maxUses;
                  const isPend = pending === p._id;
                  return (
                    <tr
                      key={p._id}
                      className={cn(
                        "hover:bg-muted/20 transition-colors",
                        !p.isActive && "opacity-60"
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-black text-primary tracking-widest">
                          {p.code}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{p.description ?? "—"}</td>
                      <td className="px-4 py-3.5 font-semibold text-foreground">
                        {p.discountType === "percentage"
                          ? `${p.discountValue}%`
                          : `KES ${p.discountValue.toLocaleString()}`}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {p.usedCount} / {p.maxUses ?? "∞"}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {p.expiresAt ? (
                          <span className={cn(expired && "text-destructive")}>
                            {new Date(p.expiresAt).toLocaleDateString("en-KE")}
                            {expired && " (expired)"}
                          </span>
                        ) : (
                          "Never"
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            p.isActive && !expired && !exhausted
                              ? "bg-emerald-400/10 text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {!p.isActive
                            ? "Disabled"
                            : expired
                              ? "Expired"
                              : exhausted
                                ? "Exhausted"
                                : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditing(p)}
                            title="Edit"
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => doToggle(p._id, !p.isActive)}
                            disabled={isPend}
                            title="Toggle"
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                          >
                            {isPend ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : p.isActive ? (
                              <ToggleRight className="size-3.5 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="size-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => doDelete(p._id, p.code)}
                            disabled={isPend}
                            title="Delete"
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {((promos ?? []) as any[]).length === 0 && (
              <div className="text-center py-12">
                <Tag className="size-7 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">
                  No promo codes yet. Create one to offer discounts to passengers.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {(showAdd || editing) && (
        <PromoModal
          mode={editing ? "edit" : "create"}
          initial={editing}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
