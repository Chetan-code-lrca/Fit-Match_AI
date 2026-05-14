"use client";

import { useState } from "react";

import { uploadFormats } from "@/lib/fitmatch-data";

type UploadAnalysis = {
  fileName: string;
  dominantColors: string[];
  tags: string[];
  occasionHint: string;
};

export function UploadStudio() {
  const [files, setFiles] = useState<File[]>([]);
  const [analysis, setAnalysis] = useState<UploadAnalysis[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleAnalyze(selectedFiles: FileList | null) {
    if (!selectedFiles) {
      return;
    }

    const nextFiles = Array.from(selectedFiles);
    const invalid = nextFiles.find((file) => !uploadFormats.includes(file.type));

    if (invalid) {
      setError("Please upload JPG, PNG, or WEBP files only.");
      return;
    }

    setError("");
    setFiles(nextFiles);
    setPending(true);

    const formData = new FormData();
    nextFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload analysis failed.");
      }

      const payload = (await response.json()) as { analysis: UploadAnalysis[] };
      setAnalysis(payload.analysis);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to analyze the selected images.",
      );
      setAnalysis([]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[28px] border border-dashed border-white/20 bg-black/30 p-6">
        <div className="space-y-4">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-zinc-400">
            Cloud-ready uploads
          </span>
          <h2 className="text-2xl font-semibold">Upload mirror selfies or single items</h2>
          <p className="text-sm leading-6 text-zinc-400">
            The demo validates image formats, previews your files, and simulates AI tags for
            colors, occasion, and outfit components.
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
                handleAnalyze(event.target.files);
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
              Review previews, extracted tags, and upload-ready metadata.
            </p>
          </div>
          {pending ? (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
              Analyzing...
            </span>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="overflow-hidden rounded-[24px] border border-white/10 bg-black/30"
            >
              <div className="flex h-48 flex-col justify-between bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_50%),linear-gradient(160deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.02))] p-5">
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-zinc-300">
                  wardrobe image
                </span>
                <div>
                  <p className="text-lg font-semibold text-white">{file.name}</p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-4">
          {analysis.map((entry) => (
            <article key={entry.fileName} className="rounded-3xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">{entry.fileName}</h3>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                  {entry.occasionHint}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.dominantColors.map((color) => (
                  <span
                    key={color}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black"
                  >
                    {color}
                  </span>
                ))}
              </div>
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
          {!analysis.length && !pending ? (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-sm text-zinc-400">
              Your AI analysis cards will appear here after you upload an outfit photo.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
