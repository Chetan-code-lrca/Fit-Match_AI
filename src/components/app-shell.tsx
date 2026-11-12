import type { ReactNode } from "react";

import { TopNav } from "@/components/top-nav";

type AppShellProps = {
  children?: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function AppShell({ children, eyebrow, title, description }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#10120f] text-[#f4f2e9]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(ellipse_at_top,_rgba(158,190,116,0.13),_transparent_62%)]"
      />
      <TopNav />
      <main className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-9 px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
        {title ? (
          <section className="relative overflow-hidden rounded-[30px] border border-white/[0.09] bg-[#191d17]/85 px-6 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur sm:px-9 sm:py-9">
            <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-28 h-72 w-72 rounded-full border border-[#d3ee9c]/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-16 h-48 w-48 rounded-full border border-[#d3ee9c]/10" />
            <div className="relative max-w-4xl">
              {eyebrow ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d3ee9c]/20 bg-[#d3ee9c]/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d3ee9c]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d3ee9c]" />
                  {eyebrow}
                </span>
              ) : null}
              <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-[1.08] tracking-[-0.045em] text-[#f4f2e9] sm:text-5xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
        <div className="flex flex-col gap-8">{children}</div>
      </main>
      <footer className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-2 border-t border-white/[0.07] px-4 py-7 text-[10px] uppercase tracking-[0.18em] text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <span>FITMATCH AI · WARDROBE INTELLIGENCE</span>
        <span className="normal-case tracking-normal text-zinc-600">Build a wardrobe that works harder.</span>
      </footer>
    </div>
  );
}