"use client";

import { useEffect, useRef, useState } from "react";

import { ItemThumbnail } from "@/components/outfit-card";
import { promptSuggestions, type OutfitRecommendation } from "@/lib/fitmatch-data";
import { resolveColorHex } from "@/lib/wardrobe-visuals";

type ChatResponse = {
  message: string;
  recommendations: OutfitRecommendation[];
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  recommendations?: OutfitRecommendation[];
};

const starterMessage =
  "Tell me the vibe or item you want to wear and I'll build a fit from your wardrobe.";

export function ChatStylist() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: starterMessage },
  ]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function sendPrompt(nextPrompt: string) {
    if (!nextPrompt.trim()) return;

    setPending(true);
    setError("");
    setMessages((current) => [...current, { role: "user", text: nextPrompt }]);
    setPrompt("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: nextPrompt }),
      });

      if (!response.ok) throw new Error("Unable to fetch stylist reply.");

      const payload = (await response.json()) as ChatResponse;
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: payload.message,
          recommendations: payload.recommendations.slice(0, 2),
        },
      ]);
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !pending) {
      void sendPrompt(prompt);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      {/* Chat thread */}
      <section className="flex flex-col rounded-[28px] border border-white/10 bg-white/5">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[520px]">
          {messages.map((msg, index) => (
            <div key={index} className={msg.role === "user" ? "flex justify-end" : "flex flex-col gap-3"}>
              {msg.role === "user" ? (
                <div className="max-w-[80%] rounded-3xl bg-white px-4 py-3 text-sm font-medium text-black">
                  {msg.text}
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white via-zinc-300 to-zinc-600 text-[10px] font-bold text-black">
                      FM
                    </div>
                    <div className="max-w-[85%] rounded-3xl bg-zinc-900 px-4 py-3 text-sm leading-6 text-zinc-100">
                      {msg.text}
                    </div>
                  </div>
                  {/* Inline outfit recommendation cards */}
                  {msg.recommendations && msg.recommendations.length > 0 ? (
                    <div className="ml-11 grid gap-3">
                      {msg.recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="rounded-[20px] border border-white/10 bg-black/40 p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-zinc-200">{rec.title}</span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black">
                              {rec.confidenceScore}%
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {rec.items.map((item) => (
                              <div key={item.id} className="flex flex-col items-center gap-1">
                                <ItemThumbnail item={item} size="sm" />
                                <span className="max-w-[52px] truncate text-center text-[9px] text-zinc-500">
                                  {item.name.split(" ")[0]}
                                </span>
                              </div>
                            ))}
                          </div>
                          {/* Color palette */}
                          <div className="mt-2 flex items-center gap-2">
                            {Array.from(new Set(rec.items.map((i) => i.color))).map((color) => (
                              <span
                                key={color}
                                className="h-3 w-3 rounded-full border border-white/20"
                                style={{ backgroundColor: resolveColorHex(color) }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ))}
          {pending ? (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white via-zinc-300 to-zinc-600 text-[10px] font-bold text-black">
                FM
              </div>
              <div className="max-w-[85%] rounded-3xl bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
                <span className="flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
                  </span>
                  Styling your fit
                </span>
              </div>
            </div>
          ) : null}
          {error ? (
            <div className="rounded-3xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-white/10 p-4">
          <div className="flex gap-3">
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Try: airport casual fit, all-black look..."
              className="flex-1 rounded-full border border-white/10 bg-black/40 px-5 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/35"
            />
            <button
              type="button"
              onClick={() => void sendPrompt(prompt)}
              disabled={pending || !prompt.trim()}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </section>

      {/* Prompt starters */}
      <section className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-xl font-semibold">Prompt ideas</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Tap any prompt to see your wardrobe-aware stylist respond.
          </p>
        </div>
        <div className="grid gap-2">
          {promptSuggestions.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => void sendPrompt(entry)}
              disabled={pending}
              className="w-full rounded-[18px] border border-white/10 bg-black/40 px-4 py-3 text-left text-sm text-zinc-200 transition hover:border-white/25 hover:bg-white/10 disabled:opacity-50"
            >
              <span className="mr-2 text-zinc-500">&ldquo;</span>
              {entry}
              <span className="ml-2 text-zinc-500">&rdquo;</span>
            </button>
          ))}
        </div>

        <div className="rounded-[20px] border border-white/10 bg-black/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Wardrobe context
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            The stylist only uses items from your uploaded wardrobe and scores every outfit using
            color harmony, occasion fit, and your personal style profile.
          </p>
        </div>
      </section>
    </div>
  );
}
