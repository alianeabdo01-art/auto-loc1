import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { isAdminUser } from "@/lib/supabase/admin";
import AdminDashboardClient from "@/app/components/admin-dashboard-client";
import type { Car, Reservation } from "@/lib/types";

export const metadata = {
  title: "Admin — Auto-Loc",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) {
    redirect("/");
  }

  const adminDb = createAdminClient();

  // Fetch cars for car management
  const { data: cars, error: carsError } = await adminDb
    .from("cars")
    .select("id, brand, model, price_per_day, availability, image_url, created_at")
    .order("created_at", { ascending: false });

  if (carsError) {
    throw new Error(carsError.message);
  }

  // Fetch reservations for reservation management
  const { data: reservationsWithUsers, error: reservationsWithUsersError } = await adminDb
    .from("reservations")
    .select(
      "id, user_id, car_id, start_date, end_date, status, license_file_url, created_at, cars(brand, model, price_per_day, image_url), users(email)"
    )
    .order("created_at", { ascending: false })
    .returns<Reservation[]>();

  let reservations: Reservation[] | null = null;
  let reservationsError = reservationsWithUsersError;

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
    reservationsError = fallbackError;
  }

  if (reservationsError) {
    throw new Error(reservationsError.message);
  }

  return (
    <AdminDashboardClient
      initialCars={(cars ?? []) as Car[]}
      initialReservations={
        (reservations ?? []).map((reservation) => ({
          ...reservation,
          user_email: reservation.users?.email ?? null,
        }))
      }
    />
  );
}
