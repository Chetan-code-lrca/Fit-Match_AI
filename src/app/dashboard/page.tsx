import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";

import { AppShell } from "@/components/app-shell";
import { FadeIn } from "@/components/fade-in";
import { GenerateOutfitSection } from "@/components/generate-outfit-section";
import { ItemThumbnail } from "@/components/outfit-card";
import { WardrobeGallery } from "@/components/wardrobe-gallery";
import { wardrobeItems } from "@/lib/fitmatch-data";
import { buildOutfitOfTheDay, buildRecommendations } from "@/lib/style-engine";
import { readUserWardrobeItems } from "@/lib/wardrobe-server";
import { resolveColorHex } from "@/lib/wardrobe-visuals";

const quickActions = [
  { label: "Add clothes", href: "/upload", icon: "+" },
  { label: "Explore outfits", href: "/suggestions", icon: "↗" },
  { label: "Ask your stylist", href: "/chat", icon: "✳" },
];

const categoryLabels = [
  { key: "top", label: "Tops", color: "#d3ee9c" },
  { key: "bottom", label: "Bottoms", color: "#b9c4ad" },
  { key: "layer", label: "Layers", color: "#d4b88e" },
  { key: "shoes", label: "Shoes", color: "#a9b8d4" },
  { key: "accessory", label: "Accessories", color: "#d5a9a2" },
] as const;

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const savedItems = await readUserWardrobeItems(session.accessToken, session.user.id);
  const activeWardrobe = savedItems.length > 0 ? savedItems : wardrobeItems;
  const outfitOfTheDay = buildOutfitOfTheDay(activeWardrobe);
  const topPicks = buildRecommendations(
    activeWardrobe[0]?.id ?? "black-hoodie",
    "campus",
    activeWardrobe,
  ).slice(0, 2);

  const categoryCounts = categoryLabels.map((category) => ({
    ...category,
    count: activeWardrobe.filter((item) => item.category === category.key).length,
  }));
  const totalCategoryCount = Math.max(activeWardrobe.length, 1);
  const topOptions = activeWardrobe.filter((item) => item.category === "top" || item.category === "layer").length;
  const bottomOptions = activeWardrobe.filter((item) => item.category === "bottom").length;
  const shoeOptions = activeWardrobe.filter((item) => item.category === "shoes").length;
  const uniqueColors = Array.from(new Set(activeWardrobe.map((item) => item.color)));
  const possibleCombinations = topOptions * bottomOptions * shoeOptions;

  const insights = [
    { label: "Pieces in your closet", value: String(activeWardrobe.length).padStart(2, "0"), note: savedItems.length ? "Saved wardrobe items" : "Starter wardrobe preview" },
    { label: "Colour families", value: String(uniqueColors.length).padStart(2, "0"), note: "Distinct colours represented" },
    { label: "Base combinations", value: possibleCombinations.toLocaleString("en-IN"), note: "Before style filtering" },
    { label: "Category coverage", value: categoryCounts.filter((category) => category.count > 0).length + "/5", note: "Core wardrobe categories" },
  ];

  return (
    <AppShell
      eyebrow="Your wardrobe, in rotation"
      title="More looks. Less guesswork."
      description="A clearer view of what you own, what works together and how to get more from every piece."
    >
      {!savedItems.length ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-[#d3ee9c]/15 bg-[#d3ee9c]/[0.045] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-zinc-400">
            You are viewing the starter wardrobe. Add your own pieces to personalise outfit suggestions.
          </p>
          <Link href="/upload" className="shrink-0 text-xs font-semibold text-[#d3ee9c] hover:underline">
            Add wardrobe pieces ↗
          </Link>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {quickActions.map((action, index) => (
          <FadeIn key={action.href} delay={index * 0.04}>
            <Link
              href={action.href}
              className="group flex items-center justify-between gap-4 rounded-[20px] border border-white/[0.08] bg-[#191d17]/70 px-5 py-4 transition hover:border-[#d3ee9c]/25 hover:bg-[#1e241b]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d3ee9c]/20 bg-[#d3ee9c]/[0.07] text-lg text-[#d3ee9c]">{action.icon}</span>
                <span className="text-sm font-medium text-zinc-200">{action.label}</span>
              </span>
              <span className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-[#d3ee9c]">→</span>
            </Link>
          </FadeIn>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <FadeIn className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#191d17] p-6 sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#d3ee9c]/[0.055] blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d3ee9c]">The daily edit</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#f4f2e9] sm:text-3xl">{outfitOfTheDay.title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">{outfitOfTheDay.explanation}</p>
            </div>
            <span className="rounded-full border border-[#d3ee9c]/25 bg-[#d3ee9c]/[0.08] px-3 py-2 text-xs font-semibold text-[#d3ee9c]">
              {outfitOfTheDay.confidenceScore}% match
            </span>
          </div>

          <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {outfitOfTheDay.items.map((item) => (
              <div key={item.id} className="flex min-w-0 flex-col items-center gap-2 rounded-[18px] border border-white/[0.07] bg-black/15 p-3 text-center">
                <ItemThumbnail item={item} size="lg" />
                <span className="line-clamp-2 text-[10px] leading-4 text-zinc-400">{item.name}</span>
              </div>
            ))}
          </div>

          <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[17px] border border-white/[0.07] bg-black/15 p-4">
              <p className="text-[9px] uppercase tracking-[0.17em] text-zinc-500">Colour harmony</p>
              <p className="mt-2 text-xl font-semibold text-[#f4f2e9]">{outfitOfTheDay.colorHarmonyScore}%</p>
            </div>
            <div className="rounded-[17px] border border-white/[0.07] bg-black/15 p-4">
              <p className="text-[9px] uppercase tracking-[0.17em] text-zinc-500">Style coherence</p>
              <p className="mt-2 text-xl font-semibold text-[#f4f2e9]">{outfitOfTheDay.aestheticScore}%</p>
            </div>
            <div className="rounded-[17px] border border-white/[0.07] bg-black/15 p-4">
              <p className="text-[9px] uppercase tracking-[0.17em] text-zinc-500">Occasion fit</p>
              <p className="mt-2 text-xl font-semibold text-[#f4f2e9]">{outfitOfTheDay.occasionMatchScore}%</p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.08} className="rounded-[28px] border border-white/[0.08] bg-[#191d17] p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Wardrobe pulse</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#f4f2e9]">Your closet at a glance</h2>
            </div>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-zinc-500">{activeWardrobe.length} pieces</span>
          </div>
          <div className="mt-7 space-y-5">
            {categoryCounts.map((category) => {
              const percentage = (category.count / totalCategoryCount) * 100;
              return (
                <div key={category.key}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-zinc-300">{category.label}</span>
                    <span className="tabular-nums text-zinc-500">{category.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full transition-all" style={{ width: percentage + "%", backgroundColor: category.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-7 border-t border-white/[0.08] pt-5">
            <p className="text-[10px] uppercase tracking-[0.17em] text-zinc-500">Palette in your closet</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {uniqueColors.map((color) => (
                <span key={color} className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/15 px-3 py-1.5 text-[10px] capitalize text-zinc-300">
                  <span className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: resolveColorHex(color) }} />
                  {color}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {insights.map((stat, index) => (
          <FadeIn key={stat.label} delay={index * 0.04} className="rounded-[21px] border border-white/[0.08] bg-[#191d17]/70 p-5">
            <p className="text-[10px] text-zinc-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#f4f2e9]">{stat.value}</p>
            <p className="mt-1 text-[10px] leading-4 text-zinc-600">{stat.note}</p>
          </FadeIn>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <FadeIn>
          <GenerateOutfitSection items={activeWardrobe} />
        </FadeIn>
        <FadeIn delay={0.08} className="rounded-[28px] border border-white/[0.08] bg-[#191d17] p-6 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d3ee9c]">Suggested next</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#f4f2e9]">Outfits to explore</h2>
          <p className="mt-2 text-xs leading-5 text-zinc-500">A couple of starting points based on the pieces currently in your wardrobe.</p>
          <div className="mt-5 space-y-3">
            {topPicks.map((recommendation) => (
              <article key={recommendation.id} className="rounded-[18px] border border-white/[0.07] bg-black/15 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200">{recommendation.title}</h3>
                    <p className="mt-1 text-[10px] capitalize text-zinc-500">{recommendation.occasion}</p>
                  </div>
                  <span className="rounded-full bg-[#d3ee9c] px-2.5 py-1 text-[10px] font-bold text-[#182011]">{recommendation.confidenceScore}%</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recommendation.items.map((item) => (
                    <ItemThumbnail key={item.id} item={item} size="sm" />
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-zinc-500">{recommendation.explanation}</p>
              </article>
            ))}
          </div>
          <Link href="/suggestions" className="mt-5 inline-flex text-xs font-semibold text-[#d3ee9c] transition hover:underline">
            Open outfit lab ↗
          </Link>
        </FadeIn>
      </section>

      <FadeIn className="rounded-[28px] border border-white/[0.08] bg-[#191d17] p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Your pieces</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f4f2e9]">The wardrobe, organised.</h2>
          </div>
          <Link href="/upload" className="text-xs font-semibold text-[#d3ee9c] hover:underline">Manage pieces ↗</Link>
        </div>
        <WardrobeGallery items={activeWardrobe} allowDelete={savedItems.length > 0} />
      </FadeIn>

      {!savedItems.length ? (
        <p className="text-center text-[10px] leading-5 text-zinc-700">
          Starter data is used for this preview. Sample style signals are illustrative, not a personal analysis.
        </p>
      ) : null}
    </AppShell>
  );
}