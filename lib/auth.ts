import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const getSession = () => getServerSession(authOptions);

export async function requireUserId() {
  const session = await getSession();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}
