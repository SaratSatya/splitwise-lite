import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CreateGroupForm from "@/components/CreateGroupForm";


type GroupItem = {
  id: string;
  name: string;
  updatedAt: Date;
};

export default async function GroupsPage() {
  const session = await getSession();
  if (!session) redirect("/api/auth/signin?callbackUrl=/groups");

  const userId = session.user.id;

  const groups: GroupItem[] = await prisma.group.findMany({
    where: { members: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-semibold">Your Groups</h1>

      <div className="mt-4">
        <CreateGroupForm />
      </div>

      <div className="mt-8 space-y-2">
        {groups.length === 0 ? (
          <p className="opacity-70">No groups yet. Create one above.</p>
        ) : (
          groups.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              className="block border rounded p-3 hover:bg-black/5"
            >
              <div className="font-medium">{g.name}</div>
              <div className="text-xs opacity-70">
                Updated: {new Date(g.updatedAt).toLocaleString()}
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
