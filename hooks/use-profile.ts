"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/auth-client";

export function useProfile() {
  const { data: session, isPending } = useSession();

  // Do NOT call getMyProfile until useSession has resolved.
  // isPending = true means better-auth is still fetching the token —
  // sending the Convex query at this point arrives with no token → Unauthenticated.
  const profileData = useQuery(api.users.getMyProfile, isPending || !session?.user ? "skip" : {});

  const user = (profileData as Record<string, unknown> | null)?.user ?? session?.user ?? null;

  return {
    profile: profileData ?? null,
    user,
    isLoading: isPending || (!!session?.user && profileData === undefined),
    isBanned: !!(profileData as ({ _banned?: boolean } & Record<string, unknown>) | null)?._banned,
  };
}
