type UploadResult = {
  path: string;
  url: string;
  bucket: string;
};

function sanitizeFileName(name: string): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return base || "upload.bin";
}

function getExt(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx < 0) return "bin";
  return fileName.slice(idx + 1).toLowerCase() || "bin";
}

export async function uploadImageFile(file: File, folder = "refs"): Promise<UploadResult> {
  const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
  const bucket = String(import.meta.env.VITE_SUPABASE_UPLOADS_BUCKET ?? "project-assets").trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  }

  const ext = getExt(file.name);
  const safeName = sanitizeFileName(file.name).replace(/\.[a-z0-9]+$/, "");
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}.${ext}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

  const resp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${supabaseAnonKey}`,
      "x-upsert": "true",
      "content-type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Upload failed (${resp.status})`);
  }

  const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  return { path, url, bucket };
}

