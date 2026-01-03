import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, bad } from "@/lib/api";

export async function GET(_req:Request,{params}:{params:Promise<{groupId:string}>}) {
  try {
    const userId = await requireUserId();
    const  groupId =  params;

    // membership check
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: groupId as any, userId: userId as any },
      select: { id: true },
    });
    if (!membership) return bad("Forbidden", 403);

    const group = await prisma.group.findUnique({
      where: { id: groupId as any },
      select: {
        id: true,
        name: true,
        createdAt: true,
        members: {
          select: {
            role: true,
            joinedAt: true,
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
    });

    if (!group) return bad("Not found", 404);
    return ok(group);
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return bad("Unauthorized", 401);
    return bad("Something went wrong", 500);
  }
}
