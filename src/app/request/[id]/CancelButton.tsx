"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CancelButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/requests/${id}/cancel`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Cancel failed: ${res.status}`);
      }
      // Refresh the page data
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={cancel}
        disabled={busy}
        className="rounded-md bg-red-600 text-white px-4 py-2 disabled:opacity-60"
      >
        {busy ? "Cancelling…" : "Cancel request"}
      </button>
      {err && <p className="text-red-600 text-sm">{err}</p>}
    </div>
  );
}
