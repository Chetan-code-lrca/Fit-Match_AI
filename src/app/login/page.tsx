"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";

type Mode = "sign-in" | "sign-up";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch(mode === "sign-in" ? "/api/auth/sign-in" : "/api/auth/sign-up", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }),
      });
      const payload = await response.json() as { message?: string; authenticated?: boolean };
      if (!response.ok) throw new Error(payload.message ?? "Authentication failed.");
      if (mode === "sign-up" && !payload.authenticated) { setMessage(payload.message ?? "Check your inbox to confirm your email."); return; }
      setMessage(payload.message ?? "Signed in. Opening your wardrobe…");
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to authenticate.");
    } finally { setBusy(false); }
  }

  return (
    <AppShell eyebrow="Your private wardrobe" title={mode === "sign-in" ? "Welcome back." : "Build your personal style space."} description="Sign in to access your saved pieces, private clothing photos and wardrobe-aware outfit recommendations.">
      <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-[28px] border border-white/[0.09] bg-[#191d17] p-6 sm:p-8">
          <div className="mb-6 grid grid-cols-2 rounded-full border border-white/10 bg-black/20 p-1">
            <button type="button" onClick={() => { setMode("sign-in"); setError(""); setMessage(""); }} className={"rounded-full px-4 py-2.5 text-sm font-medium transition " + (mode === "sign-in" ? "bg-[#d3ee9c] text-[#182011]" : "text-zinc-400 hover:text-white")}>Sign in</button>
            <button type="button" onClick={() => { setMode("sign-up"); setError(""); setMessage(""); }} className={"rounded-full px-4 py-2.5 text-sm font-medium transition " + (mode === "sign-up" ? "bg-[#d3ee9c] text-[#182011]" : "text-zinc-400 hover:text-white")}>Create account</button>
          </div>
          <form onSubmit={submit} className="grid gap-4">
            <label className="grid gap-2 text-xs text-zinc-400">Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#d3ee9c]/50" /></label>
            <label className="grid gap-2 text-xs text-zinc-400">Password<input required type="password" minLength={mode === "sign-up" ? 10 : 1} maxLength={128} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "sign-up" ? "At least 10 characters" : "Your password"} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#d3ee9c]/50" /></label>
            {error ? <p role="alert" className="rounded-2xl border border-red-300/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200">{error}</p> : null}
            {message ? <p role="status" className="rounded-2xl border border-[#d3ee9c]/20 bg-[#d3ee9c]/[0.06] px-4 py-3 text-sm text-[#d3ee9c]">{message}</p> : null}
            <button type="submit" disabled={busy} className="mt-2 rounded-full bg-[#d3ee9c] px-5 py-3.5 text-sm font-semibold text-[#182011] transition hover:bg-[#e0f5b0] disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Please wait…" : mode === "sign-in" ? "Sign in to FitMatch" : "Create my account"}</button>
          </form>
          <p className="mt-5 text-[11px] leading-5 text-zinc-600">Email confirmation may be required depending on your Supabase authentication settings.</p>
        </section>
        <aside className="rounded-[28px] border border-white/[0.08] bg-black/20 p-6 sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d3ee9c]">Your data stays yours</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#f4f2e9]">A wardrobe built around your account.</h2>
          <div className="mt-6 space-y-3">
            {[["Private by default", "Wardrobe records are scoped to your authenticated account."], ["Secure image access", "Clothing photos use a private bucket and expiring signed URLs."], ["Explainable styling", "Recommendations show the colour, style and occasion signals behind each match."]].map(([title, description]) => <div key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><h3 className="text-sm font-semibold text-zinc-200">{title}</h3><p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p></div>)}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
