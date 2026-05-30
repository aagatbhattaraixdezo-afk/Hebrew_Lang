import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LearnerTopbar from "@/components/LearnerTopbar";
import CourseDetailClient from "./course-detail-client";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const course = await prisma.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
    include: {
      modules: {
        where: { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { order: "asc" },
            select: { id: true, title: true, order: true },
          },
          decks: { 
            where: { status: "PUBLISHED" },
            select: { 
              id: true, 
              title: true,
              _count: { select: { cards: true } },
            },
          },
          quizzes: { 
            where: { status: "PUBLISHED" },
            select: { id: true, title: true },
          },
        },
      },
      enrollmentCodes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!course) notFound();

  // Load lesson completions
  const progressList = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id, completed: true },
    select: { lessonId: true },
  });
  const completedSet = new Set(progressList.map((p) => p.lessonId));

  // Load quiz attempts
  const quizAttemptsList = await prisma.quizAttempt.findMany({
    where: { userId: session.user.id },
    select: { quizId: true, score: true },
  });
  // Map to highest score per quiz
  const quizScores = new Map<string, number>();
  for (const attempt of quizAttemptsList) {
    const currentMax = quizScores.get(attempt.quizId) ?? -1;
    if (attempt.score > currentMax) {
      quizScores.set(attempt.quizId, attempt.score);
    }
  }

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const lessonsCompleted = allLessons.filter((l) => completedSet.has(l.id)).length;

  // Compute unlock rules: lessons are unlocked if previous lessons are complete
  let firstIncomplete: string | null = null;
  for (const m of course.modules) {
    for (const l of m.lessons) {
      if (!completedSet.has(l.id)) {
        firstIncomplete = l.id;
        break;
      }
    }
    if (firstIncomplete) break;
  }

  const unlockedSet = new Set<string>();
  let stopAfter = false;
  for (const m of course.modules) {
    for (const l of m.lessons) {
      unlockedSet.add(l.id);
      if (l.id === firstIncomplete) {
        stopAfter = true;
        break;
      }
    }
    if (stopAfter) break;
  }

  // Map module items to client model
  const modulesMapped = course.modules.map((m) => {
    // A module's quiz/deck is available if at least one lesson in the module is unlocked,
    // or if the module has no lessons.
    const isModuleUnlocked = m.lessons.length === 0 || m.lessons.some((l) => unlockedSet.has(l.id) || completedSet.has(l.id));

    return {
      id: m.id,
      title: m.title,
      description: m.description,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        status: completedSet.has(l.id)
          ? ("completed" as const)
          : unlockedSet.has(l.id)
          ? ("available" as const)
          : ("locked" as const),
      })),
      quizzes: m.quizzes.map((q) => {
        const score = quizScores.get(q.id) ?? null;
        return {
          id: q.id,
          title: q.title,
          status: score !== null
            ? ("completed" as const)
            : isModuleUnlocked
            ? ("available" as const)
            : ("locked" as const),
          score,
        };
      }),
      decks: m.decks.map((d) => ({
        id: d.id,
        title: d.title,
        status: isModuleUnlocked ? ("available" as const) : ("locked" as const),
        cardCount: d._count.cards,
      })),
    };
  });

  return (
    <div className="min-h-screen bg-paper">
      <LearnerTopbar userName={session.user.name || undefined} isAdmin={session.user.role === "ADMIN"} />
      <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-8">
        <CourseDetailClient
          course={{
            id: course.id,
            title: course.title,
            description: course.description,
            level: course.level,
            lessonsCompleted,
            totalLessons: allLessons.length,
            modules: modulesMapped,
          }}
          enrollmentCodes={course.enrollmentCodes.map((c) => ({
            id: c.id,
            code: c.code,
            createdAt: c.createdAt.toISOString(),
            redeemedBy: c.redeemedBy,
          }))}
          isAdmin={session.user.role === "ADMIN"}
        />
      </main>
    </div>
  );
}
