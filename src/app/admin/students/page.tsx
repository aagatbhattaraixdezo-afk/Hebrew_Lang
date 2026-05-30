import { prisma } from "@/lib/prisma";
import { StudentFormDialog } from "./student-form";
import { BulkAddDialog } from "./bulk-add";
import { StudentRow } from "./student-row";

export default async function AdminStudentsPage() {
  const [students, courses] = await Promise.all([
    prisma.user.findMany({
      where: { role: "LEARNER" },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { progress: true } },
        enrollments: { select: { courseId: true } },
      },
    }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Students</h1>
          <p className="text-sm text-muted">{students.length} total learners.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BulkAddDialog courses={courses} />
          <StudentFormDialog />
        </div>
      </header>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">XP</th>
              <th className="px-4 py-3">Streak</th>
              <th className="px-4 py-3">Lessons</th>
              <th className="px-4 py-3">Enrolled in</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No students yet. Use “New student” or bulk add to create accounts.
                </td>
              </tr>
            )}
            {students.map((s) => (
              <StudentRow
                key={s.id}
                student={{
                  id: s.id,
                  name: s.name,
                  email: s.email,
                  xp: s.xp,
                  streakCount: s.streakCount,
                  lessonsDone: s._count.progress,
                  enrolledCourseIds: s.enrollments.map((e) => e.courseId),
                }}
                courses={courses}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
