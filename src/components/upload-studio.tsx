"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { dataUrlToFile, removeBackground } from "@/lib/background-remover";
import { extractDominantColors, getColorName } from "@/lib/color-extractor";
import type { WardrobeCategory, WardrobeItem } from "@/lib/fitmatch-data";
import { uploadFormats } from "@/lib/fitmatch-data";

type UploadAnalysis = {
  fileName: string;
  imageUrl: string;
  dominantColors: string[];
  colorNames: string[];
  tags: string[];
  occasionHint: string;
};

type UploadedFile = {
  file: File;
  previewUrl: string;
  extractedColors: string[];
  processedPreviewUrl?: string;
};

type SaveFormState = {
  name: string;
  category: WardrobeCategory;
  color: string;
  style: string;
  removeBackground: boolean;
};

const clothingTips = [
  "Center the clothing item in frame for best color detection.",
  "Plain backgrounds improve clothing segmentation accuracy.",
  "Natural light gives the most accurate color extraction.",
  "Upload one item per image for precise category tagging.",
];

const CATEGORY_OPTIONS: { value: WardrobeCategory; label: string }[] = [
  { value: "top", label: "Top / T-shirt" },
  { value: "layer", label: "Layer / Hoodie / Jacket" },
  { value: "bottom", label: "Bottom / Pants / Jeans" },
  { value: "shoes", label: "Shoes / Sneakers / Boots" },
  { value: "accessory", label: "Accessory / Watch / Bag" },
];

const STYLE_OPTIONS = ["minimal", "streetwear", "smart", "utility", "classic"];

export function UploadStudio() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysis, setAnalysis] = useState<UploadAnalysis[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [extractingColors, setExtractingColors] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [saveError, setSaveError] = useState("");

  const prevPreviewUrls = useRef<string[]>([]);

  const [saveForms, setSaveForms] = useState<SaveFormState[]>([]);

  function revokeOldPreviews() {
    for (const url of prevPreviewUrls.current) {
      URL.revokeObjectURL(url);
    }
  }

  function updateSaveForm(index: number, patch: Partial<SaveFormState>) {
    setSaveForms((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;
      next[index] = { ...current, ...patch };
      return next;
    });
  }

  async function handleAnalyze(selectedFiles: FileList | null) {
    if (!selectedFiles) return;

    const nextFiles = Array.from(selectedFiles);
    const invalid = nextFiles.find((file) => !uploadFormats.includes(file.type));

    if (invalid) {
      setError("Please upload JPG, PNG, or WEBP files only.");
      return;
    }

    setError("");
    setSaveError("");
    setAnalysis([]);
    setSavedIds(new Set());

    revokeOldPreviews();
    const previews: UploadedFile[] = nextFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      extractedColors: [],
    }));
    prevPreviewUrls.current = previews.map((p) => p.previewUrl);
    setUploadedFiles(previews);

    // Initialize save forms
    setSaveForms(
      nextFiles.map((file) => ({
        name: file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "),
        category: "top",
        color: "black",
        style: "minimal",
        removeBackground: true,
      })),
    );

    setExtractingColors(true);
    const withColors: UploadedFile[] = await Promise.all(
      previews.map(async (entry) => {
        const colors = await extractDominantColors(entry.file, 5);
        return { ...entry, extractedColors: colors };
      }),
    );
    setExtractingColors(false);
    setUploadedFiles(withColors);

    setPending(true);
    const formData = new FormData();
    nextFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload analysis failed.");

      const payload = (await response.json()) as { analysis: UploadAnalysis[] };
      const merged = payload.analysis.map((entry, i) => ({
        ...entry,
        dominantColors:
          withColors[i]?.extractedColors.length
            ? withColors[i].extractedColors
            : entry.dominantColors,
        colorNames: withColors[i]?.extractedColors.map(getColorName) ?? [],
      }));
      setAnalysis(merged);

      // Pre-fill color from extracted colors
      setSaveForms((prev) =>
        prev.map((form, i) => ({
          ...form,
          color:
            merged[i]?.colorNames[0]?.toLowerCase() ?? form.color,
        })),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to analyze the selected images.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleSaveToWardrobe(index: number) {
    const form = saveForms[index];
    const analysisEntry = analysis[index];
    const fileEntry = uploadedFiles[index];
    if (!form || !analysisEntry || !fileEntry) return;

    setSavingIndex(index);
    setSaveError("");

    try {
      const imageUrl = analysisEntry.imageUrl;
      let extractedItemImage: string | undefined;

      // Optionally remove background
      if (form.removeBackground) {
        setRemovingBg(true);
        try {
          const processedDataUrl = await removeBackground(fileEntry.file);
          const processedFile = dataUrlToFile(processedDataUrl, fileEntry.file.name);

          // Upload the processed (background-removed) file
          const bgFormData = new FormData();
          bgFormData.append("files", processedFile);
          const bgResponse = await fetch("/api/upload", {
            method: "POST",
            body: bgFormData,
          });
          if (bgResponse.ok) {
            const bgPayload = (await bgResponse.json()) as {
              analysis: Array<{ imageUrl: string }>;
            };
            extractedItemImage = bgPayload.analysis[0]?.imageUrl;

            // Update preview with processed image
            setUploadedFiles((prev) => {
              const next = [...prev];
              next[index] = { ...next[index]!, processedPreviewUrl: processedDataUrl };
              return next;
            });
          }
        } finally {
          setRemovingBg(false);
        }
      }

      const itemId = `user-${Date.now()}-${index}`;
      const item: Partial<WardrobeItem> = {
        id: itemId,
        name: form.name || analysisEntry.fileName,
        category: form.category,
        color: form.color || "black",
        palette: "neutral",
        occasion: ["campus", "travel", "smart-casual"],
        season: ["spring", "summer", "autumn", "winter"],
        tags: analysisEntry.tags,
        imageUrl,
        extractedItemImage,
        style: form.style || undefined,
      };

      const response = await fetch("/api/wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error("Failed to save item to wardrobe.");
      }

      setSavedIds((prev) => new Set([...prev, index]));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to save item.");
    } finally {
      setSavingIndex(null);
    }
  }

  const isLoading = pending || extractingColors;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      {/* Upload dropzone */}
      <section className="rounded-[28px] border border-dashed border-white/20 bg-black/30 p-6">
        <div className="space-y-4">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-zinc-400">
            Wardrobe ingestion
          </span>
          <h2 className="text-2xl font-semibold">Upload your clothing items</h2>
          <p className="text-sm leading-6 text-zinc-400">
            Upload individual garment photos or mirror selfies. The AI extracts clothing colors
            from the center of each image, ignoring background walls and lighting — only the center
            65% of each image is sampled.
          </p>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-white/10 bg-white/5 px-6 py-12 text-center transition hover:border-white/30 hover:bg-white/10">
            <span className="text-4xl">👗</span>
            <span className="mt-3 text-lg font-semibold">Drop files or browse</span>
            <span className="mt-1 text-sm text-zinc-400">Supports JPG, PNG, WEBP</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(event) => {
                void handleAnalyze(event.target.files);
              }}
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {/* Tips */}
          <div className="grid gap-2 pt-2">
            {clothingTips.map((tip) => (
              <div
                key={tip}
                className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-zinc-400"
              >
                <span className="mt-0.5 text-zinc-600">•</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analysis + Save-to-Wardrobe panel */}
      <section className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">AI wardrobe analysis</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Clothing colors sampled from the center 65% of the image — background walls excluded.
            </p>
          </div>
          {isLoading || removingBg ? (
            <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
              <svg
                className="h-3 w-3 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {extractingColors
                ? "Extracting colors…"
                : removingBg
                  ? "Removing background…"
                  : "Analyzing…"}
            </span>
          ) : null}
        </div>

        {/* Image previews */}
        {uploadedFiles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {uploadedFiles.map((entry, index) => (
              <div
                key={`${entry.file.name}-${index}`}
                className="overflow-hidden rounded-[24px] border border-white/10 bg-black/30"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={entry.processedPreviewUrl ?? entry.previewUrl}
                    alt={entry.file.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="truncate text-sm font-semibold text-white">{entry.file.name}</p>
                    <p className="mt-1 text-xs text-zinc-300">
                      {(entry.file.size / 1024 / 1024).toFixed(2)} MB · {entry.file.type}
                    </p>
                  </div>
                  {extractingColors ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="rounded-2xl border border-white/20 bg-black/60 px-4 py-2 text-xs text-white">
                        Scanning clothing area…
                      </div>
                    </div>
                  ) : null}
                  {entry.processedPreviewUrl ? (
                    <div className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                      BG removed
                    </div>
                  ) : null}
                </div>
                {entry.extractedColors.length > 0 ? (
                  <div className="flex items-center gap-2 px-4 py-3">
                    <span className="text-xs text-zinc-500">Clothing colors:</span>
                    {entry.extractedColors.map((hex) => (
                      <span
                        key={hex}
                        className="h-5 w-5 rounded-full border border-white/20 shadow"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {/* Analysis + save forms */}
        <div className="grid gap-4">
          {analysis.map((entry, index) => {
            const form = saveForms[index];
            const isSaved = savedIds.has(index);
            const isSaving = savingIndex === index;
            if (!form) return null;

            return (
              <article
                key={entry.fileName}
                className="rounded-3xl border border-white/10 bg-black/30 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{entry.fileName}</h3>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                    {entry.occasionHint}
                  </span>
                </div>

                {entry.dominantColors.length > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {entry.dominantColors.map((colorValue, i) => {
                      const isHex = colorValue.startsWith("#");
                      const displayName = entry.colorNames?.[i] ?? colorValue;
                      return (
                        <span
                          key={colorValue}
                          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white"
                        >
                          {isHex ? (
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full border border-white/20"
                              style={{ backgroundColor: colorValue }}
                            />
                          ) : null}
                          {displayName}
                        </span>
                      );
                    })}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Save-to-Wardrobe form */}
                {!isSaved ? (
                  <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                      Add to wardrobe
                    </p>

                    {/* Item name */}
                    <div>
                      <label className="mb-1 block text-[11px] text-zinc-500">Item name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => updateSaveForm(index, { name: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-white/30"
                        placeholder="e.g. Black Oversized Hoodie"
                      />
                    </div>

                    {/* Category + Style */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] text-zinc-500">Category</label>
                        <select
                          value={form.category}
                          onChange={(e) =>
                            updateSaveForm(index, { category: e.target.value as WardrobeCategory })
                          }
                          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                        >
                          {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-zinc-500">Style</label>
                        <select
                          value={form.style}
                          onChange={(e) => updateSaveForm(index, { style: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                        >
                          {STYLE_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Color */}
                    <div>
                      <label className="mb-1 block text-[11px] text-zinc-500">
                        Primary color
                      </label>
                      <input
                        type="text"
                        value={form.color}
                        onChange={(e) => updateSaveForm(index, { color: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-white/30"
                        placeholder="e.g. black, olive, cream"
                      />
                    </div>

                    {/* Background removal toggle */}
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={form.removeBackground}
                        onChange={(e) =>
                          updateSaveForm(index, { removeBackground: e.target.checked })
                        }
                        className="h-4 w-4 accent-white"
                      />
                      <div>
                        <p className="text-xs font-medium text-white">Remove background</p>
                        <p className="text-[10px] text-zinc-500">
                          Isolate clothing item — works best with plain backgrounds
                        </p>
                      </div>
                    </label>

                    <button
                      onClick={() => void handleSaveToWardrobe(index)}
                      disabled={isSaving || !!savingIndex}
                      className="w-full rounded-full bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="h-3 w-3 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Saving…
                        </span>
                      ) : (
                        "Save to Wardrobe"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                    <span className="text-lg">✓</span>
                    <div>
                      <p className="text-sm font-semibold text-emerald-300">
                        Saved to wardrobe!
                      </p>
                      <p className="text-xs text-zinc-400">
                        Visit the Suggestions page to see outfit recommendations.
                      </p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {saveError ? (
            <p className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {saveError}
            </p>
          ) : null}

          {!analysis.length && !isLoading && uploadedFiles.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-center">
              <p className="text-4xl">📸</p>
              <p className="mt-3 text-sm text-zinc-400">
                Upload a clothing photo to see AI analysis — extracted colors, occasion tags, and
                wardrobe metadata will appear here.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
