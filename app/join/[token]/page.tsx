import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import JoinGroupClient from "@/components/JoinGroupClient";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params; // ✅ unwrap params

  const session = await getSession();
  if (!session) redirect(`/api/auth/signin?callbackUrl=/join/${token}`);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-semibold">Join Group</h1>
      <p className="mt-2 opacity-80">Click join to become a member.</p>

      <div className="mt-6">
        <JoinGroupClient token={token} />
      </div>
    </main>
  );
}
