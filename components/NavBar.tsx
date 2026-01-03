"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function NavBar() {
  const { data: session, status } = useSession();

  return (
    <div className="w-full border-b">
      <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          Splitwise-lite
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/groups" className="text-sm underline">
            Groups
          </Link>

          {status === "loading" ? (
            <span className="text-sm opacity-70">Loading…</span>
          ) : session ? (
            <>
              <span className="text-sm opacity-80">
                {session.user?.name ?? session.user?.email}
              </span>
              <button
                className="text-sm px-3 py-1 border rounded"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className="text-sm px-3 py-1 border rounded"
              onClick={() => signIn()}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
