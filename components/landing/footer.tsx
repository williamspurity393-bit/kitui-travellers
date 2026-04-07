"use client";

import Link from "next/link";
import Image from "next/image";

const YEAR = 2026;

export default function Footer() {
  const year = YEAR;

  return (
    <footer className="border-t border-border py-12 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image
                src="/icon-192.svg"
                unoptimized
                alt="Kitui Travellers"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="font-black text-lg" style={{ fontFamily: "var(--font-syne)" }}>
                Kitui <span className="text-primary">Travellers</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Kitui Travellers Sacco — Kitui &amp; Eastern Kenya&apos;s most reliable online
              transport booking platform.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-16 gap-y-2 text-sm">
            <Link
              href="/routes"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Routes
            </Link>
            <Link
              href="/destinations"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Destinations
            </Link>
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              href="/auth/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/contact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/auth/signup"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign Up
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground font-mono">
            © {year} Kitui Travellers Sacco. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground font-mono">Built for Kenyan travellers 🇰🇪</p>
        </div>
      </div>
    </footer>
  );
}
