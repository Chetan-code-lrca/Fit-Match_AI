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
  const imageSource = item.extractedItemImage ?? item.imageUrl;

  return (
    <article className="group overflow-hidden rounded-[21px] border border-white/[0.08] bg-[#11140f] transition hover:-translate-y-0.5 hover:border-[#d3ee9c]/20">
      {imageSource ? (
        <div className="relative h-40 w-full bg-[#20251e]">
          <Image
            src={imageSource}
            alt={item.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, 220px"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center" style={{ backgroundColor: hex }}>
          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl" role="img" aria-label={label}>{emoji}</span>
            <span className={"text-xs font-medium " + textColor}>{label}</span>
          </div>
        </div>
      )}

      <div className="p-4">
        <h3 className="truncate text-xs font-semibold text-[#f4f2e9]">{item.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: hex }} />
          <span className="text-[10px] capitalize text-zinc-500">{item.color}</span>
          <span className="ml-auto text-[9px] uppercase tracking-[0.12em] text-zinc-600">{label}</span>
        </div>
        {item.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full border border-white/[0.08] px-2 py-1 text-[9px] text-zinc-500">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

type WardrobeGalleryProps = {
  items: WardrobeItem[];
  title?: string;
};

export function WardrobeGallery({ items, title = "Your wardrobe" }: WardrobeGalleryProps) {
  const categories = Array.from(new Set(items.map((item) => item.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Wardrobe gallery</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f4f2e9]">{title}</h2>
        </div>
        <span className="rounded-full border border-white/[0.1] px-3 py-1.5 text-[10px] text-zinc-400">
          {items.length} pieces
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-white/[0.12] p-8 text-center">
          <p className="text-sm text-zinc-300">Your wardrobe is empty.</p>
          <p className="mt-2 text-xs text-zinc-500">Add your first pieces to start building outfits.</p>
        </div>
      ) : null}

      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category === category);
        const label = categoryMeta[category].label;
        const heading = category === "accessory" ? "Accessories" : label + "s";

        return (
          <div key={category} className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{heading}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
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