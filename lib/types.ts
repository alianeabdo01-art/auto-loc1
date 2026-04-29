export type Car = {
  id: string;
  brand: string;
  model: string;
  price_per_day: number;
  availability: boolean;
  image_url: string | null;
  created_at: string;
};

export type Reservation = {
  id: string;
  user_id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "confirmed" | "cancelled";
  license_file_url: string | null;
  created_at: string;
  cars: Pick<Car, "brand" | "model" | "price_per_day" | "image_url">;
};