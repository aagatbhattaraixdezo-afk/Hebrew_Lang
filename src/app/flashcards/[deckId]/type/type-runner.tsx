"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  Eye,
  Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SpeakButton } from "@/components/speak-button";
import { hebrewMatches } from "@/lib/hebrew-text";
import { cn } from "@/lib/utils";
import { awardDrillXp } from "../drills/actions";

type Card = {
  id: string;
  front: string;
  back: string;
  transliteration: string | null;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TypeRunner({ cards }: { cards: Card[] }) {
  const router = useRouter();
  const [order, setOrder] = useState<Card[]>(() => shuffle(cards));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState<null | { correct: boolean; revealed: boolean }>(
    null
  );
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const total = order.length;
  const current = order[idx];

  function check() {
    if (!current || revealed) return;
    const ok = hebrewMatches(input, current.front);
    if (ok) setCorrectCount((c) => c + 1);
    setRevealed({ correct: ok, revealed: false });
  }

  function reveal() {
    if (!current) return;
    setRevealed({ correct: false, revealed: true });
  }

  function next() {
    if (idx + 1 >= total) {
      finish();
      return;
    }
    setIdx((i) => i + 1);
    setInput("");
    setRevealed(null);
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function finish() {
    const earned = correctCount * 10;
    startTransition(async () => {
      if (earned > 0) await awardDrillXp({ xpEarned: earned });
      setDone(true);
      router.refresh();
    });
  }

  function restart() {
    setOrder(shuffle(cards));
    setIdx(0);
    setInput("");
    setRevealed(null);
    setCorrectCount(0);
    setDone(false);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (revealed) next();
      else if (input.trim()) check();
    }
  }

  if (done) {
    const earned = correctCount * 10;
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
            {correctCount} / {total} typed correctly
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
  const showResult = revealed !== null;

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
          key={current.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="card overflow-hidden"
        >
          <div
            className="px-6 py-10 text-center sm:px-10 sm:py-12"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--accent) / 0.06))",
            }}
          >
            <p className="text-xs uppercase tracking-widest text-muted">
              Type this in Hebrew
            </p>
            <p className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
              {current.back}
            </p>
            {current.transliteration && (
              <p className="mt-2 font-mono text-sm text-muted">
                Sounds like: {current.transliteration}
              </p>
            )}
          </div>

          <div className="p-5 sm:p-6">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              dir="rtl"
              autoFocus
              disabled={showResult}
              placeholder="Type the Hebrew word…"
              className="he text-center text-2xl h-14"
              style={{ direction: "rtl" }}
            />

            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "mt-4 rounded-2xl border p-4",
                    revealed.correct
                      ? "border-success/40 bg-success/10"
                      : "border-danger/40 bg-danger/10"
                  )}
                >
                  <p
                    className={cn(
                      "inline-flex items-center gap-2 font-display text-lg font-bold",
                      revealed.correct ? "text-success" : "text-danger"
                    )}
                  >
                    {revealed.correct ? (
                      <>
                        <CheckCircle2 className="h-5 w-5" /> Correct!
                      </>
                    ) : revealed.revealed ? (
                      <>
                        <Eye className="h-5 w-5" /> Revealed
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5" /> Not quite
                      </>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="he text-2xl font-bold text-ink" style={{ direction: "rtl" }}>
                      {current.front}
                    </p>
                    <SpeakButton text={current.front} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-bg/50 px-5 py-4 sm:px-6">
            <p className="text-xs text-muted">
              {correctCount} correct so far · +10 XP each
            </p>
            <div className="flex items-center gap-2">
              {!showResult ? (
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={reveal}>
                    <Eye className="h-3.5 w-3.5" />
                    Reveal
                  </Button>
                  <Button onClick={check} disabled={!input.trim()}>
                    Check
                  </Button>
                </>
              ) : (
                <Button onClick={next} disabled={pending}>
                  {idx + 1 >= total ? "See score" : "Next"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="mt-4 text-center text-xs text-muted">
        <Keyboard className="mr-1 inline h-3 w-3" />
        Press Enter to check / advance
      </p>
    </div>
  );
}
