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

  if (item.extractedItemImage ?? item.imageUrl) {
    return (
      <div
        className={`${dim} relative flex-shrink-0 overflow-hidden rounded-2xl border border-white/10`}
      >
        <Image
          src={(item.extractedItemImage ?? item.imageUrl)!}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`${dim} flex flex-shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-white/10`}
      style={{ backgroundColor: hex }}
      title={item.name}
    >
      <span className={`${emojiSize} leading-none`} role="img" aria-label={label}>
        {emoji}
      </span>
      <span className={`text-[10px] font-medium leading-none ${textColor}`}>{label}</span>
    </div>
  );
}

type OutfitItemRowProps = {
  item: WardrobeItem;
  isAccessory?: boolean;
};

function OutfitItemRow({ item, isAccessory = false }: OutfitItemRowProps) {
  const hasImage = !!(item.extractedItemImage ?? item.imageUrl);
  const imgSrc = item.extractedItemImage ?? item.imageUrl;

  return (
    <div
      className={`group/item relative flex items-center gap-3 rounded-[16px] border border-white/8 bg-white/5 p-2 transition hover:border-white/20 hover:bg-white/10 ${
        isAccessory ? "" : "overflow-hidden"
      }`}
    >
      {/* Item image – large square */}
      {hasImage && imgSrc ? (
        <div
          className={`relative flex-shrink-0 overflow-hidden rounded-[12px] border border-white/10 ${
            isAccessory ? "h-12 w-12" : "h-20 w-20"
          }`}
        >
          <Image
            src={imgSrc}
            alt={item.name}
            fill
            className="object-cover transition duration-300 group-hover/item:scale-105"
            sizes={isAccessory ? "48px" : "80px"}
            unoptimized
          />
        </div>
      ) : (
        <div
          className={`flex flex-shrink-0 flex-col items-center justify-center gap-1 rounded-[12px] border border-white/10 ${
            isAccessory ? "h-12 w-12" : "h-20 w-20"
          }`}
          style={{ backgroundColor: resolveColorHex(item.color) }}
        >
          <span
            className={`leading-none ${isAccessory ? "text-xl" : "text-3xl"}`}
            role="img"
            aria-label={categoryMeta[item.category].label}
          >
            {categoryMeta[item.category].emoji}
          </span>
        </div>
      )}

      {/* Text info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-white">{item.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full border border-white/20"
            style={{ backgroundColor: resolveColorHex(item.color) }}
          />
          <span className="text-[10px] capitalize text-zinc-500">{item.color}</span>
          {item.style ? (
            <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[9px] text-zinc-500">
              {item.style}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
          {categoryMeta[item.category].label}
        </p>
      </div>
    </div>
  );
}

/** Vertical outfit stack: layer/top → bottom → shoes → accessories */
function OutfitStack({ items }: { items: WardrobeItem[] }) {
  const layers = items.filter((i) => i.category === "layer" || i.category === "top");
  const bottoms = items.filter((i) => i.category === "bottom");
  const shoes = items.filter((i) => i.category === "shoes");
  const accessories = items.filter((i) => i.category === "accessory");
  const ordered = [...layers, ...bottoms, ...shoes, ...accessories];

  return (
    <div className="flex flex-col gap-2 py-1">
      {ordered.map((item) => (
        <OutfitItemRow
          key={item.id}
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
  const scoreColor =
    score >= 90
      ? "bg-emerald-400 text-black"
      : score >= 75
        ? "bg-white text-black"
        : "bg-zinc-700 text-white";

  return (
    <article className="group flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-white/25 hover:shadow-lg hover:shadow-white/5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-[0.3em] text-zinc-500">{occasion}</p>
          <h3 className="mt-1 text-base font-semibold leading-snug">{outfitName}</h3>
        </div>
        <span
          className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold ${scoreColor}`}
        >
          {score}%
        </span>
      </div>

      {/* Visual outfit stack with real item images */}
      <div className="rounded-[20px] border border-white/8 bg-black/30 px-3 py-3">
        <OutfitStack items={items} />
      </div>

      {/* Color palette row */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600">Palette</span>
        <div className="flex gap-1.5">
          {Array.from(new Set(items.map((i) => i.color))).map((color) => (
            <span
              key={color}
              className="h-4 w-4 rounded-full border border-white/20 shadow-sm transition hover:scale-125"
              style={{ backgroundColor: resolveColorHex(color) }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Reasoning */}
      <p className="text-xs leading-5 text-zinc-400">{reasoning}</p>

      {/* Score breakdown */}
      {colorHarmonyScore !== undefined || aestheticScore !== undefined ? (
        <div className="grid gap-2">
          {colorHarmonyScore !== undefined ? (
            <ScoreBar label="Color harmony" value={colorHarmonyScore} />
          ) : null}
          {aestheticScore !== undefined ? (
            <ScoreBar label="Aesthetic" value={aestheticScore} />
          ) : null}
          <ScoreBar label="Confidence" value={score} />
        </div>
      ) : null}
    </article>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-zinc-500">{label}</span>
        <span className="text-zinc-400">{value}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/10">
        <div
          className="h-1 rounded-full bg-gradient-to-r from-zinc-400 to-white transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
