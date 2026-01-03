"use client";

import { useEffect, useMemo, useState } from "react";

type Member = { id: string; label: string };

type SettlementItem = {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  note: string | null;
  createdAt: string; // serialized
};

function formatINR(paise: number) {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const p = (abs % 100).toString().padStart(2, "0");
  return `${sign}₹${rupees}.${p}`;
}

export default function SettlementsList({
  groupId,
  members,
  initialSettlements,
  initialNextCursor,
}: {
  groupId: string;
  members: Member[];
  initialSettlements: SettlementItem[];
  initialNextCursor: string | null;
}) {
  const labelOf = useMemo(() => {
    const map = new Map(members.map((m) => [m.id, m.label]));
    return (id: string) => map.get(id) ?? id;
  }, [members]);

  const [settlements, setSettlements] = useState<SettlementItem[]>(initialSettlements);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setSettlements(initialSettlements);
    setNextCursor(initialNextCursor);
  }, [initialSettlements, initialNextCursor]);

  async function loadMore() {
    if (!nextCursor || loading) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/settlements/list?limit=20&cursor=${encodeURIComponent(nextCursor)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load");

      setSettlements((prev) => [...prev, ...(data.settlements ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {settlements.length === 0 ? (
        <div className="opacity-70">No settlements yet.</div>
      ) : (
        settlements.map((s: SettlementItem) => (
          <div key={s.id} className="border rounded p-3 text-sm">
            <div>
              <b>{labelOf(s.fromUserId)}</b> paid <b>{labelOf(s.toUserId)}</b>{" "}
              <b>{formatINR(s.amount)}</b>
            </div>
            <div className="text-xs opacity-70 mt-1">
              {new Date(s.createdAt).toLocaleString()}
              {s.note ? ` • ${s.note}` : ""}
            </div>
          </div>
        ))
      )}

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      {nextCursor ? (
        <button className="border rounded px-3 py-2" onClick={loadMore} disabled={loading}>
          {loading ? "Loading…" : "Load more settlements"}
        </button>
      ) : settlements.length > 0 ? (
        <div className="text-sm opacity-70">No more settlements.</div>
      ) : null}
    </div>
  );
}
