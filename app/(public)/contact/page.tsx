import { Navbar } from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ArrowRight, MessageSquare } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Reach Kitui Travellers Sacco support — open daily 6 AM to 10 PM. Phone, email, or visit our Kitui Town Bus Station office.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Kitui Travellers",
    description: "We're here to help. Available daily 6 AM – 10 PM by phone, email, or in person.",
    url: "/contact",
    type: "website",
  },
};

const CONTACT_ITEMS = [
  {
    icon: Phone,
    title: "Phone",
    value: "+254 700 000 000",
    sub: "Mon–Sun, 6am–10pm",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    href: "tel:+254700000000",
  },
  {
    icon: Mail,
    title: "Email",
    value: "support@kuittravellers.co.ke",
    sub: "Reply within 24 hours",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    href: "mailto:support@kuittravellers.co.ke",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "Kitui Town Bus Station, Kitui County",
    sub: "Mon–Sat, 7am–7pm",
    color: "text-primary",
    bg: "bg-primary/10",
    href: "https://maps.google.com/?q=Kitui+Town+Bus+Station+Kenya",
  },
  {
    icon: Clock,
    title: "Hours",
    value: "Daily 6:00 AM – 10:00 PM",
    sub: "Incl. weekends & holidays",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    href: null,
  },
];

export default function ContactPage() {
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
                "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative max-w-4xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
            <p className="text-xs text-primary font-mono uppercase tracking-widest mb-3">
              We&apos;re Here to Help
            </p>
            <h1
              className="text-4xl sm:text-5xl font-black text-foreground mb-4"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Contact Us
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Have a question about a booking? Need help with a payment? We&apos;re available every
              day from 6 AM to 10 PM.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-16 space-y-10">
          {/* Contact cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {CONTACT_ITEMS.map(({ icon: Icon, title, value, sub, color, bg, href }) => {
              const card = (
                <div
                  className={`rounded-2xl border border-border bg-card p-6 space-y-3 transition-colors ${href ? "hover:border-primary/30" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`size-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{title}</p>
                    <p className="font-semibold text-foreground text-sm">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                </div>
              );
              return href ? (
                <a
                  key={title}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                >
                  {card}
                </a>
              ) : (
                <div key={title}>{card}</div>
              );
            })}
          </div>

          {/* Booking issues */}
          <div className="rounded-2xl border border-border bg-card p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
                <MessageSquare className="size-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-foreground mb-3">For Booking Issues</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Have your booking code ready (format:{" "}
                  <span className="font-mono text-primary">KT-XXXXX</span>). For M-Pesa disputes, we
                  may ask for your receipt number.
                </p>
                <Link
                  href="/user/bookings"
                  className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:gap-3 transition-all"
                >
                  View my bookings <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
