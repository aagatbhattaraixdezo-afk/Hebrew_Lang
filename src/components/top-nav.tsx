import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldCheck, User2, UserCircle } from "lucide-react";

export async function TopNav() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/85 backdrop-blur-md">
        <div className="container-wide flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-lg font-bold"
              aria-hidden
            >
              ש
            </span>
            <span className="font-display text-xl font-bold tracking-tight">
              Shalom
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {session.user.role === "ADMIN" && (
              <Button asChild variant="outline" size="sm">
                <Link href="/admin">
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              </Button>
            )}
            <Link
              href="/profile"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface px-3 py-1.5 text-sm text-ink/80 transition hover:bg-bg"
            >
              <UserCircle className="h-4 w-4 text-muted" />
              {session.user.name}
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="ghost" size="icon" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>
    </div>
  );
}
