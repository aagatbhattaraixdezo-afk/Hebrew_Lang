import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { ChevronLeft, ChevronRight, Trash2, BookOpen, BookCheck, Layers } from "lucide-react";
import { CourseFormDialog } from "../course-form";
import { ModuleFormDialog } from "../../modules/module-form";
import { ModuleActions } from "./module-actions";
import { GenerateCodeButton } from "./generate-code-button";

export default async function AdminCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
          quizzes: { select: { id: true, title: true, status: true } },
          decks: { select: { id: true, title: true, status: true } },
        },
      },
      enrollmentCodes: {
        where: { redeemedBy: null },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: { select: { enrollments: true } },
    },
  });
  if (!course) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/courses">
          <ChevronLeft className="h-4 w-4" />
          All courses
        </Link>
      </Button>

      <header className="card overflow-hidden">
        <div
          className="px-6 py-7"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--accent) / 0.12))",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {course.level ?? "Course"} · {course.status}
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold">{course.title}</h1>
              {course.description && (
                <p className="mt-2 max-w-2xl text-sm text-ink/80">{course.description}</p>
              )}
            </div>
            <CourseFormDialog
              course={{
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                coverColor: course.coverColor,
                status: course.status,
              }}
              triggerLabel="Edit course"
            />
          </div>
          <p className="mt-4 text-sm text-muted">
            {course._count.enrollments} enrolled · {course.modules.length} modules
          </p>
        </div>
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Modules</h2>
          <ModuleFormDialog courseId={course.id} />
        </div>

        {course.modules.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            No modules yet — add your first module to start building lessons.
          </div>
        ) : (
          <div className="space-y-3">
            {course.modules.map((m, i) => (
              <div key={m.id} className="card overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-primary/10 font-display font-bold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-semibold text-ink truncate">
                      {m.title}
                    </p>
                    <p className="text-xs text-muted">
                      {m.lessons.length} lessons · {m.quizzes.length} quizzes ·{" "}
                      {m.decks.length} decks · {m.status}
                    </p>
                  </div>
                  <ModuleActions courseId={course.id} module={m} />
                </div>

                {/* Inner content: lessons + quiz + deck */}
                <div className="border-t border-border bg-bg/40 p-4 space-y-2">
                  {m.lessons.map((l) => (
                    <Link
                      key={l.id}
                      href={`/admin/lessons/${l.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-sm transition hover:bg-bg"
                    >
                      <BookOpen className="h-4 w-4 text-accent" />
                      <span className="flex-1 truncate font-medium">{l.title}</span>
                      <span className="text-xs text-muted">{l.status}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted" />
                    </Link>
                  ))}
                  {m.quizzes.map((q) => (
                    <Link
                      key={q.id}
                      href={`/admin/quizzes/${q.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-sm transition hover:bg-bg"
                    >
                      <BookCheck className="h-4 w-4 text-primary" />
                      <span className="flex-1 truncate font-medium">{q.title}</span>
                      <span className="text-xs text-muted">Quiz · {q.status}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted" />
                    </Link>
                  ))}
                  {m.decks.map((d) => (
                    <Link
                      key={d.id}
                      href={`/admin/decks/${d.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-sm transition hover:bg-bg"
                    >
                      <Layers className="h-4 w-4 text-accent" />
                      <span className="flex-1 truncate font-medium">{d.title}</span>
                      <span className="text-xs text-muted">Deck · {d.status}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted" />
                    </Link>
                  ))}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <ModuleQuickActions moduleId={m.id} hasQuiz={m.quizzes.length > 0} hasDeck={m.decks.length > 0} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Enrollment codes */}
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Enrollment codes</h2>
            <p className="text-sm text-muted">
              Generate a single-use code, share it, students self-sign up at{" "}
              <code className="rounded bg-bg px-1.5 py-0.5">/enroll/&lt;code&gt;</code>.
            </p>
          </div>
          <GenerateCodeButton courseId={course.id} />
        </div>
        {course.enrollmentCodes.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No active codes for this course yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {course.enrollmentCodes.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5">
                <code className="rounded-md bg-bg px-2.5 py-1.5 font-mono text-sm font-bold text-primary">
                  {c.code}
                </code>
                <span className="text-xs text-muted">
                  Created {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import { addLessonOrQuizOrDeck } from "./quick-add";

function ModuleQuickActions({
  moduleId,
  hasQuiz,
  hasDeck,
}: {
  moduleId: string;
  hasQuiz: boolean;
  hasDeck: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <form
        action={async () => {
          "use server";
          await addLessonOrQuizOrDeck(moduleId, "lesson");
        }}
      >
        <Button type="submit" variant="outline" size="sm">
          <BookOpen className="h-3.5 w-3.5" />
          Add lesson
        </Button>
      </form>
      {!hasQuiz && (
        <form
          action={async () => {
            "use server";
            await addLessonOrQuizOrDeck(moduleId, "quiz");
          }}
        >
          <Button type="submit" variant="outline" size="sm">
            <BookCheck className="h-3.5 w-3.5" />
            Add quiz
          </Button>
        </form>
      )}
      {!hasDeck && (
        <form
          action={async () => {
            "use server";
            await addLessonOrQuizOrDeck(moduleId, "deck");
          }}
        >
          <Button type="submit" variant="outline" size="sm">
            <Layers className="h-3.5 w-3.5" />
            Add flashcard deck
          </Button>
        </form>
      )}
    </div>
  );
}
