"use client";

import { useState } from "react";

import { OutfitCarousel, type OutfitSuggestion } from "@/components/outfit-carousel";
import type { WardrobeItem, WardrobeOccasion } from "@/lib/fitmatch-data";

type ApiOutfit = {
  outfitName: string;
  score: number;
  reasoning: string;
  occasion: string;
  items: WardrobeItem[];
};

type GenerateOutfitSectionProps = {
  items: WardrobeItem[];
};

const occasions: Array<{ value: WardrobeOccasion; label: string }> = [
  { value: "campus", label: "Campus" },
  { value: "smart-casual", label: "Smart casual" },
  { value: "streetwear", label: "Streetwear" },
  { value: "travel", label: "Travel" },
  { value: "night-out", label: "Night out" },
];

export function GenerateOutfitSection({ items }: GenerateOutfitSectionProps) {
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
  const [occasion, setOccasion] = useState<WardrobeOccasion>("campus");
  const [anchorItemId, setAnchorItemId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ count: "6", occasion });
      if (anchorItemId) params.set("item", anchorItemId);
      const response = await fetch("/api/generate-outfits?" + params.toString());
      if (!response.ok) {
        throw new Error("The outfit engine could not complete this request.");
      }

      const data = (await response.json()) as { outfits?: ApiOutfit[] };
      setOutfits(data.outfits ?? []);
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-[#191d17] p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d3ee9c]">Outfit lab</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f4f2e9]">Build a look around your day.</h2>
          <p className="mt-2 max-w-lg text-xs leading-6 text-zinc-500">
            Choose the occasion and, optionally, one piece to build around. FitMatch compares the combinations using your closet data.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500">What are you dressing for?</p>
        <div className="flex flex-wrap gap-2">
          {occasions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={occasion === option.value}
              onClick={() => setOccasion(option.value)}
              className={
                "rounded-full border px-3.5 py-2 text-[11px] font-medium transition " +
                (occasion === option.value
                  ? "border-[#d3ee9c]/40 bg-[#d3ee9c] text-[#182011]"
                  : "border-white/[0.1] bg-white/[0.025] text-zinc-400 hover:border-white/25 hover:text-white")
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500">
            Build around a piece <span className="normal-case tracking-normal text-zinc-600">(optional)</span>
          </span>
          <select
            value={anchorItemId}
            onChange={(event) => setAnchorItemId(event.target.value)}
            className="w-full rounded-2xl border border-white/[0.1] bg-[#11140f] px-4 py-3 text-xs text-zinc-200 outline-none transition focus:border-[#d3ee9c]/50"
          >
            <option value="">Surprise me — use the whole closet</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || items.length === 0}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#d3ee9c] px-6 py-3.5 text-xs font-bold text-[#182011] transition hover:-translate-y-0.5 hover:bg-[#e0f5b8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#182011]/25 border-t-[#182011]" />
              Finding combinations
            </>
          ) : generated ? "Refresh looks ↻" : "Find my looks ↗"}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/[0.08] px-4 py-3 text-xs text-red-200">
          {error}
        </p>
      ) : null}

      {!generated && !loading ? (
        <div className="mt-5 flex items-center gap-3 rounded-[18px] border border-dashed border-white/[0.12] bg-black/10 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d3ee9c]/[0.08] text-lg text-[#d3ee9c]">✳</span>
          <p className="text-xs leading-5 text-zinc-500">Your results appear here, with the pieces and matching signals behind each suggestion.</p>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-[24px] border border-white/[0.07] bg-white/[0.035]" />
          ))}
        </div>
      ) : null}

      {!loading && outfits.length > 0 ? (
        <div className="mt-6">
          <OutfitCarousel outfits={outfits} />
        </div>
      ) : null}

      {!loading && generated && outfits.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-white/[0.08] bg-black/10 px-4 py-3 text-xs text-zinc-500">
          There are not enough compatible pieces yet. Add a top, a bottom and a pair of shoes for fuller outfits.
        </p>
      ) : null}
    </section>
  );
}