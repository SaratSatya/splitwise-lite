"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinGroupClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function join() {
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/invites/${token}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Join failed");
      router.push(`/groups/${data.groupId}`);
    } catch (e: any) {
      setErr(e.message ?? "Join failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded p-4">
      <button className="border rounded px-3 py-2" onClick={join} disabled={loading}>
        {loading ? "Joining…" : "Join group"}
      </button>
      {err ? <div className="mt-2 text-sm text-red-600">{err}</div> : null}
    </div>
  );
}
