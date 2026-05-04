import { createClient } from "@/lib/supabase/server";

const SUPABASE_BUCKET = "hero-images"; // Replace with your bucket name

async function fetchHeroImages() {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .list("", { limit: 20, sortBy: { column: "name", order: "asc" } });

  if (error) {
    console.error("Supabase Storage error:", error.message);
    return [];
  }

  if (!data) {
    return [];
  }

  return data
    .filter((file) => /\.(jpe?g|png|webp|gif|avif)$/i.test(file.name))
    .map((file) => {
      const { data: publicData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(file.name);
      return {
        name: file.name,
        url: publicData.publicUrl,
        title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      };
    })
    .filter((item) => Boolean(item.url));
}

export default async function HeroGallery() {
  const images = await fetchHeroImages();

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="mb-10 space-y-5">
      <div className="rounded-3xl border border-[#ffffff0f] bg-[#111118] p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[#6c63ff]">Hero Gallery</p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Featured fleet from Supabase Storage</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#a0a0b8]">
            Images are loaded automatically from your Supabase Storage bucket and displayed in a responsive grid with lazy loading and hover overlays.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <div
              key={image.name}
              className="group overflow-hidden rounded-3xl border border-[#ffffff0f] bg-[#0f0f16] shadow-[0_0_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-[#6c63ff33]"
            >
              <div className="relative overflow-hidden">
                <img
                  src={image.url}
                  alt={image.title}
                  loading="lazy"
                  decoding="async"
                  className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 opacity-0 transition duration-300 group-hover:opacity-100">
                  <p className="text-sm uppercase tracking-[0.3em] text-[#a78bfa]">Featured</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{image.title}</h3>
                </div>
              </div>
              <div className="space-y-2 p-5">
                <p className="text-sm leading-6 text-[#c0c0dc]">This image is served from Supabase Storage and loaded lazily for better performance.</p>
                <div className="flex flex-wrap gap-2 text-xs text-[#8f8fb7]">
                  <span className="rounded-full border border-[#ffffff14] bg-white/5 px-3 py-1">{image.name}</span>
                  <span className="rounded-full border border-[#ffffff14] bg-white/5 px-3 py-1">Lazy loaded</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
