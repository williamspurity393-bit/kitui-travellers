import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Star,
  TreePine,
} from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import { ALL_DESTINATIONS } from "@/components/landing/destinations-section";

// ── Static params — pre-renders all slugs at build time ───────
export function generateStaticParams() {
  return ALL_DESTINATIONS.map((d) => ({ slug: d.slug }));
}

// ── Per-page SEO ──────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dest = ALL_DESTINATIONS.find((d) => d.slug === slug);
  if (!dest) return { title: "Not Found" };
  return {
    title: `${dest.name} — ${dest.location}`,
    description: dest.description,
    alternates: { canonical: `/destinations/${dest.slug}` },
    openGraph: {
      title: `${dest.name} | Kitui Travellers`,
      description: dest.blurb,
      url: `/destinations/${dest.slug}`,
      images: [{ url: dest.image, width: 1200, height: 630, alt: dest.name }],
      type: "website",
    },
  };
}

const TAG_STYLES: Record<string, string> = {
  Landmark: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  Wildlife: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  Hiking: "bg-blue-400/15 text-blue-300 ring-blue-400/30",
  Culture: "bg-orange-400/15 text-orange-300 ring-orange-400/30",
  Birdwatching: "bg-teal-400/15 text-teal-300 ring-teal-400/30",
};

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dest = ALL_DESTINATIONS.find((d) => d.slug === slug);
  if (!dest) notFound();

  const tagStyle = TAG_STYLES[dest.tag] ?? "bg-primary/15 text-primary ring-primary/30";

  // Related destinations (same tag, excluding self)
  const related = ALL_DESTINATIONS.filter(
    (d) => d.slug !== dest.slug && (d.tag === dest.tag || d.location === dest.location)
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* ── Hero image ──────────────────────────────────────── */}
        <div className="relative w-full overflow-hidden" style={{ height: "min(60vh, 520px)" }}>
          <Image
            src={dest.image}
            alt={dest.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          {/* Side gradient for text on left */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />

          {/* Top nav bar */}
          <div className="absolute top-0 left-0 right-0 px-4 sm:px-6 lg:px-10 xl:px-12 pt-6">
            <Link
              href="/destinations"
              className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
            >
              <ArrowLeft className="size-3.5" /> All destinations
            </Link>
          </div>

          {/* Bottom headline over image */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-10 xl:px-12 pb-8 sm:pb-12">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2.5 mb-3">
                <span
                  className={`inline-flex text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full ring-1 backdrop-blur-sm ${tagStyle}`}
                >
                  {dest.tag}
                </span>
                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-xs rounded-full px-2.5 py-1">
                  <Star className="size-2.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{dest.rating}</span>
                </div>
              </div>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-lg"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {dest.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-2">
                <MapPin className="size-3.5 shrink-0" style={{ color: dest.accent }} />
                <span className="text-white/70 text-sm font-mono">{dest.location}, Kenya</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-10 sm:py-14">
          <div className="grid lg:grid-cols-[1fr_320px] gap-10 lg:gap-16">
            {/* Left — main content */}
            <div className="space-y-8">
              {/* Blurb */}
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-medium">
                {dest.blurb}
              </p>

              {/* Description */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-foreground/80 leading-relaxed">{dest.description}</p>
              </div>

              {/* Highlights */}
              <div>
                <h2
                  className="text-xl font-black text-foreground mb-4"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Highlights
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {dest.highlights.map((h) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-2xl border border-border bg-card text-foreground font-medium"
                    >
                      <span
                        className="size-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: dest.accent }}
                      />
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div>
                <h2
                  className="text-xl font-black text-foreground mb-4"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Visitor Tips
                </h2>
                <div className="space-y-3">
                  {dest.tips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-card"
                    >
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                        style={{ backgroundColor: dest.accent }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm text-foreground/80 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* How to get there */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2
                  className="text-lg font-black text-foreground mb-3 flex items-center gap-2"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  <Bus className="size-4 text-primary" /> Getting There
                </h2>
                <p className="text-sm text-foreground/80 leading-relaxed">{dest.howToGet}</p>
                <Link
                  href={`/routes?to=${encodeURIComponent(dest.location)}`}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                >
                  Book a bus to {dest.location} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Right — sidebar */}
            <div className="space-y-5">
              {/* Quick facts */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest font-mono">
                  Quick facts
                </h3>

                {[
                  { icon: MapPin, label: "Location", value: `${dest.location}, Kenya` },
                  { icon: Calendar, label: "Best time", value: dest.bestTime },
                  { icon: Star, label: "Rating", value: `${dest.rating} / 5` },
                  { icon: TreePine, label: "Category", value: dest.tag },
                  {
                    icon: Clock,
                    label: "From Kitui",
                    value:
                      dest.location === "Kitui" || dest.location === "Kitui Town"
                        ? "Within town"
                        : "Day trip",
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Icon className="size-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Book CTA */}
              <div
                className="rounded-2xl p-5 text-white"
                style={{
                  background: `linear-gradient(135deg, ${dest.accent}30, ${dest.accent}10)`,
                  borderColor: `${dest.accent}40`,
                  border: "1px solid",
                }}
              >
                <p
                  className="font-black text-foreground text-base mb-1"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Ready to visit?
                </p>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Book your bus from Kitui or Nairobi and explore {dest.name}.
                </p>
                <Link
                  href={`/routes?to=${encodeURIComponent(dest.location)}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: dest.accent }}
                >
                  <Bus className="size-4" /> Find a bus route
                </Link>
              </div>

              {/* Back to all */}
              <Link
                href="/destinations"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                <ArrowLeft className="size-4" /> All destinations
              </Link>
            </div>
          </div>

          {/* ── Related ────────────────────────────────────────── */}
          {related.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center justify-between mb-8">
                <h2
                  className="text-2xl font-black text-foreground"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  You might also like
                </h2>
                <Link
                  href="/destinations"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  See all <ChevronRight className="size-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/destinations/${r.slug}`}
                    className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative overflow-hidden" style={{ height: 160 }}>
                      <Image
                        src={r.image}
                        alt={r.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/70 to-transparent" />
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
                        style={{ backgroundColor: r.accent }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MapPin className="size-3 shrink-0" style={{ color: r.accent }} />
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                          {r.location}
                        </span>
                      </div>
                      <p
                        className="font-black text-foreground text-base leading-tight"
                        style={{ fontFamily: "var(--font-syne)" }}
                      >
                        {r.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.blurb}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
