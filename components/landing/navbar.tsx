"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X, Moon, Sun } from "lucide-react";
import React from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/routes", label: "Routes" },
  { href: "/destinations", label: "Destinations" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const pathname = usePathname();

  // Close mobile menu whenever the route changes
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <nav
        className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="Kitui Travellers — Home">
          <Image
            src="/icon-192.svg"
            unoptimized
            alt="Kitui Travellers"
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
          <span
            className="font-black text-base text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Kitui <span className="text-primary">Travellers</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "transition-colors",
                pathname === href
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          {session ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile actions */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "block py-2.5 text-sm transition-colors",
                pathname === href
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 border-t border-border space-y-2">
            {session ? (
              <Link
                href="/dashboard"
                className="block w-full text-center py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block py-2.5 text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block w-full text-center py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
