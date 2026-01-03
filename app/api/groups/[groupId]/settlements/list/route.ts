import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, bad } from "@/lib/api";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await ctx.params;
    const userId = await requireUserId();

    const member = await prisma.groupMember.findFirst({
      where: { groupId, userId },
      select: { id: true },
    });
    if (!member) return bad("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);
    const cursor = searchParams.get("cursor");

    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        fromUserId: true,
        toUserId: true,
        amount: true,
        note: true,
        createdAt: true,
      },
    });

    const nextCursor = settlements.length === limit ? settlements[settlements.length - 1].id : null;
    return ok({ settlements, nextCursor });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return bad("Unauthorized", 401);
    return bad("Something went wrong", 500);
  }
}
