import { prisma } from "@/lib/prisma";

export type NetBalance = {
  userId: string;
  name: string | null;
  email: string | null;
  netPaise: number; // +ve means they should receive, -ve means they owe
};

export type TransferSuggestion = {
  fromUserId: string;
  toUserId: string;
  amountPaise: number;
};

type GroupMembersResult = {
  members: {
    user: { id: string; name: string | null; email: string | null };
  }[];
};

type ExpenseRow = {
  id: string;
  amount: number;
  paidByUserId: string;
};

export async function computeGroupBalances(groupId: string) {
  const group: GroupMembersResult | null = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      members: {
        select: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!group) throw new Error("GROUP_NOT_FOUND");

  const users = group.members.map((m: GroupMembersResult["members"][number]) => m.user);

  const net = new Map<string, number>();
  for (const u of users) net.set(u.id, 0);

  const expenses: ExpenseRow[] = await prisma.expense.findMany({
    where: { groupId, isDeleted:false},
    select: { id: true, amount: true, paidByUserId: true },
  });

  if (expenses.length) {
    type SplitRow = { expenseId: string; userId: string; share: number };

    const splits: SplitRow[] = await prisma.expenseSplit.findMany({
      where: { expenseId: { in: expenses.map((e: ExpenseRow) => e.id) },isDeleted:false},
      select: { expenseId: true, userId: true, share: true },
    });

    // each split user -share
    for (const s of splits) {
      const curr = net.get(s.userId) ?? 0;
      net.set(s.userId, curr - s.share);
    }

    // payer +amount
    for (const e of expenses) {
      const curr = net.get(e.paidByUserId) ?? 0;
      net.set(e.paidByUserId, curr + e.amount);
    }
  }

  const settlements: { fromUserId: string; toUserId: string; amount: number }[] =
    await prisma.settlement.findMany({
      where: { groupId },
      select: { fromUserId: true, toUserId: true, amount: true },
    });

  // settlement: fromUser pays toUser
  for (const s of settlements) {
    net.set(s.fromUserId, (net.get(s.fromUserId) ?? 0) + s.amount);
    net.set(s.toUserId, (net.get(s.toUserId) ?? 0) - s.amount);
  }

  const netBalances: NetBalance[] = users.map((u: (typeof users)[number]) => ({
    userId: u.id,
    name: u.name,
    email: u.email,
    netPaise: net.get(u.id) ?? 0,
  }));

  const suggestions = minimizeTransfers(netBalances);
  return { netBalances, suggestions };
}

function minimizeTransfers(netBalances: NetBalance[]): TransferSuggestion[] {
  const creditors = netBalances
    .filter((b) => b.netPaise > 0)
    .map((b) => ({ userId: b.userId, amt: b.netPaise }))
    .sort((a, b) => b.amt - a.amt);

  const debtors = netBalances
    .filter((b) => b.netPaise < 0)
    .map((b) => ({ userId: b.userId, amt: -b.netPaise }))
    .sort((a, b) => b.amt - a.amt);

  const transfers: TransferSuggestion[] = [];
  let i = 0,
    j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const x = Math.min(d.amt, c.amt);

    transfers.push({ fromUserId: d.userId, toUserId: c.userId, amountPaise: x });

    d.amt -= x;
    c.amt -= x;

    if (d.amt === 0) i++;
    if (c.amt === 0) j++;
  }

  return transfers;
}
