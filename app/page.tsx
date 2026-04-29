import Link from "next/link";

export const metadata = {
  title: "Auto-Loc — Premium Car Rental",
};

export default function Home() {
  return (
    <section className="fade-up flex min-h-[calc(100vh-9rem)] flex-col justify-between py-10">
      <div className="relative overflow-hidden rounded-2xl border border-[#ffffff0f] bg-[#111118] px-6 py-20 text-center sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_#6c63ff22_0%,_transparent_70%)]" />
        <div className="relative mx-auto max-w-3xl space-y-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6c63ff33] bg-[#6c63ff0f] px-3 py-1 text-xs text-[#6c63ff]">
            ✦ Car Rental Platform 2026
          </span>
          <div className="space-y-3">
            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
              Rent Smarter.
            </h1>
            <h2 className="bg-gradient-to-r from-[#6c63ff] to-[#a78bfa] bg-clip-text text-5xl font-bold leading-[1.1] tracking-tight text-transparent sm:text-6xl">
              Drive Better.
            </h2>
          </div>
          <p className="mx-auto max-w-lg text-lg leading-relaxed text-[#a0a0b8]">
            Browse our premium fleet, book in minutes, and upload your license securely. No paperwork. No waiting.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/cars"
              className="rounded-xl bg-[#6c63ff] px-5 py-2.5 font-medium text-white shadow-[0_0_24px_#6c63ff44] transition-all duration-200 hover:bg-[#7c74ff] hover:shadow-[0_0_32px_#6c63ff66] active:scale-[0.97]"
            >
              Browse Cars →
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-[#ffffff1a] px-5 py-2.5 text-[#a0a0b8] transition-all duration-200 hover:bg-[#1e1e2a] hover:text-white active:scale-[0.97]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-5 py-10 md:grid-cols-3">
        {[
          ["🚗", "Wide Fleet Selection", "From city hatchbacks to spacious SUVs - all maintained and ready to go."],
          ["⚡", "Instant Booking", "Pick your dates, confirm your reservation, and receive immediate status updates."],
          ["🔒", "Private & Secure", "Your documents are encrypted and stored privately. Only you can access them."],
        ].map(([icon, title, body]) => (
          <article key={title} className="rounded-2xl border border-[#ffffff0f] bg-[#16161f] p-6 transition-all duration-200 hover:border-[#6c63ff33] hover:bg-[#1e1e2a]">
            <div className="w-fit rounded-xl bg-[#6c63ff15] p-3 text-xl">{icon}</div>
            <h3 className="mt-4 font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#a0a0b8]">{body}</p>
          </article>
        ))}
      </div>

      <footer className="mt-20 flex items-center justify-between gap-4 border-t border-[#ffffff0f] py-8">
        <p className="font-semibold text-white">🚗 Auto-Loc</p>
        <p className="text-sm text-[#55556a]">© 2025 Auto-Loc. All rights reserved.</p>
      </footer>
    </section>
  );
}
