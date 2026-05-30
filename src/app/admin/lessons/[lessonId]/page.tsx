import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { LessonForm } from "./lesson-form";
import { McqEditor } from "./mcq-editor";

export default async function AdminLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { include: { course: { select: { id: true, title: true } } } },
      mcqs: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { id: "asc" } } },
      },
    },
  });
  if (!lesson) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/admin/courses/${lesson.module.course.id}`}>
          <ChevronLeft className="h-4 w-4" />
          {lesson.module.course.title}
        </Link>
      </Button>

      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {lesson.module.title} · Lesson editor
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">{lesson.title}</h1>
      </header>

      <LessonForm
        lesson={{
          id: lesson.id,
          title: lesson.title,
          bodyEn: lesson.bodyEn,
          videoUrl: lesson.videoUrl,
          status: lesson.status,
        }}
      />

      <McqEditor
        lessonId={lesson.id}
        mcqs={lesson.mcqs.map((m) => ({
          id: m.id,
          promptNe: m.promptNe,
          hebrewText: m.hebrewText,
          explanationNe: m.explanationNe,
          options: m.options.map((o) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        }))}
      />
    </div>
  );
}
