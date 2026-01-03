"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; label: string };
type Suggestion = { fromUserId: string; toUserId: string; amountPaise: number };

function formatINR(paise: number) {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const p = (abs % 100).toString().padStart(2, "0");
  return `${sign}₹${rupees}.${p}`;
}

function rupeesToPaise(v: string) {
  const cleaned = v.trim();
  if (!cleaned) return 0;
  const [r, p = ""] = cleaned.split(".");
  const rupees = parseInt(r || "0", 10);
  const paise = parseInt((p + "00").slice(0, 2), 10);
  return rupees * 100 + (isNaN(paise) ? 0 : paise);
}

function paiseToRupeesString(paise: number) {
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const p = (abs % 100).toString().padStart(2, "0");
  return `${rupees}.${p}`;
}

export default function AddSettlementForm({
  groupId,
  members,
  suggestions,
}: {
  groupId: string;
  members: Member[];
  suggestions: Suggestion[];
}) {
  const router = useRouter();

  const labelOf = useMemo(() => {
    const map = new Map(members.map((m) => [m.id, m.label]));
    return (id: string) => map.get(id) ?? id;
  }, [members]);

  const [fromUserId, setFromUserId] = useState(members[0]?.id ?? "");
  const [toUserId, setToUserId] = useState(members[0]?.id ?? "");
  const [amountRupees, setAmountRupees] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function useSuggestion(s: Suggestion) {
    setFromUserId(s.fromUserId);
    setToUserId(s.toUserId);
    setAmountRupees(paiseToRupeesString(s.amountPaise));
    setNote("Settled as suggested");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const amountPaise = rupeesToPaise(amountRupees);
    if (!fromUserId || !toUserId) return setErr("Select both users");
    if (fromUserId === toUserId) return setErr("From and To must be different");
    if (amountPaise <= 0) return setErr("Amount must be > 0");

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId,
          toUserId,
          amountPaise,
          note: note.trim() ? note.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to add settlement");

      setAmountRupees("");
      setNote("");
      router.refresh(); // ✅ refresh balances + suggestions + settlement list
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded p-4">
      <h3 className="font-semibold">Settle Up</h3>

      <div className="mt-3">
        <div className="text-sm font-medium">Suggested transfers</div>
        <div className="mt-2 space-y-2">
          {suggestions.length === 0 ? (
            <div className="text-sm opacity-70">All settled 🎉</div>
          ) : (
            suggestions.map((s, idx) => (
              <div key={idx} className="border rounded p-3 text-sm flex items-center justify-between gap-3">
                <div className="flex-1">
                  <b>{labelOf(s.fromUserId)}</b> pays <b>{labelOf(s.toUserId)}</b>{" "}
                  <b>{formatINR(s.amountPaise)}</b>
                </div>
                <button
                  className="border rounded px-3 py-1"
                  onClick={() => useSuggestion(s)}
                  type="button"
                >
                  Use
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div className="flex gap-2">
          <select
            className="border rounded px-3 py-2 w-full"
            value={fromUserId}
            onChange={(e) => setFromUserId(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                From: {m.label}
              </option>
            ))}
          </select>

          <select
            className="border rounded px-3 py-2 w-full"
            value={toUserId}
            onChange={(e) => setToUserId(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                To: {m.label}
              </option>
            ))}
          </select>
        </div>

        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Amount in INR (e.g., 500 or 500.50)"
          value={amountRupees}
          onChange={(e) => setAmountRupees(e.target.value)}
        />

        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {err ? <div className="text-sm text-red-600">{err}</div> : null}

        <button className="border rounded px-3 py-2" disabled={loading}>
          {loading ? "Adding…" : "Add settlement"}
        </button>
      </form>
    </div>
  );
}
