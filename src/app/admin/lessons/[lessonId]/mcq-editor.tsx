"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmAction } from "@/components/ui/confirm-action";
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
import { saveMcq, deleteMcq } from "../actions";

type Option = { id?: string; text: string; isCorrect: boolean };
type Mcq = {
  id: string;
  promptNe: string;
  hebrewText: string | null;
  explanationNe: string | null;
  options: { id: string; text: string; isCorrect: boolean }[];
};

export function McqEditor({
  lessonId,
  mcqs,
}: {
  lessonId: string;
  mcqs: Mcq[];
}) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Practice questions</h2>
          <p className="text-sm text-muted">
            Each MCQ has 2–6 options with exactly one marked correct.
          </p>
        </div>
        <McqDialog lessonId={lessonId} />
      </div>

      {mcqs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-bg/40 p-6 text-center text-sm text-muted">
          No questions yet — click “Add question”.
        </p>
      ) : (
        <ul className="space-y-3">
          {mcqs.map((m, i) => (
            <li key={m.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Question {i + 1}
                  </p>
                  {m.hebrewText && (
                    <p className="he mt-1 text-2xl font-bold text-ink">{m.hebrewText}</p>
                  )}
                  <p className="mt-1 font-semibold text-ink">{m.promptNe}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {m.options.map((o) => (
                      <li
                        key={o.id}
                        className={
                          o.isCorrect
                            ? "inline-flex w-fit items-center gap-1.5 rounded-md bg-success/10 px-2 py-0.5 text-success font-medium mr-1.5"
                            : "inline-flex w-fit items-center gap-1.5 rounded-md bg-bg px-2 py-0.5 text-ink/80 mr-1.5"
                        }
                      >
                        {o.isCorrect && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {o.text}
                      </li>
                    ))}
                  </ul>
                  {m.explanationNe && (
                    <p className="mt-2 text-xs italic text-muted">
                      “{m.explanationNe}”
                    </p>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <McqDialog lessonId={lessonId} mcq={m} />
                  <DeleteMcqButton mcqId={m.id} promptNe={m.promptNe} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DeleteMcqButton({ mcqId, promptNe }: { mcqId: string; promptNe: string }) {
  const router = useRouter();
  return (
    <ConfirmAction
      title="Delete this question?"
      description={`“${promptNe}” — this cannot be undone.`}
      confirmLabel="Delete"
      trigger={
        <Button variant="ghost" size="icon" aria-label="Delete">
          <Trash2 className="h-4 w-4 text-danger" />
        </Button>
      }
      onConfirm={async () => {
        await deleteMcq(mcqId);
        router.refresh();
      }}
    />
  );
}

function McqDialog({ lessonId, mcq }: { lessonId: string; mcq?: Mcq }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<Option[]>(
    mcq
      ? mcq.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect }))
      : [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ]
  );

  function setOption(i: number, patch: Partial<Option>) {
    setOptions((prev) => prev.map((o, k) => (k === i ? { ...o, ...patch } : o)));
  }

  function setCorrect(i: number) {
    setOptions((prev) => prev.map((o, k) => ({ ...o, isCorrect: k === i })));
  }

  function addOption() {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, { text: "", isCorrect: false }]);
  }

  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions((prev) => {
      const next = prev.filter((_, k) => k !== i);
      if (!next.some((o) => o.isCorrect)) next[0].isCorrect = true;
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    if (options.filter((o) => o.isCorrect).length !== 1) {
      setError("Mark exactly one option as correct.");
      return;
    }
    if (options.some((o) => !o.text.trim())) {
      setError("All option texts must be filled in.");
      return;
    }
    startTransition(async () => {
      const res = await saveMcq({
        id: mcq?.id,
        lessonId,
        promptNe: String(fd.get("promptNe") ?? ""),
        hebrewText: String(fd.get("hebrewText") ?? ""),
        explanationNe: String(fd.get("explanationNe") ?? ""),
        options,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mcq ? (
          <Button variant="ghost" size="icon" aria-label="Edit question">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add question
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mcq ? "Edit question" : "New question"}</DialogTitle>
          <DialogDescription>
            Mark exactly one option as correct. Hebrew text and explanation are optional but
            recommended.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="promptNe">Question</Label>
            <Textarea
              id="promptNe"
              name="promptNe"
              required
              defaultValue={mcq?.promptNe ?? ""}
              rows={2}
              className="mt-1.5"
              placeholder={`What does "shalom" mean?`}
            />
          </div>
          <div>
            <Label htmlFor="hebrewText">Hebrew text (shown big, RTL)</Label>
            <Input
              id="hebrewText"
              name="hebrewText"
              defaultValue={mcq?.hebrewText ?? ""}
              className="he mt-1.5 text-lg"
              placeholder="שלום"
              dir="rtl"
            />
          </div>

          <div>
            <Label>Options</Label>
            <div className="mt-1.5 space-y-2">
              {options.map((o, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1.5"
                >
                  <button
                    type="button"
                    onClick={() => setCorrect(i)}
                    className={
                      "grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border-2 transition " +
                      (o.isCorrect
                        ? "border-success bg-success text-white"
                        : "border-border bg-bg")
                    }
                    aria-label={o.isCorrect ? "Correct" : "Mark as correct"}
                  >
                    {o.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : null}
                  </button>
                  <Input
                    value={o.text}
                    onChange={(e) => setOption(i, { text: e.target.value })}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="border-0 bg-transparent focus:ring-0"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(i)}
                      aria-label="Remove option"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addOption}
                  className="text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add option
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="explanationNe">Explanation</Label>
            <Textarea
              id="explanationNe"
              name="explanationNe"
              defaultValue={mcq?.explanationNe ?? ""}
              rows={2}
              className="mt-1.5"
              placeholder="Shown to the learner after they answer."
            />
          </div>

          {error && (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mcq ? "Save changes" : "Add question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
