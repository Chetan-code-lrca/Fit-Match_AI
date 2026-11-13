"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CONFIRMATION = "DELETE MY FITMATCH ACCOUNT";

export function AccountDataActions() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function exportData() {
    setExporting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/account/export", { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json() as { message?: string };
        throw new Error(payload.message ?? "Unable to export your data.");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "fitmatch-account-export.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
      setMessage("Your account export has been prepared.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to export your data.");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    if (confirmation !== CONFIRMATION) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const payload = await response.json() as { message?: string; success?: boolean };
      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Account deletion failed.");
      }
      router.replace("/");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Account deletion failed.");
      setDeleting(false);
    }
  }

  return (
    <section className="rounded-[22px] border border-white/[0.08] bg-[#191d17] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Your account data</p>
      <h2 className="mt-2 text-lg font-semibold text-[#f4f2e9]">Export or delete your data</h2>
      <p className="mt-2 max-w-3xl text-xs leading-6 text-zinc-500">
        Export your wardrobe metadata as JSON. Account deletion removes your wardrobe records, private images and sign-in identity.
      </p>
      <button type="button" onClick={() => void exportData()} disabled={exporting || deleting}
        className="mt-4 rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-[#d3ee9c]/40 hover:text-[#d3ee9c] disabled:opacity-50">
        {exporting ? "Preparing export…" : "Download my data"}
      </button>
      <div className="mt-6 border-t border-white/[0.08] pt-5">
        <p className="text-sm font-semibold text-red-200">Permanently delete account</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          This cannot be undone. Download your data first. Deletion removes your account and its saved wardrobe.
        </p>
        <label htmlFor="delete-confirmation" className="mt-4 block text-[11px] font-medium text-zinc-400">
          Type <span className="font-semibold text-red-200">{CONFIRMATION}</span> to confirm
        </label>
        <input id="delete-confirmation" value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off" spellCheck={false} maxLength={40}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white outline-none focus:border-red-300/40" />
        <button type="button" onClick={() => void deleteAccount()}
          disabled={deleting || exporting || confirmation !== CONFIRMATION}
          className="mt-3 rounded-full border border-red-300/25 bg-red-500/[0.08] px-4 py-2.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/[0.14] disabled:cursor-not-allowed disabled:opacity-40">
          {deleting ? "Deleting account…" : "Delete account permanently"}
        </button>
      </div>
      {error ? <p role="alert" className="mt-4 rounded-xl border border-red-300/20 bg-red-500/[0.08] px-3 py-2.5 text-xs text-red-200">{error}</p> : null}
      {message ? <p role="status" className="mt-4 rounded-xl border border-[#d3ee9c]/20 bg-[#d3ee9c]/[0.07] px-3 py-2.5 text-xs text-[#d3ee9c]">{message}</p> : null}
    </section>
  );
}
