import Link from "next/link";
import { Bus, ArrowLeft, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist.",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px,transparent 1px),linear-gradient(90deg,currentColor 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bus className="size-12 text-primary opacity-60" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center">
              <span className="text-xs font-black text-muted-foreground">?</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-primary font-mono uppercase tracking-widest">
            404 — Not Found
          </p>
          <h1
            className="text-4xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            This stop doesn&apos;t exist
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            The page you&apos;re looking for has either moved or never existed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <ArrowLeft className="size-4" /> Back to Home
          </Link>
          <Link
            href="/routes"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-xl font-medium text-sm hover:bg-muted transition-colors"
          >
            <MapPin className="size-4" /> Browse Routes
          </Link>
        </div>

        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-3">Popular destinations</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Kitui → Nairobi", href: "/routes?from=Kitui&to=Nairobi" },
              { label: "Kitui → Mombasa", href: "/routes?from=Kitui&to=Mombasa" },
              { label: "My Bookings", href: "/user/bookings" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-primary hover:underline bg-primary/5 border border-primary/15 px-3 py-1.5 rounded-full"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
