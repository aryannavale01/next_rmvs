import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://compassionglobal.org";

const STATIC_PAGES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/impact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/programs", changeFrequency: "weekly", priority: 0.9 },
  { path: "/resources", changeFrequency: "monthly", priority: 0.7 },
  { path: "/volunteer", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
  { path: "/donate", changeFrequency: "monthly", priority: 0.8 },
  { path: "/offices", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  let courses: { slug: string; updatedAt: Date }[] = [];
  try {
    courses = await prisma.course.findMany({
      where: { status: "active", visibility: { in: ["programs", "both"] } },
      select: { slug: true, updatedAt: true },
    });
  } catch {
    // If the DB is unreachable during build/health checks, fall back to pages only.
    courses = [];
  }

  for (const course of courses) {
    entries.push({
      url: `${SITE_URL}/programs/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}
