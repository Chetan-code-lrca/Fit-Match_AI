import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { FadeIn } from "@/components/fade-in";
import { OutfitCard } from "@/components/outfit-card";
import {
  wardrobeItems as starterWardrobe,
  type WardrobeOccasion,
} from "@/lib/fitmatch-data";
import { buildRecommendations } from "@/lib/style-engine";
import { readUserWardrobeItems } from "@/lib/wardrobe-server";

export const dynamic = "force-dynamic";

type SuggestionsPageProps = {
  searchParams?: Promise<{ item?: string; occasion?: string }>;
};

const occasions: Array<{ value: WardrobeOccasion; label: string }> = [
  { value: "campus", label: "Campus" },
  { value: "smart-casual", label: "Smart casual" },
  { value: "streetwear", label: "Streetwear" },
  { value: "travel", label: "Travel" },
  { value: "night-out", label: "Night out" },
];

export default async function SuggestionsPage({ searchParams }: SuggestionsPageProps) {
  const params = (await searchParams) ?? {};
  const savedItems = await readUserWardrobeItems();
  const wardrobe = savedItems.length > 0 ? savedItems : starterWardrobe;
  const fallbackItem = wardrobe[0];

  if (!fallbackItem) {
    return (
      <AppShell
        eyebrow="Outfit lab"
        title="Your wardrobe is ready when you are."
        description="Add a few clothing pieces to start building complete outfit combinations."
      />
    );
  }

  const selectedItem = wardrobe.find((item) => item.id === params.item) ?? fallbackItem;
  const selectedOccasion = occasions.some((item) => item.value === params.occasion)
    ? (params.occasion as WardrobeOccasion)
    : "campus";
  const recommendations = buildRecommendations(selectedItem.id, selectedOccasion, wardrobe);
  const starterMode = savedItems.length === 0;

  function hrefFor(itemId: string, occasion: WardrobeOccasion) {
    return "/suggestions?item=" + encodeURIComponent(itemId) + "&occasion=" + occasion;
  }

  return (
    <AppShell
      eyebrow="Outfit lab · Explainable matching"
      title="A better combination starts with one piece."
      description="Choose an anchor item and an occasion. FitMatch ranks the pieces in your wardrobe by colour compatibility, style coherence, occasion fit and versatility."
    >
      {starterMode ? (
        <div className="rounded-2xl border border-[#d3ee9c]/15 bg-[#d3ee9c]/[0.045] px-4 py-3 text-xs leading-5 text-zinc-400">
          This is a starter wardrobe preview. Your saved pieces will replace this sample once you add them.
          <Link href="/upload" className="ml-2 font-semibold text-[#d3ee9c] hover:underline">Add your clothes ↗</Link>
        </div>
      ) : null}

      <section className="rounded-[24px] border border-white/[0.08] bg-[#191d17] p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">01 · Choose your anchor</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {wardrobe
              .filter((item) => item.category !== "accessory")
              .map((item) => (
                <Link
                  key={item.id}
                  href={hrefFor(item.id, selectedOccasion)}
                  aria-current={item.id === selectedItem.id ? "true" : undefined}
                  className={
                    "rounded-full border px-3.5 py-2 text-[11px] transition " +
                    (item.id === selectedItem.id
                      ? "border-[#d3ee9c]/50 bg-[#d3ee9c] font-semibold text-[#182011]"
                      : "border-white/[0.1] bg-white/[0.025] text-zinc-400 hover:border-white/25 hover:text-white")
                  }
                >
                  {item.name}
                </Link>
              ))}
          </div>
        </div>

        <div className="mt-7 border-t border-white/[0.07] pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">02 · Set the occasion</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {occasions.map((item) => (
              <Link
                key={item.value}
                href={hrefFor(selectedItem.id, item.value)}
                aria-current={selectedOccasion === item.value ? "true" : undefined}
                className={
                  "rounded-full border px-3.5 py-2 text-[11px] transition " +
                  (selectedOccasion === item.value
                    ? "border-[#d3ee9c]/50 bg-[#d3ee9c]/[0.1] font-semibold text-[#d3ee9c]"
                    : "border-white/[0.1] text-zinc-500 hover:border-white/25 hover:text-zinc-200")
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-black/15 px-4 py-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">Building around</p>
            <p className="mt-1 text-sm font-semibold text-zinc-200">{selectedItem.name}</p>
          </div>
          <span className="rounded-full border border-white/[0.09] px-3 py-1.5 text-[10px] capitalize text-zinc-400">
            {selectedOccasion.replace("-", " ")}
          </span>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d3ee9c]">03 · Your combinations</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#f4f2e9]">
              Looks ranked for {selectedOccasion.replace("-", " ")}
            </h2>
          </div>
          <span className="text-[10px] text-zinc-600">{recommendations.length} styling directions</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((recommendation, index) => (
            <FadeIn key={recommendation.id} delay={index * 0.05}>
              <OutfitCard
                outfitName={recommendation.title}
                score={recommendation.confidenceScore}
                reasoning={recommendation.explanation}
                occasion={recommendation.occasion}
                items={recommendation.items}
                colorHarmonyScore={recommendation.colorHarmonyScore}
                aestheticScore={recommendation.aestheticScore}
              />
            </FadeIn>
          ))}
        </div>
      </section>

      <FadeIn className="rounded-[24px] border border-white/[0.08] bg-[#191d17] p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">How the match is calculated</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Colour harmony", value: "30%", desc: "Compares colour families and palette compatibility." },
            { label: "Style coherence", value: "25%", desc: "Checks whether the style labels of paired pieces work together." },
            { label: "Occasion fit", value: "30%", desc: "Prioritises pieces tagged for the selected occasion." },
            { label: "Versatility", value: "15%", desc: "Rewards pieces that are tagged for more than one setting." },
          ].map((signal) => (
            <div key={signal.label} className="rounded-[18px] border border-white/[0.07] bg-black/15 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-zinc-200">{signal.label}</p>
                <span className="text-xs font-semibold text-[#d3ee9c]">{signal.value}</span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-zinc-500">{signal.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] leading-5 text-zinc-600">
          Match scores are deterministic heuristics based on wardrobe metadata. They are not measured confidence probabilities or outputs from a trained fashion model.
        </p>
      </FadeIn>
    </AppShell>
  );
}