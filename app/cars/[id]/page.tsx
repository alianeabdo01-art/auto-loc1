import Image from "next/image";
import { notFound } from "next/navigation";

/*
  IMPORTANT: Run these SQL statements in Supabase SQL Editor
  if car availability updates fail (RLS blocks UPDATE on cars):

  -- Allow authenticated users to update car availability
  CREATE POLICY "Auth users can update cars"
  ON cars FOR UPDATE
  USING (auth.uid() IS NOT NULL);

  -- Allow authenticated users to update their own reservations
  CREATE POLICY "Users can update own reservations"
  ON reservations FOR UPDATE
  USING (auth.uid() = user_id);
*/

import ReservationForm from "@/app/components/reservation-form";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import type { Car } from "@/lib/types";
import BackToCarsLink from "@/app/components/back-to-cars-link";

type CarPageProps = {
  params: Promise<{ id: string }>;
};

async function getCar(id: string) {
  const supabase = await createClient();

  return supabase.from("cars").select("id, brand, model, price_per_day, availability, image_url").eq("id", id).maybeSingle<Car>();
}

export async function generateMetadata({ params }: CarPageProps) {
  const { id } = await params;
  const { data } = await getCar(id);

  if (!data) {
    return {
      title: "Car Details — Auto-Loc",
    };
  }

  return {
    title: `${data.brand} ${data.model} — Auto-Loc`,
  };
}

export default async function CarDetailsPage({ params }: CarPageProps) {
  const { id } = await params;
  const { data: car, error } = await getCar(id);

  if (error) {
    throw new Error(error.message);
  }

  if (!car) {
    notFound();
  }

  return (
    <section className="fade-up py-10">
      <div className="flex items-center justify-between text-sm text-[#55556a]">
        <BackToCarsLink />
        <span className="hidden sm:inline">{car.brand} {car.model}</span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <article>
          <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-[#ffffff0f] bg-[#16161f]">
          {car.image_url ? (
            <Image
              src={car.image_url}
              alt={`${car.brand} ${car.model}`}
              fill
              className="object-cover"
              priority
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#111118] text-[#55556a]">
              No image available
            </div>
          )}
            <span className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-xs font-medium ${car.availability ? "border-[#22c55e33] bg-[#22c55e15] text-[#22c55e]" : "border-[#ef444433] bg-[#ef444415] text-[#ef4444]"}`}>
              {car.availability ? "available" : "unavailable"}
            </span>
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">{car.brand} {car.model}</h1>
          <div className="my-4 border-t border-[#ffffff0f]" />
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#55556a]">PRICE PER DAY</p>
            <p className="mt-1 text-3xl font-bold text-[#6c63ff]">{formatCurrency(car.price_per_day)} DA</p>
          </div>
        </article>

        <ReservationForm carId={car.id} pricePerDay={Number(car.price_per_day)} available={car.availability} />
      </div>
    </section>
  );
}