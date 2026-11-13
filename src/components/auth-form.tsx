"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type AuthFormProps = { mode: "login" | "signup"; notice?: string; nextPath?: string };

export function AuthForm({ mode, notice, nextPath }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(notice ?? "");
  const [error, setError] = useState("");
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/" + mode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json() as { message?: string; success?: boolean; requiresEmailConfirmation?: boolean };
      if (!response.ok || !result.success) {
        setError(result.message ?? "Unable to continue. Please try again.");
        return;
      }
      if (result.requiresEmailConfirmation) {
        setMessage(result.message ?? "Check your inbox to verify your email, then sign in.");
        return;
      }
      router.replace(!isSignup && nextPath ? nextPath : "/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#10120f] px-4 py-12 text-[#f4f2e9]">
      <div aria-hidden="true" className="pointer-events-none absolute -top-44 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#d3ee9c]/[0.07] blur-3xl" />
      <section className="relative w-full max-w-[440px] rounded-[30px] border border-white/[0.09] bg-[#191d17]/95 p-7 shadow-[0_28px_100px_rgba(0,0,0,0.32)] sm:p-9">
        <Link href="/" className="inline-flex items-center gap-3" aria-label="FitMatch home">
          <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#d3ee9c] text-sm font-black tracking-[-0.08em] text-[#182011]">FM</span>
          <span>
            <span className="block text-[13px] font-bold tracking-[0.13em]">FITMATCH</span>
            <span className="mt-0.5 block text-[9px] uppercase tracking-[0.2em] text-zinc-500">Wardrobe intelligence</span>
          </span>
        </Link>
        <div className="mt-9">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d3ee9c]">{isSignup ? "Create your workspace" : "Welcome back"}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{isSignup ? "Make your wardrobe work harder." : "Your wardrobe, in rotation."}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {isSignup
              ? "Create a private account to save your clothes and build outfits around what you own."
              : "Sign in to access your saved pieces, outfit combinations and stylist."}
          </p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-medium text-zinc-300">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" required maxLength={254}
              value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#d3ee9c]/50 focus:ring-2 focus:ring-[#d3ee9c]/10" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-xs font-medium text-zinc-300">Password</label>
            <input id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"}
              required minLength={isSignup ? 12 : 1} maxLength={128} value={password}
              onChange={(event) => setPassword(event.target.value)} placeholder={isSignup ? "At least 12 characters" : "Your password"}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#d3ee9c]/50 focus:ring-2 focus:ring-[#d3ee9c]/10" />
          </div>
          {error ? <p role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-xs leading-5 text-red-200">{error}</p> : null}
          {message ? <p role="status" aria-live="polite" className="rounded-xl border border-[#d3ee9c]/20 bg-[#d3ee9c]/[0.07] px-3 py-2.5 text-xs leading-5 text-[#d3ee9c]">{message}</p> : null}
          <button type="submit" disabled={pending} className="flex w-full items-center justify-center rounded-full bg-[#d3ee9c] px-5 py-3.5 text-sm font-semibold text-[#182011] transition hover:bg-[#e2f5b5] disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-zinc-500">
          {isSignup ? "Already have an account?" : "New to FitMatch?"}{" "}
          <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-[#d3ee9c] hover:underline">{isSignup ? "Sign in" : "Create an account"}</Link>
        </p>
        <p className="mt-7 border-t border-white/[0.07] pt-5 text-center text-[10px] leading-5 text-zinc-600">
          Your wardrobe is private to your account. Do not upload images you do not have permission to store.
        </p>
      </section>
    </main>
  );
}
