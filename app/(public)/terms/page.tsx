import { Navbar } from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import Link from "next/link";
import { FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions for using the Kitui Travellers online booking platform — booking, payment, cancellation and refund policies.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: false },
};

const SECTIONS = [
  {
    title: "1. Booking and Payment",
    body: "Bookings are confirmed only after successful M-Pesa payment. A unique booking code (format KT-XXXXX) is issued upon payment — this must be presented to the conductor at boarding. Kitui Travellers reserves the right to cancel unconfirmed bookings.",
  },
  {
    title: "2. Cancellations and Refunds",
    body: "Cancellations made at least 2 hours before departure are eligible for a full refund within 3 business days. Cancellations less than 2 hours before departure, or no-shows, are non-refundable. Kitui Travellers may cancel trips for operational or safety reasons with a full refund.",
  },
  {
    title: "3. Passenger Responsibilities",
    body: "Passengers must arrive at least 15 minutes before departure. A valid national ID or passport is required. Children under 12 must be accompanied by an adult. Passengers are responsible for their personal belongings.",
  },
  {
    title: "4. Conduct",
    body: "Passengers must behave respectfully towards staff and fellow passengers. We reserve the right to refuse service to any person who is intoxicated, abusive, or poses a safety risk, with no refund issued.",
  },
  {
    title: "5. Limitation of Liability",
    body: "Kitui Travellers is not liable for delays caused by traffic, weather, or events outside our control. Liability for loss or damage to passenger property is limited to the fare paid. We carry passenger liability insurance as required by Kenyan law.",
  },
  {
    title: "6. Account Security",
    body: "You are responsible for maintaining the security of your account credentials. Do not share your password. Report any unauthorized access to support@kuittravellers.co.ke immediately. Accounts used for fraudulent bookings will be permanently suspended.",
  },
  {
    title: "7. Governing Law",
    body: "These terms are governed by the laws of Kenya. Any disputes shall be resolved under the jurisdiction of Kenyan courts.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <section className="border-b border-border">
          <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="size-5 text-primary" />
              </div>
              <span className="text-xs text-primary font-mono uppercase tracking-widest">
                Legal
              </span>
            </div>
            <h1
              className="text-4xl sm:text-5xl font-black text-foreground mb-3"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Terms of Service
            </h1>
            <p className="text-sm text-muted-foreground">Last updated: March 2026</p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16 space-y-10">
          {SECTIONS.map(({ title, body }) => (
            <div key={title} className="pb-10 border-b border-border/50 last:border-0 last:pb-0">
              <h2 className="text-lg font-bold text-foreground mb-3">{title}</h2>
              <p className="text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              By using Kitui Travellers services, you agree to these terms. Questions?{" "}
              <Link href="/contact" className="text-primary hover:underline font-medium">
                Contact us
              </Link>{" "}
              or email{" "}
              <a
                href="mailto:support@kuittravellers.co.ke"
                className="text-primary hover:underline font-medium"
              >
                support@kuittravellers.co.ke
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer /> {/* ← footer only here */}
    </div>
  );
}
