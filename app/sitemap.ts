import type { MetadataRoute } from "next";
import { ALL_DESTINATIONS } from "@/components/landing/destinations-section";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kuittravellers.co.ke";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/routes`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    {
      url: `${BASE_URL}/destinations`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/auth/login`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/auth/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  // Dynamic destination detail pages — each gets its own indexed URL
  const destinationPages: MetadataRoute.Sitemap = ALL_DESTINATIONS.map((dest) => ({
    url: `${BASE_URL}/destinations/${dest.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...destinationPages];
}
