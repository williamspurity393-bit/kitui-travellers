"use client";

import { useEffect } from "react";
import { Ticket, RefreshCw } from "lucide-react";

export default function BookingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[BookingsError]", error);
  }, [error]);

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto flex flex-col items-center justify-center py-16 gap-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center">
        <Ticket className="size-6 text-muted-foreground opacity-40" />
      </div>
      <div className="space-y-2">
        <h2
          className="text-xl font-black text-foreground"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Couldn&apos;t load bookings
        </h2>
        <p className="text-sm text-muted-foreground">There was a problem fetching your bookings.</p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
      >
        <RefreshCw className="size-4" /> Try again
      </button>
    </div>
  );
}
