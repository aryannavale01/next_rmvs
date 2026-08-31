// Dev-only helper: removes QA test rows created during manual CMS image-upload
// testing (title/name prefixed with "QA") and deletes the matching test images
// that were uploaded to the public "cms-images" Supabase bucket.
//
// Usage:  node scripts/cleanup-qa.mjs
// Reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL from <project>/.env

import { createRequire } from "node:module";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(projectRoot, ".env") });

const prisma = new PrismaClient();

const QA_PREFIX = "QA";

async function deleteByPrefix(model, field, prefix, imageField = "image") {
  const rows = await prisma[model].findMany({
    where: { [field]: { startsWith: prefix } },
    select: { id: true, [field]: true, [imageField]: true },
  });
  if (rows.length === 0) {
    console.log(`[${model}] no QA rows`);
    return [];
  }
  await prisma[model].deleteMany({
    where: { [field]: { startsWith: prefix } },
  });
  console.log(`[${model}] deleted ${rows.length} QA row(s):`, rows.map((r) => r[field]).join(", "));
  return rows.map((r) => r[imageField]).filter(Boolean);
}

async function main() {
  const results = await Promise.all([
    deleteByPrefix("program", "title", QA_PREFIX),
    deleteByPrefix("galleryItem", "title", QA_PREFIX),
    deleteByPrefix("leader", "name", QA_PREFIX),
    deleteByPrefix("blogPost", "title", QA_PREFIX),
    deleteByPrefix("newsletter", "title", QA_PREFIX),
    deleteByPrefix("testimonial", "name", QA_PREFIX, "avatarUrl"),
  ]);
  const imageUrls = results.flat();

  // Remove the uploaded test files from the cms-images bucket.
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key && imageUrls.length > 0) {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const paths = imageUrls
      .map((u) => {
        const marker = `/storage/v1/object/public/cms-images/`;
        const idx = u.indexOf(marker);
        return idx >= 0 ? u.slice(idx + marker.length) : null;
      })
      .filter(Boolean);
    if (paths.length > 0) {
      const { error } = await supabase.storage.from("cms-images").remove(paths);
      if (error) {
        console.log("[storage] failed to remove some files:", error.message);
      } else {
        console.log(`[storage] removed ${paths.length} test image(s) from cms-images`);
      }
    }
  } else {
    console.log("[storage] skip (no image URLs or missing env)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
