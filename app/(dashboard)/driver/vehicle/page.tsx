"use client";

import React from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, Bus, AlertCircle, Check, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function DriverVehiclePage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, !isAuthenticated ? "skip" : {});
  const vehicle = useQuery(api.vehicles.getMyVehicle, !isAuthenticated ? "skip" : {});

  React.useEffect(() => {
    if (profile && profile.accountType !== "driver") router.replace("/dashboard");
  }, [profile, router]);

  if (!profile || vehicle === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  const now = Date.now();
  const serviceOverdue = vehicle?.nextMaintenanceDate && vehicle.nextMaintenanceDate < now;
  const serviceSoon =
    vehicle?.nextMaintenanceDate &&
    vehicle.nextMaintenanceDate >= now &&
    vehicle.nextMaintenanceDate < now + 7 * 86400000;

  // Cast amenities to string[] so the .map() callback is typed
  const amenities: string[] = (vehicle?.amenities ?? []) as string[];

  if (!vehicle) {
    return (
      <div className="p-5 lg:p-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            My Vehicle
          </h1>
          <p className="text-sm text-muted-foreground">No vehicle assigned to your account yet</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-2xl gap-4">
          <Bus className="size-10 text-muted-foreground opacity-40" />
          <div className="text-center">
            <p className="font-semibold text-foreground">No Vehicle Assigned</p>
            <p className="text-sm text-muted-foreground mt-1">
              Contact the admin to get a vehicle assigned to your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1
          className="text-2xl font-black text-foreground"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          My Vehicle
        </h1>
        <p className="text-sm text-muted-foreground">Vehicle details assigned to your account</p>
      </div>

      {serviceOverdue && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-destructive/20 bg-destructive/5">
          <AlertCircle className="size-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">
            Service is overdue — please notify admin immediately
          </p>
        </div>
      )}
      {serviceSoon && !serviceOverdue && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-400/20 bg-amber-400/5">
          <Wrench className="size-5 text-amber-400 shrink-0" />
          <p className="text-sm font-medium text-amber-400">Service due within 7 days</p>
        </div>
      )}

      {/* Main card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-primary/5 border-b border-border px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bus className="size-5 text-primary" />
          </div>
          <div>
            <p
              className="font-black text-lg text-foreground font-mono"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {vehicle.registrationNumber}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {vehicle.type} · {vehicle.make} {vehicle.model}
            </p>
          </div>
          <span
            className={cn(
              "ml-auto text-xs px-3 py-1 rounded-full font-medium",
              vehicle.isActive
                ? "bg-emerald-400/10 text-emerald-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            {vehicle.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="p-5 space-y-0 divide-y divide-border/50">
          {[
            { label: "Registration", value: vehicle.registrationNumber },
            { label: "Make & Model", value: `${vehicle.make} ${vehicle.model}` },
            { label: "Type", value: vehicle.type, cap: true },
            { label: "Year", value: String(vehicle.year) },
            { label: "Seat Capacity", value: `${vehicle.capacity} passengers` },
            {
              label: "Last Service",
              value: vehicle.lastMaintenanceDate
                ? new Date(vehicle.lastMaintenanceDate).toLocaleDateString("en-KE")
                : "Not recorded",
            },
            {
              label: "Next Service Due",
              value: vehicle.nextMaintenanceDate
                ? new Date(vehicle.nextMaintenanceDate).toLocaleDateString("en-KE")
                : "Not scheduled",
              highlight: serviceOverdue
                ? "text-destructive"
                : serviceSoon
                  ? "text-amber-400"
                  : undefined,
            },
          ].map(({ label, value, cap, highlight }) => (
            <div key={label} className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span
                className={cn(
                  "text-sm font-medium text-foreground",
                  cap && "capitalize",
                  highlight
                )}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Amenities */}
      {amenities.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Amenities
          </p>
          <div className="flex flex-wrap gap-2">
            {amenities.map((a: string) => (
              <span
                key={a}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-medium text-primary"
              >
                <Check className="size-3" /> {a}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Contact admin if any details are incorrect or if you need a service date updated.
      </p>
    </div>
  );
}
