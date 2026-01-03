import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, bad } from "@/lib/api";
import crypto from "crypto";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params; // ✅ unwrap params
    const userId = await requireUserId();

    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId },
      select: { role: true },
    });
    if (!membership) return bad("Forbidden", 403);
    if (membership.role !== "OWNER") return bad("Only owner can invite", 403);

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.groupInvite.create({
      data: {
        groupId, // ✅ now defined
        token,
        createdBy: userId,
        expiresAt,
      },
    });

    const base =process.env.NEXTAUTH_URL ??(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const joinUrl = `${base}/join/${token}`;


    return ok({ token, joinUrl, expiresAt }, 201);
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return bad("Unauthorized", 401);
    return bad("Something went wrong", 500);
  }
}
