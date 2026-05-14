import { AppShell } from "@/components/app-shell";
import { FadeIn } from "@/components/fade-in";
import { integrationStatus } from "@/lib/config";
import { recentOutfits, userProfile, wardrobeItems } from "@/lib/fitmatch-data";
import { buildOutfitOfTheDay, buildRecommendations } from "@/lib/style-engine";

const dashboardStats = [
  { label: "Wardrobe items", value: wardrobeItems.length.toString().padStart(2, "0") },
  { label: "Saved combinations", value: "18" },
  { label: "Recommendation history", value: "42" },
  { label: "Favorite palette", value: "Earth + neutral" },
];

export default function DashboardPage() {
  const outfitOfTheDay = buildOutfitOfTheDay();
  const recommendations = buildRecommendations("black-hoodie", "campus");

  return (
    <AppShell
      eyebrow="Virtual closet dashboard"
      title={`Welcome back, ${userProfile.name}`}
      description="Track wardrobe coverage, AI suggestions, favorites, and the daily outfit generator from one premium control center."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <FadeIn
            key={stat.label}
            delay={index * 0.06}
            className="rounded-[28px] border border-white/10 bg-white/5 p-6"
          >
            <p className="text-sm text-zinc-400">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
          </FadeIn>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <FadeIn className="rounded-[32px] border border-white/10 bg-white/5 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Outfit of the day</p>
              <h2 className="mt-3 text-3xl font-semibold">{outfitOfTheDay.title}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300">
                {outfitOfTheDay.explanation}
              </p>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
              {outfitOfTheDay.confidenceScore}% confidence
            </span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
              <p className="text-sm font-semibold">Why today?</p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{outfitOfTheDay.weatherSummary}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{outfitOfTheDay.trendSummary}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{outfitOfTheDay.rotationHint}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
              <p className="text-sm font-semibold">Recommended pieces</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {outfitOfTheDay.items.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.1} className="rounded-[32px] border border-white/10 bg-black/30 p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Integration status</p>
          <div className="mt-5 grid gap-3">
            {Object.entries(integrationStatus).map(([key, enabled]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm"
              >
                <span className="capitalize text-zinc-300">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className={enabled ? "text-emerald-300" : "text-amber-300"}>
                  {enabled ? "Ready" : "Needs environment variables"}
                </span>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <FadeIn className="rounded-[32px] border border-white/10 bg-white/5 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Recent outfits</p>
              <h2 className="mt-3 text-3xl font-semibold">Keep variety in rotation</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            {recentOutfits.map((outfit) => (
              <article
                key={outfit.id}
                className="rounded-[24px] border border-white/10 bg-black/30 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{outfit.title}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{outfit.wornOn}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                    {outfit.items.length} pieces
                  </span>
                </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {outfit.items.map((itemId) => (
                  <span
                    key={itemId}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300"
                  >
                    {wardrobeItems.find((item) => item.id === itemId)?.name ?? itemId}
                  </span>
                ))}
              </div>
              </article>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.12} className="rounded-[32px] border border-white/10 bg-black/30 p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Recommendation engine</p>
          <h2 className="mt-3 text-3xl font-semibold">Fresh pairings from your wardrobe</h2>
          <div className="mt-6 grid gap-4">
            {recommendations.map((recommendation) => (
              <article
                key={recommendation.id}
                className="rounded-[24px] border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{recommendation.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {recommendation.explanation}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
                    {recommendation.confidenceScore}%
                  </span>
                </div>
              </article>
            ))}
          </div>
        </FadeIn>
      </section>
    </AppShell>
  );
}
