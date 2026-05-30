"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, GraduationCap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { StudentFormDialog } from "./student-form";
import { deleteStudent, setEnrollment } from "./actions";
import { cn } from "@/lib/utils";

type Student = {
  id: string;
  name: string;
  email: string;
  xp: number;
  streakCount: number;
  lessonsDone: number;
  enrolledCourseIds: string[];
};

export function StudentRow({
  student,
  courses,
}: {
  student: Student;
  courses: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [enrolled, setEnrolled] = useState<string[]>(student.enrolledCourseIds);

  function toggleEnroll(courseId: string) {
    const isCurrentlyEnrolled = enrolled.includes(courseId);
    setEnrolled((prev) =>
      isCurrentlyEnrolled ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
    startTransition(async () => {
      await setEnrollment(student.id, courseId, !isCurrentlyEnrolled);
      router.refresh();
    });
  }

  return (
    <>
      <tr>
        <td className="px-4 py-3 font-semibold">{student.name}</td>
        <td className="px-4 py-3 text-muted">{student.email}</td>
        <td className="px-4 py-3 font-semibold text-accent">{student.xp}</td>
        <td className="px-4 py-3">{student.streakCount}</td>
        <td className="px-4 py-3">{student.lessonsDone}</td>
        <td className="px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((e) => !e)}
            className="-ml-2"
          >
            <GraduationCap className="h-4 w-4" />
            {enrolled.length} {enrolled.length === 1 ? "course" : "courses"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition", expanded && "rotate-180")} />
          </Button>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="inline-flex items-center gap-1">
            <StudentFormDialog
              student={{ id: student.id, name: student.name, email: student.email }}
            />
            <ConfirmAction
              title={`Delete ${student.name}?`}
              description="Permanently removes this student's account and all their progress, attempts, and card states. This cannot be undone."
              confirmLabel="Delete student"
              trigger={
                <Button variant="ghost" size="icon" aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              }
              onConfirm={async () => {
                await deleteStudent(student.id);
                router.refresh();
              }}
            />
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-bg/40 px-4 py-3">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted">Enrolments</p>
            <div className="flex flex-wrap gap-2">
              {courses.map((c) => {
                const isEnrolled = enrolled.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleEnroll(c.id)}
                    disabled={pending}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      isEnrolled
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-surface text-muted hover:bg-bg"
                    )}
                  >
                    {isEnrolled ? "✓ " : "+ "}
                    {c.title}
                  </button>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
