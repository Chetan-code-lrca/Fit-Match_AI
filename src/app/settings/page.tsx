import { AppShell } from "@/components/app-shell";
import { integrationStatus } from "@/lib/config";
import { trendSignals, userProfile, weatherModes } from "@/lib/fitmatch-data";

const futureFeatures = [
  "Weather integration",
  "Calendar outfit planner",
  "Travel packing assistant",
  "AI-generated outfit previews",
  "Voice-first stylist assistant",
  "Shopping recommendations",
];

export default function SettingsPage() {
  return (
    <AppShell
      eyebrow="Profile and configuration"
      title="Control your style profile and integrations"
      description="Update style preferences, preferred palettes, feature readiness, and deployment environment variables from one place."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Profile</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-zinc-400">Style persona</p>
              <p className="mt-2 text-lg font-semibold">{userProfile.stylePersona}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-zinc-400">Skin tone compatibility</p>
              <p className="mt-2 text-lg font-semibold">{userProfile.skinTone}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-zinc-400">Favorite colors</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {userProfile.favoriteColors.map((color) => (
                  <span
                    key={color}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-black/30 p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Environment readiness</p>
          <div className="mt-6 grid gap-3">
            {Object.entries(integrationStatus).map(([key, enabled]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm"
              >
                <span className="capitalize text-zinc-300">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className={enabled ? "text-emerald-300" : "text-amber-300"}>
                  {enabled ? "Connected" : "Awaiting env vars"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Recommendation context</p>
          <div className="mt-6 grid gap-3">
            {weatherModes.map((weather) => (
              <div
                key={weather.key}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4"
              >
                <p className="font-semibold">{weather.label}</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Boosts {weather.boost} outfit recommendations for daily styling.
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {trendSignals.map((signal) => (
              <span
                key={signal}
                className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300"
              >
                {signal}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-black/30 p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Future-ready architecture</p>
          <div className="mt-6 grid gap-3">
            {futureFeatures.map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-zinc-300"
              >
                {feature}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
