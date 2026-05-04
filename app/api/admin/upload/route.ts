import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { isAdminUser } from "@/lib/supabase/admin";

const BUCKET_NAME = process.env.SUPABASE_CAR_IMAGE_BUCKET ?? "car-images";

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase: createAdminClient(), user };
}

export async function POST(request: Request) {
  const { supabase, user } = await getAdminClient();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${Date.now()}-${safeName}`;
  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, new Uint8Array(fileBuffer), {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  if (!publicData?.publicUrl) {
    return NextResponse.json({ error: "Failed to get public URL" }, { status: 500 });
  }

  if (publicData?.publicUrl) {
    return NextResponse.json({ image_url: publicData.publicUrl });
  }

  const { data: signedData, error: signedUrlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 60 * 60 * 24 * 365);

  if (signedUrlError) {
    return NextResponse.json({ error: signedUrlError.message }, { status: 500 });
  }

  return NextResponse.json({ image_url: signedData.signedUrl });
}
