"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bus, MapPin, Play, Users, Zap } from "lucide-react";
import { RouteSearchBar } from "@/components/landing/route-search-bar";

const DESTINATIONS = [
  {
    id: 1,
    city: "Nairobi",
    tag: "Express",
    price: "KES 700",
    image: "/nairobi.jpg",
    accent: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  {
    id: 2,
    city: "Mombasa",
    tag: "Coach",
    price: "KES 1,200",
    image: "/mombasa.jpg",
    accent: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  {
    id: 3,
    city: "Mwingi",
    tag: "Matatu",
    price: "KES 200",
    image: "/mwingi.jpg",
    accent: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  {
    id: 4,
    city: "Garissa",
    tag: "Bus",
    price: "KES 950",
    image: "/garissa.jpg",
    accent: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
];

const STATS = [
  { value: "29+", label: "Routes" },
  { value: "50K+", label: "Moved" },
  { value: "98%", label: "On-Time" },
  { value: "4.8★", label: "Rating" },
];

export function HeroSection() {
  return (
    <section className="relative flex items-center pt-16 overflow-hidden bg-background min-h-screen">
      {/* ── Atmospheric glows ─────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-64 h-64 sm:w-80 sm:h-80 lg:w-[480px] lg:h-[480px] rounded-full bg-primary/15 blur-[80px] lg:blur-[100px]" />
        <div className="absolute top-1/4 -right-16 w-64 h-64 lg:w-96 lg:h-96 rounded-full bg-blue-600/10 blur-[60px] lg:blur-[80px]" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-72 sm:w-96 lg:w-[600px] h-40 lg:h-48 rounded-full bg-primary/8 blur-[60px] lg:blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* ── Page content ──────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-16 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 xl:gap-14 2xl:gap-20 items-center">
          <div className="space-y-6 sm:space-y-7 max-w-xl mx-auto lg:mx-0">
            {/* Badge pill — "Explore the world" equivalent */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] sm:text-xs font-mono uppercase tracking-widest animate-in fade-in duration-500">
              <span className="size-1.5 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="hidden sm:inline">Kitui &amp; Eastern Kenya · 29+ Routes</span>
              <span className="sm:hidden">Kitui · Eastern Kenya</span>
              <div className="ml-1 w-4 h-4 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <Play className="size-2 text-primary fill-primary ml-px" />
              </div>
            </div>

            {/* ── 2-line headline (matches screenshot structure) ── */}
            <div
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: "80ms" }}
            >
              <h1
                className="font-black tracking-tight leading-[1.0]"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {/* Line 1: foreground color, large */}
                <span className="block text-[2.4rem] sm:text-5xl md:text-6xl lg:text-[3.6rem] xl:text-[4.2rem] 2xl:text-7xl text-foreground">
                  From Kitui
                </span>
                {/* Line 2: primary color, slightly larger — mirrors "to the World." */}
                <span className="block text-[2.6rem] sm:text-5xl md:text-[3.8rem] lg:text-[3.8rem] xl:text-[4.5rem] 2xl:text-7xl text-primary mt-1">
                  to the World.
                </span>
              </h1>
            </div>

            {/* Sub-copy */}
            <p
              className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xs sm:max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: "160ms" }}
            >
              Bus, matatu, and coach tickets across Kitui and Eastern Kenya — live seat
              availability, instant QR tickets, M-Pesa payment.
            </p>

            {/* ── Route search ──────────────────────────── */}
            <div
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: "220ms" }}
            >
              <RouteSearchBar />
            </div>

            {/* CTAs — "Get Started" (filled) + "Watch Demo" (outlined with play icon) */}
            <div
              className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: "300ms" }}
            >
              {/* Filled CTA */}
              <Link
                href="/routes"
                className="group inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/30 hover:shadow-primary/50 w-full sm:w-auto"
              >
                Browse Routes
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 shrink-0" />
              </Link>

              {/* Outlined CTA with play icon — matches "Watch Demo ▶" */}
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2.5 px-5 sm:px-7 py-3 sm:py-3.5 border border-border rounded-full text-sm font-semibold text-foreground hover:bg-card hover:border-primary/40 transition-all duration-200 w-full sm:w-auto"
              >
                <Users className="size-4 text-muted-foreground shrink-0" />
                Join Free
                <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                  <Play className="size-2.5 text-primary fill-primary ml-px" />
                </div>
              </Link>
            </div>

            {/* Stats row */}
            <div
              className="grid grid-cols-4 gap-2 sm:flex sm:gap-6 pt-1 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: "320ms" }}
            >
              {STATS.map((s) => (
                <div key={s.label} className="text-center sm:text-left">
                  <p
                    className="text-lg sm:text-xl font-black text-primary leading-none"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-wider">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div
            className="hidden lg:block relative animate-in fade-in slide-in-from-right-4 duration-700"
            style={{ animationDelay: "220ms", height: "460px" }}
          >
            {/* ── LEFT COLUMN ──────────────────────────── */}

            {/* Card 1 — tall portrait (Nairobi) */}
            <DestCard
              dest={DESTINATIONS[0]}
              style={{ position: "absolute", top: 0, left: 0, width: 190, height: 268 }}
            />

            {/* Card 3 — wide short (Mwingi) */}
            <DestCard
              dest={DESTINATIONS[2]}
              style={{ position: "absolute", bottom: 0, left: 0, width: 215, height: 155 }}
            />

            {/* ── RIGHT COLUMN (offset 75px from top) ─── */}

            {/* Card 2 — small landscape (Mombasa) */}
            <DestCard
              dest={DESTINATIONS[1]}
              style={{ position: "absolute", top: 75, right: 0, width: 195, height: 140 }}
            />

            {/* Card 4 — taller (Garissa) */}
            <DestCard
              dest={DESTINATIONS[3]}
              style={{ position: "absolute", bottom: 0, right: 0, width: 195, height: 218 }}
            />
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 420 460"
              fill="none"
            >
              {/* Arc 1 — top-left to top-right, curves UP */}
              <path
                d="M 30 38 Q 195 -50 385 75"
                stroke="var(--primary)"
                strokeWidth="1.8"
                strokeDasharray="7 6"
                strokeLinecap="round"
                opacity="0.55"
                style={{
                  strokeDashoffset: 450,
                  animation: "route-dash 2s ease forwards 0.3s",
                }}
              />
              {/* Arc 2 — right-mid curves DOWN and LEFT */}
              <path
                d="M 390 220 Q 375 390 210 455"
                stroke="var(--primary)"
                strokeWidth="1.8"
                strokeDasharray="7 6"
                strokeLinecap="round"
                opacity="0.38"
                style={{
                  strokeDashoffset: 340,
                  animation: "route-dash 2.3s ease forwards 0.7s",
                }}
              />
            </svg>
            <div
              className="absolute z-30"
              style={{
                top: 28,
                right: 88,
                animation: "float 4s ease-in-out infinite 0s",
              }}
            >
              <div className="w-9 h-9 rounded-full bg-amber-400 shadow-lg shadow-amber-400/40 flex items-center justify-center">
                <Play className="size-4 text-white fill-white ml-0.5" />
              </div>
            </div>

            {/* Primary plane/arrow — right end of arc 1 (pink in screenshot) */}
            <div
              className="absolute z-30"
              style={{
                top: 54,
                right: 4,
                animation: "float 3.8s ease-in-out infinite 1.2s",
              }}
            >
              <div className="w-8 h-8 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center rotate-45">
                <ArrowRight className="size-3.5 text-primary-foreground" />
              </div>
            </div>

            {/* Bus icon — peak of arc 1 (top-center) */}
            <div
              className="absolute z-30"
              style={{
                top: -10,
                left: "47%",
                transform: "translateX(-50%)",
                animation: "float 4s ease-in-out infinite 0.6s",
              }}
            >
              <div className="bg-card border border-border rounded-full p-1.5 shadow-md">
                <Bus className="size-3 text-primary" />
              </div>
            </div>

            {/* Blue location pin — bottom of arc 2 */}
            <div
              className="absolute z-30"
              style={{
                bottom: 2,
                left: "49%",
                transform: "translateX(-50%)",
                animation: "float 4s ease-in-out infinite 2.8s",
              }}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 shadow-lg shadow-blue-500/35 flex items-center justify-center">
                <MapPin className="size-3.5 text-white fill-white" />
              </div>
            </div>

            {/* Zap dot — right arc mid-point */}
            <div
              className="absolute z-30"
              style={{
                top: 232,
                right: 0,
                animation: "float 3.5s ease-in-out infinite 2s",
              }}
            >
              <div className="bg-primary/12 border border-primary/30 rounded-full p-1.5">
                <Zap className="size-3 text-primary" />
              </div>
            </div>
            <div
              className="absolute z-30 bg-card border border-border rounded-xl px-3 py-2 shadow-xl"
              style={{
                top: 270,
                left: 185,
                animation: "float 4s ease-in-out infinite 1s",
              }}
            >
              <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wide">
                From
              </p>
              <p
                className="text-sm font-black text-primary leading-none mt-0.5"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                KES 200
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5">per seat</p>
            </div>
          </div>
          <div className="lg:hidden">
            {/* 2×2 grid — left col taller, right col shorter on top */}
            <div className="grid gap-3 max-w-md mx-auto" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {/* Left tall */}
              <div
                className="relative rounded-2xl overflow-hidden border border-white/8 shadow-xl row-span-2"
                style={{ height: 270 }}
              >
                <Image
                  src={DESTINATIONS[0].image}
                  alt={DESTINATIONS[0].city}
                  fill
                  className="object-cover"
                  sizes="50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                  <span
                    className={`inline-flex self-start text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${DESTINATIONS[0].accent}`}
                  >
                    {DESTINATIONS[0].tag}
                  </span>
                  <div>
                    <p
                      className="text-white font-black text-sm"
                      style={{ fontFamily: "var(--font-syne)" }}
                    >
                      {DESTINATIONS[0].city}
                    </p>
                    <p className="text-white/55 text-[10px] font-mono">
                      {DESTINATIONS[0].price}/seat
                    </p>
                  </div>
                </div>
              </div>
              {/* Right col: small top */}
              <div
                className="relative rounded-2xl overflow-hidden border border-white/8 shadow-xl"
                style={{ height: 128 }}
              >
                <Image
                  src={DESTINATIONS[1].image}
                  alt={DESTINATIONS[1].city}
                  fill
                  className="object-cover"
                  sizes="50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                  <span
                    className={`inline-flex self-start text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${DESTINATIONS[1].accent}`}
                  >
                    {DESTINATIONS[1].tag}
                  </span>
                  <div>
                    <p
                      className="text-white font-black text-xs"
                      style={{ fontFamily: "var(--font-syne)" }}
                    >
                      {DESTINATIONS[1].city}
                    </p>
                    <p className="text-white/55 text-[9px] font-mono">
                      {DESTINATIONS[1].price}/seat
                    </p>
                  </div>
                </div>
              </div>
              {/* Right col: taller bottom */}
              <div
                className="relative rounded-2xl overflow-hidden border border-white/8 shadow-xl"
                style={{ height: 135 }}
              >
                <Image
                  src={DESTINATIONS[3].image}
                  alt={DESTINATIONS[3].city}
                  fill
                  className="object-cover"
                  sizes="50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                  <span
                    className={`inline-flex self-start text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${DESTINATIONS[3].accent}`}
                  >
                    {DESTINATIONS[3].tag}
                  </span>
                  <div>
                    <p
                      className="text-white font-black text-xs"
                      style={{ fontFamily: "var(--font-syne)" }}
                    >
                      {DESTINATIONS[3].city}
                    </p>
                    <p className="text-white/55 text-[9px] font-mono">
                      {DESTINATIONS[3].price}/seat
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="hidden sm:flex absolute bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-30">
        <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest">
          scroll
        </span>
        <div className="w-px h-6 lg:h-8 bg-gradient-to-b from-muted-foreground to-transparent" />
      </div>
    </section>
  );
}

// ── Destination card ──────────────────────────────────────────
function DestCard({ dest, style }: { dest: (typeof DESTINATIONS)[0]; style: React.CSSProperties }) {
  return (
    <div
      className="rounded-[22px] overflow-hidden border border-white/8 shadow-2xl cursor-pointer transition-transform duration-300 hover:-translate-y-1"
      style={style}
    >
      {/* Real photo */}
      <Image
        src={dest.image}
        alt={dest.city}
        fill
        className="object-cover"
        sizes="(max-width: 1280px) 210px, 240px"
        priority
      />
      {/* Dark gradient over the photo for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
      {/* Subtle colour tint so each card feels distinct */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/30" />
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        <span
          className={`inline-flex self-start text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-sm ${dest.accent}`}
        >
          {dest.tag}
        </span>
        <div>
          <p
            className="text-white font-black text-lg leading-tight drop-shadow-md"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {dest.city}
          </p>
          <p className="text-white/70 text-xs font-mono mt-0.5 drop-shadow-sm">{dest.price}/seat</p>
        </div>
      </div>
    </div>
  );
}
