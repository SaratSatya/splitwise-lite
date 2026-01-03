"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; label: string };

function rupeesToPaise(v: string) {
  // allows "123" or "123.45"
  const cleaned = v.trim();
  if (!cleaned) return 0;
  const [r, p = ""] = cleaned.split(".");
  const rupees = parseInt(r || "0", 10);
  const paise = parseInt((p + "00").slice(0, 2), 10);
  return rupees * 100 + (isNaN(paise) ? 0 : paise);
}

export default function AddExpenseForm({
  groupId,
  members,
}: {
  groupId: string;
  members: Member[];
}) {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [amountRupees, setAmountRupees] = useState("");
  const [paidByUserId, setPaidByUserId] = useState(members[0]?.id ?? "");
  const [splitType, setSplitType] = useState<"EQUAL" | "EXACT" | "PERCENT">("EQUAL");

  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const m of members) init[m.id] = true;
    return init;
  });

  const [exactShares, setExactShares] = useState<Record<string, string>>({});
  const [percents, setPercents] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedIds = useMemo(
    () => members.map((m) => m.id).filter((id) => selected[id]),
    [members, selected]
  );

  const amountPaise = useMemo(() => rupeesToPaise(amountRupees), [amountRupees]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (selectedIds.length === 0) return setErr("Select at least one participant");
    if (!paidByUserId) return setErr("Select who paid");
    if (!description.trim()) return setErr("Description required");
    if (amountPaise <= 0) return setErr("Amount must be > 0");

    const participants = selectedIds.map((userId) => {
      if (splitType === "EXACT") {
        return { userId, sharePaise: rupeesToPaise(exactShares[userId] ?? "0") };
      }
      if (splitType === "PERCENT") {
        return { userId, percent: parseFloat(percents[userId] ?? "0") };
      }
      return { userId };
    });

    const idempotencyKey =
      (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amountPaise,
          currency: "INR",
          paidByUserId,
          splitType,
          participants,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to add expense");

      setDescription("");
      setAmountRupees("");
      setSplitType("EQUAL");
      setExactShares({});
      setPercents({});
      router.refresh();
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="border rounded p-4">
      <h3 className="font-semibold">Add Expense</h3>

      <form onSubmit={submit} className="mt-3 space-y-3">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Description (e.g., Dinner)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Amount in INR (e.g., 1200.50)"
          value={amountRupees}
          onChange={(e) => setAmountRupees(e.target.value)}
        />

        <div className="flex gap-2">
          <select
            className="border rounded px-3 py-2 w-full"
            value={paidByUserId}
            onChange={(e) => setPaidByUserId(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                Paid by: {m.label}
              </option>
            ))}
          </select>

          <select
            className="border rounded px-3 py-2"
            value={splitType}
            onChange={(e) => setSplitType(e.target.value as any)}
          >
            <option value="EQUAL">EQUAL</option>
            <option value="EXACT">EXACT</option>
            <option value="PERCENT">PERCENT</option>
          </select>
        </div>

        <div className="border rounded p-3">
          <div className="text-sm font-medium mb-2">Participants</div>
          <div className="space-y-2">
            {members.map((m) => {
              const checked = !!selected[m.id];
              return (
                <div key={m.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={checked} onChange={() => toggle(m.id)} />

                  <div className="flex-1 text-sm">{m.label}</div>

                  {splitType === "EXACT" && checked ? (
                    <input
                      className="border rounded px-2 py-1 w-32 text-sm"
                      placeholder="INR share"
                      value={exactShares[m.id] ?? ""}
                      onChange={(e) =>
                        setExactShares((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                    />
                  ) : null}

                  {splitType === "PERCENT" && checked ? (
                    <input
                      className="border rounded px-2 py-1 w-32 text-sm"
                      placeholder="%"
                      value={percents[m.id] ?? ""}
                      onChange={(e) =>
                        setPercents((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="text-xs opacity-70 mt-2">
            EXACT must sum to total. PERCENT must sum to 100 (decimals ok).
          </div>
        </div>

        {err ? <div className="text-sm text-red-600">{err}</div> : null}

        <button className="border rounded px-3 py-2" disabled={loading}>
          {loading ? "Adding…" : "Add Expense"}
        </button>
      </form>
    </div>
  );
}
