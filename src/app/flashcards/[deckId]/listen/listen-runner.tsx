"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Volume2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SpeakButton } from "@/components/speak-button";
import { pickDistractors } from "@/lib/hebrew-text";
import { cn } from "@/lib/utils";
import { awardDrillXp } from "../drills/actions";

type Card = {
  id: string;
  front: string;
  back: string;
  transliteration: string | null;
};

type Question = {
  card: Card;
  options: { id: string; text: string; correct: boolean }[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(cards: Card[]): Question[] {
  return shuffle(cards).map((card) => {
    const distractors = pickDistractors(cards, card.id, 3);
    const options = shuffle([
      { id: card.id, text: card.back, correct: true },
      ...distractors.map((d) => ({ id: d.id, text: d.back, correct: false })),
    ]);
    return { card, options };
  });
}

export function ListenRunner({ cards }: { cards: Card[] }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(cards));
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const total = questions.length;
  const current = questions[idx];

  // Auto-play the Hebrew when a new question shows
  useEffect(() => {
    if (!current || revealed) return;
    const timer = setTimeout(() => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(current.card.front);
      u.lang = "he-IL";
      u.rate = 0.85;
      const voices = window.speechSynthesis.getVoices();
      const he = voices.find((v) => v.lang.toLowerCase().startsWith("he"));
      if (he) u.voice = he;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }, 350);
    return () => clearTimeout(timer);
  }, [idx, current, revealed]);

  function pick(optId: string) {
    if (revealed || !current) return;
    setChosen(optId);
  }

  function check() {
    if (!chosen || !current) return;
    setRevealed(true);
    const opt = current.options.find((o) => o.id === chosen);
    if (opt?.correct) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (idx + 1 >= total) {
      finish();
      return;
    }
    setIdx((i) => i + 1);
    setChosen(null);
    setRevealed(false);
  }

  function finish() {
    const earned = correctCount * 5;
    startTransition(async () => {
      if (earned > 0) await awardDrillXp({ xpEarned: earned });
      setDone(true);
      router.refresh();
    });
  }

  function restart() {
    setQuestions(buildQuestions(cards));
    setIdx(0);
    setChosen(null);
    setRevealed(false);
    setCorrectCount(0);
    setDone(false);
  }

  if (done) {
    const earned = correctCount * 5;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="card overflow-hidden text-center"
      >
        <div
          className="px-6 py-12 sm:py-14"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--accent) / 0.22), hsl(var(--primary) / 0.12))",
          }}
        >
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent text-accent-foreground shadow-lift">
            <Sparkles className="h-9 w-9" />
          </div>
          <h2 className="mt-5 font-display text-3xl font-bold">Session complete!</h2>
          <p className="mt-2 text-ink/80">
            {correctCount} / {total} correct
          </p>
          {earned > 0 && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 font-semibold shadow-soft">
              <Sparkles className="h-4 w-4 text-accent" />
              +{earned} XP
            </p>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={restart} size="lg">
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

  if (!current) return null;
  const correctOpt = current.options.find((o) => o.correct);
  const chosenOpt = current.options.find((o) => o.id === chosen);
  const isCorrect = revealed && chosenOpt?.correct;

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
          key={current.card.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="card overflow-hidden"
        >
          <div
            className="p-8 text-center sm:p-12"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--accent) / 0.06))",
            }}
          >
            <p className="text-xs uppercase tracking-widest text-muted">Listen</p>
            <div className="mt-4 flex justify-center">
              <SpeakButton text={current.card.front} size="lg" />
            </div>
            <p className="mt-4 text-sm text-muted">
              Tap to play again
              {revealed && current.card.transliteration && (
                <>
                  {" "}· <span className="font-mono">{current.card.transliteration}</span>
                </>
              )}
            </p>
            {revealed && (
              <p className="he mt-4 text-3xl font-bold text-ink/85">
                {current.card.front}
              </p>
            )}
          </div>

          <div className="p-5 sm:p-6">
            <p className="mb-3 text-sm font-semibold text-ink">
              What does it mean?
            </p>
            <div className="space-y-3">
              {current.options.map((opt, i) => {
                const isChosen = chosen === opt.id;
                const isRight = opt.correct;
                const showCorrect = revealed && isRight;
                const showWrong = revealed && isChosen && !isRight;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => pick(opt.id)}
                    disabled={revealed}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border-2 bg-surface px-4 py-3.5 text-left transition",
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
                <div className="px-5 py-3 sm:px-6">
                  <p
                    className={cn(
                      "inline-flex items-center gap-2 font-display text-base font-bold",
                      isCorrect ? "text-success" : "text-danger"
                    )}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Correct!
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" /> {correctOpt?.text}
                      </>
                    )}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-bg/50 px-5 py-4 sm:px-6">
            <p className="text-xs text-muted">
              {correctCount} correct so far · +5 XP each
            </p>
            {!revealed ? (
              <Button onClick={check} disabled={!chosen}>
                Check
              </Button>
            ) : (
              <Button onClick={next} disabled={pending}>
                {idx + 1 >= total ? "See score" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
