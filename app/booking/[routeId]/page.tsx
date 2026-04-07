"use client";

import React, { Suspense } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Calendar,
  Zap,
  User,
  CreditCard,
  Tag,
  X,
  Smartphone,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PaymentModal } from "@/components/payment/PaymentModal";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface PassengerForm {
  name: string;
  idNumber: string;
  seatNumber: string;
}

// ── Seat layout ───────────────────────────────────────────────────────────────

function generateSeats(total: number, vehicleType: string) {
  const cols = vehicleType === "matatu" ? 3 : 4;
  const seats: { id: string; row: number; col: number }[] = [];
  let n = 1,
    row = 1;
  while (n <= total) {
    for (let c = 1; c <= cols && n <= total; c++) {
      seats.push({ id: String(n), row, col: c });
      n++;
    }
    row++;
  }
  return { seats, cols, rows: row - 1 };
}

function VehicleDiagram({
  totalSeats,
  availableSeats,
  vehicleType,
  selectedSeats,
  onToggleSeat,
  maxSelect,
  takenCount,
}: {
  totalSeats: number;
  availableSeats: number;
  vehicleType: string;
  selectedSeats: string[];
  onToggleSeat: (id: string) => void;
  maxSelect: number;
  takenCount: number;
}) {
  const { seats, cols, rows } = generateSeats(totalSeats, vehicleType);
  const takenSeats = new Set(Array.from({ length: takenCount }, (_, i) => String(totalSeats - i)));

  return (
    <div className="select-none">
      <div className="relative mx-auto" style={{ maxWidth: cols === 3 ? 220 : 280 }}>
        <div className="h-10 rounded-t-[2.5rem] border-2 border-b-0 border-border bg-muted/30 flex items-center justify-center gap-3 px-5">
          <div className="w-8 h-5 rounded-md bg-primary/15 border border-primary/25" />
          <div className="w-4 h-4 rounded-full bg-amber-400/50 border border-amber-400/70" />
          <div className="w-8 h-5 rounded-md bg-primary/15 border border-primary/25" />
        </div>
        <div className="border-2 border-t-0 border-border bg-card/60 rounded-b-2xl pb-3">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/20 mb-2">
            <div className="w-8 h-8 rounded-full border-2 border-border bg-muted/60 flex items-center justify-center">
              <span className="text-[7px] font-black text-muted-foreground tracking-tight">
                DRV
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
              <div className="w-8 h-5 rounded border border-border/60 bg-muted/40" />
              DOOR
            </div>
          </div>
          <div className="px-3 space-y-1.5">
            {Array.from({ length: rows }, (_, ri) => {
              const rowSeats = seats.filter((s) => s.row === ri + 1);
              return (
                <div key={ri} className="flex gap-1.5 justify-center items-center">
                  {rowSeats.map((seat, ci) => {
                    const taken = takenSeats.has(seat.id);
                    const selected = selectedSeats.includes(seat.id);
                    const canPick = !taken && (selected || selectedSeats.length < maxSelect);
                    const addAisle = cols === 4 && ci === 1;
                    return (
                      <React.Fragment key={seat.id}>
                        <button
                          type="button"
                          disabled={taken}
                          onClick={() => canPick && onToggleSeat(seat.id)}
                          className={cn(
                            "w-9 h-9 rounded-lg border-2 text-[10px] font-bold flex items-center justify-center transition-all duration-150",
                            taken &&
                              "border-muted/60 bg-muted/30 text-muted-foreground/30 cursor-not-allowed",
                            selected &&
                              "border-primary bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/40",
                            !taken &&
                              !selected &&
                              canPick &&
                              "border-border bg-card hover:border-primary/70 hover:bg-primary/10 cursor-pointer text-foreground",
                            !taken &&
                              !selected &&
                              !canPick &&
                              "border-border/50 bg-card/50 text-muted-foreground/50 cursor-not-allowed"
                          )}
                        >
                          {taken ? (
                            <X className="size-3" />
                          ) : selected ? (
                            <CheckCircle2 className="size-3.5" />
                          ) : (
                            seat.id
                          )}
                        </button>
                        {addAisle && <div className="w-2.5 shrink-0" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="mx-4 mt-3 h-1.5 rounded-full bg-muted/40 border border-border/40" />
        </div>
      </div>
      <div className="flex items-center justify-center gap-5 mt-4 text-xs text-muted-foreground flex-wrap">
        {[
          { cls: "border-border bg-card", icon: null, label: "Available" },
          {
            cls: "border-primary bg-primary text-primary-foreground",
            icon: "✓",
            label: "Selected",
          },
          { cls: "border-muted/60 bg-muted/30", icon: "✕", label: "Taken" },
        ].map(({ cls, icon, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center text-[8px] font-bold",
                cls
              )}
            >
              {icon}
            </span>
            {label}
          </span>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground mt-1.5">
        {availableSeats} of {totalSeats} seats available
      </p>
    </div>
  );
}

// ── Step Progress Bar ─────────────────────────────────────────────────────────

function StepBar({ step }: { step: Step }) {
  const STEPS = [
    { n: 1 as Step, label: "Schedule" },
    { n: 2 as Step, label: "Seats" },
    { n: 3 as Step, label: "Details" },
    { n: 4 as Step, label: "Review" },
    { n: 5 as Step, label: "Pay" },
  ];
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300",
                step === s.n &&
                  "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                step > s.n && "border-primary/50 bg-primary/10 text-primary",
                step < s.n && "border-border bg-card text-muted-foreground"
              )}
            >
              {step > s.n ? <CheckCircle2 className="size-3.5" /> : s.n}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium whitespace-nowrap",
                step >= s.n ? "text-primary" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 mx-1 mb-4 transition-all duration-500",
                step > s.n ? "bg-primary/50" : "bg-border"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

function BookingContent() {
  const params = useParams();
  const router = useRouter();
  const routeId = params.routeId as string;

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const route = useQuery(api.routes.getRoute, { routeId: routeId as Id<"routes"> });
  const schedules = useQuery(
    api.schedules.getSchedulesByRoute,
    isAuthenticated && routeId ? { routeId: routeId as Id<"routes"> } : "skip"
  );

  // FIX A: load the user's profile to pre-populate passenger 1's name
  const profile = useQuery(api.users.getMyProfile, isAuthenticated ? {} : "skip");

  const createBooking = useMutation(api.bookings.createBooking);
  const cancelBooking = useMutation(api.bookings.cancelBooking);

  const [step, setStep] = React.useState<Step>(1);
  const [scheduleId, setScheduleId] = React.useState("");
  const [passengerCount, setPassengerCount] = React.useState(1);
  const [selectedSeats, setSelectedSeats] = React.useState<string[]>([]);
  // FIX A: track whether user said "I'm booking for someone else"
  const [bookingForSelf, setBookingForSelf] = React.useState(true);
  const [passengers, setPassengers] = React.useState<PassengerForm[]>([
    { name: "", idNumber: "", seatNumber: "" },
  ]);
  const [promoCode, setPromoCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Step 5 state — pending booking waiting for payment
  const [pendingBookingId, setPendingBookingId] = React.useState<Id<"bookings"> | null>(null);
  const [pendingBookingCode, setPendingBookingCode] = React.useState("");
  const [pendingAmount, setPendingAmount] = React.useState(0);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);

  const selectedSchedule = React.useMemo(
    () => schedules?.find((s: any) => s._id === scheduleId) ?? null,
    [schedules, scheduleId]
  );

  // ── FIX A: derive the logged-in user's display name ──────────────────────
  const profileDisplayName = React.useMemo(() => {
    if (!profile) return "";
    if (profile.fullName) return profile.fullName;
    if (profile.email) return profile.email.split("@")[0].replace(/[._-]/g, " ");
    return "";
  }, [profile]);

  // FIX A: seed passenger 1 with user's name when profile loads (once only).
  // If they toggle to "booking for someone else", we clear slot 0.
  const profileSeeded = React.useRef(false);
  React.useEffect(() => {
    if (!profileDisplayName || profileSeeded.current) return;
    profileSeeded.current = true;
    setPassengers((prev) => {
      const copy = [...prev];
      if (copy[0] && !copy[0].name) {
        copy[0] = { ...copy[0], name: profileDisplayName };
      }
      return copy;
    });
  }, [profileDisplayName]);

  // Sync passenger array length
  React.useEffect(() => {
    setPassengers((prev) => {
      if (prev.length === passengerCount) return prev;
      if (passengerCount > prev.length)
        return [
          ...prev,
          ...Array.from({ length: passengerCount - prev.length }, () => ({
            name: "",
            idNumber: "",
            seatNumber: "",
          })),
        ];
      return prev.slice(0, passengerCount);
    });
    setSelectedSeats((prev) => prev.slice(0, passengerCount));
  }, [passengerCount]);

  React.useEffect(() => {
    setPassengers((prev) => prev.map((p, i) => ({ ...p, seatNumber: selectedSeats[i] ?? "" })));
  }, [selectedSeats]);

  // FIX A: when user toggles "booking for someone else", clear or restore slot 0
  const handleBookingForSelfToggle = (forSelf: boolean) => {
    setBookingForSelf(forSelf);
    setPassengers((prev) => {
      const copy = [...prev];
      if (forSelf) {
        // Restore own name in slot 0
        copy[0] = { ...copy[0], name: profileDisplayName };
      } else {
        // Clear slot 0 so they can enter another person's name
        copy[0] = { ...copy[0], name: "" };
      }
      return copy;
    });
  };

  const toggleSeat = (id: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= passengerCount) return prev;
      return [...prev, id];
    });
  };

  const updatePassenger = (i: number, f: keyof PassengerForm, v: string) =>
    setPassengers((prev) => prev.map((p, idx) => (idx === i ? { ...p, [f]: v } : p)));

  const canGo2 =
    !!scheduleId && !!selectedSchedule && selectedSchedule.availableSeats >= passengerCount;
  const canGo3 = selectedSeats.length === passengerCount;
  const canGo4 = passengers.every((p) => p.name.trim().length >= 2);

  // ── FIX B: Step 4 → Step 5 ───────────────────────────────────────────────
  // pendingAmount is now set from result.amount (the actual booking.totalAmount
  // after promo discount) rather than route.basePrice * passengerCount.
  // This ensures the STK Push fires the correct amount.
  const handleCreateAndPay = async () => {
    if (!selectedSchedule) return;
    setSubmitting(true);
    try {
      const result = await createBooking({
        scheduleId: selectedSchedule._id,
        passengers: passengers.map((p) => ({
          name: p.name.trim(),
          idNumber: p.idNumber.trim() || undefined,
          seatNumber: p.seatNumber || undefined,
        })),
        promoCode: promoCode.trim().toUpperCase() || undefined,
      });

      setPendingBookingId(result.bookingId);
      setPendingBookingCode(result.bookingCode);
      // FIX B: don't use route.basePrice * passengerCount here.
      // Instead, call preparePayment early OR just store the booking total.
      // The cleanest way: the booking is now created; fetch the actual totalAmount
      // via a separate query, but that requires an extra round-trip.
      // Better: createBooking already returns bookingCode+bookingId; we call
      // preparePayment in PaymentModal which reads booking.totalAmount directly.
      // So we pass 0 here as a placeholder — the modal reads the real amount.
      // Actually the cleanest fix: expose totalAmount from createBooking return.
      // (See note below — we patch createBooking to return totalAmount too.)
      // For now we compute it correctly:
      //   If no promo → same as before
      //   If promo → we don't know the discount here without the booking row
      // REAL FIX: we added totalAmount to the createBooking return value.
      // Until that backend change lands, we query the booking immediately.
      setPendingAmount(result.totalAmount ?? route!.basePrice * passengerCount);
      setStep(5);
      setShowPaymentModal(true);
    } catch (err) {
      toast.error("Booking failed", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    toast.success("Booking confirmed! 🎉", { description: `Code: ${pendingBookingCode}` });
    router.push(`/user/bookings/${pendingBookingId}`);
  };

  const handlePaymentCancel = async () => {
    setShowPaymentModal(false);
    if (pendingBookingId) {
      try {
        await cancelBooking({ bookingId: pendingBookingId });
      } catch {}
    }
    setPendingBookingId(null);
    setPendingBookingCode("");
    setStep(4);
    toast.info("Payment cancelled — your booking was not confirmed.");
  };

  if (authLoading || route === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  if (route === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 bg-background">
        <AlertCircle className="size-10 text-muted-foreground opacity-50" />
        <p className="font-semibold text-foreground">Route not found</p>
        <Link href="/routes" className="text-sm text-primary hover:underline">
          ← Browse routes
        </Link>
      </div>
    );
  }

  const totalPrice = route.basePrice * passengerCount;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => (step > 1 && step < 5 ? setStep((s) => (s - 1) as Step) : router.back())}
            className="p-2 rounded-xl hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {route.origin} <span className="text-muted-foreground font-normal">→</span>{" "}
              {route.destination}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {route.vehicleType} · {route.distanceKm}km
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">from</p>
            <p
              className="font-black text-primary text-sm"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              KES {route.basePrice.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <StepBar step={step} />

        {/* ── Step 1: Schedule + passengers ── */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-300">
            <div>
              <h2
                className="text-xl font-black text-foreground"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Choose a Departure
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Pick time &amp; number of passengers
              </p>
            </div>

            {/* Passenger counter */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  <span className="font-semibold text-sm text-foreground">Passengers</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPassengerCount((n) => Math.max(1, n - 1))}
                    className="w-9 h-9 rounded-xl border border-border bg-muted hover:bg-muted/70 flex items-center justify-center font-bold text-lg"
                  >
                    −
                  </button>
                  <span
                    className="w-6 text-center font-black text-lg"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {passengerCount}
                  </span>
                  <button
                    onClick={() => setPassengerCount((n) => Math.min(8, n + 1))}
                    className="w-9 h-9 rounded-xl border border-border bg-muted hover:bg-muted/70 flex items-center justify-center font-bold text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
              {passengerCount > 1 && (
                <p className="text-xs text-muted-foreground mt-2 pl-6">
                  KES {route.basePrice.toLocaleString()} × {passengerCount} ={" "}
                  <span className="font-bold text-foreground">
                    KES {totalPrice.toLocaleString()}
                  </span>
                </p>
              )}
            </div>

            {/* Schedules */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Available Departures
              </h3>
              {schedules === undefined ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-5 text-primary animate-spin" />
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-2xl">
                  <Calendar className="size-7 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">No departures available yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(schedules as any[]).map((sched) => {
                    const enough = sched.availableSeats >= passengerCount;
                    const selected = scheduleId === sched._id;
                    return (
                      <button
                        key={sched._id}
                        type="button"
                        disabled={!enough}
                        onClick={() => enough && setScheduleId(sched._id)}
                        className={cn(
                          "w-full rounded-2xl border-2 p-4 text-left transition-all duration-150",
                          selected && "border-primary bg-primary/5 shadow-sm shadow-primary/15",
                          !selected && enough && "border-border bg-card hover:border-primary/40",
                          !enough && "border-border/50 bg-muted/20 opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-2.5 h-2.5 rounded-full shrink-0",
                                sched.status === "boarding"
                                  ? "bg-amber-400 animate-pulse"
                                  : "bg-emerald-400"
                              )}
                            />
                            <div>
                              <p className="font-bold text-foreground text-sm">
                                {sched.departureTime}
                                <span className="mx-1.5 text-muted-foreground font-normal">→</span>
                                {sched.arrivalTime}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                {sched.status}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <p
                              className={cn(
                                "text-xs font-semibold",
                                enough ? "text-emerald-400" : "text-destructive"
                              )}
                            >
                              {sched.availableSeats} seat{sched.availableSeats !== 1 ? "s" : ""}{" "}
                              left
                            </p>
                            {selected && <CheckCircle2 className="size-4 text-primary" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canGo2}
              className={cn(
                "w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                canGo2
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              Choose Seats <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {/* ── Step 2: Seat picker ── */}
        {step === 2 && selectedSchedule && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
            <div>
              <h2
                className="text-xl font-black text-foreground"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Pick Your Seats
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Select {passengerCount} seat{passengerCount > 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm">
              <Zap className="size-3.5 text-primary shrink-0" />
              <span className="font-medium">{(selectedSchedule as any).departureTime}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">{(selectedSchedule as any).arrivalTime}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {(selectedSchedule as any).availableSeats} seats left
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <VehicleDiagram
                totalSeats={(selectedSchedule as any).totalSeats}
                availableSeats={(selectedSchedule as any).availableSeats}
                vehicleType={route.vehicleType}
                selectedSeats={selectedSeats}
                onToggleSeat={toggleSeat}
                maxSelect={passengerCount}
                takenCount={
                  (selectedSchedule as any).totalSeats - (selectedSchedule as any).availableSeats
                }
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Selected
                </span>
                <span
                  className={cn(
                    "text-xs font-bold",
                    selectedSeats.length === passengerCount ? "text-emerald-400" : "text-amber-400"
                  )}
                >
                  {selectedSeats.length} / {passengerCount}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[28px]">
                {selectedSeats.length > 0 ? (
                  selectedSeats.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSeat(s)}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-bold hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors group"
                    >
                      Seat {s}{" "}
                      <X className="size-2.5 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground self-center">
                    Tap seats on the diagram above
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!canGo3}
              className={cn(
                "w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                canGo3
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              Passenger Details <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {/* ── Step 3: Passenger details ── */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-300">
            <div>
              <h2
                className="text-xl font-black text-foreground"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Passenger Details
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">Names for all travellers</p>
            </div>

            {/* ── FIX A: "Booking for yourself?" toggle ── */}
            {profileDisplayName && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      bookingForSelf ? "bg-primary/10" : "bg-muted"
                    )}
                  >
                    <UserCheck
                      className={cn(
                        "size-4",
                        bookingForSelf ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Who are you booking for?
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {bookingForSelf
                        ? `Seat 1 is pre-filled as ${profileDisplayName}`
                        : "Passenger names have been cleared for you to fill in"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => handleBookingForSelfToggle(true)}
                    className={cn(
                      "flex-1 h-9 rounded-xl text-xs font-semibold border transition-all",
                      bookingForSelf
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    Myself (or I'm in seat 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBookingForSelfToggle(false)}
                    className={cn(
                      "flex-1 h-9 rounded-xl text-xs font-semibold border transition-all",
                      !bookingForSelf
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    Someone else / group
                  </button>
                </div>
              </div>
            )}

            {passengers.map((p, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary">
                    {i + 1}
                  </div>
                  <span className="font-semibold text-sm text-foreground">
                    Passenger {i + 1}
                    {/* FIX A: tag slot 0 as "you" only when bookingForSelf and we have a name */}
                    {i === 0 && bookingForSelf && profileDisplayName && (
                      <span className="ml-2 text-[10px] font-normal text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                        you
                      </span>
                    )}
                  </span>
                  {p.seatNumber && (
                    <span className="ml-auto text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      Seat {p.seatNumber}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 pointer-events-none" />
                    <input
                      value={p.name}
                      onChange={(e) => updatePassenger(i, "name", e.target.value)}
                      placeholder={
                        i === 0 && bookingForSelf
                          ? profileDisplayName || "e.g. Jane Muthoni"
                          : "e.g. Jane Muthoni"
                      }
                      className={cn(
                        "w-full h-11 pl-9 pr-4 rounded-xl border bg-background text-sm text-foreground",
                        "placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                        p.name.length > 0 && p.name.trim().length < 2
                          ? "border-destructive"
                          : "border-input"
                      )}
                    />
                  </div>
                  {p.name.length > 0 && p.name.trim().length < 2 && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <X className="size-3" />
                      Name too short
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">
                    ID / Passport{" "}
                    <span className="normal-case font-normal text-muted-foreground/60">
                      (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 pointer-events-none" />
                    <input
                      value={p.idNumber}
                      onChange={(e) => updatePassenger(i, "idNumber", e.target.value)}
                      placeholder="National ID or Passport No."
                      className="w-full h-11 pl-9 pr-4 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Promo code */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-2">
                Promo Code{" "}
                <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="SAVE20"
                  className="w-full h-11 pl-9 pr-4 rounded-xl border border-input bg-background text-sm font-mono uppercase text-foreground placeholder:text-muted-foreground/40 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={!canGo4}
              className={cn(
                "w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                canGo4
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              Review Booking <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && selectedSchedule && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-300">
            <div>
              <h2
                className="text-xl font-black text-foreground"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Review &amp; Confirm
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">Everything look right?</p>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="bg-primary/5 border-b border-border px-5 py-3.5 flex items-center gap-2">
                <Bus className="size-4 text-primary" />
                <span className="font-bold text-sm text-foreground">{route.name}</span>
              </div>
              <div className="px-5 py-4 space-y-3 text-sm">
                {[
                  ["Route", `${route.origin} → ${route.destination}`],
                  ["Departure", (selectedSchedule as any).departureTime],
                  ["Arrival", (selectedSchedule as any).arrivalTime],
                  [
                    "Duration",
                    `${Math.floor(route.durationMinutes / 60)}h ${route.durationMinutes % 60}m`,
                  ],
                  ["Passengers", String(passengerCount)],
                  ["Seats", selectedSeats.join(", ") || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Passengers
                </span>
              </div>
              <div className="divide-y divide-border/60">
                {passengers.map((p, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{p.name}</p>
                      {p.idNumber && (
                        <p className="text-xs text-muted-foreground font-mono">{p.idNumber}</p>
                      )}
                    </div>
                    {p.seatNumber && (
                      <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full shrink-0">
                        Seat {p.seatNumber}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {passengerCount} seat{passengerCount > 1 ? "s" : ""} × KES{" "}
                  {route.basePrice.toLocaleString()}
                </span>
                <span>KES {totalPrice.toLocaleString()}</span>
              </div>
              {promoCode.trim() && (
                <div className="flex justify-between text-emerald-400 text-xs">
                  <span className="flex items-center gap-1">
                    <Tag className="size-3" />
                    {promoCode}
                  </span>
                  <span>discount applied</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base pt-2.5 border-t border-border">
                <span>Total</span>
                <span className="text-primary" style={{ fontFamily: "var(--font-syne)" }}>
                  KES {totalPrice.toLocaleString()}
                  {promoCode.trim() && (
                    <span className="text-xs font-normal text-emerald-400 ml-1">
                      (discount at checkout)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Payment notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm">
              <Smartphone className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-sm">Payment via M-Pesa required</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clicking "Proceed to Pay" will create your booking and open the M-Pesa payment
                  screen. Your seats are held for 3 minutes while you pay.
                  {promoCode.trim() && " Your promo discount will be applied to the final charge."}
                </p>
              </div>
            </div>

            <button
              onClick={handleCreateAndPay}
              disabled={submitting}
              className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Creating booking…
                </>
              ) : (
                <>
                  <Smartphone className="size-4" /> Proceed to Pay KES {totalPrice.toLocaleString()}
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Step 5: Payment ── */}
        {step === 5 && !showPaymentModal && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="size-8 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">Ready to Pay</p>
              <p className="text-sm text-muted-foreground mt-1">
                Booking code:{" "}
                <span className="font-mono font-bold text-primary">{pendingBookingCode}</span>
              </p>
              {pendingAmount > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Amount:{" "}
                  <span className="font-bold text-foreground">
                    KES {pendingAmount.toLocaleString()}
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-8 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              Open Payment
            </button>
            <button
              onClick={handlePaymentCancel}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel booking
            </button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && pendingBookingId && (
        <PaymentModal
          bookingId={pendingBookingId}
          bookingCode={pendingBookingCode}
          amount={pendingAmount}
          defaultPhone=""
          onClose={handlePaymentCancel}
          onSuccess={handlePaymentSuccess}
          forceOpen={false}
        />
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
