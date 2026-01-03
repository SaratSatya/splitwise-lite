import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, bad } from "@/lib/api";
import { Prisma } from "@prisma/client";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ groupId: string; expenseId: string }> }
) {
  try {
    const { groupId, expenseId } = await ctx.params;
    const userId = await requireUserId();

    // membership check
    const member = await prisma.groupMember.findFirst({
      where: { groupId, userId },
      select: { id: true },
    });
    if (!member) return bad("Forbidden", 403);

    // ensure expense belongs to group and not already deleted
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, groupId, isDeleted: false },
      select: { id: true, description: true, amount: true },
    });
    if (!expense) return bad("Expense not found", 404);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
        },
      });

      await tx.expenseSplit.updateMany({
        where: { expenseId },
        data: { isDeleted: true },
      });

      await tx.activityLog.create({
        data: {
          groupId,
          actorId: userId,
          type: "EXPENSE_DELETED",
          meta: { expenseId, amountPaise: expense.amount, description: expense.description },
        },
      });
    });

    return ok({ deleted: true });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return bad("Unauthorized", 401);
    return bad("Something went wrong", 500);
  }
}
