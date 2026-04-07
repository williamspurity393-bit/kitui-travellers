"use client";

import React from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function DashboardHubPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  // Only run getMyProfile once Convex has a valid token
  const profile = useQuery(api.users.getMyProfile, isAuthenticated ? {} : "skip");

  // Sync Better Auth session data → Convex profile (name, email, avatar)
  const syncMyProfile = useMutation(api.users.syncMyProfile);
  const { data: session } = authClient.useSession();

  // Fire in background — do NOT await. We redirect based on profile state,
  // not on whether sync completed.
  React.useEffect(() => {
    if (!isAuthenticated) return;
    syncMyProfile({
      fullName: session?.user?.name ?? undefined,
      email: session?.user?.email ?? undefined,
      avatar: session?.user?.image ?? undefined,
    }).catch(() => {
      // Silent — new users may not have a profile row yet
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, session?.user?.id]);

  // ── Routing logic ──────────────────────────────────────────────────────
  React.useEffect(() => {
    // Still waiting for Convex auth / OTT exchange to complete — show spinner
    if (authLoading) return;

    // Not yet authenticated — could be mid-OTT exchange, keep waiting.
    // DO NOT redirect to login here. proxy.ts handles truly unauthenticated
    // users; this component just needs to wait for the token.
    if (!isAuthenticated) return;

    // Profile query hasn't returned yet
    if (profile === undefined) return;

    // No profile row = brand-new social user → go to onboarding immediately.
    // Don't wait for syncMyProfile — completeOnboarding will create the row.
    if (profile === null) {
      router.replace("/auth/onboarding");
      return;
    }

    // Profile exists but onboarding not finished
    if (!profile.isOnboarded) {
      router.replace("/auth/onboarding");
      return;
    }

    // Banned users land on user dashboard where BanWall renders
    if (profile.isBanned) {
      router.replace("/user/dashboard");
      return;
    }

    // Route to role-specific dashboard
    switch (profile.accountType) {
      case "admin":
        router.replace("/admin/dashboard");
        break;
      case "driver":
        router.replace("/driver/dashboard");
        break;
      default:
        router.replace("/user/dashboard");
        break;
    }
  }, [authLoading, isAuthenticated, profile, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-6 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground font-mono animate-pulse">
          Loading your dashboard…
        </p>
      </div>
    </div>
  );
}
