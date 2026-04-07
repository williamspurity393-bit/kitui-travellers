"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import RoutesClient from "@/app/(public)/routes/RoutesClient";

export default function DriverRoutesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      }
    >
      <RoutesClient />
    </Suspense>
  );
}
