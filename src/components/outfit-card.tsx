import Image from "next/image";

import type { WardrobeItem } from "@/lib/fitmatch-data";
import { categoryMeta, isLightColor, resolveColorHex } from "@/lib/wardrobe-visuals";

type ItemThumbnailProps = {
  item: WardrobeItem;
  size?: "sm" | "md" | "lg";
};

export function ItemThumbnail({ item, size = "md" }: ItemThumbnailProps) {
  const hex = resolveColorHex(item.color);
  const light = isLightColor(hex);
  const { emoji, label } = categoryMeta[item.category];
  const dim =
    size === "sm" ? "h-14 w-14" : size === "lg" ? "h-28 w-28" : "h-20 w-20";
  const textColor = light ? "text-black/70" : "text-white/80";
  const emojiSize = size === "sm" ? "text-xl" : size === "lg" ? "text-4xl" : "text-2xl";
  const imageSource = item.extractedItemImage ?? item.imageUrl;

  if (imageSource) {
    return (
      <div className={dim + " relative flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#20251e]"}>
        <Image
          src={imageSource}
          alt={item.name}
          fill
          className="object-cover"
          sizes="112px"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={dim + " flex flex-shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-white/10"}
      style={{ backgroundColor: hex }}
      title={item.name}
    >
      <span className={emojiSize + " leading-none"} role="img" aria-label={label}>
        {emoji}
      </span>
      <span className={"text-[10px] font-medium leading-none " + textColor}>{label}</span>
    </div>
  );
}

type OutfitItemRowProps = {
  item: WardrobeItem;
  isAccessory?: boolean;
};

function OutfitItemRow({ item, isAccessory = false }: OutfitItemRowProps) {
  const imageSource = item.extractedItemImage ?? item.imageUrl;
  const imageSize = isAccessory ? "h-12 w-12" : "h-16 w-16";

  return (
    <div className="group/item relative flex items-center gap-3 rounded-[15px] border border-white/[0.07] bg-[#11140f]/70 p-2 transition hover:border-[#d3ee9c]/20 hover:bg-white/[0.04]">
      {imageSource ? (
        <div className={"relative shrink-0 overflow-hidden rounded-[11px] border border-white/10 bg-[#20251e] " + imageSize}>
          <Image
            src={imageSource}
            alt={item.name}
            fill
            className="object-cover transition duration-300 group-hover/item:scale-105"
            sizes={isAccessory ? "48px" : "64px"}
            unoptimized
          />
        </div>
      ) : (
        <div
          className={"flex shrink-0 flex-col items-center justify-center rounded-[11px] border border-white/10 " + imageSize}
          style={{ backgroundColor: resolveColorHex(item.color) }}
        >
          <span className={isAccessory ? "text-xl" : "text-2xl"} role="img" aria-label={categoryMeta[item.category].label}>
            {categoryMeta[item.category].emoji}
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[#f4f2e9]">{item.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white/20"
            style={{ backgroundColor: resolveColorHex(item.color) }}
          />
          <span className="text-[10px] capitalize text-zinc-500">{item.color}</span>
          {item.style ? (
            <span className="rounded-full border border-white/[0.08] px-1.5 py-0.5 text-[9px] text-zinc-500">
              {item.style}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-zinc-600">
          {categoryMeta[item.category].label}
        </p>
      </div>
    </div>
  );
}

function OutfitStack({ items }: { items: WardrobeItem[] }) {
  const uppers = items.filter((item) => item.category === "layer" || item.category === "top");
  const bottoms = items.filter((item) => item.category === "bottom");
  const shoes = items.filter((item) => item.category === "shoes");
  const accessories = items.filter((item) => item.category === "accessory");
  const ordered = [...uppers, ...bottoms, ...shoes, ...accessories];

  return (
    <div className="flex flex-col gap-2 py-1">
      {ordered.map((item, index) => (
        <OutfitItemRow
          key={item.category + "-" + item.id + "-" + index}
          item={item}
          isAccessory={item.category === "accessory"}
        />
      ))}
    </div>
  );
}

type OutfitCardProps = {
  outfitName: string;
  score: number;
  reasoning: string;
  occasion: string;
  items: WardrobeItem[];
  colorHarmonyScore?: number;
  aestheticScore?: number;
};

export function OutfitCard({
  outfitName,
  score,
  reasoning,
  occasion,
  items,
  colorHarmonyScore,
  aestheticScore,
}: OutfitCardProps) {
  return (
    <article className="group flex h-full flex-col gap-4 rounded-[25px] border border-white/[0.08] bg-[#191d17] p-4 transition hover:-translate-y-0.5 hover:border-[#d3ee9c]/20 hover:shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.2em] text-[#d3ee9c]">{occasion}</p>
          <h3 className="mt-2 text-base font-semibold leading-snug text-[#f4f2e9]">{outfitName}</h3>
        </div>
        <span className="shrink-0 rounded-full border border-[#d3ee9c]/25 bg-[#d3ee9c]/[0.08] px-2.5 py-1.5 text-[11px] font-bold tabular-nums text-[#d3ee9c]">
          {score}% match
        </span>
      </div>

      <div className="rounded-[18px] border border-white/[0.07] bg-[#11140f]/70 p-2.5">
        <OutfitStack items={items} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-600">Palette</span>
        <div className="flex gap-1.5">
          {Array.from(new Set(items.map((item) => item.color))).map((color) => (
            <span
              key={color}
              className="h-3.5 w-3.5 rounded-full border border-white/20 transition hover:scale-125"
              style={{ backgroundColor: resolveColorHex(color) }}
              title={color}
            />
          ))}
        </div>
      </div>

      <p className="text-[11px] leading-5 text-zinc-400">{reasoning}</p>

      <div className="mt-auto grid gap-2 border-t border-white/[0.07] pt-3">
        {colorHarmonyScore !== undefined ? <ScoreBar label="Colour harmony" value={colorHarmonyScore} /> : null}
        {aestheticScore !== undefined ? <ScoreBar label="Style coherence" value={aestheticScore} /> : null}
        <ScoreBar label="Overall match" value={score} />
      </div>
    </article>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[9px]">
        <span className="text-zinc-500">{label}</span>
        <span className="tabular-nums text-zinc-400">{value}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-[#d3ee9c] transition-all"
          style={{ width: value + "%" }}
        />
      </div>
    </div>
  );
}