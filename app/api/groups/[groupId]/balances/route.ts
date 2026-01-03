import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";
import { computeGroupBalances } from "@/lib/balances";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params; // ✅ string
    const userId = await requireUserId();

    const member = await prisma.groupMember.findFirst({
      where: { groupId, userId },
      select: { id: true },
    });
    if (!member) return bad("Forbidden", 403);

    const data = await computeGroupBalances(groupId); // ✅ now correct
    return ok(data);
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return bad("Unauthorized", 401);
    return bad("Something went wrong", 500);
  }
}
