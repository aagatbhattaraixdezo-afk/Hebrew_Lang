import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EnrollForm } from "./enroll-form";

export const metadata = { title: "Join the course — Shalom" };

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const ec = await prisma.enrollmentCode.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      course: { select: { title: true, description: true, level: true, coverColor: true } },
    },
  });

  if (!ec) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(70% 50% at 20% 0%, hsl(var(--accent) / 0.18), transparent 60%), hsl(var(--bg))",
          }}
        />
        <div className="container-tight grid min-h-screen place-items-center py-10">
          <div className="card max-w-md p-8 text-center">
            <h1 className="font-display text-2xl font-bold">Invalid code</h1>
            <p className="mt-2 text-sm text-muted">
              We couldn&apos;t find an active code matching <code>{code}</code>. Check with
              your instructor or ask for a fresh one.
            </p>
            <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-primary">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (ec.redeemedBy) {
    return (
      <div className="container-tight grid min-h-screen place-items-center py-10">
        <div className="card max-w-md p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Code already used</h1>
          <p className="mt-2 text-sm text-muted">
            This code has already been claimed. Ask your instructor for a fresh one.
          </p>
          <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-primary">
            ← Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 50% at 20% 0%, hsl(var(--accent) / 0.18), transparent 60%), radial-gradient(60% 60% at 90% 100%, hsl(var(--primary) / 0.2), transparent 60%), hsl(var(--bg))",
        }}
      />

      <div className="container-tight grid min-h-screen place-items-center py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <span
              className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground font-display text-2xl font-bold"
              aria-hidden
            >
              ש
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold leading-none">Shalom</h1>
              <p className="text-sm text-muted">You&apos;ve been invited</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div
              className="px-6 py-5"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--accent) / 0.18))",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {ec.course.level ?? "Course"}
              </p>
              <h2 className="mt-1 font-display text-xl font-bold">{ec.course.title}</h2>
              {ec.course.description && (
                <p className="mt-1.5 text-sm text-ink/80">{ec.course.description}</p>
              )}
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-surface/80 px-2.5 py-1 font-mono text-xs font-bold text-primary">
                Code: {ec.code}
              </p>
            </div>
            <div className="p-6">
              <EnrollForm code={ec.code} />
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary">
              Log in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
