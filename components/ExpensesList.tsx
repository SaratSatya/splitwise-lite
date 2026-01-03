"use client";

import { useEffect, useMemo, useState } from "react";
import DeleteExpenseButton from "@/components/DeleteExpenseButton";

type ExpenseSplitItem = {
  share: number;
  user: { name: string | null; email: string | null };
};

type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  splitType: "EQUAL" | "EXACT" | "PERCENT";
  createdAt: string; // serialized
  paidBy: { name: string | null; email: string | null };
  splits: ExpenseSplitItem[];
};

function formatINR(paise: number) {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const p = (abs % 100).toString().padStart(2, "0");
  return `${sign}₹${rupees}.${p}`;
}

function nameOf(u: { name: string | null; email: string | null }) {
  return u.name ?? u.email ?? "Unknown";
}

export default function ExpensesList({
  groupId,
  initialExpenses,
  initialNextCursor,
}: {
  groupId: string;
  initialExpenses: ExpenseItem[];
  initialNextCursor: string | null;
}) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // when server refresh happens, this component remounts with new initial props
  useEffect(() => {
    setExpenses(initialExpenses);
    setNextCursor(initialNextCursor);
  }, [initialExpenses, initialNextCursor]);

  async function loadMore() {
    if (!nextCursor || loading) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/expenses?limit=20&cursor=${encodeURIComponent(nextCursor)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load");

      setExpenses((prev) => [...prev, ...(data.expenses ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {expenses.length === 0 ? (
        <p className="opacity-70">No expenses yet.</p>
      ) : (
        expenses.map((e:ExpenseItem) => (
          <div key={e.id} className="border rounded p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{e.description}</div>

              <div className="flex items-center gap-2">
                <div className="text-sm">
                  {formatINR(e.amount)}{" "}
                  <span className="opacity-60">({e.splitType})</span>
                </div>
                <DeleteExpenseButton groupId={groupId} expenseId={e.id} />
              </div>
            </div>

            <div className="text-xs opacity-70 mt-1">
              Paid by {nameOf(e.paidBy)} • {new Date(e.createdAt).toLocaleString()}
            </div>

            <div className="mt-2 text-sm space-y-1">
              {e.splits.map((sp:ExpenseSplitItem, i:number) => (
                <div key={i} className="flex justify-between">
                  <span>{nameOf(sp.user)}</span>
                  <span>{formatINR(sp.share)}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      {nextCursor ? (
        <button className="border rounded px-3 py-2" onClick={loadMore} disabled={loading}>
          {loading ? "Loading…" : "Load more expenses"}
        </button>
      ) : expenses.length > 0 ? (
        <div className="text-sm opacity-70">No more expenses.</div>
      ) : null}
    </div>
  );
}
