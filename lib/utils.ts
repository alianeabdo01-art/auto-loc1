export function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function calculateRentalDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time to midnight to avoid timezone issues
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const difference = end.getTime() - start.getTime();

  if (Number.isNaN(difference) || difference < 0) {
    return 0;
  }

  // Calculate the number of days (including both start and end date)
  const days = Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, days);
}

export function resolveImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucketName = process.env.SUPABASE_CAR_IMAGE_BUCKET ?? "car-images";
  if (!supabaseUrl) {
    return null;
  }

  const trimmed = imageUrl
    .replace(/^\/+/, "")
    .replace(new RegExp(`^storage/v1/object/public/${bucketName}/`), "")
    .replace(new RegExp(`^${bucketName}/`), "")
    .replace(/^car-image\//, "")
    .replace(/^storage\/v1\/object\/(public|sign)\//, "");

  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${trimmed}`;
}

export function formatReservationDates(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} - ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}