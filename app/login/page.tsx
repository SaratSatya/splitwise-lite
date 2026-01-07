import Container from "@/components/ui/Container";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import SignInButtons from "@/components/SignInButtons";

function safeCallbackUrl(v: unknown) {
  if (typeof v !== "string") return "/groups";
  // prevent open-redirects
  if (!v.startsWith("/")) return "/groups";
  return v;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  const callbackUrl = safeCallbackUrl(searchParams?.callbackUrl);

  return (
    <main className="py-14 sm:py-20">
      <Container className="max-w-xl">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm text-white/60">
              Continue to Splitwise-lite to access your groups.
            </p>
          </CardHeader>

          <CardContent>
            <SignInButtons callbackUrl={callbackUrl} />

            <div className="mt-6 text-xs text-white/50">
              By continuing, you agree to use this app responsibly.
            </div>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
