import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy } from "lucide-react";
import { QuizRunner } from "./quiz-runner";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId, status: "PUBLISHED" },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: true },
      },
      module: { include: { course: { select: { id: true, title: true } } } },
    },
  });
  if (!quiz) notFound();

  const best = await prisma.quizAttempt.findFirst({
    where: { userId: session.user.id, quizId: quiz.id },
    orderBy: { score: "desc" },
    select: { score: true, xpEarned: true },
  });

  return (
    <>
      <TopNav />
      <main className="container-tight py-6 sm:py-10">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href={`/courses/${quiz.module.course.id}`}>
            <ChevronLeft className="h-4 w-4" />
            {quiz.module.course.title}
          </Link>
        </Button>

        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Quiz · {quiz.module.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {quiz.title}
            </h1>
            {best && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-sm font-semibold text-accent">
                <Trophy className="h-4 w-4" />
                Best {best.score}%
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted">
            {quiz.questions.length} questions · instant feedback · retry any time
          </p>
        </header>

        <QuizRunner
          quizId={quiz.id}
          questions={quiz.questions.map((q) => ({
            id: q.id,
            promptNe: q.promptNe,
            hebrewText: q.hebrewText,
            explanationNe: q.explanationNe,
            options: q.options.map((o) => ({
              id: o.id,
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          }))}
        />
      </main>
    </>
  );
}
