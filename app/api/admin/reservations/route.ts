import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { isAdminUser } from "@/lib/supabase/admin";
import type { Reservation } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminDb = createAdminClient();

  try {
    const { data: reservationsWithUsers, error: reservationsWithUsersError } = await adminDb
      .from("reservations")
      .select(
        "id, user_id, car_id, start_date, end_date, status, license_file_url, created_at, cars(brand, model, price_per_day, image_url), users(email)"
      )
      .order("created_at", { ascending: false })
      .returns<Reservation[]>();

    let reservations: Reservation[] | null = null;
    let error = reservationsWithUsersError;

    if (!reservationsWithUsersError) {
      reservations = reservationsWithUsers;
    } else {
      const { data: fallbackReservations, error: fallbackError } = await adminDb
        .from("reservations")
        .select(
          "id, user_id, car_id, start_date, end_date, status, license_file_url, created_at, cars(brand, model, price_per_day, image_url)"
        )
        .order("created_at", { ascending: false })
        .returns<Reservation[]>();

      reservations = fallbackReservations;
      error = fallbackError;
    }

    if (error) {
      console.error("Supabase error fetching reservations:", error);
      throw new Error(error.message);
    }

    return NextResponse.json({
      reservations: (reservations ?? []).map((reservation) => ({
        ...reservation,
        user_email: reservation.users?.email ?? null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}
