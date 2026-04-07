"use client";

import React from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  Search,
  Filter,
  MessageSquare,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-3.5",
            n <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function RespondModal({ review, onClose }: { review: any; onClose: () => void }) {
  const respond = useMutation(api.reviews.respondToReview);
  const [text, setText] = React.useState(review.driverResponse ?? "");
  const [saving, setSaving] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Response cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await respond({ reviewId: review._id, response: text.trim() });
      toast.success("Response saved ✓");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-sm text-foreground">Official Response</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
        <div className="px-5 pt-4">
          <div className="p-3 rounded-xl bg-muted/40 text-sm text-foreground italic">
            "{review.comment ?? "No comment"}"
          </div>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Write an official response from Kitui Travellers…"
            className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-3">
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
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{" "}
              Save Response
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const allReviews = useQuery(api.reviews.getAllReviews, !isAuthenticated ? "skip" : {});
  const stats = useQuery(api.reviews.getReviewStats, !isAuthenticated ? "skip" : {});
  const routes = useQuery(api.routes.getActiveRoutes, !isAuthenticated ? "skip" : {});

  const verifyMut = useMutation(api.reviews.verifyReview);
  const deleteMut = useMutation(api.reviews.deleteReview);

  const [search, setSearch] = React.useState("");
  const [filterState, setFilterState] = React.useState<"all" | "verified" | "pending">("all");
  const [responding, setResponding] = React.useState<any>(null);
  const [pending, setPending] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile && profile.accountType !== "admin") router.replace("/dashboard");
  }, [profile, router]);

  // FIX: cast allReviews to any[] so TypeScript doesn't complain about the 'r' parameter
  const filtered = ((allReviews ?? []) as any[]).filter((r: any) => {
    const matchState =
      filterState === "all" ||
      (filterState === "verified" && r.isVerified) ||
      (filterState === "pending" && !r.isVerified);
    const s = search.toLowerCase();
    const matchSearch = !search || (r.comment ?? "").toLowerCase().includes(s);
    return matchState && matchSearch;
  });

  const doVerify = async (id: Id<"reviews">, isVerified: boolean) => {
    setPending(id);
    try {
      await verifyMut({ reviewId: id, isVerified });
      toast.success(isVerified ? "Review verified ✓" : "Review unverified");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(null);
    }
  };

  const doDelete = async (id: Id<"reviews">) => {
    if (!confirm("Delete this review permanently?")) return;
    setPending(id);
    try {
      await deleteMut({ reviewId: id });
      toast.success("Review deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black text-foreground"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Reviews & Ratings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Passenger feedback — verify before public display
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: (stats as any).total, color: "text-foreground" },
            { label: "Verified", value: (stats as any).verified, color: "text-emerald-400" },
            { label: "Pending", value: (stats as any).pending, color: "text-amber-400" },
            { label: "Avg. Rating", value: `${(stats as any).avgRating}★`, color: "text-primary" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center">
              <p
                className={cn("text-2xl font-black", color)}
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rating distribution */}
      {stats && (stats as any).total > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Rating Distribution
          </p>
          <div className="space-y-2">
            {((stats as any).distribution as any[]).map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16 shrink-0">
                  <span className="text-sm font-medium text-foreground">{rating}</span>
                  <Star className="size-3.5 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {count} ({percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex rounded-xl border border-input overflow-hidden bg-background">
          {(["all", "verified", "pending"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterState(f)}
              className={cn(
                "px-4 h-10 text-xs capitalize transition-colors",
                filterState === f
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      {allReviews === undefined ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl">
          <Star className="size-7 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">
            {search || filterState !== "all" ? "No reviews match your filters" : "No reviews yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r: any) => {
            const isPend = pending === r._id;
            const route = ((routes ?? []) as any[]).find((ro: any) => ro._id === r.routeId);
            return (
              <div
                key={r._id}
                className={cn(
                  "rounded-2xl border bg-card p-5 transition-opacity",
                  r.isVerified ? "border-border" : "border-amber-400/30 bg-amber-400/5",
                  isPend && "opacity-50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <StarRow rating={r.rating} />
                      {r.isVerified ? (
                        <span className="text-[10px] bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                          Pending
                        </span>
                      )}
                      {route && (
                        <span className="text-[10px] text-muted-foreground">
                          {route.origin} → {route.destination}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {r.comment ?? <em className="text-muted-foreground">No comment provided</em>}
                    </p>
                    {r.driverResponse && (
                      <div className="mt-3 pl-3 border-l-2 border-primary/40">
                        <p className="text-xs font-semibold text-primary mb-0.5">
                          Kitui Travellers Response:
                        </p>
                        <p className="text-xs text-muted-foreground">{r.driverResponse}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(r.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => doVerify(r._id, !r.isVerified)}
                      disabled={isPend}
                      title={r.isVerified ? "Unverify" : "Verify"}
                      className={cn(
                        "p-2 rounded-xl transition-colors disabled:opacity-40",
                        r.isVerified
                          ? "hover:bg-muted text-emerald-400"
                          : "hover:bg-emerald-400/10 text-muted-foreground hover:text-emerald-400"
                      )}
                    >
                      {isPend ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setResponding(r)}
                      title="Respond"
                      className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageSquare className="size-4" />
                    </button>
                    <button
                      onClick={() => doDelete(r._id)}
                      disabled={isPend}
                      title="Delete"
                      className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {responding && <RespondModal review={responding} onClose={() => setResponding(null)} />}
    </div>
  );
}
