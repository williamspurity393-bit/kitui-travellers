import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginContent } from "./login-content"; // ← keep your existing file unchanged

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Kitui Travellers account to book trips and manage bookings.",
  alternates: { canonical: "/auth/login" },
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full flex items-center justify-center min-h-[60vh]">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
