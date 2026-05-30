import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LearnerTopbar from "@/components/LearnerTopbar";
import DashboardGreeting from "./components/DashboardGreeting";
import DashboardStatsRow from "./components/DashboardStatsRow";
import DashboardReviewCards from "./components/DashboardReviewCards";
import DashboardHeroCard from "./components/DashboardHeroCard";
import DashboardAlphabetCard from "./components/DashboardAlphabetCard";
import DashboardScenariosCard from "./components/DashboardScenariosCard";
import DashboardCoursesGrid from "./components/DashboardCoursesGrid";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      enrollments: {
        include: {
          course: {
            include: {
              modules: {
                orderBy: { order: "asc" },
                include: {
                  lessons: {
                    orderBy: { order: "asc" },
                    select: { id: true, title: true },
                  },
                },
              },
            },
          },
        },
      },
      progress: { select: { lessonId: true, completed: true } },
    },
  });

  if (!user) {
    redirect("/api/auth/signout?callbackUrl=/login");
  }

  const completedSet = new Set(
    user.progress.filter((p) => p.completed).map((p) => p.lessonId)
  );

  const enrolled = user.enrollments.map((e) => {
    const lessons = e.course.modules.flatMap((m) => m.lessons);
    const done = lessons.filter((l) => completedSet.has(l.id)).length;
    const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
    return { course: e.course, lessons, done, pct };
  });

  const continueCourse = enrolled.find((e) => e.pct < 100) ?? enrolled[0];
  const nextLesson = continueCourse?.lessons.find((l) => !completedSet.has(l.id))
    ?? continueCourse?.lessons[0];

  // Daily review queue
  const dueCards = await prisma.cardState.count({
    where: { userId: user.id, dueOn: { lte: new Date() } },
  });
  
  const enrolledCourseIds = user.enrollments.map((e) => e.courseId);
  const untouchedCards = enrolledCourseIds.length
    ? await prisma.flashcard.count({
        where: {
          deck: {
            module: { courseId: { in: enrolledCourseIds }, status: "PUBLISHED" },
            status: "PUBLISHED",
          },
          cardStates: { none: { userId: user.id } },
        },
      })
    : 0;
  const totalDue = dueCards + untouchedCards;

  // Mistakes queue (count of distinct unresolved wrong answers in last 30 days)
  const wrongAttempts = await prisma.mcqAttempt.findMany({
    where: {
      userId: user.id,
      correct: false,
      createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
    },
    select: { mcqId: true },
    distinct: ["mcqId"],
  });
  let openMistakes = 0;
  for (const { mcqId } of wrongAttempts) {
    const lastWrong = await prisma.mcqAttempt.findFirst({
      where: { userId: user.id, mcqId, correct: false },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (!lastWrong) continue;
    const lastCorrect = await prisma.mcqAttempt.findFirst({
      where: { userId: user.id, mcqId, correct: true, createdAt: { gt: lastWrong.createdAt } },
      select: { id: true },
    });
    if (!lastCorrect) openMistakes++;
  }

  // First deck with due cards, for the "Review now" CTA
  const firstDueDeck = await prisma.flashcardDeck.findFirst({
    where: {
      status: "PUBLISHED",
      module: { courseId: { in: enrolledCourseIds }, status: "PUBLISHED" },
    },
    orderBy: { id: "asc" },
    select: { id: true },
  });

  const scenarioCount = await prisma.scenario.count({
    where: { tenantId: user.tenantId, status: "PUBLISHED" },
  });

  return (
    <div className="min-h-screen bg-paper">
      <LearnerTopbar userName={user.name} isAdmin={user.role === "ADMIN"} />
      <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-8 flex flex-col gap-8">
        <DashboardGreeting name={user.name} />
        
        <DashboardStatsRow 
          xp={user.xp} 
          level={Math.floor(user.xp / 100) + 1} 
          streak={user.streakCount} 
          xpForNextLevel={100} 
        />
        
        <DashboardReviewCards 
          cardsDue={totalDue} 
          mistakesCount={openMistakes} 
          firstDueDeckId={firstDueDeck?.id ?? null}
        />
        
        {continueCourse && nextLesson && (
          <DashboardHeroCard
            courseTitle={continueCourse.course.title}
            nextLesson={nextLesson.title}
            nextLessonId={nextLesson.id}
            lessonsCompleted={continueCourse.done}
            totalLessons={continueCourse.lessons.length}
            courseId={continueCourse.course.id}
          />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardAlphabetCard />
          <DashboardScenariosCard scenarioCount={scenarioCount} />
        </div>
        
        <DashboardCoursesGrid courses={enrolled} />
      </main>
    </div>
  );
}
