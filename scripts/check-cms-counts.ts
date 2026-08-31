import { PrismaClient } from "@prisma/client";

const tables: { name: string; model: string }[] = [
  { name: "programs",      model: "program" },
  { name: "leaders",       model: "leader" },
  { name: "gallery_items", model: "galleryItem" },
  { name: "blog_posts",    model: "blogPost" },
  { name: "newsletters",   model: "newsletter" },
  { name: "locations",     model: "location" },
  { name: "contact_info",  model: "contactInfo" },
  { name: "social_links",  model: "socialLink" },
  { name: "testimonials",  model: "testimonial" },
  { name: "milestones",    model: "milestone" },
  { name: "schemes",       model: "scheme" },
  { name: "partners",      model: "partner" },
];

async function main() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log("Connected to database.\n");
  console.log("=== CMS Table Row Counts ===\n");

  for (const t of tables) {
    const count = await (prisma as any)[t.model].count();
    console.log(`${t.name.padEnd(20)} ${count}`);
  }

  console.log("\nDone.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });