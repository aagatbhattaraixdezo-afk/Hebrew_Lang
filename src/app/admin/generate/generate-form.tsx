"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wand2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const SAMPLE_TEXT = `Today we'll cover essential Hebrew greetings.

The most important Hebrew word is שלום (shalom) — it means "hello", "goodbye", and "peace".

Other essential greetings:
- תודה (toda) — thank you
- בוקר טוב (boker tov) — good morning
- לילה טוב (laila tov) — good night
- בבקשה (bevakasha) — please / you're welcome
- סליחה (slicha) — excuse me / sorry
- כן (ken) — yes
- לא (lo) — no

Practise saying each one out loud. Notice that Hebrew reads right to left.`;

type Course = { id: string; title: string };

export function GenerateForm({
  courses,
  apiKeyConfigured,
}: {
  courses: Course[];
  apiKeyConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    courseId: string;
    moduleId: string;
    stats: { mcqs: number; quizQuestions: number; flashcards: number };
  } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setSuccess(null);

    const body = {
      courseId: String(fd.get("courseId") ?? ""),
      moduleTitle: String(fd.get("moduleTitle") ?? ""),
      sourceText: String(fd.get("sourceText") ?? ""),
      videoUrl: String(fd.get("videoUrl") ?? ""),
      mcqCount: parseInt(String(fd.get("mcqCount") ?? "5"), 10),
      quizQuestionCount: parseInt(String(fd.get("quizQuestionCount") ?? "5"), 10),
      flashcardCount: parseInt(String(fd.get("flashcardCount") ?? "10"), 10),
      level: String(fd.get("level") ?? "A1") as "A1" | "A2",
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.ok) {
          setError(data.error ?? "Generation failed.");
          return;
        }
        setSuccess({ courseId: data.courseId, moduleId: data.moduleId, stats: data.stats });
        // Refresh /admin/courses so the new draft is visible if user navigates there.
        router.refresh();
      } catch (e) {
        setError("Network error — could not reach /api/ai/generate.");
      }
    });
  }

  if (courses.length === 0) {
    return (
      <div className="card p-6 text-center text-muted">
        Create a course first under <strong>Admin → Courses</strong> — the generator drops
        the drafted module into a course.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-5 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="courseId">Course</Label>
          <select
            id="courseId"
            name="courseId"
            required
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="moduleTitle">Module title</Label>
          <Input
            id="moduleTitle"
            name="moduleTitle"
            required
            defaultValue="Greetings & Basics"
            placeholder="Greetings & Basics"
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="sourceText">Source text (transcript / notes / vocab list)</Label>
          <button
            type="button"
            className="text-xs font-semibold text-primary hover:underline"
            onClick={(e) => {
              const ta = (e.currentTarget.closest("form") as HTMLFormElement).elements.namedItem(
                "sourceText"
              ) as HTMLTextAreaElement;
              if (ta) ta.value = SAMPLE_TEXT;
            }}
          >
            Use sample text
          </button>
        </div>
        <Textarea
          id="sourceText"
          name="sourceText"
          required
          minLength={50}
          rows={12}
          className="mt-1.5 font-mono text-[0.85rem]"
          placeholder="Paste a transcript, teaching notes, or a topic + vocabulary list (Hebrew words can be inline). The AI derives every question and flashcard from this text."
        />
        <p className="mt-1.5 text-xs text-muted">
          At least 50 characters. Hebrew words can appear inline in Hebrew script.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="mcqCount">MCQs</Label>
          <Input
            id="mcqCount"
            name="mcqCount"
            type="number"
            min={1}
            max={15}
            defaultValue={5}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="quizQuestionCount">Quiz Qs</Label>
          <Input
            id="quizQuestionCount"
            name="quizQuestionCount"
            type="number"
            min={1}
            max={15}
            defaultValue={5}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="flashcardCount">Flashcards</Label>
          <Input
            id="flashcardCount"
            name="flashcardCount"
            type="number"
            min={1}
            max={30}
            defaultValue={10}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="level">Level</Label>
          <select
            id="level"
            name="level"
            defaultValue="A1"
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          >
            <option value="A1">A1 — Survival</option>
            <option value="A2">A2 — Elementary</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="videoUrl">Optional video URL</Label>
        <Input
          id="videoUrl"
          name="videoUrl"
          type="url"
          placeholder="https://…"
          className="mt-1.5"
        />
        <p className="mt-1.5 text-xs text-muted">
          The video isn&apos;t transcribed — paste the transcript into the source text above.
          The URL is just stored on the drafted lesson for the learner to click.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-semibold">
                Draft module created — {success.stats.mcqs} MCQs,{" "}
                {success.stats.quizQuestions} quiz questions, {success.stats.flashcards}{" "}
                flashcards.
              </p>
              <p className="mt-1.5 text-xs">
                Review the draft before publishing.{" "}
                <a
                  href={`/admin/courses/${success.courseId}`}
                  className="font-semibold underline"
                >
                  Open the course →
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted">
          Saved as DRAFT — nothing goes live until you publish it.
        </p>
        <Button type="submit" size="lg" disabled={pending || !apiKeyConfigured}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          {pending ? "Generating…" : "Generate module"}
        </Button>
      </div>
    </form>
  );
}
