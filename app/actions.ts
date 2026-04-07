"use server";

import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";

export async function updatePassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    await fetchAuthMutation(api.users.updateUserPassword, {
      currentPassword,
      newPassword,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update password";
    return { success: false, error: message };
  }
}
