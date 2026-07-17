import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKETS } from "@/constants";
import { requireRole } from "@/features/auth/guards";

export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  const guard = await requireRole(["admin", "scorer"]);
  if (guard instanceof NextResponse) return guard;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string | null;

    if (!file || !bucket) {
      return NextResponse.json({ error: "File and bucket are required." }, { status: 400 });
    }

    const allowedBuckets = Object.values(STORAGE_BUCKETS) as readonly string[];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ error: "Invalid bucket." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file." }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the 5 MB size limit." },
        { status: 413 },
      );
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use PNG, JPEG, WebP, or GIF." },
        { status: 415 },
      );
    }

    const supabase = createServiceClient();
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({ path: data.path, url: urlData.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
