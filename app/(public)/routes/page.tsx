import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import RoutesClient from "./RoutesClient";
import RoutesLoading from "./loading";

export const metadata: Metadata = {
  title: "Available Routes",
  description:
    "Browse bus, matatu, and coach routes from Kitui to Nairobi, Mombasa, Mwingi, and more. Real-time seat availability and instant M-Pesa booking.",
  alternates: { canonical: "/routes" },
  openGraph: {
    title: "Available Routes — Kitui Travellers",
    description:
      "Browse all available transport routes from Kitui. Instant online booking with M-Pesa.",
    url: "/routes",
    type: "website",
  },
};

export default function RoutesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <Suspense fallback={<RoutesLoading />}>
          <RoutesClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
