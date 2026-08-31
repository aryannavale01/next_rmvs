// One-time setup: ensures the public "cms-images" Supabase storage bucket exists.
// All admin-uploaded CMS images (gallery, leadership, programs, resources,
// testimonials) are stored in this single bucket.
//
// Usage:  node scripts/create-cms-bucket.mjs
// Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from <project>/.env

import { createRequire } from "node:module";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const dotenv = require("dotenv");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(projectRoot, ".env") });

const { createClient } = require("@supabase/supabase-js");

const BUCKET = "cms-images";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const { data: existing, error: listError } = await supabase.storage.getBucket(BUCKET);
  if (listError && listError.message?.toLowerCase().includes("not found")) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) {
      console.error(`Could not create bucket "${BUCKET}":`, error.message);
      process.exit(1);
    }
    console.log(`Created public bucket "${BUCKET}".`);
    return;
  }
  if (existing) {
    if (!existing.public) {
      await supabase.storage.updateBucket(BUCKET, { public: true });
      console.log(`Bucket "${BUCKET}" exists — set to public.`);
    } else {
      console.log(`Bucket "${BUCKET}" already exists and is public.`);
    }
    return;
  }
  if (listError) {
    console.error(`Could not inspect bucket "${BUCKET}":`, listError.message);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
