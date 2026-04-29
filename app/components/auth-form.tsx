"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";
  const title = isLogin ? "Welcome back" : "Create your account";
  const description = isLogin
    ? "Sign in to manage reservations, uploads, and your dashboard."
    : "Set up your Auto-Loc account and start reserving cars.";

  const validate = () => {
    if (!email.trim()) {
      return "Email is required.";
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return "Enter a valid email address.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    return "";
  };

  const goToDashboard = (delay = 0) => {
    window.setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, delay);
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

      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.toLowerCase().includes("email not confirmed")) {
            setError("Please confirm your email before logging in.");
          } else {
            setError(signInError.message);
          }
          return;
        }

        setEmail("");
        setPassword("");
        goToDashboard(300);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("user already registered")) {
          setError("An account with this email already exists. Log in instead.");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.session) {
        setEmail("");
        setPassword("");
        goToDashboard(300);
        return;
      }

      setMessage("Check your email to confirm your account before signing in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,_#6c63ff22_0%,_transparent_72%)]" />
      <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-[#ffffff0f] bg-[#16161f] p-8 shadow-2xl shadow-black/40 fade-up">
        <div className="space-y-2 text-center">
          <p className="text-lg font-bold tracking-tight text-white">🚗 Auto-Loc</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
          <p className="text-sm text-[#a0a0b8]">{description}</p>
        </div>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-medium uppercase tracking-widest text-[#55556a]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[#ffffff0f] bg-[#111118] px-4 py-3 text-white placeholder:text-[#55556a] outline-none transition-all duration-200 focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff]"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-xs font-medium uppercase tracking-widest text-[#55556a]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[#ffffff0f] bg-[#111118] px-4 py-3 text-white placeholder:text-[#55556a] outline-none transition-all duration-200 focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff]"
              placeholder="At least 8 characters"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={8}
              required
            />
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
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#6c63ff] px-5 py-2.5 font-medium text-white shadow-[0_0_24px_#6c63ff44] transition-all duration-200 hover:bg-[#7c74ff] hover:shadow-[0_0_32px_#6c63ff66] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Please wait...
              </>
            ) : isLogin ? (
              "Login"
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#55556a]">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <Link
            href={isLogin ? "/signup" : "/login"}
            className="font-medium text-[#6c63ff] hover:text-[#7c74ff]"
          >
            {isLogin ? "Create an account →" : "Log in →"}
          </Link>
        </p>

        {isLogin ? (
          <p className="mt-3 text-center text-sm text-[#55556a]">
            <a href="#" className="text-[#6c63ff] hover:text-[#7c74ff]">
              Forgot password?
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}