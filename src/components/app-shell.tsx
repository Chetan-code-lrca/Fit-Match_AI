import type { ReactNode } from "react";

import { TopNav } from "@/components/top-nav";

type AppShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function AppShell({
  children,
  eyebrow,
  title,
  description,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_35%),linear-gradient(180deg,_#09090b_0%,_#111827_35%,_#030712_100%)] text-white">
      <TopNav />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        {title ? (
          <section className="grid gap-4 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
            {eyebrow ? (
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-400">
                {eyebrow}
              </span>
            ) : null}
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg">
                {description}
              </p>
            ) : null}
          </section>
        ) : null}
        {children}
      </main>
    </div>
  );
}
