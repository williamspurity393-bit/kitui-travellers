"use client";

import { useSession } from "@/lib/auth-client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export function useAuth() {
  const { data: session, isPending: sessionLoading } = useSession();

  // Only fetch profile when we have a session
  const profile = useQuery(api.users.getMyProfile, sessionLoading || !session?.user ? "skip" : {});

  const isLoading = sessionLoading || profile === undefined;
  const isAuthenticated = Boolean(session?.user);
  const isAdmin = profile?.accountType === "admin";
  const isDriver = profile?.accountType === "driver";

  return {
    session: session?.user || null,
    profile: profile || null,
    isLoading,
    isAuthenticated,
    isAdmin,
    isDriver,
  };
}

export function useProtected() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !session) {
      router?.push("/auth/login?from=" + window.location.pathname);
    }
  }, [isLoading, session, router]);

  return { isLoading, isAuthenticated: Boolean(session) };
}
