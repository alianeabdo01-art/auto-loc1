import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { isAdminUser } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  const { reservationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const adminDb = createAdminClient();

  try {
    const { status } = await request.json() as { status: "confirmed" | "cancelled" };

    if (!["confirmed", "cancelled"].includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status" }),
        { status: 400 }
      );
    }

    // Update reservation status
    const { data: reservation, error: updateError } = await adminDb
      .from("reservations")
      .update({ status })
      .eq("id", reservationId)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    // If cancelled, make the car available again
    if (status === "cancelled") {
      const { error: carError } = await adminDb
        .from("cars")
        .update({ availability: true })
        .eq("id", reservation.car_id);

      if (carError) {
        console.error("Error updating car availability:", carError.message);
      }
    }

    return new Response(
      JSON.stringify({ success: true, reservation }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating reservation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to update reservation",
      }),
      { status: 500 }
    );
  }
}
