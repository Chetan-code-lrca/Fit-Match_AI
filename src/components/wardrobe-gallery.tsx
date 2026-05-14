import Image from "next/image";

import type { WardrobeItem } from "@/lib/fitmatch-data";
import { categoryMeta, isLightColor, resolveColorHex } from "@/lib/wardrobe-visuals";

type WardrobeItemCardProps = {
  item: WardrobeItem;
};

function WardrobeItemCard({ item }: WardrobeItemCardProps) {
  const hex = resolveColorHex(item.color);
  const light = isLightColor(hex);
  const { emoji, label } = categoryMeta[item.category];
  const textColor = light ? "text-black/70" : "text-white/80";

  return (
    <article className="group overflow-hidden rounded-[24px] border border-white/10 bg-black/30 transition hover:border-white/20 hover:bg-white/5">
      {item.imageUrl ? (
        <div className="relative h-40 w-full">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 200px"
          />
        </div>
      ) : (
        <div
          className="flex h-40 items-center justify-center"
          style={{ backgroundColor: hex }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl" role="img" aria-label={label}>
              {emoji}
            </span>
            <span className={`text-sm font-medium ${textColor}`}>{label}</span>
          </div>
        </div>
      )}

      <div className="p-4">
        <h3 className="truncate text-sm font-semibold">{item.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full border border-white/20"
            style={{ backgroundColor: hex }}
          />
          <span className="text-xs capitalize text-zinc-400">{item.color}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

type WardrobeGalleryProps = {
  items: WardrobeItem[];
  title?: string;
};

export function WardrobeGallery({ items, title = "Your Wardrobe" }: WardrobeGalleryProps) {
  const categories = Array.from(new Set(items.map((item) => item.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Wardrobe gallery</p>
          <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
          {items.length} items
        </span>
      </div>

      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category === category);
        const { label } = categoryMeta[category];
        return (
          <div key={category} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
              {label}s
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {categoryItems.map((item) => (
                <WardrobeItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
