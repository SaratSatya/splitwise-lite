import Link from "next/link";
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
import Container from "@/components/ui/Container";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

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
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(`/groups/${groupId}`)}`);


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

  const { netBalances, suggestions } = await computeGroupBalances(groupId);
  const lookup = new Map(netBalances.map((b) => [b.userId, b]));
  const userLabel = (uid: string) =>
    lookup.get(uid)?.name ?? lookup.get(uid)?.email ?? uid;

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
  const expenses = firstExpenses.map((e: (typeof firstExpenses)[number]) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
  }));
  const expensesNextCursor =
    firstExpenses.length === expenseLimit ? firstExpenses[firstExpenses.length - 1].id : null;

  const settlementLimit = 20;
  const firstSettlements = await prisma.settlement.findMany({
    where: { groupId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: settlementLimit,
    select: { id: true, fromUserId: true, toUserId: true, amount: true, note: true, createdAt: true },
  });
  const settlements = firstSettlements.map((s: (typeof firstSettlements)[number]) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }));
  const settlementsNextCursor =
    firstSettlements.length === settlementLimit ? firstSettlements[firstSettlements.length - 1].id : null;

  const activities: ActivityItem[] = await prisma.activityLog.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, type: true, meta: true, createdAt: true, actorId: true },
  });

  function actLine(a: { type: string; meta: any; actorId: string | null }) {
    const actor = a.actorId ? userLabel(a.actorId) : "Someone";
    if (a.type === "GROUP_CREATED") return `${actor} created the group`;
    if (a.type === "MEMBER_JOINED") return `${actor} joined the group`;
    if (a.type === "EXPENSE_ADDED") return `${actor} added an expense`;
    if (a.type === "EXPENSE_DELETED") return `${actor} deleted an expense`;
    if (a.type === "SETTLEMENT_ADDED") return `${actor} added a settlement`;
    if (a.type === "MEMBER_REMOVED") return `${actor} removed a member`;
    return `${actor} did ${a.type}`;
  }

  return (
    <main className="py-10">
      <Container>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/groups" className="text-sm text-white/60 hover:text-white transition">
              ← Back to groups
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{group.name}</h1>
            <div className="mt-2 inline-flex items-center gap-2 text-xs text-white/60">
              <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
                Role: <b className="text-white/80">{membership.role}</b>
              </span>
              <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
                Members: <b className="text-white/80">{group.members.length}</b>
              </span>
            </div>
          </div>

          <div className="hidden sm:block">
            <Card>
              <CardContent className="pt-5 sm:pt-6">
                <CreateInviteLink groupId={group.id} />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 sm:hidden">
          <Card>
            <CardContent className="pt-5 sm:pt-6">
              <CreateInviteLink groupId={group.id} />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Add Expense</div>
              <div className="text-xs text-white/60 mt-1">Record who paid and how it’s split.</div>
            </CardHeader>
            <CardContent>
              <AddExpenseForm groupId={group.id} members={memberOptions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Settle Up</div>
              <div className="text-xs text-white/60 mt-1">Use suggestions or add a manual settlement.</div>
            </CardHeader>
            <CardContent>
              <AddSettlementForm groupId={group.id} members={memberOptions} suggestions={suggestions} />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">Balances</div>
                <div className="text-xs text-white/60 mt-1">Net position for each member.</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {netBalances.map((b) => (
                    <div key={b.userId} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="font-medium">{b.name ?? b.email}</div>
                      <div className="text-sm text-white/70 mt-1">
                        Net: <span className="text-white/90">{formatINR(b.netPaise)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <div className="text-sm font-semibold">Members</div>
                  <div className="text-xs text-white/60 mt-1">Manage group access.</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.members.map((m) => {
                      const label = m.user.name ?? m.user.email ?? m.user.id;
                      const canRemove = membership.role === "OWNER" && m.user.id !== userId;

                      return (
                        <div
                          key={m.user.id}
                          className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="font-medium truncate">{label}</div>
                            <div className="text-xs text-white/55 mt-1">
                              {m.user.email} • {m.role} • joined{" "}
                              {new Date(m.joinedAt).toLocaleString()}
                            </div>
                          </div>

                          {canRemove ? (
                            <RemoveMemberButton groupId={groupId} memberUserId={m.user.id} label={label} />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">Settlements</div>
                <div className="text-xs text-white/60 mt-1">Latest settlement records.</div>
              </CardHeader>
              <CardContent>
                <SettlementsList
                  groupId={groupId}
                  members={memberOptions}
                  initialSettlements={settlements}
                  initialNextCursor={settlementsNextCursor}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">Recent Expenses</div>
                <div className="text-xs text-white/60 mt-1">Most recent first.</div>
              </CardHeader>
              <CardContent>
                <ExpensesList groupId={groupId} initialExpenses={expenses} initialNextCursor={expensesNextCursor} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">Activity</div>
                <div className="text-xs text-white/60 mt-1">Last 30 actions.</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <div className="text-sm text-white/60">No activity yet.</div>
                  ) : (
                    activities.map((a) => (
                      <div key={a.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
                        <div>{actLine(a)}</div>
                        <div className="text-xs text-white/50 mt-1">
                          {new Date(a.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
