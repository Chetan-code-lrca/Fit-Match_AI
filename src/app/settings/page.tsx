import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getCurrentSession } from "@/lib/auth";
import { integrationStatus } from "@/lib/config";
import { wardrobeItems as starterWardrobe } from "@/lib/fitmatch-data";
import { readUserWardrobeItems } from "@/lib/wardrobe-server";
import { resolveColorHex } from "@/lib/wardrobe-visuals";

const connectionLabels: Record<keyof typeof integrationStatus, string> = {
  supabase: "Authentication, database and private storage",
  openAi: "OpenAI explanation enrichment",
  weather: "Weather context",
};

const nextCapabilities = [
  {
    title: "Wear history and wardrobe ROI",
    description: "Record what you wear and understand cost-per-wear and underused pieces.",
  },
  {
    title: "Personal style profile",
    description: "Save silhouette preferences, fit notes and combinations to avoid for more tailored suggestions.",
  },
  {
    title: "Weather-aware outfit planning",
    description: "Use a real forecast to adjust layers and outfit suggestions for the day.",
  },
  {
    title: "More accurate garment recognition",
    description: "Recognise garment type, pattern and attributes from the uploaded image.",
  },
];

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const savedItems = await readUserWardrobeItems(session.accessToken, session.user.id);
  const wardrobe = savedItems.length > 0 ? savedItems : starterWardrobe;
  const colors = Array.from(new Set(wardrobe.map((item) => item.color)));
  const connectedCount = Object.values(integrationStatus).filter(Boolean).length;

  return (
    <AppShell
      eyebrow="Workspace configuration"
      title="Know what powers your style profile."
      description="Review your saved wardrobe, connected services and the styling capabilities still on the roadmap."
    >
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[26px] border border-white/[0.08] bg-[#191d17] p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d3ee9c]">Wardrobe profile</p>
              <h2 className="mt-2 text-xl font-semibold text-[#f4f2e9]">Your style signals</h2>
            </div>
            <span className="rounded-full border border-white/[0.1] px-3 py-1.5 text-[10px] text-zinc-400">
              {savedItems.length ? "Saved wardrobe" : "Starter preview"}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-[18px] border border-white/[0.07] bg-black/15 p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Pieces indexed</p>
              <p className="mt-2 text-3xl font-semibold text-[#f4f2e9]">{wardrobe.length}</p>
            </div>
            <div className="rounded-[18px] border border-white/[0.07] bg-black/15 p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Colour families</p>
              <p className="mt-2 text-3xl font-semibold text-[#f4f2e9]">{colors.length}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Colours found in your wardrobe</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {colors.map((color) => (
                <span key={color} className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/15 px-3 py-2 text-[10px] capitalize text-zinc-300">
                  <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: resolveColorHex(color) }} />
                  {color}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-6 border-t border-white/[0.07] pt-4 text-[10px] leading-5 text-zinc-600">
            These signals are derived from your account wardrobe. A sample wardrobe is shown only until you add your own pieces.
          </p>
        </div>

        <div className="rounded-[26px] border border-white/[0.08] bg-[#191d17] p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Service status</p>
              <h2 className="mt-2 text-xl font-semibold text-[#f4f2e9]">Connected services</h2>
            </div>
            <span className="rounded-full border border-[#d3ee9c]/20 bg-[#d3ee9c]/[0.07] px-3 py-1.5 text-[10px] text-[#d3ee9c]">
              {connectedCount}/{Object.keys(integrationStatus).length} configured
            </span>
          </div>

          <div className="mt-6 space-y-2.5">
            {Object.entries(integrationStatus).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-[15px] border border-white/[0.07] bg-black/15 px-4 py-3">
                <span className="text-xs text-zinc-300">{connectionLabels[key as keyof typeof integrationStatus]}</span>
                <span className={"inline-flex items-center gap-2 text-[10px] " + (enabled ? "text-[#d3ee9c]" : "text-zinc-600")}>
                  <span className={"h-1.5 w-1.5 rounded-full " + (enabled ? "bg-[#d3ee9c]" : "bg-zinc-600")} />
                  {enabled ? "Configured" : "Not configured"}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] leading-5 text-zinc-600">
            Configuration status confirms environment variables are present; it does not guarantee an external provider is healthy.
          </p>
        </div>
      </section>

      <section className="rounded-[26px] border border-white/[0.08] bg-[#191d17] p-6 sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d3ee9c]">Development roadmap</p>
        <h2 className="mt-2 text-xl font-semibold text-[#f4f2e9]">What will make FitMatch more useful.</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {nextCapabilities.map((item, index) => (
            <article key={item.title} className="rounded-[18px] border border-white/[0.07] bg-black/15 p-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-[#d3ee9c]">0{index + 1}</span>
                <h3 className="text-sm font-semibold text-zinc-200">{item.title}</h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-amber-200/10 bg-amber-100/[0.025] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/70">Account data protection</p>
        <p className="mt-2 max-w-4xl text-xs leading-6 text-zinc-500">
          Wardrobe records are scoped to your account by database row-level security. Uploaded images are stored in a private bucket and delivered through short-lived signed URLs. Keep your account credentials private and use only images you have permission to store.
        </p>
      </section>
    </AppShell>
  );
}