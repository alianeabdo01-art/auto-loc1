"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";
import { calculateRentalDays, formatCurrency } from "@/lib/utils";
import { useToast } from "./toast";

type ReservationFormProps = {
  carId: string;
  pricePerDay: number;
  available: boolean;
};

export default function ReservationForm({ carId, pricePerDay, available }: ReservationFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const rentalDays = calculateRentalDays(startDate, endDate);
  const totalPrice = rentalDays * pricePerDay;

  const validate = () => {
    if (!available) {
      return "This car is currently not available.";
    }

    if (!startDate || !endDate) {
      return "Please select both dates.";
    }

    if (new Date(startDate) < new Date(today)) {
      return "Start date cannot be in the past.";
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return "End date must be after start date.";
    }

    if (!licenseFile) {
      return "Please upload a driver's license file.";
    }

    if (licenseFile.size > 5 * 1024 * 1024) {
      return "File too large. Maximum size is 5MB.";
    }

    const fileName = licenseFile.name.toLowerCase();
    const isImage = licenseFile.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(fileName);
    const isPdf = licenseFile.type === "application/pdf" || fileName.endsWith(".pdf");

    if (!(isImage || isPdf)) {
      return "Please upload a JPG, PNG, or PDF file.";
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You need to be signed in to make a reservation.");
        return;
      }

      if (!licenseFile) {
        setError("Please upload a driver's license file.");
        return;
      }

      const safeFileName = licenseFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${user.id}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage.from("licenses").upload(storagePath, licenseFile, {
        cacheControl: "3600",
        contentType: licenseFile.type || "application/octet-stream",
        upsert: false,
      });

      if (uploadError) {
        showToast("Upload failed", "error");
        setError(uploadError.message);
        return;
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("licenses")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        showToast("Upload failed", "error");
        setError(signedUrlError?.message ?? "Could not create a license file link.");
        return;
      }

      const { error: insertError } = await supabase.from("reservations").insert({
        user_id: user.id,
        car_id: carId,
        start_date: startDate,
        end_date: endDate,
        status: "pending",
        license_file_url: signedUrlData.signedUrl,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      const { error: carUpdateError } = await supabase
        .from("cars")
        .update({ availability: false })
        .eq("id", carId);

      if (carUpdateError) {
        console.error(carUpdateError.message);
        // If this fails in production, add the following SQL policy in Supabase:
        // CREATE POLICY "Authenticated users can update car availability"
        // ON cars FOR UPDATE
        // USING (auth.uid() IS NOT NULL);
      }

      showToast("Reservation confirmed", "success");
      setMessage("Reservation confirmed! Redirecting to your dashboard...");
      setSubmitted(true);
      window.setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  if (!available) {
    return (
      <div className="rounded-2xl border border-[#ef444433] bg-[#ef444415] p-6 text-center text-[#ef4444]">
        <p className="font-semibold">This car is currently unavailable.</p>
        <button
          type="button"
          onClick={() => router.push("/cars")}
          className="mt-4 rounded-xl bg-[#6c63ff] px-5 py-2.5 font-medium text-white shadow-[0_0_24px_#6c63ff44] transition-all duration-200 hover:bg-[#7c74ff] hover:shadow-[0_0_32px_#6c63ff66] active:scale-[0.97]"
        >
          Browse Other Cars
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#22c55e33] bg-[#22c55e15] p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#22c55e20] text-xl text-[#22c55e]">
          ✓
        </div>
        <p className="mt-3 text-lg font-semibold text-white">Reservation Confirmed!</p>
        <p className="mt-1 text-sm text-[#a0a0b8]">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-amber-300">
            Reservation details
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Book this car</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111118] px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Per day</p>
          <p className="text-lg font-semibold text-white">{formatCurrency(pricePerDay)}</p>
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="startDate" className="text-xs font-medium uppercase tracking-widest text-[#55556a]">
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              min={today}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-xl border border-[#ffffff0f] bg-[#111118] px-4 py-3 text-white outline-none transition-all duration-200 focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff]"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="endDate" className="text-xs font-medium uppercase tracking-widest text-[#55556a]">
              End date
            </label>
            <input
              id="endDate"
              type="date"
              min={startDate || today}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-xl border border-[#ffffff0f] bg-[#111118] px-4 py-3 text-white outline-none transition-all duration-200 focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff]"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="licenseFile" className="text-xs font-medium uppercase tracking-widest text-[#55556a]">
            Driver&apos;s license
          </label>
          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-[#ffffff0f] bg-[#111118] p-6 text-center transition-colors hover:border-[#6c63ff33]">
            <input
              id="licenseFile"
              type="file"
              accept="image/*,.pdf"
              onChange={(event) => setLicenseFile(event.target.files?.[0] ?? null)}
              className="hidden"
              required
            />
            {licenseFile ? (
              <div className="text-sm font-medium text-[#22c55e]">✓ {licenseFile.name}</div>
            ) : (
              <>
                <div className="text-sm text-[#55556a]">📄 Click to upload or drag &amp; drop</div>
                <div className="mt-1 text-xs text-[#55556a]">JPG, PNG or PDF accepted</div>
              </>
            )}
          </label>
        </div>

        <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Duration</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {startDate && endDate ? (
                <>
                  {rentalDays} day{rentalDays > 1 ? "s" : ""} × {formatCurrency(pricePerDay)} = {formatCurrency(totalPrice)}
                </>
              ) : (
                "Select dates to calculate"
              )}
            </p>
            {startDate && endDate && (
              <p className="mt-2 text-xs text-slate-400">
                {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Estimated total</p>
            <p className="mt-1 text-2xl font-bold text-[#6c63ff]">{formatCurrency(totalPrice)}</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-[#ef444433] bg-[#ef444415] px-4 py-3 text-sm text-[#ef4444]">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-xl border border-[#22c55e33] bg-[#22c55e15] px-4 py-3 text-sm text-[#22c55e]">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !available}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#6c63ff] px-5 py-2.5 font-medium text-white shadow-[0_0_24px_#6c63ff44] transition-all duration-200 hover:bg-[#7c74ff] hover:shadow-[0_0_32px_#6c63ff66] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              Submitting...
            </span>
          ) : (
            "Confirm Reservation"
          )}
        </button>
      </form>
    </div>
  );
}