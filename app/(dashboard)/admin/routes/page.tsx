"use client";

import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  Search,
  Map,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Id, Doc } from "@/convex/_generated/dataModel";

export default function AdminRoutesPage() {
  const profile = useQuery(api.users.getMyProfile);
  const router = useRouter();
  const toggleActive = useMutation(api.admin.toggleRouteActive);
  const deleteRoute = useMutation(api.routes.deleteRoute);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile && profile.accountType !== "admin") router.replace("/dashboard");
  }, [profile, router]);

  const routes = useQuery(api.admin.getAllRoutesAdmin, {
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
    search: search || undefined,
  });

  const handleToggle = async (routeId: Id<"routes">, isActive: boolean) => {
    setPendingId(routeId);
    try {
      await toggleActive({ routeId, isActive });
      toast.success(isActive ? "Route activated" : "Route deactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (routeId: Id<"routes">, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setPendingId(routeId);
    try {
      await deleteRoute({ routeId });
      toast.success("Route deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cannot delete — may have active schedules");
    } finally {
      setPendingId(null);
    }
  };

  const isLoading = routes === undefined;
  const list: Doc<"routes">[] = routes ?? [];

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Routes
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : `${list.filter((r: Doc<"routes">) => r.isActive).length} active · ${list.filter((r: Doc<"routes">) => !r.isActive).length} inactive`}
          </p>
        </div>
        <Link
          href="/admin/routes/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" /> Add Route
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search routes…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex rounded-xl border border-input overflow-hidden shrink-0">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-4 h-10 text-sm capitalize transition-colors",
                statusFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-5 h-52 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((route: Doc<"routes">) => (
            <div
              key={route._id}
              className={cn(
                "rounded-2xl border bg-card p-5 flex flex-col gap-4 transition-all",
                route.isActive
                  ? "border-border hover:border-primary/30"
                  : "border-border/50 opacity-70"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-mono mb-1 capitalize">
                    {route.vehicleType}
                  </p>
                  <h3 className="font-bold text-foreground truncate">{route.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {route.origin} → {route.destination}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xs px-2 py-0.5 rounded-full font-medium",
                    route.isActive
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {route.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center border-y border-border py-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center justify-center gap-1">
                    <Clock className="size-2.5" />
                    Duration
                  </p>
                  <p className="text-xs font-semibold text-foreground">
                    {Math.floor(route.durationMinutes / 60)}h
                    {route.durationMinutes % 60 > 0 ? ` ${route.durationMinutes % 60}m` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center justify-center gap-1">
                    <DollarSign className="size-2.5" />
                    From
                  </p>
                  <p className="text-xs font-semibold text-foreground">
                    KES {route.basePrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center justify-center gap-1">
                    <Map className="size-2.5" />
                    Stops
                  </p>
                  <p className="text-xs font-semibold text-foreground">{route.stops.length}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {route.distanceKm} km · {route.amenities.join(", ") || "No amenities"}
              </p>

              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/admin/routes/${route._id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-border text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Edit className="size-3" /> Edit
                </Link>
                <button
                  onClick={() => handleToggle(route._id, !route.isActive)}
                  disabled={pendingId === route._id}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-medium transition-colors disabled:opacity-50",
                    route.isActive
                      ? "border border-border hover:bg-muted text-muted-foreground"
                      : "border border-emerald-400/30 bg-emerald-400/5 text-emerald-400 hover:bg-emerald-400/10"
                  )}
                >
                  {pendingId === route._id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : route.isActive ? (
                    <>
                      <ToggleLeft className="size-3" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight className="size-3" />
                      Activate
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(route._id, route.name)}
                  disabled={pendingId === route._id}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}

          {list.length === 0 && (
            <div className="col-span-3 text-center py-12 border border-dashed border-border rounded-2xl">
              <Map className="size-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-3">No routes found</p>
              <Link href="/admin/routes/new" className="text-xs text-primary hover:underline">
                Add your first route →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
