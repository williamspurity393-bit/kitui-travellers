"use client";

import Link from "next/link";
import { Bus, Star, Shield, Clock, MapPin, Zap } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const PANEL_CONTENT = {
  login: {
    heading: "Welcome\nback.",
    sub: "Your saved routes, booking history, and upcoming trips are waiting.",
    accent: "text-primary",
    features: [
      { icon: Clock, text: "Your upcoming trips at a glance" },
      { icon: MapPin, text: "Saved routes and favourite destinations" },
      { icon: Shield, text: "Secure session, auto-signed out when inactive" },
    ],
    testimonial: {
      quote: "I book my Nairobi–Kitui trip every week. Kitui Travellers makes it effortless.",
      author: "Amina W.",
      location: "Nairobi",
      initials: "AW",
    },
  },
  signup: {
    heading: "Travel smarter\nstarts here.",
    sub: "Join thousands of Kenyan travellers who book with Kitui Travellers every day.",
    accent: "text-emerald-400",
    features: [
      { icon: Zap, text: "Book any route in under 60 seconds" },
      { icon: MapPin, text: "50+ routes across Kenya" },
      { icon: Shield, text: "Free to join, no hidden fees" },
    ],
    testimonial: {
      quote: "Finally a booking platform that actually works in Kenya. 10/10.",
      author: "Kevin O.",
      location: "Kisumu",
      initials: "KO",
    },
  },
  onboarding: {
    heading: "Almost\nthere.",
    sub: "Tell us a bit about yourself so we can tailor your experience perfectly.",
    accent: "text-blue-400",
    features: [
      { icon: Bus, text: "Travellers: browse & book instantly" },
      { icon: Shield, text: "Drivers: manage routes & passengers" },
      { icon: Zap, text: "Switch roles anytime from settings" },
    ],
    testimonial: {
      quote: "The driver dashboard is incredibly well-designed. My passengers love the QR tickets.",
      author: "Samuel O.",
      location: "Mombasa",
      initials: "SO",
    },
  },
};

type PanelKey = keyof typeof PANEL_CONTENT;

function getPanel(pathname: string): PanelKey {
  if (pathname.includes("signup")) return "signup";
  if (pathname.includes("onboarding")) return "onboarding";
  return "login";
}

const STATS = [
  { value: "50+", label: "Routes" },
  { value: "50K+", label: "Passengers" },
  { value: "98%", label: "On-Time" },
  { value: "4.8★", label: "Rating" },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const key = getPanel(pathname);
  const panel = PANEL_CONTENT[key];

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* ── Left: Form ── */}
      <div className="flex flex-col min-h-screen lg:min-h-0 order-2 lg:order-1">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-border">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
              <Bus className="size-3.5" />
            </div>
            <span className="font-black text-sm" style={{ fontFamily: "var(--font-syne)" }}>
              Kitui <span className="text-primary">Travellers</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Home
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      {/* ── Right: Brand panel ── */}
      <div className="hidden lg:flex flex-col order-1 lg:order-2 relative overflow-hidden bg-[#0A0F1C]">
        <div className="pointer-events-none absolute inset-0">
          <div
            className={cn(
              "absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-30 transition-colors duration-700",
              key === "login" && "bg-primary",
              key === "signup" && "bg-emerald-500",
              key === "onboarding" && "bg-blue-500"
            )}
          />
          <div
            className={cn(
              "absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-20 transition-colors duration-700",
              key === "login" && "bg-blue-600",
              key === "signup" && "bg-primary",
              key === "onboarding" && "bg-primary"
            )}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 p-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Bus className="size-5" />
            </div>
            <span
              className="font-black text-xl text-white"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Kitui <span className="text-primary">Travellers</span>
            </span>
          </Link>
          <Link href="/" className="text-xs text-white/30 hover:text-white/70 transition-colors">
            ← Back to home
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex items-center px-10">
          {/* key prop forces remount → re-animate on page change */}
          <div
            key={key}
            className="text-white space-y-8 w-full animate-in fade-in slide-in-from-right-4 duration-500"
          >
            <h2
              className="text-5xl font-black leading-[1.05] whitespace-pre-line"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {panel.heading.split("\n")[0]}
              {"\n"}
              <span className={panel.accent}>{panel.heading.split("\n")[1]}</span>
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">{panel.sub}</p>
            <ul className="space-y-3">
              {panel.features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Icon className="size-3.5 text-white/70" />
                  </div>
                  <span className="text-sm text-white/70">{text}</span>
                </li>
              ))}
            </ul>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3 text-primary fill-primary" />
                ))}
              </div>
              <p className="text-sm text-white/70 italic leading-relaxed mb-3">
                &ldquo;{panel.testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                  {panel.testimonial.initials}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/90">{panel.testimonial.author}</p>
                  <p className="text-xs text-white/40">{panel.testimonial.location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-10 border-t border-white/5">
          <div className="grid grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p
                  className="text-lg font-black text-white"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {s.value}
                </p>
                <p className="text-xs text-white/30 font-mono">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
