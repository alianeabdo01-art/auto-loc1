import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/app/components/auth-session-provider";
import Navbar from "@/app/components/navbar";
import { ToastProvider } from "@/app/components/toast";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Auto-Loc",
  description: "Premium car rental platform. Browse, book, and drive - all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootLayoutContent>{children}</RootLayoutContent>;
}

async function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0a0a0f] text-white">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_#6c63ff22_0%,_transparent_70%)]" />
          <div className="relative z-10 flex min-h-screen flex-col">
            <AuthSessionProvider initialEmail={user?.email ?? null}>
              <ToastProvider>
                <Navbar />
                <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10">
                  {children}
                </main>
              </ToastProvider>
            </AuthSessionProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
