import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

import CreateInviteLink from "@/components/CreateInviteLink";
import AddExpenseForm from "@/components/AddExpenseForm";
import AddSettlementForm from "@/components/AddSettlementForm";

import ExpensesList from "@/components/ExpensesList";
import SettlementsList from "@/components/SettlementsList";
import RemoveMemberButton from "@/components/RemoveMemberButton";


import { computeGroupBalances } from "@/lib/balances";

type MemberItem = {
  role: "OWNER" | "MEMBER";
  joinedAt: Date;
  user: { id: string; name: string | null; email: string | null };
};

type GroupDetails = {
  id: string;
  name: string;
  members: MemberItem[];
};

type ActivityItem = {
  id: string;
  type: string;
  meta: any;
  createdAt: Date;
  actorId: string | null;
};

function formatINR(paise: number) {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const p = (abs % 100).toString().padStart(2, "0");
  return `${sign}₹${rupees}.${p}`;
}

export default async function GroupDetailsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const session = await getSession();
  if (!session) redirect(`/api/auth/signin?callbackUrl=/groups/${groupId}`);

  const userId = session.user.id;

  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId },
    select: { role: true },
  });
  if (!membership) redirect("/groups");

  const group: GroupDetails | null = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      members: {
        select: {
          role: true,
          joinedAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!group) redirect("/groups");

  const memberOptions = group.members.map((m) => ({
    id: m.user.id,
    label: m.user.name ?? m.user.email ?? m.user.id,
  }));

  // balances + suggestions
  const { netBalances, suggestions } = await computeGroupBalances(groupId);
  const lookup = new Map(netBalances.map((b) => [b.userId, b]));
  const userLabel = (uid: string) =>
    lookup.get(uid)?.name ?? lookup.get(uid)?.email ?? uid;

  // first page expenses (serialize dates for client component)
  const expenseLimit = 20;
  const firstExpenses = await prisma.expense.findMany({
    where: { groupId, isDeleted: false },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: expenseLimit,
    select: {
      id: true,
      description: true,
      amount: true,
      splitType: true,
      createdAt: true,
      paidBy: { select: { name: true, email: true } },
      splits: {
        where: { isDeleted: false },
        select: {
          share: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
  const expenses = firstExpenses.map((e:(typeof firstExpenses[number])) => ({ ...e, createdAt: e.createdAt.toISOString() }));
  const expensesNextCursor =
    firstExpenses.length === expenseLimit ? firstExpenses[firstExpenses.length - 1].id : null;

  // first page settlements (serialize dates)
  const settlementLimit = 20;
  const firstSettlements = await prisma.settlement.findMany({
    where: { groupId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: settlementLimit,
    select: { id: true, fromUserId: true, toUserId: true, amount: true, note: true, createdAt: true },
  });
  const settlements = firstSettlements.map((s:(typeof firstSettlements)[number]) => ({ ...s, createdAt: s.createdAt.toISOString() }));
  const settlementsNextCursor =
    firstSettlements.length === settlementLimit
      ? firstSettlements[firstSettlements.length - 1].id
      : null;

  // activity feed
  const activities: ActivityItem[] = await prisma.activityLog.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, type: true, meta: true, createdAt: true, actorId: true },
  });

  function actLine(a: { type: string; meta: any; actorId: string | null }) {
    const actor = a.actorId?userLabel(a.actorId):"Someone";

    if (a.type === "GROUP_CREATED") return `${actor} created the group`;
    if (a.type === "MEMBER_JOINED") return `${actor} joined the group`;
    if (a.type === "EXPENSE_ADDED") return `${actor} added an expense`;
    if (a.type === "EXPENSE_DELETED") return `${actor} deleted an expense`;
    if (a.type === "SETTLEMENT_ADDED") return `${actor} added a settlement`;
    if (a.type === "MEMBER_REMOVED") return `${actor} removed a member`;

    return `${actor} did ${a.type}`;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-semibold">{group.name}</h1>
      <p className="mt-1 text-sm opacity-70">
        Your role: <b>{membership.role}</b>
      </p>

      <div className="mt-6">
        <CreateInviteLink groupId={group.id} />
      </div>

      <div className="mt-6">
        <AddExpenseForm groupId={group.id} members={memberOptions} />
      </div>

      <div className="mt-6">
        <AddSettlementForm groupId={group.id} members={memberOptions} suggestions={suggestions} />
      </div>

      <h2 className="mt-10 font-semibold">Balances</h2>
      <div className="mt-3 space-y-2">
        {netBalances.map((b) => (
          <div key={b.userId} className="border rounded p-3">
            <div className="font-medium">{b.name ?? b.email}</div>
            <div className="text-sm opacity-80">Net: {formatINR(b.netPaise)}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-semibold">Settlements</h2>
      <SettlementsList
        groupId={groupId}
        members={memberOptions}
        initialSettlements={settlements}
        initialNextCursor={settlementsNextCursor}
      />

      <h2 className="mt-10 font-semibold">Recent expenses</h2>
      <ExpensesList
        groupId={groupId}
        initialExpenses={expenses}
        initialNextCursor={expensesNextCursor}
      />

      <h2 className="mt-10 font-semibold">Activity</h2>
      <div className="mt-3 space-y-2">
        {activities.length === 0 ? (
          <div className="opacity-70">No activity yet.</div>
        ) : (
          activities.map((a) => (
            <div key={a.id} className="border rounded p-3 text-sm">
              <div>{actLine(a)}</div>
              <div className="text-xs opacity-70 mt-1">
                {new Date(a.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

    <h2 className="mt-10 font-semibold">Members</h2>
    <div className="mt-3 space-y-2">
        {group.members.map((m) => {
            const label = m.user.name ?? m.user.email ?? m.user.id;
            const canRemove =
            membership.role === "OWNER" && m.user.id !== userId;
            return (
              <div key={m.user.id} className="border rounded p-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{label}</div>
                <div className="text-xs opacity-70">
                {m.user.email} • {m.role} • joined {new Date(m.joinedAt).toLocaleString()}
              </div>
              </div>
              {canRemove ? (
                <RemoveMemberButton
                groupId={groupId}
                memberUserId={m.user.id}
                label={label}
                />
              ) : null}
            </div>
            );
         })}
    </div>

    </main>
  );
}
