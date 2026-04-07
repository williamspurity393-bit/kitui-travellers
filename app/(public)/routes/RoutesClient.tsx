"use client";

import React from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bus,
  Clock,
  MapPin,
  Star,
  ArrowRight,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

// ── Local shape types ─────────────────────────────────────────
interface Route {
  _id: Id<"routes">;
  name: string;
  origin: string;
  destination: string;
  vehicleType: string;
  durationMinutes: number;
  distanceKm: number;
  basePrice: number;
  stops: string[];
  amenities: string[];
}

interface Schedule {
  _id: Id<"schedules">;
  status: string;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  date?: string | null;
  price?: number | null;
}

interface Review {
  _id: string;
  rating: number;
  comment?: string | null;
  driverResponse?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────
function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}
function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

// ── Route card ────────────────────────────────────────────────
function RouteCard({ route, isAuthenticated }: { route: Route; isAuthenticated: boolean }) {
  const [showReviews, setShowReviews] = React.useState(false);

  const schedules = useQuery(api.schedules.getSchedulesByRoute, { routeId: route._id });
  const reviews = useQuery(api.reviews.getRouteReviews, { routeId: route._id, limit: 3 });

  const scheduleList: Schedule[] = (schedules ?? []) as unknown as Schedule[];
  const reviewList: Review[] = (reviews ?? []) as unknown as Review[];

  const available: Schedule[] = scheduleList.filter((s: Schedule) =>
    ["scheduled", "boarding"].includes(s.status)
  );

  const avgRating =
    reviewList.length > 0
      ? Math.round((reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length) * 10) / 10
      : null;

  const bookingHref = (scheduleId?: string) => {
    if (!isAuthenticated) {
      const dest = `/user/booking/${route._id}${scheduleId ? `?schedule=${scheduleId}` : ""}`;
      return `/auth/login?from=${encodeURIComponent(dest)}`;
    }
    return scheduleId
      ? `/user/booking/${route._id}?schedule=${scheduleId}`
      : `/user/booking/${route._id}`;
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/30">
      {/* Route header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs capitalize bg-muted px-2 py-0.5 rounded-lg text-muted-foreground">
                {route.vehicleType}
              </span>
              {avgRating && (
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <Star className="size-3 fill-amber-400" /> {avgRating}
                  <span className="text-muted-foreground">({reviewList.length})</span>
                </span>
              )}
              {schedules !== undefined && (
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-lg font-medium",
                    available.length > 0
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {available.length > 0
                    ? `${available.length} departure${available.length !== 1 ? "s" : ""} available`
                    : "No departures today"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span
                className="font-black text-xl text-foreground"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {route.origin}
              </span>
              <ArrowRight className="size-4 text-muted-foreground shrink-0" />
              <span
                className="font-black text-xl text-foreground"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {route.destination}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {fmtDuration(route.durationMinutes)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {route.distanceKm} km
              </span>
              {route.stops.length > 0 && (
                <span>
                  {route.stops.length} stop{route.stops.length !== 1 ? "s" : ""}
                </span>
              )}
              {route.amenities.length > 0 && (
                <span>
                  {route.amenities.slice(0, 2).join(", ")}
                  {route.amenities.length > 2 ? ` +${route.amenities.length - 2}` : ""}
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <p
              className="text-2xl font-black text-primary"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {fmt(route.basePrice)}
            </p>
            <p className="text-xs text-muted-foreground">per seat</p>
          </div>
        </div>

        {route.stops.length > 0 && (
          <div className="mt-3 flex items-center gap-1 flex-wrap">
            {route.stops.map((stop, i) => (
              <React.Fragment key={stop}>
                {i > 0 && <span className="text-muted-foreground/30 text-xs">→</span>}
                <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-lg text-muted-foreground">
                  {stop}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Departures */}
      <div className="border-t border-border">
        <div className="px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Calendar className="size-3.5" /> Departures
          </p>
          {schedules === undefined && (
            <Loader2 className="size-3.5 text-muted-foreground animate-spin" />
          )}
        </div>

        {schedules !== undefined && available.length === 0 ? (
          <div className="px-5 pb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Calendar className="size-4 text-muted-foreground opacity-40" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">No departures available right now</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Check back later or browse other routes
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {available.map((s: Schedule) => (
              <div
                key={s._id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    s.status === "boarding" ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {s.departureTime}
                    <span className="mx-1.5 text-muted-foreground font-normal">→</span>
                    {s.arrivalTime}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        s.availableSeats > 5
                          ? "text-emerald-400"
                          : s.availableSeats > 0
                            ? "text-amber-400"
                            : "text-destructive"
                      )}
                    >
                      <Users className="size-3 inline mr-0.5" />
                      {s.availableSeats} seat{s.availableSeats !== 1 ? "s" : ""} left
                    </span>
                    {s.status === "boarding" && (
                      <span className="text-xs text-amber-400 font-medium">Boarding now</span>
                    )}
                    {s.date && <span className="text-xs text-muted-foreground">{s.date}</span>}
                    {s.price && s.price !== route.basePrice && (
                      <span className="text-xs font-bold text-primary">{fmt(s.price)}</span>
                    )}
                  </div>
                </div>
                <Link
                  href={bookingHref(s._id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
                    s.availableSeats > 0
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                      : "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                  )}
                >
                  Book <ArrowRight className="size-3" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {available.length > 0 && (
          <div className="px-5 pb-4 pt-1">
            <Link
              href={bookingHref()}
              className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transition-colors"
            >
              <Bus className="size-3.5" /> Choose your own departure
            </Link>
          </div>
        )}
      </div>

      {/* Reviews */}
      {reviewList.length > 0 && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowReviews((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Star className="size-3.5 text-amber-400 fill-amber-400" />
              {avgRating} · {reviewList.length} review{reviewList.length !== 1 ? "s" : ""}
            </span>
            {showReviews ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
          {showReviews && (
            <div className="px-5 pb-4 space-y-3 border-t border-border/50 pt-3">
              {reviewList.map((r) => (
                <div key={r._id} className="space-y-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn(
                          "size-3",
                          n <= r.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      &quot;{r.comment}&quot;
                    </p>
                  )}
                  {r.driverResponse && (
                    <p className="text-xs text-primary pl-2 border-l border-primary/30">
                      <span className="font-semibold">KT: </span>
                      {r.driverResponse}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function RoutesClient() {
  const { isAuthenticated } = useConvexAuth();
  const searchParams = useSearchParams();

  // ── Read URL params on mount — this is the key fix ───────────
  // When the hero search bar navigates to /routes?from=Kitui&to=Nairobi,
  // these values pre-populate the filter inputs immediately.
  const [search, setSearch] = React.useState(() => {
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    // Combine from + to into a single search string so the existing
    // origin/destination filter picks them both up
    return [from, to].filter(Boolean).join(" ");
  });
  const [vehicleType, setVehicleType] = React.useState("all");
  const [maxPrice, setMaxPrice] = React.useState("");

  // Keep a human-readable label when arriving from the search bar
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  const hasFilter = !!(fromParam || toParam);

  const routes = useQuery(api.routes.getActiveRoutes, {
    vehicleType: vehicleType !== "all" ? vehicleType : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  });

  const routeList: Route[] = (routes ?? []) as unknown as Route[];

  const filtered: Route[] = routeList.filter((r: Route) => {
    if (!search.trim()) return true;
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    return terms.every(
      (term) =>
        r.origin.toLowerCase().includes(term) ||
        r.destination.toLowerCase().includes(term) ||
        r.name.toLowerCase().includes(term)
    );
  });

  const clearFilter = () => {
    setSearch("");
    // Also clear URL params without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete("from");
    url.searchParams.delete("to");
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1
          className="text-3xl font-black text-foreground"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {hasFilter && fromParam && toParam
            ? `${fromParam} → ${toParam}`
            : hasFilter && fromParam
              ? `From ${fromParam}`
              : hasFilter && toParam
                ? `To ${toParam}`
                : "Our Routes"}
        </h1>
        <p className="text-muted-foreground text-sm">
          Book your seat online — fast, simple, M-Pesa payment
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by city or route name…"
            className="w-full h-11 pl-9 pr-9 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button
              onClick={clearFilter}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All types</option>
          {["bus", "minibus", "matatu", "coach"].map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max price (KES)"
          className="h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-40"
        />
      </div>

      {/* Active filter pill */}
      {hasFilter && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtered:</span>
          {fromParam && (
            <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-medium">
              From: {fromParam}
            </span>
          )}
          {toParam && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-400/10 text-blue-400 border border-blue-400/20 px-2.5 py-1 rounded-full font-medium">
              To: {toParam}
            </span>
          )}
          <button
            onClick={clearFilter}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors ml-1"
          >
            <X className="size-3" /> Clear
          </button>
        </div>
      )}

      {/* Results */}
      {routes === undefined ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl">
          <Bus className="size-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-muted-foreground">
            {search ? `No routes found for "${search}"` : "No routes available"}
          </p>
          {search && (
            <button onClick={clearFilter} className="mt-3 text-sm text-primary hover:underline">
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {filtered.length} route{filtered.length !== 1 ? "s" : ""}
          </p>
          {filtered.map((r: Route) => (
            <RouteCard key={r._id} route={r} isAuthenticated={isAuthenticated} />
          ))}
        </div>
      )}
    </div>
  );
}
