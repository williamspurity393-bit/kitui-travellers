import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { twoFactorClient, anonymousClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL,
  plugins: [convexClient(), twoFactorClient(), anonymousClient()],
});

export const { signIn, signUp, signOut, useSession, getSession, resetPassword, changePassword } =
  authClient;
