import Image from "next/image";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { FadeIn } from "@/components/fade-in";
import { buildOutfitOfTheDay } from "@/lib/style-engine";

const featureCards = [
  "Private wardrobe uploads with image-aware tagging",
  "AI outfit scoring across aesthetics, color harmony, and occasion fit",
  "Conversational stylist chat grounded in your own closet",
  "Responsive premium UI with dashboard, uploads, suggestions, and settings",
];

const requiredPages = [
  { title: "Dashboard", href: "/dashboard", copy: "Daily outfit, wardrobe health, favorites, and recent history." },
  { title: "Upload Wardrobe", href: "/upload", copy: "Mirror selfies, item shots, and analysis metadata in one flow." },
  { title: "Outfit Suggestions", href: "/suggestions", copy: "Color-theory-backed combinations driven by what you already own." },
  { title: "AI Stylist Chat", href: "/chat", copy: "Prompt for college, travel, monochrome, and sneaker-based fits." },
];

export default function Home() {
  const outfitOfTheDay = buildOutfitOfTheDay();

  return (
    <AppShell>
      <section className="grid gap-8 rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
        <FadeIn className="space-y-8">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-zinc-400">
            Jarvis for fashion
          </div>
          <div className="space-y-6">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl">
              Your wardrobe, upgraded into an AI stylist.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-zinc-300">
              FitMatch AI turns your uploaded outfits into a smart closet that understands
              colors, layering, occasion fit, and daily style recommendations.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Launch dashboard
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              Explore auth flow
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featureCards.map((card, index) => (
              <FadeIn
                key={card}
                delay={index * 0.08}
                className="rounded-[28px] border border-white/10 bg-black/30 p-5 text-sm leading-6 text-zinc-300"
              >
                {card}
              </FadeIn>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.15} className="rounded-[32px] border border-white/10 bg-black/30 p-6">
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-zinc-950">
            <Image
              src="/stylist-orb.svg"
              alt="FitMatch AI premium stylist visual"
              width={760}
              height={640}
              className="h-auto w-full"
              priority
            />
          </div>
          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Outfit of the day</p>
                <h2 className="mt-2 text-2xl font-semibold">{outfitOfTheDay.title}</h2>
              </div>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
                {outfitOfTheDay.confidenceScore}% confidence
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{outfitOfTheDay.explanation}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {outfitOfTheDay.items.map((item) => (
                <span
                  key={item.id}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300"
                >
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <FadeIn className="rounded-[32px] border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Experience</p>
          <h2 className="mt-4 text-3xl font-semibold">Designed for premium, mobile-first styling.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
            Built with Next.js, Tailwind CSS, Framer Motion, and modular recommendation APIs so
            it is ready for future weather, calendar, shopping, and voice assistant features.
          </p>
          <div className="mt-8 overflow-hidden rounded-[24px] border border-white/10">
            <Image
              src="/wardrobe-grid.svg"
              alt="Wardrobe dashboard preview"
              width={1200}
              height={700}
              className="h-auto w-full"
            />
          </div>
        </FadeIn>
        <div className="grid gap-6">
          {requiredPages.map((page, index) => (
            <FadeIn
              key={page.title}
              delay={index * 0.08}
              className="rounded-[32px] border border-white/10 bg-black/30 p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">{page.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{page.copy}</p>
                </div>
                <Link
                  href={page.href}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  Open
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
