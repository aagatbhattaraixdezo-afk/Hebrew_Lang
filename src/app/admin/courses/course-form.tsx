"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { saveCourse } from "./actions";

type Course = {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  coverColor: string | null;
  status: "DRAFT" | "PUBLISHED";
};

export function CourseFormDialog({
  course,
  triggerLabel,
}: {
  course?: Course;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!course;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await saveCourse({
        id: course?.id,
        title: String(fd.get("title") ?? ""),
        description: String(fd.get("description") ?? ""),
        level: String(fd.get("level") ?? ""),
        coverColor: String(fd.get("coverColor") ?? ""),
        status: (fd.get("status") as "DRAFT" | "PUBLISHED") ?? "PUBLISHED",
      });
      if (!res.ok) {
        setError("Could not save. Check your inputs and try again.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
            {triggerLabel ?? "Edit"}
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            {triggerLabel ?? "New course"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit course" : "New course"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the course details below."
              : "Define a new course that students will be able to enrol in."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={course?.title ?? ""}
              placeholder="Survival Hebrew (A1)"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={course?.description ?? ""}
              placeholder="What students will learn"
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                name="level"
                defaultValue={course?.level ?? ""}
                placeholder="A1 / Survival"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="coverColor">Cover color</Label>
              <Input
                id="coverColor"
                name="coverColor"
                defaultValue={course?.coverColor ?? ""}
                placeholder="#3F7D6E"
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={course?.status ?? "PUBLISHED"}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>

          {error && (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
