import { Navbar } from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Kitui Travellers collects, uses, and protects your personal data under the Kenyan Data Protection Act 2019.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: false },
};

const SECTIONS = [
  {
    title: "1. Data We Collect",
    body: "When you create an account and book with Kitui Travellers, we collect your name, phone number, email address, national ID or passport number (optional), M-Pesa payment transaction records, and booking history. We do not store your M-Pesa PIN.",
  },
  {
    title: "2. How We Use Your Data",
    body: "Your data is used to process and confirm bookings, send payment confirmations and trip reminders, verify your identity at boarding, and improve our services. We do not sell your personal data to third parties.",
  },
  {
    title: "3. M-Pesa Payments",
    body: "Payment processing is handled by Safaricom's M-Pesa platform. We store only the M-Pesa receipt number and transaction amount for record-keeping. Your phone number is used solely to initiate the payment prompt.",
  },
  {
    title: "4. Data Retention",
    body: "Booking records are retained for 7 years as required by Kenyan financial regulations. You may request deletion of your account and personal data at any time by contacting us, subject to legal retention requirements.",
  },
  {
    title: "5. Your Rights (Kenyan Data Protection Act 2019)",
    body: "You have the right to access your personal data, correct inaccurate information, request deletion, object to processing, and data portability. Contact us at support@kuittravellers.co.ke to exercise these rights.",
  },
  {
    title: "6. Security",
    body: "All data is transmitted over HTTPS. Passwords are hashed using industry-standard algorithms. We conduct regular security reviews. In the event of a data breach, we will notify you within 72 hours.",
  },
  {
    title: "7. Contact",
    body: "For privacy-related inquiries: support@kuittravellers.co.ke · +254 700 000 000 · Kitui Town, Kitui County, Kenya.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <section className="border-b border-border">
          <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="size-5 text-primary" />
              </div>
              <span className="text-xs text-primary font-mono uppercase tracking-widest">
                Legal
              </span>
            </div>
            <h1
              className="text-4xl sm:text-5xl font-black text-foreground mb-3"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: March 2026 · Governed by the Kenyan Data Protection Act 2019
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16 space-y-10">
          {SECTIONS.map(({ title, body }) => (
            <div key={title} className="pb-10 border-b border-border/50 last:border-0 last:pb-0">
              <h2 className="text-lg font-bold text-foreground mb-3">{title}</h2>
              <p className="text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer /> {/* ← footer only here */}
    </div>
  );
}
