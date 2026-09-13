import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { integrationStatus } from "@/lib/config";

const currentStatus = [
  "The current login screen is a UI prototype; it does not authenticate users.",
  "The dashboard can be opened directly without signing in.",
  "Wardrobe data is shared through the prototype storage layer rather than isolated by user account.",
];

export default function LoginPage() {
  return (
    <AppShell
      eyebrow="Authentication"
      title="Authentication prototype"
      description="This page is the placeholder for the future sign-in flow. The current app does not create or verify user accounts."
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
                  disabled
                />
                <input
                  type="password"
                  placeholder="Authentication is not connected yet"
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-white/35"
                  disabled
                />
                <Link
                  href="/dashboard"
                  className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  Continue to demo
                </Link>
              </div>
            </div>
            <div className="relative py-2 text-center text-xs uppercase tracking-[0.35em] text-zinc-500">
              <span className="bg-transparent px-3">or</span>
            </div>
            <button
              type="button"
              disabled
              className="rounded-full border border-white/10 bg-black/40 px-5 py-3 text-sm font-medium text-zinc-500"
            >
              Google login is not connected
            </button>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-black/30 p-8">
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Current status</p>
              <h2 className="mt-3 text-3xl font-semibold">Prototype authentication</h2>
            </div>
            <div className="grid gap-3">
              {currentStatus.map((point) => (
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
                Google provider variables: {integrationStatus.googleAuth ? "set" : "not set"}
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                Auth secret: {integrationStatus.emailAuth ? "set" : "not set"}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
