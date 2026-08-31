import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://compassionglobal.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api/", "/setup-2fa", "/verify", "/force-password-change"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
