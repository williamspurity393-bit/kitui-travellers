import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kuittravellers.co.ke";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Kitui Travellers — Book Bus, Matatu & Coach Tickets Online",
    template: "%s | Kitui Travellers",
  },
  description:
    "Book bus, matatu, and coach tickets across Kitui and Eastern Kenya. Real-time seat availability, instant QR tickets, and M-Pesa payment.",
  keywords: [
    "bus booking Kenya",
    "Kitui transport",
    "matatu booking",
    "Kitui Nairobi bus",
    "Kitui Mombasa bus",
    "online bus ticket Kenya",
    "M-Pesa bus booking",
    "Mwingi transport",
    "Eastern Kenya bus",
    "Kitui Travellers Sacco",
    "Nzambani Rock",
    "Kitui destinations",
    "things to do in Kitui",
    "Kitui tourism",
  ],
  authors: [{ name: "Kitui Travellers Sacco", url: BASE_URL }],
  creator: "Kitui Travellers Sacco",
  publisher: "Kitui Travellers Sacco",
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: BASE_URL,
    siteName: "Kitui Travellers",
    title: "Kitui Travellers — Book Bus Tickets Online",
    description:
      "Book bus, matatu, and coach tickets across Kitui and Eastern Kenya. M-Pesa payment, instant QR ticket.",
    // SVG og-image — renders perfectly at any size for social cards
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Kitui Travellers — Book Bus Tickets Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kitui Travellers — Book Bus Tickets Online",
    description: "Book bus, matatu, and coach tickets across Kitui and Eastern Kenya.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    // SVG favicon — crisp at any size, supports dark/light via CSS
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }, // fallback for old browsers
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.svg",
  },
  alternates: { canonical: BASE_URL },
  applicationName: "Kitui Travellers",
  category: "Travel",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* SVG favicon — adaptive to dark/light OS theme */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Kitui Travellers Sacco",
              description: "Online bus and matatu ticket booking for Kitui and Eastern Kenya",
              url: BASE_URL,
              telephone: "+254700000000",
              image: `${BASE_URL}/og-image.svg`,
              logo: `${BASE_URL}/icon-192.svg`,
              address: {
                "@type": "PostalAddress",
                streetAddress: "Kitui Town Bus Station",
                addressLocality: "Kitui",
                addressRegion: "Kitui County",
                addressCountry: "KE",
              },
              areaServed: ["Kitui", "Nairobi", "Mombasa", "Mwingi", "Kenya"],
              serviceType: "Passenger Transport",
              priceRange: "KES 200 – KES 1,500",
              openingHours: "Mo-Su 06:00-22:00",
              sameAs: [
                "https://www.facebook.com/kuittravellers",
                "https://twitter.com/kuittravellers",
              ],
            }),
          }}
        />
      </head>
      <body
        className={cn(
          syne.variable,
          jetbrainsMono.variable,
          "font-mono antialiased bg-background text-foreground"
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ConvexClientProvider>
            {children}
            <Toaster />
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
