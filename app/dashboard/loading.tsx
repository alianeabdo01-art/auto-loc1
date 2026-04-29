export default function LoadingDashboard() {
  return (
    <section className="fade-up py-10">
      <div className="h-8 w-48 rounded bg-[#1e1e2a] animate-pulse" />
      <div className="mt-2 h-4 w-64 rounded bg-[#1e1e2a] animate-pulse" />

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-[#ffffff0f] bg-[#16161f] p-5">
            <div className="h-12 rounded-xl bg-[#1e1e2a] animate-pulse" />
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-3 rounded-2xl border border-[#ffffff0f] bg-[#16161f] p-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-12 rounded-xl bg-[#1e1e2a] animate-pulse" />
        ))}
      </div>
    </section>
  );
}