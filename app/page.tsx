import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Splitwise-lite</h1>
      <p className="mt-2 opacity-80">
        Track group expenses, balances, and settlements.
      </p>

      <div className="mt-6">
        <Link className="underline" href="/groups">
          Go to Groups →
        </Link>
      </div>
    </main>
  );
}
