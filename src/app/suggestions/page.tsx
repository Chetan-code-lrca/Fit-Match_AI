import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { FadeIn } from "@/components/fade-in";
import { OutfitCard } from "@/components/outfit-card";
import { wardrobeItems as staticWardrobeItems } from "@/lib/fitmatch-data";
import { buildRecommendations } from "@/lib/style-engine";
import { readUserWardrobeItems } from "@/lib/wardrobe-server";

export const dynamic = "force-dynamic";

type SuggestionsPageProps = {
  searchParams?: Promise<{ item?: string; occasion?: string }>;
};

export default async function SuggestionsPage({ searchParams }: SuggestionsPageProps) {
  const params = (await searchParams) ?? {};

  // Merge user-uploaded items (with real images) with static fallback items
  const userItems = readUserWardrobeItems();
  const wardrobeItems =
    userItems.length > 0
      ? // Prefer user items; fill missing categories with static items that aren't superseded
        [
          ...userItems,
          ...staticWardrobeItems.filter(
            (si) => !userItems.some((ui) => ui.id === si.id),
          ),
        ]
      : staticWardrobeItems;

  const fallbackItem = wardrobeItems[0];

  if (!fallbackItem) {
    return (
      <AppShell
        eyebrow="Smart outfit recommendation engine"
        title="No wardrobe items available yet"
        description="Upload items to start generating outfit recommendations."
      />
    );
  }

  const defaultItemId = userItems[0]?.id ?? "black-hoodie";
  const selectedItemId = params.item ?? defaultItemId;
  const selectedItem =
    wardrobeItems.find((item) => item.id === selectedItemId) ?? fallbackItem;
  const recommendations = buildRecommendations(selectedItem.id, "campus", wardrobeItems);

  return (
    <AppShell
      eyebrow="Smart outfit recommendation engine"
      title={`Built around ${selectedItem.name}`}
      description="FitMatch AI scores combinations using color theory, occasion suitability, skin-tone-friendly neutrals, and your saved wardrobe preferences."
    >
      {/* Item selector pills */}
      <section>
        <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">
          Anchor piece — tap to switch
        </p>
        <div className="flex flex-wrap gap-2">
          {wardrobeItems
            .filter((item) => item.category !== "accessory")
            .map((item) => (
              <Link
                key={item.id}
                href={`/suggestions?item=${item.id}`}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  item.id === selectedItem.id
                    ? "bg-white text-black"
                    : "border border-white/10 bg-black/30 text-zinc-300 hover:border-white/30 hover:bg-white/10"
                }`}
              >
                {item.name}
              </Link>
            ))}
        </div>
      </section>

      {/* Outfit recommendation cards */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {recommendations.map((recommendation, index) => (
          <FadeIn key={recommendation.id} delay={index * 0.08}>
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
      </section>

      {/* Tip card */}
      <FadeIn delay={0.3} className="rounded-[28px] border border-white/10 bg-black/30 p-6">
        <p className="text-xs uppercase tracking-widest text-zinc-500">How scoring works</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Color harmony",
              desc: "Scores how well the palette tones balance each other based on complementary and analogous color theory.",
            },
            {
              label: "Aesthetic fit",
              desc: "Measures how consistently the silhouette, style types, and fabric weights work together.",
            },
            {
              label: "Occasion match",
              desc: "Checks how many items in the outfit are tagged for the target occasion.",
            },
          ].map((tip) => (
            <div key={tip.label} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold">{tip.label}</p>
              <p className="mt-2 text-xs leading-5 text-zinc-400">{tip.desc}</p>
            </div>
          ))}
        </div>
      </FadeIn>
    </AppShell>
  );
}

