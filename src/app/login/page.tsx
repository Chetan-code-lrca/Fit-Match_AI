import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { integrationStatus } from "@/lib/config";

const securityPoints = [
  "Google OAuth-ready configuration via environment variables",
  "Email + password authentication slot prepared with AUTH_SECRET",
  "Private wardrobe, favorites, and recommendation history per user profile",
];

export default function LoginPage() {
  return (
    <AppShell
      eyebrow="Authentication"
      title="Secure access for your private wardrobe"
      description="FitMatch AI supports Google login and email/password flows with environment-driven provider setup for production deployment."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8">
          <div className="grid gap-5">
            <div>
              <p className="text-sm font-medium text-zinc-400">Email + Password</p>
              <div className="mt-4 grid gap-4">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-white/35"
                />
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-white/35"
                />
                <Link
                  href="/dashboard"
                  className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  Continue to dashboard
                </Link>
              </div>
            </div>
            <div className="relative py-2 text-center text-xs uppercase tracking-[0.35em] text-zinc-500">
              <span className="bg-transparent px-3">or</span>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-black/40 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/10"
            >
              {integrationStatus.googleAuth ? "Continue with Google" : "Configure Google Login"}
            </button>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-black/30 p-8">
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Production checklist</p>
              <h2 className="mt-3 text-3xl font-semibold">Auth that scales with the product</h2>
            </div>
            <div className="grid gap-3">
              {securityPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-zinc-300"
                >
                  {point}
                </div>
              ))}
            </div>
            <div className="grid gap-3 text-sm text-zinc-400">
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                Google OAuth:{" "}
                <span className={integrationStatus.googleAuth ? "text-emerald-300" : "text-amber-300"}>
                  {integrationStatus.googleAuth ? "configured" : "missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET"}
                </span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                Email auth secret:{" "}
                <span className={integrationStatus.emailAuth ? "text-emerald-300" : "text-amber-300"}>
                  {integrationStatus.emailAuth ? "configured" : "missing AUTH_SECRET"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
