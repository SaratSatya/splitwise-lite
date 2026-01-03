"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateGroupForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed");

      setName("");
      router.refresh();
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onCreate} className="flex gap-2 items-center">
      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="New group name (e.g., Goa Trip)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        className="border rounded px-3 py-2"
        disabled={loading || name.trim().length < 2}
      >
        {loading ? "Creating…" : "Create"}
      </button>
      {err ? <span className="text-sm text-red-600">{err}</span> : null}
    </form>
  );
}
