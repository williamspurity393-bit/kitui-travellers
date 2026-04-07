"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import React from "react";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "refunded";

export function useMyBookings(status?: BookingStatus) {
  const { data: session, isPending } = useSession();

  // Same guard as use-profile: skip until better-auth has resolved the token.
  const bookings = useQuery(
    api.bookings.getMyBookings,
    isPending || !session?.user ? "skip" : status ? { status } : {}
  );

  const cancelMutation = useMutation(api.bookings.cancelBooking);

  const cancelBooking = React.useCallback(
    async (bookingId: Id<"bookings">) => {
      const promise = cancelMutation({ bookingId });
      toast.promise(promise, {
        loading: "Cancelling booking...",
        success: "Booking cancelled successfully",
        error: (err) => (err instanceof Error ? err.message : "Failed to cancel booking"),
      });
      return promise;
    },
    [cancelMutation]
  );

  return {
    bookings: bookings ?? [],
    isLoading: isPending || (!!session?.user && bookings === undefined),
    cancelBooking,
  };
}
