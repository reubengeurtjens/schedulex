"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function CancelRequestButton({ id }: { id: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  async function doCancel() {
    try {
      const res = await fetch(`/api/requests/${id}/cancel`, {
        method: "POST",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `Cancel failed (${res.status})`);
      }
      router.refresh(); // reload data on this page
    } catch (err: any) {
      alert(err?.message ?? "Cancel failed");
    }
  }

  return (
    <button disabled={pending} onClick={() => start(doCancel)}>
      {pending ? "Cancelling..." : "Cancel request"}
    </button>
  );
}
