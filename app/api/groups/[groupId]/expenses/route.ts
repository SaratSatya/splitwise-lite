import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, bad } from "@/lib/api";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  computeEqualShares,
  computeExactShares,
  computePercentShares,
  ensureUniqueUsers,
} from "@/lib/splits";

const ExpenseSplitTypeSchema = z.enum(["EQUAL", "EXACT", "PERCENT"]);

const CreateExpenseSchema = z.object({
  description: z.string().min(1).max(200),
  amountPaise: z.number().int().positive(),
  currency: z.string().optional().default("INR"),
  paidByUserId: z.string().min(1),
  splitType: ExpenseSplitTypeSchema,
  participants: z
    .array(
      z.object({
        userId: z.string().min(1),
        sharePaise: z.number().int().nonnegative().optional(), // EXACT
        percent: z.number().min(0).max(100).optional(), // PERCENT
      })
    )
    .min(1),
  idempotencyKey: z.string().min(8).max(200).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await ctx.params; // ✅ MUST be first
    const userId = await requireUserId();

    // membership check
    const member = await prisma.groupMember.findFirst({
      where: { groupId, userId },
      select: { id: true },
    });
    if (!member) return bad("Forbidden", 403);

    const body = CreateExpenseSchema.parse(await req.json());

    // paidBy must be a member
    const paidByIsMember = await prisma.groupMember.findFirst({
      where: { groupId, userId: body.paidByUserId },
      select: { id: true },
    });
    if (!paidByIsMember) return bad("paidByUserId must be a group member", 400);

    // participants must be unique + members
    const participantIds = body.participants.map((p) => p.userId);
    ensureUniqueUsers(participantIds);

    const participantMemberships = await prisma.groupMember.findMany({
      where: { groupId, userId: { in: participantIds } },
      select: { userId: true },
    });
    if (participantMemberships.length !== participantIds.length) {
      return bad("All participants must be group members", 400);
    }

    // idempotency (use findFirst to avoid requiring @unique)
    if (body.idempotencyKey) {
      const existing = await prisma.expense.findFirst({
        where: { idempotencyKey: body.idempotencyKey },
        select: { id: true, groupId: true },
      });
      if (existing) {
        if (existing.groupId !== groupId) return bad("Idempotency key conflict", 409);
        return ok({ id: existing.id, idempotent: true }, 200);
      }
    }

    // compute shares
    let shares: { userId: string; sharePaise: number }[] = [];

    if (body.splitType === "EQUAL") {
      shares = computeEqualShares(body.amountPaise, participantIds);
    } else if (body.splitType === "EXACT") {
      const exact = body.participants.map((p) => ({
        userId: p.userId,
        sharePaise: p.sharePaise ?? -1,
      }));
      if (exact.some((x) => x.sharePaise < 0))
        return bad("sharePaise required for EXACT split", 400);

      shares = computeExactShares(body.amountPaise, exact);
    } else {
      const perc = body.participants.map((p) => ({
        userId: p.userId,
        percent: p.percent ?? -1,
      }));
      if (perc.some((x) => x.percent < 0))
        return bad("percent required for PERCENT split", 400);

      shares = computePercentShares(body.amountPaise, perc);
    }

    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const expense = await tx.expense.create({
        data: {
          groupId, // ✅ string
          description: body.description,
          amount: body.amountPaise,
          currency: body.currency ?? "INR",
          paidByUserId: body.paidByUserId,
          splitType: body.splitType,
          idempotencyKey: body.idempotencyKey,
        },
        select: { id: true },
      });

      await tx.expenseSplit.createMany({
        data: shares.map((s) => ({
          expenseId: expense.id,
          userId: s.userId,
          share: s.sharePaise,
        })),
      });

      await tx.activityLog.create({
        data: {
          groupId,
          actorId: userId,
          type: "EXPENSE_ADDED",
          meta: { expenseId: expense.id, amountPaise: body.amountPaise },
        },
      });

      return expense;
    });

    return ok({ id: created.id }, 201);
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return bad("Unauthorized", 401);
    if (e?.name === "ZodError") return bad(e.errors?.[0]?.message ?? "Invalid body", 400);
    return bad(e?.message ?? "Something went wrong", 500);
  }
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await ctx.params; // ✅ MUST be first
    const userId = await requireUserId();

    const member = await prisma.groupMember.findFirst({
      where: { groupId, userId },
      select: { id: true },
    });
    if (!member) return bad("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);
    const cursor = searchParams.get("cursor");

    const expenses = await prisma.expense.findMany({
      where: { groupId, isDeleted:false},
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        description: true,
        amount: true,
        currency: true,
        splitType: true,
        createdAt: true,
        paidBy: { select: { id: true, name: true, email: true } },
        splits: {
          select: {
            share: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    const nextCursor = expenses.length === limit ? expenses[expenses.length - 1].id : null;
    return ok({ expenses, nextCursor });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return bad("Unauthorized", 401);
    return bad("Something went wrong", 500);
  }
}
