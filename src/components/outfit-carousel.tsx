"use client";

import { useRef, useState } from "react";

import type { WardrobeItem } from "@/lib/fitmatch-data";
import { OutfitCard } from "@/components/outfit-card";

export type OutfitSuggestion = {
  outfitName: string;
  score: number;
  reasoning: string;
  occasion: string;
  items: WardrobeItem[];
};

type OutfitCarouselProps = {
  outfits: OutfitSuggestion[];
};

export function OutfitCarousel({ outfits }: OutfitCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function scrollTo(index: number) {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.children[index] as HTMLElement | undefined;
    if (card) {
      card.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
    setActiveIndex(index);
  }

  function handleScroll() {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = (container.children[0] as HTMLElement | undefined)?.offsetWidth ?? 320;
    const index = Math.round(container.scrollLeft / (cardWidth + 16));
    setActiveIndex(Math.min(index, outfits.length - 1));
  }

  if (outfits.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-sm text-zinc-400">
        No outfit suggestions available. Click &ldquo;Generate Outfits&rdquo; to create combinations.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {outfits.map((outfit) => (
          <div
            key={`${outfit.outfitName}-${outfit.score}`}
            className="w-[300px] flex-shrink-0 sm:w-[320px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <OutfitCard {...outfit} />
          </div>
        ))}
      </div>

      {outfits.length > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {outfits.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Go to outfit ${i + 1}`}
              className={`rounded-full transition-all ${
                i === activeIndex
                  ? "h-2 w-6 bg-white"
                  : "h-2 w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
