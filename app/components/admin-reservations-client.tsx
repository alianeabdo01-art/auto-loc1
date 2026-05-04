"use client";

import { useState, useMemo } from "react";
import { useToast } from "./toast";
import type { Reservation } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type AdminReservationsClientProps = {
  initialReservations: Reservation[];
};

const statusStyles: Record<Reservation["status"], string> = {
  pending: "border-[#f59e0b33] bg-[#f59e0b15] text-[#f59e0b]",
  confirmed: "border-[#22c55e33] bg-[#22c55e15] text-[#22c55e]",
  accepted: "border-[#22c55e33] bg-[#22c55e15] text-[#22c55e]",
  cancelled: "border-[#ef444433] bg-[#ef444415] text-[#ef4444]",
  rejected: "border-[#ef444433] bg-[#ef444415] text-[#ef4444]",
};

export default function AdminReservationsClient({ initialReservations }: AdminReservationsClientProps) {
  const { showToast } = useToast();
  const [reservations, setReservations] = useState(initialReservations);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "accepted" | "cancelled" | "rejected">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredReservations = useMemo(() => {
    if (filter === "all") return reservations;
    return reservations.filter((r) => r.status === filter);
  }, [reservations, filter]);

  const stats = useMemo(
    () => ({
      total: reservations.length,
      pending: reservations.filter((r) => r.status === "pending").length,
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      accepted: reservations.filter((r) => r.status === "accepted").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
      rejected: reservations.filter((r) => r.status === "rejected").length,
    }),
    [reservations]
  );

  function calculateDays(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  const handleUpdateStatus = async (reservationId: string, newStatus: "confirmed" | "cancelled") => {
    setProcessingId(reservationId);

    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to update reservation");
      }

      setReservations((current) =>
        current.map((r) => (r.id === reservationId ? { ...r, status: newStatus } : r))
      );

      showToast(
        `Reservation ${newStatus === "confirmed" ? "accepted" : "refused"}`,
        "success"
      );
    } catch (error) {
      showToast(
        `Failed to update reservation: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="fade-up py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Reservation Management</h1>
        <p className="mt-1 text-sm text-[#a0a0b8]">Review and manage customer reservations</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Total", stats.total],
          ["Pending", stats.pending],
          ["Confirmed", stats.confirmed],
          ["Cancelled", stats.cancelled],
        ].map(([label, value]) => (
          <div
            key={label as string}
            className="rounded-2xl border border-[#ffffff0f] bg-[#16161f] p-5 transition-colors hover:border-[#6c63ff33]"
          >
            <div className="text-3xl font-bold text-[#6c63ff]">{value as number}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-[#55556a]">
              {label as string}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex gap-2">
        {(["all", "pending", "confirmed", "accepted", "cancelled", "rejected"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filter === status
                ? "bg-[#6c63ff] text-white"
                : "border border-[#ffffff1a] text-[#a0a0b8] hover:bg-[#1e1e2a]"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[#ffffff0f] bg-[#16161f] overflow-hidden">
        {filteredReservations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#111118] text-xs uppercase tracking-widest text-[#55556a]">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Days</th>
                  <th className="px-6 py-4">Total Cost</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">License</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => {
                  const days = calculateDays(reservation.start_date, reservation.end_date);
                  const total = days * reservation.cars.price_per_day;
                  const isProcessing = processingId === reservation.id;

                  return (
                    <tr
                      key={reservation.id}
                      className="border-t border-[#ffffff0f] transition-colors hover:bg-[#1e1e2a]"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {reservation.user_id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-[#a0a0b8]">
                        {reservation.cars.brand} {reservation.cars.model}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#a0a0b8]">
                        {new Date(reservation.start_date).toLocaleDateString()} -{" "}
                        {new Date(reservation.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[#6c63ff]">
                        {days} day{days !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-white">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[reservation.status]}`}
                        >
                          {reservation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {reservation.license_file_url ? (
                          <a
                            href={reservation.license_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#6c63ff] hover:underline"
                          >
                            View →
                          </a>
                        ) : (
                          <span className="text-[#55556a]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {reservation.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateStatus(reservation.id, "confirmed")}
                              disabled={isProcessing}
                              className="rounded-lg border border-[#22c55e33] px-3 py-1.5 text-xs text-[#22c55e] transition-colors hover:bg-[#22c55e15] disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(reservation.id, "cancelled")}
                              disabled={isProcessing}
                              className="rounded-lg border border-[#ef444433] px-3 py-1.5 text-xs text-[#ef4444] transition-colors hover:bg-[#ef444415] disabled:opacity-50"
                            >
                              Refuse
                            </button>
                          </div>
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
        ) : (
          <div className="p-12 text-center">
            <p className="text-[#a0a0b8]">No reservations found</p>
          </div>
        )}
      </div>
    </section>
  );
}
