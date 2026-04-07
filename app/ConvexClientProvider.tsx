"use client";

import { ReactNode, memo } from "react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

// Singleton — created once per browser session, never recreated on re-renders
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  verbose: process.env.NODE_ENV === "development",
});

interface Props {
  children: ReactNode;
  initialToken?: string | null;
}

// memo() prevents the entire React tree from re-rendering when a parent prop changes
const ConvexClientProvider = memo(function ConvexClientProvider({ children, initialToken }: Props) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={authClient}
      initialToken={initialToken ?? undefined}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
});

ConvexClientProvider.displayName = "ConvexClientProvider";

export { ConvexClientProvider };
