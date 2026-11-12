import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { FadeIn } from "@/components/fade-in";
import { ItemThumbnail } from "@/components/outfit-card";
import { wardrobeItems } from "@/lib/fitmatch-data";
import { buildOutfitOfTheDay } from "@/lib/style-engine";

const productSignals = [
  {
    number: "01",
    title: "Start with your closet",
    description: "Build looks around pieces you already own instead of sending you straight to another shopping feed.",
  },
  {
    number: "02",
    title: "See why a look works",
    description: "Compare colour harmony, style coherence and occasion fit instead of relying on a mystery score.",
  },
  {
    number: "03",
    title: "Make every piece count",
    description: "Explore more combinations from the same wardrobe and make more intentional outfit decisions.",
  },
];

export default function Home() {
  const outfit = buildOutfitOfTheDay(wardrobeItems);

  return (
    <AppShell>
      <section className="relative isolate grid overflow-hidden rounded-[32px] border border-white/[0.09] bg-[#191d17] shadow-[0_28px_100px_rgba(0,0,0,0.24)] lg:grid-cols-[1.08fr_0.92fr]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-40 h-[440px] w-[440px] rounded-full bg-[#d3ee9c]/[0.07] blur-3xl"
        />
        <FadeIn className="relative flex flex-col justify-center px-7 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d3ee9c]/20 bg-[#d3ee9c]/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d3ee9c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d3ee9c]" />
            Style intelligence, not more shopping
          </div>

          <h1 className="mt-7 max-w-3xl text-[clamp(2.7rem,6vw,5.7rem)] font-semibold leading-[0.98] tracking-[-0.065em] text-[#f4f2e9]">
            Get more out of
            <span className="block text-[#d3ee9c]">what you own.</span>
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base sm:leading-8">
            FitMatch turns your wardrobe into a personal styling system — building complete looks,
            explaining why they work and helping you make more intentional outfit decisions.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 rounded-full bg-[#d3ee9c] px-6 py-3.5 text-sm font-semibold text-[#182011] transition hover:-translate-y-0.5 hover:bg-[#e0f5b8]"
            >
              Explore your wardrobe
              <span aria-hidden="true">↗</span>
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center rounded-full border border-white/[0.13] px-6 py-3.5 text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/[0.04]"
            >
              Build your closet
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/[0.08] pt-6">
            <div>
              <p className="text-2xl font-semibold tracking-tight text-[#f4f2e9]">5</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">Style contexts</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-[#f4f2e9]">4</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">Matching signals</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-[#f4f2e9]">1</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">Personal closet</p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.12} className="relative m-3 flex flex-col justify-between overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#11140f] p-5 sm:m-4 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">The daily edit</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#f4f2e9]">A look from your closet</h2>
            </div>
            <span className="rounded-full border border-[#d3ee9c]/25 bg-[#d3ee9c]/[0.08] px-3 py-1.5 text-xs font-semibold text-[#d3ee9c]">
              {outfit.confidenceScore}% match
            </span>
          </div>

          <div className="my-7 rounded-[22px] border border-white/[0.08] bg-[#1b2018] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Suggested combination</span>
              <span className="text-[10px] text-zinc-600">Starter wardrobe</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {outfit.items.map((item) => (
                <div key={item.id} className="flex min-w-0 flex-col items-center gap-2 text-center">
                  <ItemThumbnail item={item} size="lg" />
                  <span className="line-clamp-2 text-[10px] leading-4 text-zinc-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.035] p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">Colour balance</p>
              <p className="mt-2 text-2xl font-semibold text-[#f4f2e9]">{outfit.colorHarmonyScore}%</p>
              <div className="mt-3 h-1 rounded-full bg-white/10">
                <div className="h-1 rounded-full bg-[#d3ee9c]" style={{ width: outfit.colorHarmonyScore + "%" }} />
              </div>
            </div>
            <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.035] p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">Occasion fit</p>
              <p className="mt-2 text-2xl font-semibold text-[#f4f2e9]">{outfit.occasionMatchScore}%</p>
              <div className="mt-3 h-1 rounded-full bg-white/10">
                <div className="h-1 rounded-full bg-[#d3ee9c]" style={{ width: outfit.occasionMatchScore + "%" }} />
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {productSignals.map((signal, index) => (
          <FadeIn
            key={signal.number}
            delay={index * 0.06}
            className="rounded-[25px] border border-white/[0.08] bg-[#191d17]/75 p-6 transition hover:-translate-y-1 hover:border-[#d3ee9c]/25"
          >
            <span className="text-xs font-semibold tracking-[0.16em] text-[#d3ee9c]">{signal.number}</span>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-[#f4f2e9]">{signal.title}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{signal.description}</p>
          </FadeIn>
        ))}
      </section>

      <section className="flex flex-col gap-6 rounded-[28px] border border-white/[0.08] bg-[#171b15] px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-9">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d3ee9c]">A better relationship with your wardrobe</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#f4f2e9] sm:text-3xl">
            Your next great outfit might already be in your closet.
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Start with a few pieces. Let FitMatch help you find the combinations you have been overlooking.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#d3ee9c] px-6 py-3.5 text-sm font-semibold text-[#182011] transition hover:bg-[#e0f5b8]"
        >
          Add your first pieces <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </AppShell>
  );
}