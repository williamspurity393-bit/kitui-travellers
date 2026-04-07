"use client";

import { useEffect } from "react";
import { Bus, RefreshCw } from "lucide-react";

export default function RoutesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RoutesError]", error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center text-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center">
        <Bus className="size-8 text-muted-foreground opacity-40" />
      </div>
      <div className="space-y-2">
        <h2
          className="text-2xl font-black text-foreground"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Couldn&apos;t load routes
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          There was a problem loading the available routes. Please try again.
        </p>
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
