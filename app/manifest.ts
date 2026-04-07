import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kitui Travellers",
    short_name: "KT Booking",
    description: "Book bus, matatu, and coach tickets across Kitui and Eastern Kenya",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1120",
    theme_color: "#f97316",
    orientation: "portrait-primary",
    lang: "en-KE",
    categories: ["travel", "transportation"],
    icons: [
      { src: "/icon-192.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      {
        src: "/og-image.svg",
        sizes: "1200x630",
        type: "image/svg+xml",
        form_factor: "wide",
        label: "Kitui Travellers — Book Bus & Matatu Tickets",
      },
    ],
  };
}
