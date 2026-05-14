import Image from "next/image";

import type { WardrobeItem } from "@/lib/fitmatch-data";
import { categoryMeta, isLightColor, resolveColorHex } from "@/lib/wardrobe-visuals";

type ItemThumbnailProps = {
  item: WardrobeItem;
  size?: "sm" | "md";
};

export function ItemThumbnail({ item, size = "md" }: ItemThumbnailProps) {
  const hex = resolveColorHex(item.color);
  const light = isLightColor(hex);
  const { emoji, label } = categoryMeta[item.category];
  const dim = size === "sm" ? "h-14 w-14" : "h-20 w-20";
  const textColor = light ? "text-black/70" : "text-white/80";

  if (item.imageUrl) {
    return (
      <div className={`${dim} relative flex-shrink-0 overflow-hidden rounded-2xl border border-white/10`}>
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
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
      <span className="text-2xl leading-none" role="img" aria-label={label}>
        {emoji}
      </span>
      <span className={`text-[10px] font-medium leading-none ${textColor}`}>{label}</span>
    </div>
  );
}

type OutfitCardProps = {
  outfitName: string;
  score: number;
  reasoning: string;
  occasion: string;
  items: WardrobeItem[];
};

export function OutfitCard({ outfitName, score, reasoning, occasion, items }: OutfitCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-[0.3em] text-zinc-500">{occasion}</p>
          <h3 className="mt-1 text-lg font-semibold leading-snug">{outfitName}</h3>
        </div>
        <span className="flex-shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
          {score}%
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col items-center gap-1">
            <ItemThumbnail item={item} size="md" />
            <span className="max-w-[80px] truncate text-center text-[10px] text-zinc-400">
              {item.name.split(" ").slice(0, 2).join(" ")}
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm leading-6 text-zinc-400">{reasoning}</p>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.id}
            className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: resolveColorHex(item.color) }}
            />
            {item.color}
          </span>
        ))}
      </div>
    </article>
  );
}
