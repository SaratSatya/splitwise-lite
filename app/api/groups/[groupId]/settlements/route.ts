import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, bad } from "@/lib/api";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const CreateSettlementSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  note: z.string().max(200).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params; // ✅
    const userId = await requireUserId();

    const member = await prisma.groupMember.findFirst({
      where: { groupId, userId },
      select: { id: true },
    });
    if (!member) return bad("Forbidden", 403);

    const body = CreateSettlementSchema.parse(await req.json());
    if (body.fromUserId === body.toUserId) return bad("fromUserId and toUserId must differ", 400);

    const both = await prisma.groupMember.findMany({
      where: { groupId, userId: { in: [body.fromUserId, body.toUserId] } },
      select: { userId: true },
    });
    if (both.length !== 2) return bad("Both users must be group members", 400);

    const settlement = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.settlement.create({
        data: {
          groupId,
          fromUserId: body.fromUserId,
          toUserId: body.toUserId,
          amount: body.amountPaise,
          note: body.note,
        },
        select: { id: true },
      });

      await tx.activityLog.create({
        data: {
          groupId,
          actorId: userId,
          type: "SETTLEMENT_ADDED",
          meta: { settlementId: created.id, amountPaise: body.amountPaise },
        },
      });

      return created;
    });

    return ok({ id: settlement.id }, 201);
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return bad("Unauthorized", 401);
    if (e?.name === "ZodError") return bad(e.errors?.[0]?.message ?? "Invalid body", 400);
    return bad("Something went wrong", 500);
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params; // ✅
    const userId = await requireUserId();

    const member = await prisma.groupMember.findFirst({
      where: { groupId, userId },
      select: { id: true },
    });
    if (!member) return bad("Forbidden", 403);

    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, fromUserId: true, toUserId: true, amount: true, note: true, createdAt: true },
    });

    return ok({ settlements });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return bad("Unauthorized", 401);
    return bad("Something went wrong", 500);
  }
}
