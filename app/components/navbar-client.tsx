"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useAuthSession } from "./auth-session-provider";
import { useToast } from "./toast";

type NavbarClientProps = {
  initialEmail: string | null;
};

const signedOutLinks = [
  { href: "/cars", label: "Cars" },
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Sign up" },
];

const signedInLinks = [
  { href: "/cars", label: "Cars" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function NavbarClient({ initialEmail }: NavbarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { email, setEmail } = useAuthSession();
  const { showToast } = useToast();
  const isLoggedIn = Boolean(email ?? initialEmail);

  const links = useMemo(() => (isLoggedIn ? signedInLinks : signedOutLinks), [isLoggedIn]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setEmail(null);
    setOpen(false);
    showToast("Sign out successful", "success");
    router.push("/");
    router.refresh();
    setSigningOut(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#ffffff0f] bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-semibold tracking-tight text-white">
          🚗 Auto-Loc
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm transition-colors ${active ? "text-white" : "text-[#a0a0b8] hover:text-white"}`}
              >
                {link.label}
                {active ? (
                  <span className="absolute -bottom-3 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#6c63ff]" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <>
              <div className="max-w-[180px] truncate rounded-full border border-[#ffffff0f] bg-[#16161f] px-3 py-1.5 text-xs text-[#a0a0b8]">
                {email ?? initialEmail}
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded-xl border border-[#ffffff1a] px-5 py-2.5 text-[#a0a0b8] transition-all duration-200 hover:bg-[#1e1e2a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingOut ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Please wait...
                  </span>
                ) : (
                  "Sign Out"
                )}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-xl border border-[#ffffff1a] px-5 py-2.5 text-[#a0a0b8] transition-all duration-200 hover:bg-[#1e1e2a] hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-[#6c63ff] px-5 py-2.5 font-medium text-white shadow-[0_0_24px_#6c63ff44] transition-all duration-200 hover:bg-[#7c74ff] hover:shadow-[0_0_32px_#6c63ff66]"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#ffffff0f] bg-[#111118] text-white md:hidden"
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          <span className="text-xl leading-none">{open ? "×" : "☰"}</span>
        </button>
      </div>

      {open ? (
        <div className="mx-4 mb-4 rounded-2xl border border-[#ffffff0f] bg-[#111118] p-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm ${active ? "bg-[#1e1e2a] text-white" : "text-[#a0a0b8] hover:bg-[#1e1e2a] hover:text-white"}`}
                >
                  {link.label}
                </Link>
              );
            })}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl border border-[#ffffff1a] px-4 py-3 text-left text-sm text-[#a0a0b8] hover:bg-[#1e1e2a] hover:text-white"
              >
                Sign Out
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}