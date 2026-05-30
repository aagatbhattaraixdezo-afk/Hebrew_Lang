import { LoginForm } from "./login-form";

export const metadata = { title: "Log in — Shalom" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center py-10 px-4">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 50% at 20% 0%, hsl(var(--accent) / 0.18), transparent 60%), radial-gradient(60% 60% at 90% 100%, hsl(var(--primary) / 0.2), transparent 60%), hsl(var(--bg))",
        }}
      />
      <LoginForm fromPath={sp?.from ?? "/"} />
    </div>
  );
}
