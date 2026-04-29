import Link from "next/link";

export default function NotFound() {
  return (
    <section className="fade-up flex min-h-[calc(100vh-9rem)] flex-col items-center justify-center text-center">
      <div className="text-8xl font-bold text-[#ffffff08]">404</div>
      <h1 className="mt-2 text-2xl font-semibold text-white">Page not found.</h1>
      <p className="mt-2 text-[#a0a0b8]">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 inline-flex rounded-xl bg-[#6c63ff] px-5 py-2.5 font-medium text-white shadow-[0_0_24px_#6c63ff44] transition-all duration-200 hover:bg-[#7c74ff] hover:shadow-[0_0_32px_#6c63ff66] active:scale-[0.97]">
        ← Go Home
      </Link>
    </section>
  );
}