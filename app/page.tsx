import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Shield,
  Star,
  Zap,
  Users,
  ChevronRight,
  Wifi,
  Wind,
  Power,
  MapPin,
} from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero";
import { DestinationsSection } from "@/components/landing/destinations-section";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Booking",
    desc: "Book your seat in under 60 seconds. Get a unique KT-XXXXX code and QR ticket instantly.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    icon: MapPin,
    title: "Live Seat Availability",
    desc: "Real-time updates prevent overbooking. See exactly how many seats remain on any route.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Shield,
    title: "Safe & Verified",
    desc: "All vehicles are licensed. Drivers are background-checked and rated by travellers.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: Clock,
    title: "Trip Reminders",
    desc: "Automatic notifications before your departure. Never miss your bus again.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
];

const POPULAR_ROUTES = [
  {
    id: 1,
    from: "Kitui",
    to: "Nairobi",
    duration: "3h 30m",
    price: 700,
    seats: 18,
    type: "Bus",
    amenities: ["ac"],
    rating: 4.8,
  },
  {
    id: 2,
    from: "Kitui",
    to: "Mombasa",
    duration: "8h 00m",
    price: 1200,
    seats: 12,
    type: "Coach",
    amenities: ["ac", "wifi", "charging"],
    rating: 4.7,
  },
  {
    id: 3,
    from: "Kitui Town",
    to: "Mwingi",
    duration: "1h 15m",
    price: 200,
    seats: 8,
    type: "Matatu",
    amenities: [],
    rating: 4.5,
  },
  {
    id: 4,
    from: "Mwingi",
    to: "Nairobi",
    duration: "4h 30m",
    price: 850,
    seats: 22,
    type: "Bus",
    amenities: ["ac"],
    rating: 4.6,
  },
];

const STEPS = [
  {
    step: "01",
    title: "Choose Your Route",
    desc: "Browse routes by origin, destination, vehicle type, price, and amenities.",
  },
  {
    step: "02",
    title: "Select & Book",
    desc: "Pick your schedule, choose seats, add passengers, and apply promo codes.",
  },
  {
    step: "03",
    title: "Pay via M-Pesa",
    desc: "Complete payment with Lipa Na M-Pesa. Receive your QR-coded booking code instantly.",
  },
];

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="size-3 shrink-0" />,
  ac: <Wind className="size-3 shrink-0" />,
  charging: <Power className="size-3 shrink-0" />,
};

// ── Page ──────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── POPULAR ROUTES ───────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-10 xl:px-12 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8 sm:mb-10 lg:mb-12">
          <div>
            <p className="text-[10px] sm:text-xs text-primary font-mono uppercase tracking-widest mb-1.5 sm:mb-2">
              Most Booked
            </p>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-black"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Popular Routes
            </h2>
          </div>
          <Link
            href="/routes"
            className="hidden sm:flex items-center gap-1 text-xs sm:text-sm text-primary hover:underline"
          >
            View all <ChevronRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {POPULAR_ROUTES.map((route) => (
            <Link
              key={route.id}
              href={`/routes?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`}
              className="group relative rounded-2xl border border-border bg-card p-4 sm:p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground font-mono mb-1">{route.type}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm truncate">{route.from}</span>
                    <ArrowRight className="size-3 text-primary shrink-0" />
                    <span className="font-bold text-sm truncate">{route.to}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs ml-2 shrink-0">
                  <Star className="size-3 text-amber-400 fill-amber-400" />
                  {route.rating}
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3 shrink-0" />
                  {route.duration}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="size-3 shrink-0" />
                  {route.seats} seats available
                </div>
              </div>

              <div className="flex gap-1.5 mb-3 sm:mb-4 min-h-[20px] flex-wrap">
                {route.amenities.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted rounded-lg px-1.5 py-0.5"
                  >
                    {AMENITY_ICONS[a]}
                    {a}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div>
                  <span className="text-base sm:text-lg font-black text-primary">
                    KES {route.price.toLocaleString()}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground"> /seat</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {route.seats <= 5 && (
                <div className="absolute top-3 right-3 text-[10px] bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full">
                  Only {route.seats} left
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="sm:hidden mt-5 text-center">
          <Link href="/routes" className="text-sm text-primary hover:underline">
            View all routes →
          </Link>
        </div>
      </section>

      {/* ── DESTINATIONS ─────────────────────────────────────── */}
      <DestinationsSection />

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <p className="text-[10px] sm:text-xs text-primary font-mono uppercase tracking-widest mb-2">
              Simple Process
            </p>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-black"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Travel in 3 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 relative">
            <div className="hidden sm:block absolute top-8 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            {STEPS.map((step, i) => (
              <div
                key={step.step}
                className="relative flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 sm:text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-0 sm:mb-5 relative z-10 shrink-0">
                  <span
                    className="text-lg sm:text-xl lg:text-2xl font-black text-primary"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {step.step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="sm:hidden absolute left-6 top-14 bottom-0 w-px bg-gradient-to-b from-primary/30 to-transparent h-full" />
                )}
                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-1.5 sm:mb-2">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-10 xl:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <p className="text-[10px] sm:text-xs text-primary font-mono uppercase tracking-widest mb-2">
            Why Kitui Travellers
          </p>
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-black"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Built for Kenyan Travellers
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 hover:border-primary/30 transition-colors"
            >
              <div
                className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${bg} mb-3 sm:mb-4`}
              >
                <Icon className={`size-4 sm:size-5 ${color}`} />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2 text-foreground">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="max-w-3xl lg:max-w-4xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
          <div className="relative border border-primary/20 rounded-2xl p-8 sm:p-10 lg:p-12 bg-card">
            <p className="text-[10px] sm:text-xs text-primary font-mono uppercase tracking-widest mb-3 sm:mb-4">
              Get Started Today
            </p>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-5 lg:mb-6 leading-tight"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Ready to Travel
              <br />
              <span className="text-primary">Smarter?</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-sm sm:max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed">
              Join thousands of Kenyan travellers who book with Kitui Travellers. Free to sign up —
              no hidden fees.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2.5 sm:gap-3">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20"
              >
                Create Free Account
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 shrink-0" />
              </Link>
              <Link
                href="/routes"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 border border-border rounded-xl font-medium text-sm hover:bg-muted transition-colors"
              >
                Browse Routes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
