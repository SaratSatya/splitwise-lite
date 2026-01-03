import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, bad } from "@/lib/api";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params; // ✅ unwrap params
    const userId = await requireUserId();

    const invite = await prisma.groupInvite.findUnique({
      where: { token },
      select: { groupId: true, expiresAt: true },
    });
    if (!invite) return bad("Invalid invite", 404);

    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      return bad("Invite expired", 400);
    }

    const existing = await prisma.groupMember.findFirst({
      where: { groupId: invite.groupId, userId },
      select: { id: true },
    });

    if (!existing) {
      await prisma.groupMember.create({
        data: {
          groupId: invite.groupId,
          userId,
          role: "MEMBER",
        },
      });

      await prisma.activityLog.create({
        data: {
          groupId: invite.groupId,
          actorId: userId,
          type: "MEMBER_JOINED",
          meta: {},
        },
      });
    }

    return ok({ groupId: invite.groupId });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return bad("Unauthorized", 401);
    return bad("Something went wrong", 500);
  }
}
