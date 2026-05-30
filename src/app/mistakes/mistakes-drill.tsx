"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, Wrench, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SpeakButton } from "@/components/speak-button";
import { cn } from "@/lib/utils";
import { recordMistakeAttempt } from "./actions";

type Opt = { id: string; text: string; isCorrect: boolean };
type Mcq = {
  id: string;
  promptNe: string;
  hebrewText: string | null;
  explanationNe: string | null;
  lessonTitle: string;
  options: Opt[];
};

export function MistakesDrill({ mcqs }: { mcqs: Mcq[] }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [fixedCount, setFixedCount] = useState(0);
  const [done, setDone] = useState(false);
  const [, startTransition] = useTransition();

  const total = mcqs.length;
  const current = mcqs[idx];
  const correctOptId = current?.options.find((o) => o.isCorrect)?.id;
  const chosenOpt = current?.options.find((o) => o.id === chosen);
  const isCorrect = revealed && chosenOpt?.isCorrect;

  function pick(opt: Opt) {
    if (revealed) return;
    setChosen(opt.id);
  }

  function check() {
    if (!chosen || !current) return;
    const opt = current.options.find((o) => o.id === chosen);
    if (!opt) return;
    setRevealed(true);
    if (opt.isCorrect) setFixedCount((c) => c + 1);
    startTransition(async () => {
      await recordMistakeAttempt({ mcqId: current.id, correct: opt.isCorrect });
    });
  }

  function next() {
    if (idx + 1 >= total) {
      setDone(true);
      router.refresh();
      return;
    }
    setIdx((i) => i + 1);
    setChosen(null);
    setRevealed(false);
  }

  if (done) {
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
              "linear-gradient(135deg, hsl(var(--success) / 0.18), hsl(var(--primary) / 0.10))",
          }}
        >
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success text-white shadow-lift">
            <Wrench className="h-9 w-9" />
          </div>
          <h2 className="mt-5 font-display text-3xl font-bold">Mistakes fixed</h2>
          <p className="mt-2 text-ink/80">
            <span className="font-semibold">{fixedCount}</span> of {total} cleared.
          </p>
          {fixedCount > 0 && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 font-semibold shadow-soft">
              <Sparkles className="h-4 w-4 text-accent" />
              +{fixedCount * 5} XP
            </p>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/">Back to dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/mistakes">Refresh queue</Link>
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
          key={`m-${current.id}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="card overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            <p className="mb-3 text-xs uppercase tracking-widest text-muted">
              From: {current.lessonTitle}
            </p>
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
                        <CheckCircle2 className="h-5 w-5" /> Fixed!
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5" /> Stays in the queue
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
              {fixedCount} fixed in this session
            </p>
            {!revealed ? (
              <Button onClick={check} disabled={!chosen}>
                Check
              </Button>
            ) : (
              <Button onClick={next}>
                {idx + 1 >= total ? "Finish" : "Next mistake"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
