"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const VEHICLE_TYPES = ["bus", "minibus", "matatu", "coach"];
const AMENITIES_LIST = ["ac", "wifi", "charging", "tv", "toilet", "meals"];

export default function RouteEditPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = params.routeId as string;
  const isNew = routeId === "new";

  const existingRoute = useQuery(
    api.routes.getRoute,
    !isNew && routeId ? { routeId: routeId as Id<"routes"> } : "skip"
  );

  const createRoute = useMutation(api.routes.createRoute);
  const updateRoute = useMutation(api.routes.updateRoute);

  const [form, setForm] = React.useState({
    name: "",
    origin: "",
    destination: "",
    stops: [] as string[],
    distanceKm: 0,
    durationMinutes: 0,
    basePrice: 0,
    vehicleType: "bus",
    amenities: [] as string[],
    isActive: true,
  });
  const [newStop, setNewStop] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (existingRoute && !loaded) {
      setForm({
        name: existingRoute.name,
        origin: existingRoute.origin,
        destination: existingRoute.destination,
        stops: existingRoute.stops,
        distanceKm: existingRoute.distanceKm,
        durationMinutes: existingRoute.durationMinutes,
        basePrice: existingRoute.basePrice,
        vehicleType: existingRoute.vehicleType,
        amenities: existingRoute.amenities,
        isActive: existingRoute.isActive,
      });
      setLoaded(true);
    }
  }, [existingRoute, loaded]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const toggleAmenity = (a: string) =>
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  const addStop = () => {
    if (!newStop.trim()) return;
    setForm((f) => ({ ...f, stops: [...f.stops, newStop.trim()] }));
    setNewStop("");
  };
  const removeStop = (i: number) =>
    setForm((f) => ({ ...f, stops: f.stops.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.origin || !form.destination || !form.basePrice) {
      toast.error("Fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createRoute({
          name: form.name,
          origin: form.origin,
          destination: form.destination,
          stops: form.stops,
          distanceKm: Number(form.distanceKm),
          durationMinutes: Number(form.durationMinutes),
          basePrice: Number(form.basePrice),
          vehicleType: form.vehicleType,
          amenities: form.amenities,
        });
        toast.success("Route created!");
      } else {
        await updateRoute({
          routeId: routeId as Id<"routes">,
          name: form.name,
          origin: form.origin,
          destination: form.destination,
          stops: form.stops,
          distanceKm: Number(form.distanceKm),
          durationMinutes: Number(form.durationMinutes),
          basePrice: Number(form.basePrice),
          vehicleType: form.vehicleType,
          amenities: form.amenities,
          isActive: form.isActive,
        });
        toast.success("Route updated!");
      }
      router.push("/admin/routes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && existingRoute === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }
  if (!isNew && existingRoute === null) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Route not found.</p>
        <Link href="/admin/routes" className="text-primary text-sm hover:underline mt-2 block">
          ← Back
        </Link>
      </div>
    );
  }

  const inputCls =
    "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/routes"
          className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {isNew ? "Add New Route" : "Edit Route"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isNew ? "Create a new transport route" : `Editing: ${form.name}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-bold text-sm text-foreground">Basic Information</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Route Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="e.g. Kitui Express"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Origin *
              </label>
              <input
                value={form.origin}
                onChange={(e) => set("origin", e.target.value)}
                required
                placeholder="Kitui"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Destination *
              </label>
              <input
                value={form.destination}
                onChange={(e) => set("destination", e.target.value)}
                required
                placeholder="Nairobi"
                className={inputCls}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Stops (optional)
            </label>
            <div className="flex gap-2">
              <input
                value={newStop}
                onChange={(e) => setNewStop(e.target.value)}
                placeholder="Add a stop…"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStop())}
                className={inputCls}
              />
              <button
                type="button"
                onClick={addStop}
                className="px-3 h-10 rounded-xl bg-muted border border-border hover:bg-muted/70 transition-colors"
              >
                <Plus className="size-4" />
              </button>
            </div>
            {form.stops.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.stops.map((s, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeStop(i)}
                      className="hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-bold text-sm text-foreground">Route Details</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Distance (km)", key: "distanceKm", placeholder: "170" },
              { label: "Duration (min)", key: "durationMinutes", placeholder: "210" },
              { label: "Base Price (KES) *", key: "basePrice", placeholder: "700" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {label}
                </label>
                <input
                  type="number"
                  value={(form as any)[key]}
                  onChange={(e) => set(key, e.target.value)}
                  min={0}
                  placeholder={placeholder}
                  required={label.includes("*")}
                  className={inputCls}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Vehicle Type *
            </label>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("vehicleType", t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                    form.vehicleType === t
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-muted"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Amenities
            </label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition-colors",
                    form.amenities.includes(a)
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-muted"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {!isNew && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="text-sm font-medium text-foreground">Route Status</p>
                <p className="text-xs text-muted-foreground">
                  {form.isActive ? "Active and bookable" : "Disabled"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => set("isActive", !form.isActive)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-colors",
                  form.isActive
                    ? "bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >
                {form.isActive ? "Active" : "Inactive"}
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/routes"
            className="flex-1 h-11 flex items-center justify-center rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {isNew ? "Create Route" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
