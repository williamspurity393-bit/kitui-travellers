"use client";

import React from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bus,
  MapPin,
  Clock,
  Users,
  CreditCard,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  Check,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

// Placeholder QR — TODO: replace with react-qr-code
function BookingQR({ code }: { code: string }) {
  const chars = code.split("");
  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-border shadow-sm">
      <div className="w-36 h-36 grid grid-cols-8 gap-px bg-white rounded-xl overflow-hidden">
        {Array.from({ length: 64 }).map((_, i) => {
          const cv = chars[i % chars.length]?.charCodeAt(0) ?? 0;
          return (
            <div key={i} className={(cv * (i + 1) * 7) % 17 < 9 ? "bg-gray-900" : "bg-white"} />
          );
        })}
      </div>
      <p className="font-mono text-sm font-black text-gray-900 tracking-widest">{code}</p>
      <p className="text-[10px] text-gray-500 text-center">Show to conductor at boarding</p>
    </div>
  );
}

function ReviewModal({
  bookingId,
  bookingCode,
  onClose,
}: {
  bookingId: Id<"bookings">;
  bookingCode: string;
  onClose: () => void;
}) {
  const createReview = useMutation(api.reviews.createReview);
  const [rating, setRating] = React.useState(5);
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createReview({ bookingId, rating, comment: comment.trim() || undefined });
      toast.success("Review submitted ✓");
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
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground text-sm">Rate Your Journey</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">
            Booking <span className="font-mono font-bold text-foreground">{bookingCode}</span>
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "size-8 transition-colors",
                    n <= (hover || rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-xs font-medium text-muted-foreground">
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Share your experience…"
            className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Star className="size-4" />}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_CFG = {
  pending: {
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    label: "Pending Payment",
  },
  confirmed: {
    icon: CheckCircle2,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    label: "Confirmed",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    label: "Completed",
  },
  cancelled: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted", label: "Cancelled" },
  refunded: {
    icon: AlertCircle,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    label: "Refunded",
  },
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  const bookingId = params.bookingId as Id<"bookings">;
  const booking = useQuery(
    api.bookings.getBookingDetail,
    !isAuthenticated ? "skip" : { bookingId }
  );
  const existing = useQuery(
    api.reviews.getReviewForBooking,
    !isAuthenticated ? "skip" : { bookingId }
  );
  const cancelMut = useMutation(api.bookings.cancelBooking);
  const [cancelling, setCancelling] = React.useState(false);
  const [showReview, setShowReview] = React.useState(false);

  if (booking === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }
  if (!booking) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="size-8 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="font-semibold text-foreground">Booking not found</p>
        <Link href="/user/bookings" className="text-sm text-primary hover:underline mt-2 block">
          ← Back to bookings
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CFG[booking.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
  const StatusIcon = statusCfg.icon;
  const schedule = (booking as any).schedule;
  const route = (booking as any).route;

  const doCancel = async () => {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(true);
    try {
      await cancelMut({ bookingId });
      toast.success("Booking cancelled");
      router.push("/user/bookings");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="p-5 lg:p-8 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/user/bookings"
          className="p-2 rounded-xl hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-black text-primary text-lg">{booking.bookingCode}</span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
                statusCfg.bg,
                statusCfg.color
              )}
            >
              <StatusIcon className="size-3" /> {statusCfg.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(booking.createdAt).toLocaleString("en-KE", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* QR code — show for confirmed/completed */}
      {["confirmed", "completed"].includes(booking.status) && (
        <div className="flex justify-center">
          <BookingQR code={booking.bookingCode} />
        </div>
      )}

      {/* Route + schedule */}
      {route && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="bg-primary/5 border-b border-border px-5 py-3.5 flex items-center gap-2">
            <Bus className="size-4 text-primary" />
            <span className="font-bold text-sm text-foreground">{route.name}</span>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: "From", value: route.origin, icon: MapPin },
              { label: "To", value: route.destination, icon: MapPin },
              schedule && { label: "Departure", value: schedule.departureTime, icon: Clock },
              schedule && { label: "Arrival", value: schedule.arrivalTime, icon: Clock },
              {
                label: "Duration",
                value: `${Math.floor(route.durationMinutes / 60)}h ${route.durationMinutes % 60}m`,
                icon: Clock,
              },
            ]
              .filter(Boolean)
              .map((row: any) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-3 text-sm">
                    <Icon className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground w-20">{row.label}</span>
                    <span className="font-medium text-foreground">{row.value}</span>
                  </div>
                );
              })}
            {/* Link to route detail */}
            <Link
              href={`/user/routes/${route._id}`}
              className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              View full route details →
            </Link>
          </div>
        </div>
      )}

      {/* Passengers */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Users className="size-3.5" /> Passengers
          </p>
        </div>
        <div className="divide-y divide-border/50">
          {booking.passengers.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{p.name}</p>
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

      {/* Payment */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <CreditCard className="size-3.5" /> Payment
        </p>
        {[
          { label: "Amount", value: fmt(booking.totalAmount), bold: true },
          booking.promoCode && { label: "Promo Code", value: booking.promoCode },
          booking.discountAmount && { label: "Discount", value: `-${fmt(booking.discountAmount)}` },
          { label: "Status", value: booking.paymentStatus },
          booking.paymentReference && {
            label: "M-Pesa Receipt",
            value: booking.paymentReference,
            mono: true,
            green: true,
          },
          booking.paymentMethod && { label: "Method", value: booking.paymentMethod },
        ]
          .filter(Boolean)
          .map((row: any) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span
                className={cn(
                  "font-medium",
                  row.bold && "font-black text-foreground",
                  row.mono && "font-mono",
                  row.green && "text-emerald-400"
                )}
              >
                {row.value}
              </span>
            </div>
          ))}
      </div>

      {/* Review (completed) */}
      {booking.status === "completed" && (
        <div className="rounded-2xl border border-border bg-card p-5">
          {existing ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Your Review
              </p>
              <div className="flex gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      "size-4",
                      n <= existing.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              {existing.comment && (
                <p className="text-sm text-muted-foreground">{existing.comment}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground mb-1">Rate your journey</p>
              <p className="text-xs text-muted-foreground mb-3">
                Your feedback helps other travellers
              </p>
              <button
                onClick={() => setShowReview(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/10 text-amber-400 text-sm font-bold hover:bg-amber-400/20 transition-colors"
              >
                <Star className="size-4" /> Leave a Review
              </button>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      {["pending", "confirmed"].includes(booking.status) && (
        <button
          onClick={doCancel}
          disabled={cancelling}
          className="w-full h-10 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {cancelling ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <XCircle className="size-4" />
          )}
          Cancel Booking
        </button>
      )}

      {showReview && (
        <ReviewModal
          bookingId={bookingId}
          bookingCode={booking.bookingCode}
          onClose={() => setShowReview(false)}
        />
      )}
    </div>
  );
}
