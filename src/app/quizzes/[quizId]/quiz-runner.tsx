"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Trophy, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SpeakButton } from "@/components/speak-button";
import { cn } from "@/lib/utils";
import { submitQuizAttempt } from "./actions";

type Opt = { id: string; text: string; isCorrect: boolean };
type Question = {
  id: string;
  promptNe: string;
  hebrewText: string | null;
  explanationNe: string | null;
  options: Opt[];
};

export function QuizRunner({
  quizId,
  questions,
}: {
  quizId: string;
  questions: Question[];
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [firstTry, setFirstTry] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ score: number; xpEarned: number } | null>(null);

  const total = questions.length;
  const current = questions[idx];
  const correctOptId = current?.options.find((o) => o.isCorrect)?.id;
  const chosenOpt = current?.options.find((o) => o.id === chosen);
  const isCorrect = revealed && chosenOpt?.isCorrect;

  // Once the last question is submitted, `current` may briefly be undefined while
  // the server action resolves. Don't crash — wait for setDone(true) to flip the view.
  if (!current && !done) return <div className="card p-8 text-center text-muted">Scoring…</div>;

  function pick(opt: Opt) {
    if (revealed) return;
    setChosen(opt.id);
  }

  function check() {
    if (!chosen || !current) return;
    setRevealed(true);
    const opt = current.options.find((o) => o.id === chosen);
    setFirstTry((prev) => [...prev, !!opt?.isCorrect]);
  }

  function next() {
    if (idx + 1 >= total) {
      const correctCount = [...firstTry].filter(Boolean).length;
      const score = total ? Math.round((correctCount / total) * 100) : 0;
      const xpEarned = Math.round(score * 0.4); // up to 40 XP per quiz
      startTransition(async () => {
        const res = await submitQuizAttempt({ quizId, score, xpEarned });
        if (res.ok) {
          setResult({ score: res.score, xpEarned: res.xpEarned });
          setDone(true);
          router.refresh();
        }
      });
      return;
    }
    setIdx((i) => i + 1);
    setChosen(null);
    setRevealed(false);
  }

  function retry() {
    setIdx(0);
    setChosen(null);
    setRevealed(false);
    setFirstTry([]);
    setDone(false);
    setResult(null);
  }

  if (done && result) {
    const passed = result.score >= 70;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="card overflow-hidden text-center"
      >
        <div
          className="px-6 py-10 sm:py-14"
          style={{
            background:
              passed
                ? "linear-gradient(135deg, hsl(var(--accent) / 0.25), hsl(var(--primary) / 0.15))"
                : "linear-gradient(135deg, hsl(var(--danger) / 0.15), hsl(var(--bg)))",
          }}
        >
          <div
            className={cn(
              "mx-auto grid h-20 w-20 place-items-center rounded-full shadow-lift",
              passed
                ? "bg-accent text-accent-foreground"
                : "bg-danger text-white"
            )}
          >
            {passed ? <Trophy className="h-9 w-9" /> : <RotateCcw className="h-9 w-9" />}
          </div>
          <h2 className="mt-5 font-display text-3xl font-bold">
            {passed ? "Nice work!" : "Almost there"}
          </h2>
          <p className="mt-2 text-ink/80">
            Score: <span className="font-semibold">{result.score}%</span>
          </p>
          {result.xpEarned > 0 && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 font-semibold shadow-soft">
              <Sparkles className="h-4 w-4 text-accent" />
              +{result.xpEarned} XP
            </p>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={retry} size="lg">
              <RotateCcw className="h-4 w-4" />
              Try again
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Dashboard</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex-1">
          <Progress value={(idx / total) * 100} />
        </div>
        <span className="text-sm font-semibold text-muted">
          {idx + 1} / {total}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`q-${current.id}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="card overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            {current.hebrewText && (
              <div className="mb-4 rounded-2xl bg-bg p-5 text-center">
                <p className="he text-4xl font-bold tracking-wide text-ink sm:text-5xl">
                  {current.hebrewText}
                </p>
                <div className="mt-3 flex justify-center">
                  <SpeakButton text={current.hebrewText} size="md" />
                </div>
              </div>
            )}
            <p className="text-lg font-semibold text-ink sm:text-xl">{current.promptNe}</p>

            <div className="mt-6 space-y-3">
              {current.options.map((opt, i) => {
                const isChosen = chosen === opt.id;
                const isRight = opt.id === correctOptId;
                const showCorrect = revealed && isRight;
                const showWrong = revealed && isChosen && !isRight;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => pick(opt)}
                    disabled={revealed}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-2xl border-2 bg-surface px-4 py-3.5 text-left transition",
                      !revealed && isChosen && "border-primary bg-primary/5",
                      !revealed && !isChosen && "border-border hover:border-primary/40",
                      showCorrect && "border-success bg-success/10",
                      showWrong && "border-danger bg-danger/10",
                      revealed && !isChosen && !isRight && "opacity-60"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border-2 text-xs font-bold",
                        !revealed && isChosen && "border-primary bg-primary text-primary-foreground",
                        !revealed && !isChosen && "border-border text-muted",
                        showCorrect && "border-success bg-success text-white",
                        showWrong && "border-danger bg-danger text-white"
                      )}
                    >
                      {showCorrect ? "✓" : showWrong ? "✕" : String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1 font-medium">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "border-t",
                  isCorrect ? "border-success/30 bg-success/10" : "border-danger/30 bg-danger/10"
                )}
              >
                <div className="p-5 sm:p-6">
                  <p
                    className={cn(
                      "inline-flex items-center gap-2 font-display text-lg font-bold",
                      isCorrect ? "text-success" : "text-danger"
                    )}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="h-5 w-5" /> Correct!
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5" /> Not quite
                      </>
                    )}
                  </p>
                  {current.explanationNe && (
                    <p className="mt-2 text-ink/85">{current.explanationNe}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-bg/50 px-5 py-4 sm:px-6">
            <p className="text-xs text-muted">
              {firstTry.filter(Boolean).length}/{total} correct so far
            </p>
            {!revealed ? (
              <Button onClick={check} disabled={!chosen}>
                Check
              </Button>
            ) : (
              <Button onClick={next} disabled={pending}>
                {idx + 1 >= total ? "See score" : "Next question"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
