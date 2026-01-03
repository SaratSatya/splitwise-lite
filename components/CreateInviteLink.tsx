"use client";

import { useState } from "react";

export default function CreateInviteLink({ groupId }: { groupId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setErr(null);
    setLoading(true);
    setLink(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/invites`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create invite");
      setLink(data.joinUrl);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    alert("Copied!");
  }

  return (
    <div className="border rounded p-3">
      <div className="flex gap-2 items-center">
        <button
          className="border rounded px-3 py-2"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate invite link"}
        </button>
        {link ? (
          <button className="border rounded px-3 py-2" onClick={copy}>
            Copy
          </button>
        ) : null}
      </div>

      {link ? (
        <div className="mt-2 text-sm break-all">
          <span className="opacity-70">Invite:</span> {link}
        </div>
      ) : null}

      {err ? <div className="mt-2 text-sm text-red-600">{err}</div> : null}
      <div className="mt-2 text-xs opacity-70">
        Owner-only for now. Invite expires in 7 days.
      </div>
    </div>
  );
}
