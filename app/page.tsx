import Link from "next/link";
import Container from "@/components/ui/Container";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function Home() {
  return (
    <main className="py-12 sm:py-16">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Split expenses without the spreadsheet pain.
            </h1>
            <p className="mt-3 text-white/70 leading-relaxed">
              Create groups, add expenses with flexible splits, see net balances, and settle up.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/groups"
                className="rounded-xl px-4 py-2 text-sm border border-indigo-400/25 bg-indigo-500/15 hover:bg-indigo-500/20 hover:border-indigo-400/35 transition"
              >
                Go to Groups →
              </Link>
              <span className="text-sm text-white/60">
                Invite links supported
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 grid gap-3">
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">✨ Groups</div>
                <div className="text-xs text-white/60 mt-1">
                  Organize expenses by trip, flat, or event.
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">🧾 Expenses</div>
                <div className="text-xs text-white/60 mt-1">
                  EQUAL / EXACT / PERCENT splits.
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">💸 Settlements</div>
                <div className="text-xs text-white/60 mt-1">
                  Suggested transfers to minimize payments.
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div className="mt-10">
          <Card>
            <CardContent className="pt-5 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Quick start</div>
                  <div className="text-sm text-white/60 mt-1">
                    Create a group → invite → add expenses → settle up.
                  </div>
                </div>
                <Link
                  href="/groups"
                  className="rounded-xl px-4 py-2 text-sm border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition text-center"
                >
                  Open Groups
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}
