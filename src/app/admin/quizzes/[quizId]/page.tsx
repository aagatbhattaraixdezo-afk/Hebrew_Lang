import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { QuizForm } from "./quiz-form";
import { QuizQuestionsEditor } from "./questions-editor";

export default async function AdminQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      module: { include: { course: { select: { id: true, title: true } } } },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { id: "asc" } } },
      },
    },
  });
  if (!quiz) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/admin/courses/${quiz.module.course.id}`}>
          <ChevronLeft className="h-4 w-4" />
          {quiz.module.course.title}
        </Link>
      </Button>

      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {quiz.module.title} · Quiz editor
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">{quiz.title}</h1>
      </header>

      <QuizForm quiz={{ id: quiz.id, title: quiz.title, status: quiz.status }} />

      <QuizQuestionsEditor
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
    </div>
  );
}
