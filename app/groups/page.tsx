import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CreateGroupForm from "@/components/CreateGroupForm";
import Container from "@/components/ui/Container";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

type GroupItem = {
  id: string;
  name: string;
  updatedAt: Date;
};

export default async function GroupsPage() {
  const session = await getSession();
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent("/groups")}`);

  const userId = session.user.id;

  const groups: GroupItem[] = await prisma.group.findMany({
    where: { members: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true },
  });

  return (
    <main className="py-10">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your Groups</h1>
            <p className="mt-1 text-sm text-white/60">
              Create a group, invite members, and start tracking.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">Create a group</div>
                <div className="text-xs text-white/60 mt-1">
                  Keep names short (e.g., Goa Trip, Flatmates).
                </div>
              </CardHeader>
              <CardContent>
                <CreateGroupForm />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">Recent</div>
                <div className="text-xs text-white/60 mt-1">
                  Click a group to manage expenses & settlements.
                </div>
              </CardHeader>

              <CardContent>
                {groups.length === 0 ? (
                  <div className="text-sm text-white/60">
                    No groups yet. Create one on the left.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {groups.map((g) => (
                      <Link
                        key={g.id}
                        href={`/groups/${g.id}`}
                        className="group rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium">{g.name}</div>
                          <span className="text-xs text-white/50">
                            Open →
                          </span>
                        </div>
                        <div className="text-xs text-white/50 mt-1">
                          Updated: {new Date(g.updatedAt).toLocaleString()}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
