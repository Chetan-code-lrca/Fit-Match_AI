import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { FadeIn } from "@/components/fade-in";
import { GenerateOutfitSection } from "@/components/generate-outfit-section";
import { ItemThumbnail } from "@/components/outfit-card";
import { WardrobeGallery } from "@/components/wardrobe-gallery";
import { recentOutfits, userProfile, wardrobeItems } from "@/lib/fitmatch-data";
import { buildOutfitOfTheDay, buildRecommendations } from "@/lib/style-engine";
import { resolveColorHex } from "@/lib/wardrobe-visuals";

const quickActions = [
  { label: "Upload clothes", href: "/upload", icon: "📤" },
  { label: "AI Stylist chat", href: "/chat", icon: "✨" },
  { label: "Browse outfits", href: "/suggestions", icon: "👗" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
];

const styleInsights = [
  { label: "Wardrobe items", value: wardrobeItems.length.toString().padStart(2, "0"), sub: "pieces indexed" },
  { label: "Outfit combinations", value: "42+", sub: "possible pairings" },
  { label: "Style profile", value: "Minimal", sub: "streetwear lean" },
  { label: "Color palette", value: "Earth", sub: "neutral dominant" },
];

export default function DashboardPage() {
  const outfitOfTheDay = buildOutfitOfTheDay();
  const topPicks = buildRecommendations("black-hoodie", "campus").slice(0, 2);

  return (
    <AppShell
      eyebrow="Personal AI Stylist"
      title={`Good morning, ${userProfile.name} 👋`}
      description="Your wardrobe intelligence dashboard — daily outfit, style insights, and AI-powered suggestions tailored to your closet."
    >
      {/* Quick action shortcuts */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action, index) => (
          <FadeIn key={action.href} delay={index * 0.05}>
            <Link
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-[24px] border border-white/10 bg-white/5 p-5 text-center transition hover:border-white/25 hover:bg-white/10"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-medium text-zinc-300">{action.label}</span>
            </Link>
          </FadeIn>
        ))}
      </section>

      {/* Outfit of the day + Style insights */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Outfit of the Day */}
        <FadeIn className="rounded-[32px] border border-white/10 bg-white/5 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Outfit of the day</p>
              <h2 className="mt-3 text-3xl font-semibold">{outfitOfTheDay.title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">
                {outfitOfTheDay.explanation}
              </p>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
              {outfitOfTheDay.confidenceScore}% match
            </span>
          </div>

          {/* Visual item thumbnails for outfit of the day */}
          <div className="mt-6 flex flex-wrap gap-4">
            {outfitOfTheDay.items.map((item) => (
              <div key={item.id} className="flex flex-col items-center gap-1.5">
                <ItemThumbnail item={item} size="lg" />
                <span className="max-w-[90px] truncate text-center text-[10px] text-zinc-400">
                  {item.name.split(" ").slice(0, 2).join(" ")}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] border border-white/10 bg-black/30 p-4 text-xs leading-5 text-zinc-400">
              <span className="block font-semibold text-white">Weather</span>
              {outfitOfTheDay.weatherSummary}
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/30 p-4 text-xs leading-5 text-zinc-400">
              <span className="block font-semibold text-white">Trending</span>
              {outfitOfTheDay.trendSummary}
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/30 p-4 text-xs leading-5 text-zinc-400">
              <span className="block font-semibold text-white">Rotation</span>
              {outfitOfTheDay.rotationHint}
            </div>
          </div>
        </FadeIn>

        {/* Style insights */}
        <div className="grid grid-cols-2 gap-3 content-start">
          {styleInsights.map((stat, index) => (
            <FadeIn
              key={stat.label}
              delay={0.1 + index * 0.05}
              className="rounded-[24px] border border-white/10 bg-white/5 p-5"
            >
              <p className="text-xs text-zinc-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-[10px] text-zinc-600">{stat.sub}</p>
            </FadeIn>
          ))}
          <FadeIn
            delay={0.3}
            className="col-span-2 rounded-[24px] border border-white/10 bg-black/30 p-5"
          >
            <p className="text-xs text-zinc-500">Favorite colors</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {userProfile.favoriteColors.map((color) => (
                <div key={color} className="flex items-center gap-1.5">
                  <span
                    className="h-5 w-5 rounded-full border border-white/20"
                    style={{ backgroundColor: resolveColorHex(color) }}
                  />
                  <span className="text-xs capitalize text-zinc-300">{color}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Recent outfit timeline + top picks */}
      <section className="grid gap-6 lg:grid-cols-2">
        <FadeIn className="rounded-[32px] border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Outfit history</p>
          <h2 className="mt-3 text-2xl font-semibold">Recent fits</h2>
          <div className="mt-6 grid gap-4">
            {recentOutfits.map((outfit) => (
              <article
                key={outfit.id}
                className="rounded-[24px] border border-white/10 bg-black/30 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{outfit.title}</h3>
                    <p className="mt-1 text-xs text-zinc-500">{outfit.wornOn}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                    {outfit.items.length} pieces
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {outfit.items.map((itemId) => {
                    const item = wardrobeItems.find((w) => w.id === itemId);
                    return item ? (
                      <ItemThumbnail key={itemId} item={item} size="sm" />
                    ) : (
                      <span
                        key={itemId}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400"
                      >
                        {itemId}
                      </span>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.1} className="rounded-[32px] border border-white/10 bg-black/30 p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">AI picks for today</p>
          <h2 className="mt-3 text-2xl font-semibold">Top outfit pairings</h2>
          <div className="mt-6 grid gap-4">
            {topPicks.map((rec) => (
              <article
                key={rec.id}
                className="rounded-[24px] border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{rec.title}</h3>
                    <p className="mt-1 text-xs text-zinc-500">{rec.occasion}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
                    {rec.confidenceScore}%
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {rec.items.map((item) => (
                    <ItemThumbnail key={item.id} item={item} size="sm" />
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-zinc-400">{rec.explanation}</p>
              </article>
            ))}
          </div>
          <Link
            href="/suggestions"
            className="mt-4 flex items-center justify-center rounded-full border border-white/10 py-3 text-sm text-zinc-300 transition hover:border-white/30 hover:text-white"
          >
            View all suggestions →
          </Link>
        </FadeIn>
      </section>

      {/* AI outfit engine */}
      <FadeIn delay={0.1}>
        <GenerateOutfitSection />
      </FadeIn>

      {/* Wardrobe gallery */}
      <FadeIn delay={0.12} className="rounded-[32px] border border-white/10 bg-white/5 p-8">
        <WardrobeGallery items={wardrobeItems} />
      </FadeIn>
    </AppShell>
  );
}
