"use client";

import { useState } from "react";

import { promptSuggestions, type OutfitRecommendation } from "@/lib/fitmatch-data";

type ChatResponse = {
  message: string;
  recommendations: OutfitRecommendation[];
};

const starterMessage =
  "Tell me the vibe or item you want to wear and I’ll build a fit from your wardrobe.";

export function ChatStylist() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<string[]>([starterMessage]);
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function sendPrompt(nextPrompt: string) {
    if (!nextPrompt.trim()) {
      return;
    }

    setPending(true);
    setError("");
    setMessages((current) => [...current, `You: ${nextPrompt}`]);
    setPrompt("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: nextPrompt }),
      });

      if (!response.ok) {
        throw new Error("Unable to fetch stylist reply.");
      }

      const payload = (await response.json()) as ChatResponse;
      setMessages((current) => [...current, `FitMatch AI: ${payload.message}`]);
      setRecommendations(payload.recommendations);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while reaching the stylist.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={`${index}-${message}`}
              className={`rounded-3xl px-4 py-3 text-sm leading-6 ${
                message.startsWith("You:")
                  ? "ml-auto max-w-[80%] bg-white text-black"
                  : "max-w-[85%] bg-zinc-900 text-zinc-100"
              }`}
            >
              {message}
            </div>
          ))}
          {pending ? (
            <div className="max-w-[85%] rounded-3xl bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
              Styling your fit...
            </div>
          ) : null}
          {error ? (
            <div className="max-w-[85%] rounded-3xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Try: I want an all-black fit"
            className="flex-1 rounded-full border border-white/10 bg-black/40 px-5 py-3 text-sm text-white outline-none ring-0 transition placeholder:text-zinc-500 focus:border-white/35"
          />
          <button
            type="button"
            onClick={() => void sendPrompt(prompt)}
            disabled={pending}
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Ask stylist
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-xl font-semibold">Prompt starters</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Tap a prompt to see how the wardrobe-aware stylist responds.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {promptSuggestions.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => void sendPrompt(entry)}
              className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-left text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/10"
            >
              {entry}
            </button>
          ))}
        </div>
        <div className="grid gap-4 pt-2">
          {recommendations.slice(0, 2).map((recommendation) => (
            <article
              key={recommendation.id}
              className="rounded-3xl border border-white/10 bg-black/30 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{recommendation.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{recommendation.explanation}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
                  {recommendation.confidenceScore}% match
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {recommendation.items.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
