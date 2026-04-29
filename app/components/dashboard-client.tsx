"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { type Reservation } from "@/lib/types";
import { formatReservationDates } from "@/lib/utils";
import { useToast } from "./toast";

type DashboardClientProps = {
  userEmail: string;
  reservations: Reservation[];
};

const statusStyles: Record<Reservation["status"], string> = {
  pending: "border-[#f59e0b33] bg-[#f59e0b15] text-[#f59e0b]",
  confirmed: "border-[#22c55e33] bg-[#22c55e15] text-[#22c55e]",
  cancelled: "border-[#ef444433] bg-[#ef444415] text-[#ef4444]",
};

function calculateDays(startDate: string, endDate: string) {
  return Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardClient({ userEmail, reservations: initialReservations }: DashboardClientProps) {
  const { showToast } = useToast();
  const [reservations, setReservations] = useState(initialReservations);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const stats = useMemo(() => ({
    total: reservations.length,
    pending: reservations.filter((reservation) => reservation.status === "pending").length,
    confirmed: reservations.filter((reservation) => reservation.status === "confirmed").length,
    cancelled: reservations.filter((reservation) => reservation.status === "cancelled").length,
  }), [reservations]);

  const handleCancel = async (reservation: Reservation) => {
    const supabase = createClient();
    const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", reservation.id);

    if (error) {
      showToast("Failed to cancel reservation", "error");
      return;
    }

    const { error: carError } = await supabase.from("cars").update({ availability: true }).eq("id", reservation.car_id);
    if (carError) {
      console.error(carError.message);
    }

    setReservations((current) =>
      current.map((item) => (item.id === reservation.id ? { ...item, status: "cancelled" } : item)),
    );
    setConfirmingId(null);
    showToast("Reservation cancelled", "success");
  };

  return (
    <section className="fade-up py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">My Dashboard</h1>
          <p className="mt-1 text-sm text-[#a0a0b8]">Good to see you, {userEmail}</p>
        </div>
        <Link href="/cars" className="rounded-xl border border-[#ffffff1a] px-5 py-2.5 text-[#a0a0b8] transition-all duration-200 hover:bg-[#1e1e2a] hover:text-white">
          Browse Cars
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Total", stats.total],
          ["Pending", stats.pending],
          ["Confirmed", stats.confirmed],
          ["Cancelled", stats.cancelled],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-[#ffffff0f] bg-[#16161f] p-5 transition-colors hover:border-[#6c63ff33]">
            <div className="text-3xl font-bold text-[#6c63ff]">{value as number}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-[#55556a]">{label as string}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-white">Your Reservations</h2>

        {reservations.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-[#ffffff0f] bg-[#16161f] md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#111118] text-xs uppercase tracking-widest text-[#55556a]">
                  <tr>
                    <th className="px-6 py-3">Car</th>
                    <th className="px-6 py-3">Period</th>
                    <th className="px-6 py-3">Duration</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">License</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => {
                    const days = calculateDays(reservation.start_date, reservation.end_date);
                    const total = days * reservation.cars.price_per_day;
                    return (
                      <tr key={reservation.id} className="border-t border-[#ffffff0f] bg-[#16161f] transition-colors hover:bg-[#1e1e2a]">
                        <td className="px-6 py-4 text-sm font-medium text-white">{reservation.cars.brand} {reservation.cars.model}</td>
                        <td className="px-6 py-4 text-sm text-[#a0a0b8]">{formatReservationDates(reservation.start_date, reservation.end_date)}</td>
                        <td className="px-6 py-4 text-sm text-[#a0a0b8]">{days} day{days === 1 ? "" : "s"}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-[#6c63ff]">{total.toLocaleString("fr-DZ")} DA</td>
                        <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[reservation.status]}`}>{reservation.status}</span></td>
                        <td className="px-6 py-4 text-sm">{reservation.license_file_url ? <a href={reservation.license_file_url} target="_blank" rel="noopener noreferrer" className="text-[#6c63ff] hover:underline">View →</a> : <span className="text-[#55556a]">—</span>}</td>
                        <td className="px-6 py-4 text-sm">
                          {reservation.status === "pending" ? (
                            confirmingId === reservation.id ? (
                              <div className="flex items-center gap-2">
                                  <button type="button" onClick={() => handleCancel(reservation)} className="rounded-lg border border-[#22c55e33] px-3 py-1.5 text-xs text-[#22c55e] hover:bg-[#22c55e15]">Yes</button>
                                  <button type="button" onClick={() => setConfirmingId(null)} className="rounded-lg border border-[#ffffff1a] px-3 py-1.5 text-xs text-[#a0a0b8] hover:bg-[#1e1e2a]">No</button>
                              </div>
                            ) : (
                                <button type="button" onClick={() => setConfirmingId(reservation.id)} className="rounded-lg border border-[#ef444433] px-3 py-1.5 text-xs text-[#ef4444] hover:bg-[#ef444415] transition-colors">Cancel</button>
                            )
                          ) : (
                            <span className="text-[#55556a]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:hidden">
              {reservations.map((reservation) => {
                const days = calculateDays(reservation.start_date, reservation.end_date);
                const total = days * reservation.cars.price_per_day;

                return (
                  <article key={reservation.id} className="rounded-2xl border border-[#ffffff0f] bg-[#16161f] p-5">
                    <div className="flex items-start gap-3">
                      {reservation.cars.image_url ? (
                        <Image src={reservation.cars.image_url} alt={`${reservation.cars.brand} ${reservation.cars.model}`} width={40} height={40} className="h-10 w-10 rounded-lg object-cover" placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e1e2a] text-sm">🚗</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white">{reservation.cars.brand} {reservation.cars.model}</h3>
                        <p className="mt-1 text-sm text-[#a0a0b8]">{formatReservationDates(reservation.start_date, reservation.end_date)}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[reservation.status]}`}>{reservation.status}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-[#55556a]">Total</span>
                      <span className="font-semibold text-[#6c63ff]">{total.toLocaleString("fr-DZ")} DA</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-[#55556a]">License</span>
                      {reservation.license_file_url ? <a href={reservation.license_file_url} target="_blank" rel="noopener noreferrer" className="text-[#6c63ff] hover:underline">View →</a> : <span className="text-[#55556a]">—</span>}
                    </div>
                    {reservation.status === "pending" ? (
                      <div className="mt-4">
                        {confirmingId === reservation.id ? (
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => handleCancel(reservation)} className="rounded-lg border border-[#22c55e33] px-3 py-1.5 text-xs text-[#22c55e] hover:bg-[#22c55e15]">Yes</button>
                            <button type="button" onClick={() => setConfirmingId(null)} className="rounded-lg border border-[#ffffff1a] px-3 py-1.5 text-xs text-[#a0a0b8] hover:bg-[#1e1e2a]">No</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setConfirmingId(reservation.id)} className="rounded-lg border border-[#ef444433] px-3 py-1.5 text-xs text-[#ef4444] hover:bg-[#ef444415] transition-colors">Cancel</button>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="mt-16 text-center">
            <div className="text-6xl">🚗</div>
            <p className="mt-4 text-xl font-semibold text-white">No reservations yet.</p>
            <p className="mt-2 text-sm text-[#a0a0b8]">Start by browsing our available cars.</p>
            <Link href="/cars" className="mt-6 inline-flex rounded-xl bg-[#6c63ff] px-5 py-2.5 font-medium text-white shadow-[0_0_24px_#6c63ff44] transition-all duration-200 hover:bg-[#7c74ff] hover:shadow-[0_0_32px_#6c63ff66] active:scale-[0.97]">Browse Cars →</Link>
          </div>
        )}
      </div>
    </section>
  );
}