import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LearnerTopbar from "@/components/LearnerTopbar";
import { LessonRunner } from "./lesson-runner";

export const metadata = {
  title: "Lesson Player — Shalom",
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId, status: "PUBLISHED" },
    include: {
      mcqs: {
        orderBy: { order: "asc" },
        include: { options: true },
      },
      module: {
        include: { course: { select: { id: true, title: true } } },
      },
    },
  });
  if (!lesson) notFound();

  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId: lesson.id } },
  });

  return (
    <div className="min-h-screen bg-paper">
      <LearnerTopbar userName={session.user.name || undefined} isAdmin={session.user.role === "ADMIN"} />
      <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-8">
        <LessonRunner
          lesson={{
            id: lesson.id,
            title: lesson.title,
            bodyEn: lesson.bodyEn,
            bodyNe: lesson.bodyNe,
            videoUrl: lesson.videoUrl,
            moduleTitle: lesson.module.title,
            mcqs: lesson.mcqs.map((m) => ({
              id: m.id,
              promptNe: m.promptNe,
              hebrewText: m.hebrewText,
              explanationNe: m.explanationNe,
              options: m.options.map((o) => ({
                id: o.id,
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            })),
          }}
          previouslyCompleted={!!existing?.completed}
        />
      </main>
    </div>
  );
}
