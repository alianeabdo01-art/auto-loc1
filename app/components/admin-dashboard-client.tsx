"use client";

import { useMemo, useState, type FormEvent, useEffect } from "react";

import { useToast } from "./toast";
import { type Car, type Reservation } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 8;

type CarFormState = {
  id: string | null;
  brand: string;
  model: string;
  price_per_day: string;
  availability: boolean;
  image_url: string | null;
  imageFile: File | null;
};

type AdminDashboardClientProps = {
  initialCars: Car[];
  initialReservations: Reservation[];
};

export default function AdminDashboardClient({ initialCars, initialReservations }: AdminDashboardClientProps) {
  const [cars, setCars] = useState<Car[]>(initialCars);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [activeTab, setActiveTab] = useState<"cars" | "reservations">("cars");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "unavailable">("all");
  const [reservationFilter, setReservationFilter] = useState<"all" | "pending" | "confirmed" | "cancelled" | "accepted" | "rejected">("all");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingReservationId, setProcessingReservationId] = useState<string | null>(null);
  const [form, setForm] = useState<CarFormState>({
    id: null,
    brand: "",
    model: "",
    price_per_day: "",
    availability: true,
    image_url: null,
    imageFile: null,
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const { showToast } = useToast();

  const refreshReservations = async () => {
    try {
      const response = await fetch(`/api/admin/reservations?_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations ?? []);
      } else {
        console.error("Failed to fetch reservations:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to refresh reservations:", error);
    }
  };

  useEffect(() => {
    // Auto-refresh reservations on mount
    refreshReservations();
    
    const supabase = createClient();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('admin-reservations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        (payload) => {
          // Refresh reservations whenever a change occurs
          refreshReservations();
        }
      )
      .subscribe();
      
    // Set up polling as fallback
    const interval = setInterval(refreshReservations, 15000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);


  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase();

    return cars.filter((car) => {
      const matchesText =
        !query ||
        car.brand.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query);

      const matchesAvailability =
        filter === "all" ||
        (filter === "available" && car.availability) ||
        (filter === "unavailable" && !car.availability);

      return matchesText && matchesAvailability;
    });
  }, [cars, filter, search]);

  const normalizeStatus = (status: Reservation["status"]) => {
    if (status === "confirmed") return "accepted";
    if (status === "cancelled") return "rejected";
    return status;
  };

  const filteredReservations = useMemo(() => {
    if (reservationFilter === "all") return reservations;
    return reservations.filter((r) => normalizeStatus(r.status) === reservationFilter);
  }, [reservations, reservationFilter]);

  const stats = useMemo(
    () => ({
      total: reservations.length,
      pending: reservations.filter((r) => normalizeStatus(r.status) === "pending").length,
      accepted: reservations.filter((r) => normalizeStatus(r.status) === "accepted").length,
      rejected: reservations.filter((r) => normalizeStatus(r.status) === "rejected").length,
    }),
    [reservations]
  );

  const pageCount = Math.max(1, Math.ceil(filteredCars.length / PAGE_SIZE));
  const paginatedCars = filteredCars.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reservation management functions
  function calculateDays(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  const handleUpdateReservationStatus = async (reservationId: string, newStatus: "confirmed" | "cancelled") => {
    setProcessingReservationId(reservationId);

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
        `Reservation ${newStatus === "confirmed" ? "accepted" : "rejected"}`,
        "success"
      );
    } catch (error) {
      showToast(
        `Failed to update reservation: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setProcessingReservationId(null);
    }
  };

  // Car management functions (existing)
  const openAddModal = () => {
    setActionError(null);
    setForm({
      id: null,
      brand: "",
      model: "",
      price_per_day: "",
      availability: true,
      image_url: null,
      imageFile: null,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (car: Car) => {
    setActionError(null);
    setForm({
      id: car.id,
      brand: car.brand,
      model: car.model,
      price_per_day: String(car.price_per_day),
      availability: car.availability,
      image_url: car.image_url,
      imageFile: null,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActionError(null);
    setForm((prev) => ({ ...prev, imageFile: null }));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.image_url) {
      throw new Error(data.error ?? "Image upload failed");
    }

    return data.image_url;
  };

  const refreshCars = async () => {
    const response = await fetch("/api/admin/cars");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to refresh cars");
    }

    setCars(data.cars ?? []);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setSaving(true);

    try {
      const brand = form.brand.trim();
      const model = form.model.trim();
      const pricePerDay = Number(form.price_per_day);

      if (!brand || !model || Number.isNaN(pricePerDay) || pricePerDay <= 0) {
        setActionError("Please provide valid brand, model, and price values.");
        return;
      }

      let imageUrl = form.image_url;

      if (form.imageFile) {
        imageUrl = await uploadImage(form.imageFile);
      }

      const payload = {
        id: form.id,
        brand,
        model,
        price_per_day: pricePerDay,
        availability: form.availability,
        image_url: imageUrl,
      };

      const response = await fetch("/api/admin/cars", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Save failed");
      }

      await refreshCars();
      showToast(form.id ? "Car updated successfully" : "Car created successfully", "success");
      closeModal();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
      showToast("Unable to save car", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this car permanently?");
    if (!confirmed) {
      return;
    }

    setIsDeleting(id);
    try {
      const response = await fetch(`/api/admin/cars?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Delete failed");
      }

      setCars((current) => current.filter((car) => car.id !== id));
      showToast("Car deleted", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to delete car", "error");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleAvailability = async (car: Car) => {
    try {
      const response = await fetch("/api/admin/cars", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: car.id, availability: !car.availability }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Toggle failed");
      }

      setCars((current) => current.map((item) => (item.id === car.id ? { ...item, availability: !item.availability } : item)));
      showToast("Availability updated", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update availability", "error");
    }
  };

  return (
    <div className="fade-up py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-[#a0a0b8]">Manage your car rental business</p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 rounded-2xl border border-[#ffffff0f] bg-[#16161f] p-2">
        <button
          onClick={() => setActiveTab("cars")}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
            activeTab === "cars"
              ? "bg-[#6c63ff] text-white shadow-[0_0_24px_#6c63ff44]"
              : "text-[#a0a0b8] hover:bg-[#1e1e2a] hover:text-white"
          }`}
        >
          🚗 Car Management
        </button>
        <button
          onClick={() => setActiveTab("reservations")}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
            activeTab === "reservations"
              ? "bg-[#6c63ff] text-white shadow-[0_0_24px_#6c63ff44]"
              : "text-[#a0a0b8] hover:bg-[#1e1e2a] hover:text-white"
          }`}
        >
          📋 Reservations
        </button>
      </div>

      {activeTab === "cars" ? (
        <>
          {/* Car Management Section */}
          <div className="mb-6 flex flex-col gap-5 rounded-2xl border border-[#ffffff0f] bg-[#111118] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Fleet Management</h2>
                <p className="text-sm text-[#a0a0b8]">Add, update, and remove cars from your fleet</p>
              </div>
              <button
                type="button"
                onClick={openAddModal}
                className="rounded-xl bg-[#6c63ff] px-5 py-2.5 font-medium text-white shadow-[0_0_24px_#6c63ff44] transition-all duration-200 hover:bg-[#7c74ff] hover:shadow-[0_0_32px_#6c63ff66]"
              >
                + Add Car
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by brand or model..."
                  className="w-full rounded-xl border border-[#ffffff0f] bg-[#16161f] px-4 py-3 text-sm text-white placeholder:text-[#a0a0b8] outline-none focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "available", "unavailable"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setFilter(option);
                      setPage(1);
                    }}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                      filter === option
                        ? "bg-[#6c63ff] text-white"
                        : "border border-[#ffffff1a] text-[#a0a0b8] hover:bg-[#1e1e2a] hover:text-white"
                    }`}
                  >
                    {option === "all" ? "All" : option === "available" ? "Available" : "Unavailable"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cars Table */}
          <div className="rounded-2xl border border-[#ffffff0f] bg-[#16161f] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#111118] text-xs uppercase tracking-widest text-[#55556a]">
                  <tr>
                    <th className="px-6 py-4">Car</th>
                    <th className="px-6 py-4">Price/Day</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Image</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCars.map((car) => (
                    <tr key={car.id} className="border-t border-[#ffffff0f] transition-colors hover:bg-[#1e1e2a]">
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {car.brand} {car.model}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#6c63ff]">
                        {formatCurrency(car.price_per_day)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          car.availability
                            ? "border-[#22c55e33] bg-[#22c55e15] text-[#22c55e]"
                            : "border-[#ef444433] bg-[#ef444415] text-[#ef4444]"
                        }`}>
                          {car.availability ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {car.image_url ? (
                          <a
                            href={car.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#6c63ff] hover:underline"
                          >
                            View Image →
                          </a>
                        ) : (
                          <span className="text-[#55556a]">No image</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(car)}
                            className="rounded-lg border border-[#ffffff1a] px-3 py-1.5 text-xs text-[#a0a0b8] hover:bg-[#1e1e2a] hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleAvailability(car)}
                            className="rounded-lg border border-[#22c55e33] px-3 py-1.5 text-xs text-[#22c55e] hover:bg-[#22c55e15]"
                          >
                            {car.availability ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => handleDelete(car.id)}
                            disabled={isDeleting === car.id}
                            className="rounded-lg border border-[#ef444433] px-3 py-1.5 text-xs text-[#ef4444] hover:bg-[#ef444415] disabled:opacity-50"
                          >
                            {isDeleting === car.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredCars.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-[#a0a0b8]">No cars found</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Reservation Management Section */}
          <div className="mb-6 flex flex-col gap-5 rounded-2xl border border-[#ffffff0f] bg-[#111118] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Reservation Management</h2>
                <p className="text-sm text-[#a0a0b8]">Review and manage customer reservations</p>
              </div>
              <button
                onClick={async () => {
                  setIsRefreshing(true);
                  await refreshReservations();
                  setIsRefreshing(false);
                }}
                disabled={isRefreshing}
                className="rounded-lg bg-[#6c63ff] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#7c74ff] disabled:opacity-50"
              >
                {isRefreshing ? "Refreshing..." : "🔄 Refresh"}
              </button>
            </div>

            <div className="mb-4 grid grid-cols-4 gap-4">
              {[
                ["Total", stats.total],
                ["Pending", stats.pending],
                ["Accepted", stats.accepted],
                ["Rejected", stats.rejected],
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

            <div className="flex gap-2">
              {(["all", "pending", "accepted", "rejected"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setReservationFilter(status)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    reservationFilter === status
                      ? "bg-[#6c63ff] text-white"
                      : "border border-[#ffffff1a] text-[#a0a0b8] hover:bg-[#1e1e2a] hover:text-white"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Reservations Table */}
          <div className="rounded-2xl border border-[#ffffff0f] bg-[#16161f] overflow-hidden">
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
                    <th className="px-6 py-4">License Image</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => {
                    const days = calculateDays(reservation.start_date, reservation.end_date);
                    const total = days * reservation.cars.price_per_day;
                    const isProcessing = processingReservationId === reservation.id;

                    return (
                      <tr key={reservation.id} className="border-t border-[#ffffff0f] transition-colors hover:bg-[#1e1e2a]">
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {reservation.user_email ?? reservation.users?.email ?? `${reservation.user_id.slice(0, 8)}...`}
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
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                            normalizeStatus(reservation.status) === "pending"
                              ? "border-[#f59e0b33] bg-[#f59e0b15] text-[#f59e0b]"
                              : normalizeStatus(reservation.status) === "accepted"
                              ? "border-[#22c55e33] bg-[#22c55e15] text-[#22c55e]"
                              : "border-[#ef444433] bg-[#ef444415] text-[#ef4444]"
                          }`}>
                            {normalizeStatus(reservation.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {reservation.license_file_url ? (
                            <button
                              onClick={() => setLightboxImage(reservation.license_file_url)}
                              className="group relative inline-flex h-12 w-20 overflow-hidden rounded-lg outline-none ring-[#6c63ff] focus-visible:ring-2"
                            >
                              <img
                                src={reservation.license_file_url}
                                alt="Uploaded license"
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <span className="text-xs font-semibold text-white">View</span>
                              </div>
                            </button>
                          ) : (
                            <span className="text-[#55556a]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {normalizeStatus(reservation.status) === "pending" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateReservationStatus(reservation.id, "confirmed")}
                                disabled={isProcessing}
                                className="rounded-lg border border-[#22c55e33] px-3 py-1.5 text-xs text-[#22c55e] transition-colors hover:bg-[#22c55e15] disabled:opacity-50"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleUpdateReservationStatus(reservation.id, "cancelled")}
                                disabled={isProcessing}
                                className="rounded-lg border border-[#ef444433] px-3 py-1.5 text-xs text-[#ef4444] transition-colors hover:bg-[#ef444415] disabled:opacity-50"
                              >
                                Reject
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
            {filteredReservations.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-[#a0a0b8]">No reservations found</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Car Modal (only show when activeTab is cars) */}
      {activeTab === "cars" && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#ffffff0f] bg-[#16161f] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {form.id ? "Edit Car" : "Add New Car"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-[#a0a0b8] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-[#a0a0b8] mb-2">
                    Brand
                  </label>
                  <input
                    id="brand"
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                    className="w-full rounded-xl border border-[#ffffff0f] bg-[#111118] px-4 py-3 text-white outline-none focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-[#a0a0b8] mb-2">
                    Model
                  </label>
                  <input
                    id="model"
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
                    className="w-full rounded-xl border border-[#ffffff0f] bg-[#111118] px-4 py-3 text-white outline-none focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff]"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-[#a0a0b8] mb-2">
                  Price per day ($)
                </label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price_per_day}
                  onChange={(e) => setForm((prev) => ({ ...prev, price_per_day: e.target.value }))}
                  className="w-full rounded-xl border border-[#ffffff0f] bg-[#111118] px-4 py-3 text-white outline-none focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff]"
                  required
                />
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-[#a0a0b8] mb-2">
                  Car Image
                </label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                  className="w-full rounded-xl border border-[#ffffff0f] bg-[#111118] px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[#6c63ff] file:px-3 file:py-1 file:text-sm file:text-white file:hover:bg-[#7c74ff]"
                />
                {form.image_url && (
                  <p className="mt-2 text-xs text-[#a0a0b8]">
                    Current image will be replaced if you upload a new one
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="availability"
                  type="checkbox"
                  checked={form.availability}
                  onChange={(e) => setForm((prev) => ({ ...prev, availability: e.target.checked }))}
                  className="rounded border-[#ffffff0f] bg-[#111118] text-[#6c63ff] focus:ring-[#6c63ff]"
                />
                <label htmlFor="availability" className="text-sm text-[#a0a0b8]">
                  Available for rental
                </label>
              </div>

              {actionError && (
                <div className="rounded-xl border border-[#ef444433] bg-[#ef444415] px-4 py-3 text-sm text-[#ef4444]">
                  {actionError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-[#ffffff1a] px-4 py-3 text-[#a0a0b8] hover:bg-[#1e1e2a] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-[#6c63ff] px-4 py-3 font-medium text-white shadow-[0_0_24px_#6c63ff44] hover:bg-[#7c74ff] hover:shadow-[0_0_32px_#6c63ff66] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : form.id ? "Update Car" : "Add Car"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-5xl">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20 transition"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <img 
              src={lightboxImage} 
              alt="License preview full size" 
              className="max-h-[85vh] w-auto rounded-xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            />
          </div>
        </div>
      )}
    </div>
  );
}
