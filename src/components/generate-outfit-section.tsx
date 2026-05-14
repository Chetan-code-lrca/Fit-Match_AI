"use client";

import { useState } from "react";

import type { WardrobeItem } from "@/lib/fitmatch-data";
import { OutfitCarousel, type OutfitSuggestion } from "@/components/outfit-carousel";

type ApiOutfit = {
  outfitName: string;
  score: number;
  reasoning: string;
  occasion: string;
  items: WardrobeItem[];
};

export function GenerateOutfitSection() {
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-outfits?count=6");
      if (!response.ok) throw new Error("Failed to generate outfits.");

      const data = (await response.json()) as { outfits: ApiOutfit[] };
      setOutfits(data.outfits);
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">AI outfit engine</p>
          <h2 className="mt-3 text-3xl font-semibold">Generate visual outfits</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Combine your wardrobe items into complete, scored outfit suggestions using color
            harmony, occasion fit, and AI styling logic.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex-shrink-0 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating…
            </span>
          ) : generated ? (
            "Regenerate"
          ) : (
            "Generate Outfits"
          )}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {!generated && !loading ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-6 text-sm text-zinc-400">
          Click <strong className="text-white">Generate Outfits</strong> to create complete, visual
          outfit combinations from your wardrobe.
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-[28px] border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : null}

      {!loading && outfits.length > 0 ? (
        <div className="mt-6">
          <OutfitCarousel outfits={outfits} />
        </div>
      ) : null}
    </section>
  );
}
