import { createClient } from "@supabase/supabase-js";

function getServiceRoleClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function generateUploadUrl(
  bucket: string,
  path: string,
  expiresIn = 60
) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path, { upsert: false });
  if (error) throw error;
  return data;
}

export async function generateSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteFile(bucket: string, path: string) {
  const supabase = getServiceRoleClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export async function listFiles(bucket: string, prefix: string) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix);
  if (error) throw error;
  return data;
}
