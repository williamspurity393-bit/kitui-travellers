"use client";

import React from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bus,
  Clock,
  MapPin,
  Star,
  ArrowRight,
  Loader2,
  AlertCircle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Local shape types ─────────────────────────────────────────
interface Schedule {
  _id: Id<"schedules">;
  status: string;
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  availableSeats: number;
}

interface Review {
  _id: string;
  rating: number;
  comment?: string | null;
  driverResponse?: string | null;
  createdAt: number;
}

// ─────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}
function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

export default function RouteDetailPage() {
  const params = useParams();
  const routeId = params.routeId as Id<"routes">;

  const route = useQuery(api.routes.getRoute, { routeId });
  const schedules = useQuery(api.schedules.getSchedulesByRoute, { routeId });
  const reviews = useQuery(api.reviews.getRouteReviews, { routeId, limit: 10 });

  if (route === undefined || schedules === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }
  if (!route) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="size-8 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="font-semibold text-foreground">Route not found</p>
        <Link href="/user/routes" className="text-sm text-primary hover:underline mt-2 block">
          ← Browse routes
        </Link>
      </div>
    );
  }

  // Typed lists — no implicit any in any callback
  const reviewList: Review[] = (reviews ?? []) as unknown as Review[];
  const scheduleList: Schedule[] = (schedules ?? []) as unknown as Schedule[];

  const avgRating =
    reviewList.length > 0
      ? Math.round(
          (reviewList.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviewList.length) *
            10
        ) / 10
      : null;

  const available: Schedule[] = scheduleList.filter((s: Schedule) =>
    ["scheduled", "boarding"].includes(s.status)
  );

  return (
    <div className="p-5 lg:p-8 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/user/routes"
          className="p-2 rounded-xl hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs capitalize bg-muted px-2 py-0.5 rounded-lg text-muted-foreground">
              {route.vehicleType}
            </span>
            {avgRating && (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <Star className="size-3 fill-amber-400" /> {avgRating} ({reviewList.length})
              </span>
            )}
          </div>
          <h1
            className="font-black text-xl text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {route.origin} <span className="text-muted-foreground font-normal text-base">→</span>{" "}
            {route.destination}
          </h1>
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

      {/* Info card */}
      <div className="rounded-2xl border border-border bg-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Clock, label: "Duration", value: fmtDuration(route.durationMinutes) },
          { icon: MapPin, label: "Distance", value: `${route.distanceKm}km` },
          {
            icon: Users,
            label: "Capacity",
            value: `${available.length > 0 ? available[0].totalSeats : "—"} seats`,
          },
          { icon: Bus, label: "Vehicle", value: route.vehicleType, cap: true },
        ].map(({ icon: Icon, label, value, cap }) => (
          <div key={label} className="text-center space-y-1">
            <Icon className="size-4 text-primary mx-auto" />
            <p className={cn("text-sm font-bold text-foreground", cap && "capitalize")}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Stops */}
      {route.stops.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Stops
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">{route.origin}</span>
            {(route.stops as string[]).map((stop: string) => (
              <React.Fragment key={stop}>
                <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">
                  {stop}
                </span>
              </React.Fragment>
            ))}
            <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-bold text-foreground">{route.destination}</span>
          </div>
        </div>
      )}

      {/* Amenities */}
      {route.amenities.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Amenities
          </p>
          <div className="flex flex-wrap gap-2">
            {(route.amenities as string[]).map((a: string) => (
              <span
                key={a}
                className="text-xs capitalize bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-xl font-medium"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Available schedules */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Available Departures
          </p>
        </div>
        {available.length === 0 ? (
          <div className="px-5 py-6 text-sm text-muted-foreground italic">
            No departures available at this time
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {available.map((s: Schedule) => (
              <div
                key={s._id}
                className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      s.status === "boarding" ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {s.departureTime} → {s.arrivalTime}
                    </p>
                    <p
                      className={cn(
                        "text-xs font-medium mt-0.5",
                        s.availableSeats > 0 ? "text-emerald-400" : "text-destructive"
                      )}
                    >
                      {s.availableSeats} seat{s.availableSeats !== 1 ? "s" : ""} left
                    </p>
                  </div>
                </div>
                <Link
                  href={`/user/booking/${route._id}?schedule=${s._id}`}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
                >
                  Book <ArrowRight className="size-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book all */}
      <Link
        href={`/user/booking/${route._id}`}
        className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
      >
        Book This Route <ArrowRight className="size-4" />
      </Link>

      {/* Reviews */}
      {reviewList.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Passenger Reviews
            </p>
            {avgRating && (
              <span className="flex items-center gap-1 text-sm font-bold text-amber-400">
                <Star className="size-4 fill-amber-400" /> {avgRating}
              </span>
            )}
          </div>
          <div className="divide-y divide-border/50">
            {reviewList.map((r: Review) => (
              <div key={r._id} className="px-5 py-4 space-y-1.5">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={cn(
                        "size-3.5",
                        n <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
                {r.comment && (
                  <p className="text-sm text-foreground leading-relaxed">&quot;{r.comment}&quot;</p>
                )}
                {r.driverResponse && (
                  <p className="text-xs text-primary pl-3 border-l-2 border-primary/30">
                    <span className="font-semibold">Kitui Travellers: </span>
                    {r.driverResponse}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
