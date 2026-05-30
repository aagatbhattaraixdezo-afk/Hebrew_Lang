"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { CourseFormDialog } from "./course-form";
import { deleteCourse, moveCourse } from "./actions";

type Course = {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  coverColor: string | null;
  status: "DRAFT" | "PUBLISHED";
};

export function CourseActionsRow({ course }: { course: Course }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await moveCourse(course.id, direction);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => move("up")}
        disabled={pending}
        aria-label="Move up"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => move("down")}
        disabled={pending}
        aria-label="Move down"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
      <CourseFormDialog course={course} />
      <ConfirmAction
        title={`Delete "${course.title}"?`}
        description="This permanently removes the course and every module, lesson, MCQ, quiz, deck and enrollment under it. This cannot be undone."
        confirmLabel="Delete course"
        trigger={
          <Button variant="ghost" size="icon" aria-label="Delete">
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        }
        onConfirm={async () => {
          await deleteCourse(course.id);
          router.refresh();
        }}
      />
    </div>
  );
}
