import { Navbar } from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import { MapPin, Phone, Mail, Shield, Users, Star, Bus, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Kitui Travellers Sacco — connecting Kitui to Kenya since 1995. Safe, dignified, and reliable passenger transport across Eastern Kenya.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Kitui Travellers Sacco",
    description:
      "Connecting Kitui to Kenya since 1995. Safe, verified drivers and modern online booking.",
    url: "/about",
    type: "website",
  },
};

const STATS = [
  { value: "29+", label: "Active Routes" },
  { value: "50K+", label: "Passengers Moved" },
  { value: "98%", label: "On-Time Rate" },
  { value: "4.8★", label: "Average Rating" },
];

const VALUES = [
  {
    icon: Shield,
    title: "Safe Travel",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    desc: "Verified drivers, insured vehicles, and real-time trip tracking across all routes.",
  },
  {
    icon: Users,
    title: "Passenger First",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    desc: "Online booking, instant confirmation, and dedicated customer support 7 days a week.",
  },
  {
    icon: Star,
    title: "Trusted Service",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    desc: "Thousands of happy passengers served across Kitui, Nairobi, Mombasa and beyond.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(currentColor 1px,transparent 1px),linear-gradient(90deg,currentColor 1px,transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative max-w-4xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest mb-6">
              <Bus className="size-3" /> Est. 1995 · Kitui County
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95] text-foreground mb-6"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Connecting Kitui
              <br />
              <span className="text-primary">to Kenya</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Kitui Travellers Sacco has been moving passengers safely across Eastern Kenya for
              decades. We brought that reliability online — so you can book from anywhere, any time,
              in seconds.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-16 space-y-16">
          {/* ── Mission ── */}
          <section className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs text-primary font-mono uppercase tracking-widest mb-3">
                Our Mission
              </p>
              <h2
                className="text-2xl font-black text-foreground mb-4"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Safe, dignified transport
                <br />
                for every Kenyan
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We exist to provide safe, efficient, and dignified passenger transport services. We
                are committed to reducing travel time, eliminating overbooking, and making booking
                accessible from anywhere — 24 hours a day, 7 days a week.
              </p>
              <Link
                href="/routes"
                className="inline-flex items-center gap-2 mt-6 text-sm text-primary font-semibold hover:gap-3 transition-all"
              >
                Browse our routes <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {STATS.map(({ value, label }) => (
                <div key={label} className="rounded-2xl border border-border bg-card p-5">
                  <p
                    className="text-3xl font-black text-primary mb-1"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Values ── */}
          <section>
            <p className="text-xs text-primary font-mono uppercase tracking-widest mb-6">
              Why Choose Us
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {VALUES.map(({ icon: Icon, title, desc, color, bg }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-card p-6 space-y-3 hover:border-primary/30 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`size-5 ${color}`} />
                  </div>
                  <p className="font-bold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Contact ── */}
          <section className="rounded-2xl border border-border bg-card p-8">
            <p className="text-xs text-primary font-mono uppercase tracking-widest mb-4">
              Get In Touch
            </p>
            <h2
              className="text-xl font-black text-foreground mb-6"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Contact Us
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: MapPin,
                  label: "Location",
                  value: "Kitui Town Bus Station, Kitui County, Kenya",
                },
                { icon: Phone, label: "Phone", value: "+254 700 000 000" },
                { icon: Mail, label: "Email", value: "support@kuittravellers.co.ke" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer /> {/* ← footer only here */}
    </div>
  );
}
