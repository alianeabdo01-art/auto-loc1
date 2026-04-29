import { createClient } from "@/lib/supabase/server";
import CarsGridClient from "@/app/components/cars-grid";

export const metadata = {
  title: "Browse Cars — Auto-Loc",
};

export default async function CarsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: cars, error } = await supabase
    .from("cars")
    .select("id, brand, model, price_per_day, availability, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <section className="fade-up py-10">
        <div className="rounded-2xl border border-[#ef444433] bg-[#ef444415] p-6 text-center text-[#ef4444]">
          Failed to load cars. Please refresh the page.
        </div>
      </section>
    );
  }

  return <CarsGridClient initialCars={cars ?? []} initialLoggedIn={Boolean(user)} />;
}