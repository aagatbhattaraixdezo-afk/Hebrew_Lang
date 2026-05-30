import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ChevronRight } from "lucide-react";
import { CourseFormDialog } from "./course-form";
import { CourseActionsRow } from "./course-actions-row";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { modules: true, enrollments: true } } },
  });

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Courses</h1>
          <p className="text-sm text-muted">Create, edit, reorder and publish your catalogue.</p>
        </div>
        <CourseFormDialog />
      </header>

      {courses.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-muted">No courses yet. Use “New course” to create one.</p>
        </div>
      ) : (
        <div className="card divide-y divide-border">
          {courses.map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-4">
              <span
                className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl font-display text-lg font-bold"
                style={{
                  background: c.coverColor ? `${c.coverColor}22` : "hsl(var(--accent) / 0.18)",
                  color: c.coverColor ?? "hsl(var(--accent))",
                }}
                aria-hidden
              >
                ש
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/courses/${c.id}`}
                  className="font-display text-lg font-semibold hover:underline truncate block"
                >
                  {c.title}
                </Link>
                <p className="text-xs text-muted">
                  {c._count.modules} modules · {c._count.enrollments} enrolled ·{" "}
                  <span className={c.status === "DRAFT" ? "text-accent font-semibold" : ""}>
                    {c.status}
                  </span>
                  {c.level && <> · {c.level}</>}
                </p>
              </div>
              <Link
                href={`/admin/courses/${c.id}`}
                className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary"
              >
                Manage
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <CourseActionsRow
                course={{
                  id: c.id,
                  title: c.title,
                  description: c.description,
                  level: c.level,
                  coverColor: c.coverColor,
                  status: c.status,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
