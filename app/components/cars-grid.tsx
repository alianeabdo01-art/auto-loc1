"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useAuthSession } from "./auth-session-provider";
import { useToast } from "./toast";
import { type Car } from "@/lib/types";
import { formatCurrency, resolveImageUrl } from "@/lib/utils";

type CarsGridClientProps = {
  initialCars: Car[];
  initialLoggedIn: boolean;
};

export default function CarsGridClient({ initialCars, initialLoggedIn }: CarsGridClientProps) {
  const router = useRouter();
  const { email } = useAuthSession();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "available">("all");
  const [signInPrompt, setSignInPrompt] = useState<string | null>(null);

  const loggedIn = Boolean(email ?? (initialLoggedIn ? "1" : null));

  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase();

    return initialCars.filter((car) => {
      const matchesSearch =
        !query ||
        car.brand.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query);
      const matchesAvailability = filter === "all" || car.availability;

      return matchesSearch && matchesAvailability;
    });
  }, [filter, initialCars, search]);

  const allCount = initialCars.length;
  const availableCount = initialCars.filter((car) => car.availability).length;

  const handleReserveClick = (car: Car) => {
    if (!car.availability) {
      return;
    }

    if (!loggedIn) {
      setSignInPrompt(car.id);
      showToast("Sign in to reserve", "error");
      window.setTimeout(() => {
        router.push("/login");
      }, 800);
      return;
    }

    router.push(`/cars/${car.id}`);
  };

  return (
    <section className="fade-up py-10">
      <div className="mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1220]/80 p-8 shadow-[0_32px_90px_rgba(35,63,120,0.22)] backdrop-blur-xl">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr] lg:items-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-[#94a1ff]">Premium Fleet</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Rent the perfect car in minutes</h1>
            <p className="max-w-2xl text-base leading-7 text-[#c7c9db]">
              Discover our curated collection of city cars, SUVs, and premium models. Easily filter by availability and reserve with a fast, secure experience backed by Supabase.
            </p>
          </div>

          <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-[#111827]/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#8d95ff]">Quick overview</p>
                <p className="mt-2 text-xl font-semibold text-white">{availableCount} / {allCount} available</p>
              </div>
              <span className="rounded-full bg-[#1f2741] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[#9aa6ff]">Live</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-[#0c1221] px-4 py-4 text-sm text-[#b8bee7]">Modern responsive layout</div>
              <div className="rounded-3xl bg-[#0c1221] px-4 py-4 text-sm text-[#b8bee7]">Smooth hover interactions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-white">Available Cars</h2>
          <p className="mt-2 text-sm text-[#abb0d7]">Browse our fleet and reserve your next ride.</p>
        </div>

        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-[1.5fr_1fr] lg:max-w-none">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by brand or model..."
            className="w-full rounded-[1.5rem] border border-white/10 bg-[#0f1220] px-5 py-3 text-sm text-white placeholder:text-[#6f7396] outline-none focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff33]"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                filter === "all"
                  ? "bg-gradient-to-r from-[#6c63ff] to-[#37d1ff] text-white shadow-[0_20px_45px_rgba(108,99,255,0.26)]"
                  : "border border-white/10 bg-[#0f1220] text-[#c3c6da] hover:bg-[#171d32] hover:text-white"
              }`}
            >
              All Cars <span className="ml-2 text-xs text-[#8a8fb1]">({allCount})</span>
            </button>
            <button
              onClick={() => setFilter("available")}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                filter === "available"
                  ? "bg-gradient-to-r from-[#6c63ff] to-[#37d1ff] text-white shadow-[0_20px_45px_rgba(108,99,255,0.26)]"
                  : "border border-white/10 bg-[#0f1220] text-[#c3c6da] hover:bg-[#171d32] hover:text-white"
              }`}
            >
              Available <span className="ml-2 text-xs text-[#8a8fb1]">({availableCount})</span>
            </button>
          </div>
        </div>
      </div>

      {filteredCars.length === 0 ? (
        <div className="mt-20 flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-[#0b1220]/70 p-14 text-center shadow-[0_28px_80px_rgba(0,0,0,0.24)]">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#111827] text-5xl">🚗</div>
          <p className="text-xl font-semibold text-white">No cars available right now.</p>
          <p className="max-w-xl text-sm leading-6 text-[#a3a8c5]">Try clearing the search or switch to the full list to see more options.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCars.map((car) => (
            <article key={car.id} className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#111827]/90 shadow-[0_28px_80px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(46,96,255,0.18)]">
              <div className="relative h-64 overflow-hidden rounded-t-[2rem] bg-gradient-to-br from-[#111827] via-[#0f1222] to-[#090c14] image-skeleton">
                {car.image_url ? (
                  <Image
                    src={resolveImageUrl(car.image_url) ?? car.image_url}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    priority={filteredCars.indexOf(car) === 0}
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#0f1220] text-[#7d8397]">No image available</div>
                )}
                <span className={`absolute right-4 top-4 inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] ${car.availability ? "border-[#22c55e33] bg-[#22c55e15] text-[#86efac]" : "border-[#ef444433] bg-[#ef444435] text-[#fecaca]"}`}>
                  {car.availability ? "Available" : "Unavailable"}
                </span>
              </div>

              <div className="space-y-4 p-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#8b92bf]">{car.brand}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{car.model}</h2>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#9aa1c7]">Price</p>
                    <p className="mt-1 text-2xl font-semibold text-[#6c63ff]">{formatCurrency(car.price_per_day)}</p>
                  </div>
                  <span className="rounded-2xl bg-[#141b2d] px-4 py-2 text-xs uppercase tracking-[0.25em] text-[#adb4d8]">per day</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleReserveClick(car)}
                  disabled={!car.availability}
                  className="mt-1 inline-flex w-full items-center justify-center rounded-[1.5rem] bg-gradient-to-r from-[#6c63ff] to-[#32d5ff] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(52,113,255,0.26)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(59,106,255,0.28)] disabled:cursor-not-allowed disabled:bg-[#1a1f2d] disabled:text-[#78819a] disabled:shadow-none"
                >
                  {signInPrompt === car.id ? "Sign in to reserve" : car.availability ? "Reserve Now" : "Unavailable"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}