import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/top-nav";
import { XpRing, StreakBadge } from "@/components/streak-xp";
import { Progress } from "@/components/ui/progress";
import { computeBadges } from "@/lib/badges";
import { cn } from "@/lib/utils";

export const metadata = { title: "Profile — Shalom" };

export default async function ProfilePage() {
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
                where: { status: "PUBLISHED" },
                include: { lessons: { where: { status: "PUBLISHED" }, select: { id: true } } },
              },
            },
          },
        },
      },
      progress: { where: { completed: true }, select: { lessonId: true } },
    },
  });
  if (!user) redirect("/api/auth/signout?callbackUrl=/login");

  const completedLessonIds = new Set(user.progress.map((p) => p.lessonId));

  const enrolled = user.enrollments.map((e) => {
    const lessons = e.course.modules.flatMap((m) => m.lessons);
    const done = lessons.filter((l) => completedLessonIds.has(l.id)).length;
    const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
    return { course: e.course, done, total: lessons.length, pct };
  });

  const coursesCompleted = enrolled.filter((e) => e.pct === 100).length;

  const correctMcqs = await prisma.mcqAttempt.count({
    where: { userId: user.id, correct: true },
  });

  // "Fixed mistake" = a question previously answered wrong, later answered correctly.
  const wrongMcqIds = await prisma.mcqAttempt.findMany({
    where: { userId: user.id, correct: false },
    select: { mcqId: true },
    distinct: ["mcqId"],
  });
  let fixedMistakes = 0;
  for (const { mcqId } of wrongMcqIds) {
    const later = await prisma.mcqAttempt.findFirst({
      where: { userId: user.id, mcqId, correct: true },
      orderBy: { createdAt: "desc" },
    });
    if (later) fixedMistakes++;
  }

  const badges = computeBadges({
    xp: user.xp,
    streakCount: user.streakCount,
    lessonsCompleted: completedLessonIds.size,
    coursesCompleted,
    correctMcqs,
    fixedMistakes,
  });

  const earnedCount = badges.filter((b) => b.earned).length;
  const level = Math.floor(user.xp / 100) + 1;

  return (
    <>
      <TopNav />
      <main className="container-wide py-8 sm:py-10">
        {/* Hero */}
        <section className="card mb-8 overflow-hidden">
          <div
            className="flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:px-8 sm:py-10"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary) / 0.16), hsl(var(--accent) / 0.18))",
            }}
          >
            <div
              className="grid h-20 w-20 flex-shrink-0 place-items-center rounded-2xl bg-surface font-display text-3xl font-bold text-primary shadow-soft"
              aria-hidden
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Profile
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
                {user.name}
              </h1>
              <p className="text-sm text-muted">{user.email}</p>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <XpRing xp={user.xp} />
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                  Streak
                </p>
                <div className="mt-2">
                  <StreakBadge count={user.streakCount} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats row */}
        <section className="mb-10 grid gap-4 sm:grid-cols-4">
          <StatCard label="Total XP" value={user.xp} suffix="XP" />
          <StatCard label="Level" value={level} suffix="" />
          <StatCard
            label="Lessons done"
            value={completedLessonIds.size}
            suffix=""
          />
          <StatCard label="Badges" value={earnedCount} suffix={`/ ${badges.length}`} />
        </section>

        {/* Badges */}
        <section className="mb-10">
          <h2 className="mb-4 font-display text-2xl font-bold">Achievements</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((b) => {
              const Icon = b.icon;
              const pct = b.progress
                ? Math.round((b.progress.current / b.progress.goal) * 100)
                : 0;
              return (
                <div
                  key={b.id}
                  className={cn(
                    "card relative overflow-hidden p-4 transition",
                    b.earned ? "shadow-soft" : "opacity-65"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl",
                        b.earned ? "bg-accent/15" : "bg-bg",
                        b.color
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-ink">{b.name}</p>
                      <p className="text-xs text-muted">{b.description}</p>
                    </div>
                    {b.earned && (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-success">
                        Earned
                      </span>
                    )}
                  </div>
                  {!b.earned && b.progress && (
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-xs text-muted">
                        <span>
                          {b.progress.current} / {b.progress.goal}
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Enrolled courses */}
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold">Course progress</h2>
          <div className="card divide-y divide-border">
            {enrolled.length === 0 && (
              <p className="p-6 text-center text-sm text-muted">
                You aren&apos;t enrolled in any courses yet.
              </p>
            )}
            {enrolled.map(({ course, done, total, pct }) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="flex items-center justify-between gap-4 p-4 transition hover:bg-bg/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold text-ink truncate">
                    {course.title}
                  </p>
                  <p className="text-xs text-muted">
                    {done}/{total} lessons · {course.level ?? "Course"}
                  </p>
                  <div className="mt-2 max-w-sm">
                    <Progress value={pct} />
                  </div>
                </div>
                <span className="font-display text-xl font-bold text-primary">
                  {pct}%
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-bold">
        {value}
        {suffix && <span className="ml-1 text-base font-medium text-muted">{suffix}</span>}
      </p>
    </div>
  );
}
