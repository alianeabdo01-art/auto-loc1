import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { isAdminUser } from "@/lib/supabase/admin";

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase: createAdminClient(), user };
}

export async function GET(request: Request) {
  const { supabase, user } = await getAdminClient();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("cars")
    .select("id, brand, model, price_per_day, availability, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cars: data });
}

export async function POST(request: Request) {
  const { supabase, user } = await getAdminClient();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { brand, model, price_per_day, availability, image_url } = body;

  if (!brand || !model || price_per_day === undefined) {
    return NextResponse.json({ error: "Missing required car fields" }, { status: 400 });
  }

  const payload = {
    brand,
    model,
    price_per_day: Number(price_per_day),
    availability: Boolean(availability),
    image_url: image_url ?? null,
  };

  const { data, error } = await supabase.from("cars").insert(payload).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ car: data });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getAdminClient();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, brand, model, price_per_day, availability, image_url } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing car id" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (brand !== undefined) payload.brand = brand;
  if (model !== undefined) payload.model = model;
  if (price_per_day !== undefined) payload.price_per_day = Number(price_per_day);
  if (availability !== undefined) payload.availability = Boolean(availability);
  if (image_url !== undefined) payload.image_url = image_url !== null ? image_url : null;

  const { data, error } = await supabase.from("cars").update(payload).eq("id", id).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ car: data });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getAdminClient();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing car id" }, { status: 400 });
  }

  const { error } = await supabase.from("cars").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
