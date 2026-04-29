"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useAuthSession } from "./auth-session-provider";
import { useToast } from "./toast";
import { type Car } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Available Cars</h1>
        <p className="mt-1 text-sm leading-relaxed text-[#a0a0b8]">Browse our fleet and reserve your next ride.</p>
      </div>

      <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by brand or model..."
          className="w-full rounded-xl border border-[#ffffff0f] bg-[#111118] px-4 py-2.5 text-white placeholder:text-[#55556a] outline-none focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff]"
        />
      </div>

      <div className="mt-6 mb-8 flex gap-3">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${filter === "all" ? "bg-[#6c63ff] text-white shadow-[0_0_24px_#6c63ff44]" : "border border-[#ffffff1a] text-[#a0a0b8] hover:bg-[#1e1e2a] hover:text-white"}`}
        >
          All Cars <span className="ml-1.5 text-xs text-[#55556a]">({allCount})</span>
        </button>
        <button
          onClick={() => setFilter("available")}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${filter === "available" ? "bg-[#6c63ff] text-white shadow-[0_0_24px_#6c63ff44]" : "border border-[#ffffff1a] text-[#a0a0b8] hover:bg-[#1e1e2a] hover:text-white"}`}
        >
          Available Only <span className="ml-1.5 text-xs text-[#55556a]">({availableCount})</span>
        </button>
      </div>

      {filteredCars.length === 0 ? (
        <div className="mt-20 text-center text-[#55556a]">
          <div className="text-6xl">🚗</div>
          <p className="mt-3 text-lg">No cars available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCars.map((car) => (
            <article key={car.id} className="group overflow-hidden rounded-2xl border border-[#ffffff0f] bg-[#16161f] transition-all duration-200 hover:border-[#6c63ff33] hover:bg-[#1e1e2a] cursor-pointer">
              <div className="relative h-48 overflow-hidden bg-[#111118]">
                {car.image_url ? (
                  <Image
                    src={car.image_url}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    priority={filteredCars.indexOf(car) === 0}
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#55556a]">No image available</div>
                )}
                <span className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-xs font-medium ${car.availability ? "border-[#22c55e33] bg-[#22c55e15] text-[#22c55e]" : "border-[#ef444433] bg-[#ef444415] text-[#ef4444]"}`}>
                  {car.availability ? "available" : "unavailable"}
                </span>
              </div>

              <div className="p-5">
                <h2 className="text-lg font-semibold text-white">{car.brand} {car.model}</h2>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-xl font-bold text-[#6c63ff]">{formatCurrency(car.price_per_day)}</span>
                  <span className="pb-1 text-sm text-[#55556a]">/ day</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleReserveClick(car)}
                  disabled={!car.availability}
                  className="mt-4 inline-flex w-full justify-center rounded-xl bg-[#6c63ff] px-5 py-2.5 font-medium text-white shadow-[0_0_24px_#6c63ff44] hover:bg-[#7c74ff] hover:shadow-[0_0_32px_#6c63ff66] active:scale-[0.97] disabled:cursor-not-allowed disabled:border disabled:border-[#ffffff1a] disabled:bg-transparent disabled:text-[#a0a0b8] disabled:shadow-none"
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