export default function LoadingCars() {
  return (
    <section className="fade-up py-10">
      <div className="h-8 w-56 rounded bg-[#1e1e2a] animate-pulse" />
      <div className="mt-2 h-4 w-72 rounded bg-[#1e1e2a] animate-pulse" />

      <div className="mt-6 flex gap-3">
        <div className="h-10 w-36 rounded-xl bg-[#1e1e2a] animate-pulse" />
        <div className="h-10 w-44 rounded-xl bg-[#1e1e2a] animate-pulse" />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-[#ffffff0f] bg-[#16161f] animate-pulse">
            <div className="h-48 bg-[#1e1e2a]" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-2/3 rounded bg-[#1e1e2a]" />
              <div className="h-4 w-1/2 rounded bg-[#1e1e2a]" />
              <div className="h-10 rounded-xl bg-[#1e1e2a]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}