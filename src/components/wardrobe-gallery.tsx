"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { WardrobeItem } from "@/lib/fitmatch-data";
import { categoryMeta, isLightColor, resolveColorHex } from "@/lib/wardrobe-visuals";

type CardProps = {
  item: WardrobeItem;
  allowDelete: boolean;
  deleting: boolean;
  onDelete: (id: string) => void;
};

function WardrobeItemCard({ item, allowDelete, deleting, onDelete }: CardProps) {
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
        {allowDelete ? (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            disabled={deleting}
            className="mt-3 w-full rounded-xl border border-white/[0.08] px-3 py-2 text-[10px] font-medium text-zinc-500 transition hover:border-red-300/25 hover:text-red-200 disabled:opacity-50"
            aria-label={"Remove " + item.name + " from wardrobe"}
          >
            {deleting ? "Removing…" : "Remove piece"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

type WardrobeGalleryProps = {
  items: WardrobeItem[];
  title?: string;
  allowDelete?: boolean;
};

export function WardrobeGallery({
  items,
  title = "Your wardrobe",
  allowDelete = false,
}: WardrobeGalleryProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function removeItem(id: string) {
    setDeletingId(id);
    setError("");
    try {
      const response = await fetch("/api/wardrobe?id=" + encodeURIComponent(id), {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Unable to remove this piece. Please try again.");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to remove this piece.");
    } finally {
      setDeletingId(null);
    }
  }

  const categories = Array.from(new Set(items.map((item) => item.category)));
  const headings: Record<WardrobeItem["category"], string> = {
    top: "Tops",
    bottom: "Bottoms",
    layer: "Layers",
    shoes: "Shoes",
    accessory: "Accessories",
  };

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

      {error ? (
        <p role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-white/[0.12] p-8 text-center">
          <p className="text-sm text-zinc-300">Your wardrobe is empty.</p>
          <p className="mt-2 text-xs text-zinc-500">Add your first pieces to start building outfits.</p>
        </div>
      ) : null}

      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category === category);
        return (
          <div key={category} className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {headings[category]}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {categoryItems.map((item) => (
                <WardrobeItemCard
                  key={item.id}
                  item={item}
                  allowDelete={allowDelete}
                  deleting={deletingId === item.id}
                  onDelete={removeItem}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
