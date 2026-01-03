import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, bad } from "@/lib/api";
import { computeGroupBalances } from "@/lib/balances";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ groupId: string; memberUserId: string }> }
) {
  try {
    const { groupId, memberUserId } = await ctx.params; // ✅ unwrap params
    const userId = await requireUserId();

    if (memberUserId === userId) {
      return bad("You cannot remove yourself", 400);
    }

    // requester must be OWNER
    const requester = await prisma.groupMember.findFirst({
      where: { groupId, userId },
      select: { role: true },
    });
    if (!requester) return bad("Forbidden", 403);
    if (requester.role !== "OWNER") return bad("Only owner can remove members", 403);

    // target must exist
    const target = await prisma.groupMember.findFirst({
      where: { groupId, userId: memberUserId },
      select: { id: true, role: true },
    });
    if (!target) return bad("Member not found", 404);

    // If target is OWNER, ensure at least one OWNER remains after removal
    if (target.role === "OWNER") {
      const otherOwners = await prisma.groupMember.count({
        where: { groupId, role: "OWNER", userId: { not: memberUserId } },
      });
      if (otherOwners === 0) return bad("Cannot remove the last owner", 400);
    }

    // Safety: only allow removal if member has 0 net balance
    const { netBalances } = await computeGroupBalances(groupId);
    const b = netBalances.find((x) => x.userId === memberUserId);
    if (!b) return bad("Member not found in balances", 400);
    if (b.netPaise !== 0) {
      return bad("Member has outstanding balance. Settle up first.", 400);
    }

    await prisma.groupMember.delete({
      where: { id: target.id },
    });

    await prisma.activityLog.create({
      data: {
        groupId,
        actorId: userId,
        type: "MEMBER_REMOVED",
        meta: { removedUserId: memberUserId },
      },
    });

    return ok({ removed: true });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return bad("Unauthorized", 401);
    return bad("Something went wrong", 500);
  }
}
