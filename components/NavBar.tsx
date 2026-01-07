"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={[
        "rounded-xl px-3 py-2 text-sm transition border",
        active
          ? "border-white/30 bg-white/[0.06]"
          : "border-white/10 hover:border-white/20 hover:bg-white/[0.04]",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function NavBar() {
  const { data: session, status } = useSession();

  const label = session?.user?.name ?? session?.user?.email ?? "";
  const initial = (label?.trim()?.[0] ?? "U").toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/70 to-sky-500/50 border border-white/10">
            ₹
          </span>
          <span className="font-semibold tracking-tight">Splitwise-lite</span>
        </Link>

        <div className="flex items-center gap-2">
          <NavLink href="/groups" label="Groups" />

          {status === "loading" ? (
            <span className="text-sm text-white/60 px-3">Loading…</span>
          ) : session ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 text-xs">
                  {initial}
                </span>
                <span className="text-sm text-white/80 max-w-[220px] truncate">
                  {label}
                </span>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-xl px-3 py-2 text-sm border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition"
              >
                Logout
              </button>
            </>
          ) : (
          <Link
            href="/login"
            className="rounded-xl px-3 py-2 text-sm border border-indigo-400/25 bg-indigo-500/15 hover:bg-indigo-500/20 hover:border-indigo-400/35 transition"
          >
          Login
          </Link>
          )}
        </div>
      </div>
    </header>
  );
}
