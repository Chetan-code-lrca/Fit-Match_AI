"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { extractDominantColors, getColorName } from "@/lib/color-extractor";
import { uploadFormats } from "@/lib/fitmatch-data";

type UploadAnalysis = {
  fileName: string;
  dominantColors: string[];
  colorNames: string[];
  tags: string[];
  occasionHint: string;
};

type UploadedFile = {
  file: File;
  previewUrl: string;
  extractedColors: string[];
};

export function UploadStudio() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysis, setAnalysis] = useState<UploadAnalysis[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [extractingColors, setExtractingColors] = useState(false);
  const prevPreviewUrls = useRef<string[]>([]);

  function revokeOldPreviews() {
    for (const url of prevPreviewUrls.current) {
      URL.revokeObjectURL(url);
    }
  }

  async function handleAnalyze(selectedFiles: FileList | null) {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const nextFiles = Array.from(selectedFiles);
    const invalid = nextFiles.find((file) => !uploadFormats.includes(file.type));

    if (invalid) {
      setError("Please upload JPG, PNG, or WEBP files only.");
      return;
    }

    setError("");
    setAnalysis([]);

    revokeOldPreviews();
    const previews: UploadedFile[] = nextFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      extractedColors: [],
    }));
    prevPreviewUrls.current = previews.map((p) => p.previewUrl);
    setUploadedFiles(previews);

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

  const isLoading = pending || extractingColors;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[28px] border border-dashed border-white/20 bg-black/30 p-6">
        <div className="space-y-4">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-zinc-400">
            Cloud-ready uploads
          </span>
          <h2 className="text-2xl font-semibold">Upload mirror selfies or single items</h2>
          <p className="text-sm leading-6 text-zinc-400">
            The demo validates image formats, previews your files, extracts dominant colors, and
            simulates AI tags for occasion and outfit components.
          </p>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-white/10 bg-white/5 px-6 py-12 text-center transition hover:border-white/30 hover:bg-white/10">
            <span className="text-lg font-semibold">Drop files or browse</span>
            <span className="mt-2 text-sm text-zinc-400">Supports JPG, PNG, WEBP</span>
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
          <div className="grid gap-3 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Auto-detects dominant colors, layering, occasion cues, and accessories.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Ready to connect to Cloudinary or Firebase Storage via environment variables.
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">AI wardrobe analysis</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Review previews, extracted colors, and upload-ready metadata.
            </p>
          </div>
          {isLoading ? (
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
              {extractingColors ? "Extracting colors…" : "Analyzing…"}
            </span>
          ) : null}
        </div>

        {uploadedFiles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {uploadedFiles.map((entry, index) => (
              <div
                key={`${entry.file.name}-${index}`}
                className="overflow-hidden rounded-[24px] border border-white/10 bg-black/30"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={entry.previewUrl}
                    alt={entry.file.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="truncate text-sm font-semibold text-white">{entry.file.name}</p>
                    <p className="mt-1 text-xs text-zinc-300">
                      {(entry.file.size / 1024 / 1024).toFixed(2)} MB · {entry.file.type}
                    </p>
                  </div>
                </div>
                {entry.extractedColors.length > 0 ? (
                  <div className="flex items-center gap-2 px-4 py-3">
                    <span className="text-xs text-zinc-500">Colors:</span>
                    {entry.extractedColors.map((hex) => (
                      <span
                        key={hex}
                        className="h-4 w-4 rounded-full border border-white/20"
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

        <div className="grid gap-4">
          {analysis.map((entry) => (
            <article
              key={entry.fileName}
              className="rounded-3xl border border-white/10 bg-black/30 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">{entry.fileName}</h3>
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
            </article>
          ))}
          {!analysis.length && !isLoading && uploadedFiles.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-sm text-zinc-400">
              Your AI analysis cards will appear here after you upload an outfit photo.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
