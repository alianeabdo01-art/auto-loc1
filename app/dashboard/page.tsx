import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/supabase/admin";
import DashboardClient from "@/app/components/dashboard-client";
import type { Reservation } from "@/lib/types";

export const metadata = {
  title: "My Dashboard — Auto-Loc",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (isAdminUser(user)) {
    redirect("/admin");
  }

  const { data: reservations, error: reservationsError } = await supabase
    .from("reservations")
    .select(
      `
      *,
      cars (
        brand,
        model,
        price_per_day,
        image_url
      )
    `,
    )
    .order("created_at", { ascending: false })
    .returns<Reservation[]>();

  if (reservationsError) {
    throw new Error(reservationsError.message);
  }

  return <DashboardClient userEmail={user.email ?? ""} reservations={reservations ?? []} />;
}