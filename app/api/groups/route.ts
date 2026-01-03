import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, bad } from "@/lib/api";
import { z } from "zod";

const CreateGroupSchema = z.object({
  name: z.string().min(2).max(60),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = CreateGroupSchema.parse(await req.json());

    const group = await prisma.group.create({
      data: {
        name: body.name,
        createdById: userId as any,
        members: {
          create: {
            userId: userId as any,
            role: "OWNER",
          },
        },
        activities: {
          create: {
            actorId: userId as any,
            type: "GROUP_CREATED",
            meta: { name: body.name },
          },
        },
      },
      select: { id: true, name: true, createdAt: true },
    });

    return ok(group, 201);
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return bad("Unauthorized", 401);
    if (e?.name === "ZodError") return bad(e.errors?.[0]?.message ?? "Invalid body", 400);
    return bad("Something went wrong", 500);
  }
}

export async function GET() {
  try {
    const userId = await requireUserId();

    const groups = await prisma.group.findMany({
      where: { members: { some: { userId: userId as any } } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });

    return ok({ groups });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return bad("Unauthorized", 401);
    return bad("Something went wrong", 500);
  }
}
