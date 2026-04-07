import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kuittravellers.co.ke";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/routes",
          "/destinations",
          "/destinations/*",
          "/about",
          "/contact",
          "/terms",
          "/privacy",
        ],
        disallow: [
          "/dashboard",
          "/user/",
          "/driver/",
          "/admin/",
          "/auth/onboarding",
          "/auth/reset-password",
          "/api/",
          "/booking/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
