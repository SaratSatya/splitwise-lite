"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteExpenseButton({
  groupId,
  expenseId,
}: {
  groupId: string;
  expenseId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function del() {
    const ok = confirm("Delete this expense? This will affect balances.");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Delete failed");
      router.refresh();
    } catch (e: any) {
      alert(e.message ?? "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="border rounded px-3 py-1 text-xs"
      onClick={del}
      disabled={loading}
      type="button"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
