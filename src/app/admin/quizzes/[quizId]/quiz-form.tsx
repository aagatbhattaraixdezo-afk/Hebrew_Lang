"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { saveQuizMeta, deleteQuiz } from "../actions";

type Quiz = { id: string; title: string; status: "DRAFT" | "PUBLISHED" };

export function QuizForm({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await saveQuizMeta({
        id: quiz.id,
        title: String(fd.get("title") ?? ""),
        status: (fd.get("status") as "DRAFT" | "PUBLISHED") ?? "PUBLISHED",
      });
      if (!res.ok) {
        setError("Could not save.");
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Quiz details</h2>
        <ConfirmAction
          title={`Delete "${quiz.title}"?`}
          description="Deletes this quiz and all of its questions. This cannot be undone."
          confirmLabel="Delete quiz"
          trigger={
            <Button type="button" variant="ghost" size="sm" className="text-danger">
              <Trash2 className="h-4 w-4" />
              Delete quiz
            </Button>
          }
          onConfirm={async () => {
            await deleteQuiz(quiz.id);
          }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required defaultValue={quiz.title} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={quiz.status}
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="flex items-center justify-end gap-3">
        {savedAt && !pending && (
          <span className="inline-flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved
          </span>
        )}
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </form>
  );
}
