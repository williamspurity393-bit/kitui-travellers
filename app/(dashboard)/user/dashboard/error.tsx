"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
        <AlertCircle className="size-6 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2
          className="text-xl font-black text-foreground"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          An unexpected error occurred. Your data is safe — please try refreshing.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-left text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-xl p-3 mt-3 max-w-sm overflow-auto">
            {error.message}
          </pre>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="size-4" /> Try again
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl font-medium text-sm hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" /> Dashboard
        </Link>
      </div>
    </div>
  );
}
