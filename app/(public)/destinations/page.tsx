import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, TreePine, ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import { ALL_DESTINATIONS } from "@/components/landing/destinations-section";

export const metadata: Metadata = {
  title: "Explore Destinations",
  description:
    "Discover the best natural wonders, cultural landmarks, and hidden gems around Kitui and Eastern Kenya.",
  alternates: { canonical: "/destinations" },
  openGraph: {
    title: "Explore Kitui & Eastern Kenya — Kitui Travellers",
    description: "Natural wonders, cultural landmarks, and hidden gems of Eastern Kenya.",
    url: "/destinations",
    type: "website",
  },
};

const TAG_STYLES: Record<string, string> = {
  Landmark: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  Wildlife: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  Hiking: "bg-blue-400/15 text-blue-300 ring-blue-400/30",
  Culture: "bg-orange-400/15 text-orange-300 ring-orange-400/30",
  Birdwatching: "bg-teal-400/15 text-teal-300 ring-teal-400/30",
};

function DestCard({ dest }: { dest: (typeof ALL_DESTINATIONS)[0] }) {
  const tagStyle = TAG_STYLES[dest.tag] ?? "bg-primary/15 text-primary ring-primary/30";

  return (
    <Link
      href={`/destinations/${dest.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/40"
    >
      {/* Image area */}
      <div className="relative overflow-hidden" style={{ height: 220 }}>
        <Image
          src={dest.image}
          alt={dest.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div
          className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full ring-1 ${tagStyle}`}
          >
            {dest.tag}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full px-2.5 py-1">
          <Star className="size-2.5 fill-amber-400 text-amber-400" />
          <span className="font-semibold">{dest.rating}</span>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
          style={{ backgroundColor: dest.accent }}
        />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin className="size-3 shrink-0" style={{ color: dest.accent }} />
          <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
            {dest.location}
          </span>
        </div>
        <h3
          className="text-lg font-black text-foreground leading-tight mb-2"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {dest.name}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">{dest.blurb}</p>

        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <div>
            <p className="text-[9px] text-muted-foreground/60 font-mono uppercase tracking-wider mb-0.5">
              Best time
            </p>
            <p className="text-xs font-semibold text-foreground">{dest.bestTime}</p>
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {dest.highlights.slice(0, 2).map((h) => (
              <span
                key={h}
                className="text-[9px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground"
              >
                {h}
              </span>
            ))}
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 mt-3 text-xs font-semibold opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-200"
          style={{ color: dest.accent }}
        >
          Explore <ArrowRight className="size-3.5" />
        </div>
      </div>
    </Link>
  );
}

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero header */}
        <div className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px]" />
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/8 blur-[80px]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-14 sm:py-20">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="size-3.5" /> Back to home
            </Link>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <TreePine className="size-4 text-primary" />
              </div>
              <p className="text-xs text-primary font-mono uppercase tracking-widest">
                Top Destination
              </p>
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-6xl font-black text-foreground mb-4 leading-tight"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Explore Kitui
              <br />
              <span className="text-primary">&amp; Beyond</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl leading-relaxed mb-10">
              Discover natural wonders, cultural landmarks, and hidden gems across Kitui and Eastern
              Kenya — from towering rock formations to untamed wildlife reserves.
            </p>

            {/* Stats */}
            <div className="flex items-center gap-8">
              {[
                { value: `${ALL_DESTINATIONS.length}`, label: "Places" },
                { value: "5", label: "Categories" },
                { value: "3+", label: "Counties" },
              ].map((s) => (
                <div key={s.label}>
                  <p
                    className="text-2xl sm:text-3xl font-black text-primary"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-12 sm:py-16">
          <div className="flex items-center justify-between mb-8">
            <p className="text-xs text-muted-foreground">
              {ALL_DESTINATIONS.length} destinations · Kitui &amp; Eastern Kenya
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {ALL_DESTINATIONS.map((dest) => (
              <DestCard key={dest.id} dest={dest} />
            ))}
          </div>

          {/* Coming soon */}
          <div className="mt-14 rounded-2xl border border-dashed border-border p-10 text-center">
            <TreePine className="size-9 text-primary/30 mx-auto mb-4" />
            <p
              className="font-black text-foreground text-lg mb-1.5"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              More destinations coming soon
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
              We&apos;re mapping more hidden gems across Kitui, Machakos, and Eastern Kenya.
            </p>
            <Link
              href="/routes"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
            >
              Book a bus <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
