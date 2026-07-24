import { createClient } from "@supabase/supabase-js";

export function getServiceRoleClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL env var");
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
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

export async function uploadFile(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ path: string }> {
  const supabase = getServiceRoleClient();
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, new Blob([arrayBuffer], { type: contentType }), { upsert: false });
  if (error) throw error;
  return { path: data.path };
}

export async function listFiles(bucket: string, prefix: string) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix);
  if (error) throw error;
  return data;
}

export async function downloadFile(
  bucket: string,
  path: string,
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;
  return {
    buffer: await data.arrayBuffer(),
    contentType: data.type || "application/octet-stream",
  };
}
