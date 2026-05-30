import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { MistakesDrill } from "./mistakes-drill";

export const metadata = { title: "Practise mistakes — Shalom" };

export default async function MistakesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id;

  // Find every Mcq the user has ever gotten wrong.
  const wrongAttempts = await prisma.mcqAttempt.findMany({
    where: {
      userId,
      correct: false,
      createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
    },
    select: { mcqId: true },
    distinct: ["mcqId"],
  });

  // Keep only the ones not yet "fixed" (no later correct attempt).
  const openMcqIds: string[] = [];
  for (const { mcqId } of wrongAttempts) {
    const lastWrong = await prisma.mcqAttempt.findFirst({
      where: { userId, mcqId, correct: false },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (!lastWrong) continue;
    const lastCorrect = await prisma.mcqAttempt.findFirst({
      where: { userId, mcqId, correct: true, createdAt: { gt: lastWrong.createdAt } },
      select: { id: true },
    });
    if (!lastCorrect) openMcqIds.push(mcqId);
  }

  const mcqs = openMcqIds.length
    ? await prisma.mcq.findMany({
        where: { id: { in: openMcqIds } },
        include: {
          options: true,
          lesson: { select: { id: true, title: true } },
        },
      })
    : [];

  return (
    <>
      <TopNav />
      <main className="container-tight py-6 sm:py-10">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href="/">
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>

        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-danger">
            Practise
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Mistakes to fix
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Questions you&apos;ve missed in the last 30 days. Get them right once and they
            leave the queue.
          </p>
        </header>

        {mcqs.length === 0 ? (
          <div className="card p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h2 className="mt-4 font-display text-2xl font-bold">Inbox zero</h2>
            <p className="mt-2 text-sm text-muted">
              No outstanding mistakes. Keep up the streak — when you slip, the missed
              question will land here.
            </p>
            <Button asChild className="mt-6">
              <Link href="/">Back to dashboard</Link>
            </Button>
          </div>
        ) : (
          <MistakesDrill
            mcqs={mcqs.map((m) => ({
              id: m.id,
              promptNe: m.promptNe,
              hebrewText: m.hebrewText,
              explanationNe: m.explanationNe,
              lessonTitle: m.lesson.title,
              options: m.options.map((o) => ({
                id: o.id,
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            }))}
          />
        )}
      </main>
    </>
  );
}
