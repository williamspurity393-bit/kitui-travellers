"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { DashboardShell } from "@/components/dashboard/shell";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import React from "react";

function RedirectToLogin() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/auth/login");
  }, [router]);
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="size-5 text-muted-foreground animate-spin" />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Show spinner while Convex validates the JWT token on page load */}
      <AuthLoading>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-6 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground font-mono animate-pulse">
              Loading your account…
            </p>
          </div>
        </div>
      </AuthLoading>

      {/* Proxy handles most cases — this is the client-side safety net */}
      <Unauthenticated>
        <RedirectToLogin />
      </Unauthenticated>

      {/* All child useQuery calls are safe — Convex has a valid token */}
      <Authenticated>
        <DashboardShell>{children}</DashboardShell>
      </Authenticated>
    </>
  );
}
