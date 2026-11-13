"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAccountButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function removeAccount() {
    const confirmed = window.confirm(
      "Permanently delete your FitMatch account, wardrobe records and private clothing photos? This cannot be undone.",
    );
    if (!confirmed) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Account deletion failed.");
      router.replace("/login?account=deleted");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Account deletion failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={removeAccount}
        disabled={busy}
        className="rounded-full border border-red-300/20 px-4 py-2.5 text-xs font-semibold text-red-200 transition hover:border-red-300/40 hover:bg-red-400/[0.06] disabled:opacity-50"
      >
        {busy ? "Deleting account…" : "Delete account"}
      </button>
      {error ? <p role="alert" className="max-w-xs text-xs leading-5 text-red-200">{error}</p> : null}
    </div>
  );
}
