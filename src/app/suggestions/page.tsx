import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { FadeIn } from "@/components/fade-in";
import { wardrobeItems } from "@/lib/fitmatch-data";
import { buildRecommendations } from "@/lib/style-engine";

type SuggestionsPageProps = {
  searchParams?: Promise<{ item?: string }>;
};

export default async function SuggestionsPage({ searchParams }: SuggestionsPageProps) {
  const params = (await searchParams) ?? {};
  const selectedItemId = params.item ?? "black-hoodie";
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

  const selectedItem =
    wardrobeItems.find((item) => item.id === selectedItemId) ?? fallbackItem;
  const recommendations = buildRecommendations(selectedItem.id);

  return (
    <AppShell
      eyebrow="Smart outfit recommendation engine"
      title={`Suggestions built around ${selectedItem.name}`}
      description="FitMatch AI scores combinations using color theory, occasion suitability, skin-tone-friendly neutrals, and your saved wardrobe preferences."
    >
      <section className="flex flex-wrap gap-3">
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
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {recommendations.map((recommendation, index) => (
          <FadeIn
            key={recommendation.id}
            delay={index * 0.08}
            className="rounded-[32px] border border-white/10 bg-white/5 p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
                  {recommendation.occasion}
                </p>
                <h2 className="mt-3 text-2xl font-semibold">{recommendation.title}</h2>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
                {recommendation.confidenceScore}% fit
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-300">{recommendation.explanation}</p>
            <div className="mt-6 grid gap-3">
              {[
                ["Aesthetic", recommendation.aestheticScore],
                ["Color harmony", recommendation.colorHarmonyScore],
                ["Occasion match", recommendation.occasionMatchScore],
                ["Confidence", recommendation.confidenceScore],
              ].map(([label, value]) => (
                <div key={label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{label}</span>
                    <span>{value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-white"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {recommendation.items.map((item) => (
                <span
                  key={item.id}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300"
                >
                  {item.name}
                </span>
              ))}
            </div>
          </FadeIn>
        ))}
      </section>
    </AppShell>
  );
}
