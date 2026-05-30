"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronsLeft, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpeakButton } from "@/components/speak-button";
import { cn } from "@/lib/utils";
import type { HebrewLetter } from "@/lib/hebrew-alphabet";

const STORAGE_KEY = "shalom.alphabet.lastIndex";

export function AlphabetTrainer({ letters }: { letters: HebrewLetter[] }) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Restore last position
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const n = parseInt(saved, 10);
      if (!isNaN(n) && n >= 0 && n < letters.length) setIdx(n);
    }
  }, [letters.length]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(idx));
  }, [idx]);

  function go(delta: 1 | -1) {
    setDirection(delta);
    setIdx((i) => Math.max(0, Math.min(letters.length - 1, i + delta)));
  }

  function reset() {
    setDirection(-1);
    setIdx(0);
    setDone(false);
  }

  function finish() {
    setDone(true);
  }

  const current = letters[idx];
  const isFirst = idx === 0;
  const isLast = idx === letters.length - 1;

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="card overflow-hidden text-center"
      >
        <div
          className="px-6 py-12 sm:py-16"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--accent) / 0.25), hsl(var(--primary) / 0.15))",
          }}
        >
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent text-accent-foreground shadow-lift">
            <Sparkles className="h-9 w-9" />
          </div>
          <h2 className="mt-5 font-display text-3xl font-bold">Alphabet mastered!</h2>
          <p className="mt-2 text-ink/80">
            You can now read every Hebrew word — character by character. Keep practising;
            speed comes with time.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {letters.map((l) => (
              <span
                key={l.letter}
                className="he grid h-12 w-12 place-items-center rounded-xl bg-surface text-2xl font-bold text-ink shadow-soft"
                aria-label={l.name}
              >
                {l.letter}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/">Back to dashboard</Link>
            </Button>
            <Button onClick={reset} variant="outline" size="lg">
              <ChevronsLeft className="h-4 w-4" />
              Review from א
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          The Hebrew alphabet
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          22 letters, one foundation
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Learn one letter at a time. Tap the speaker to hear the example word.
        </p>
      </header>

      {/* Progress dots */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {letters.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > idx ? 1 : -1);
              setIdx(i);
            }}
            aria-label={`Go to letter ${i + 1}`}
            className={cn(
              "h-1.5 flex-1 min-w-[8px] rounded-full transition",
              i < idx && "bg-primary",
              i === idx && "bg-accent",
              i > idx && "bg-border"
            )}
          />
        ))}
      </div>

      <p className="mb-4 text-center text-sm text-muted">
        Letter <span className="font-semibold text-ink">{idx + 1}</span> of {letters.length}
      </p>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current.letter}
          custom={direction}
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * 24 }}
          transition={{ duration: 0.25 }}
          className="card relative overflow-hidden"
        >
          <div
            className="px-6 py-10 sm:px-10 sm:py-14 text-center"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--accent) / 0.10), hsl(var(--primary) / 0.05))",
            }}
          >
            <p
              className="he leading-none font-bold text-ink"
              style={{ fontSize: "clamp(8rem, 28vw, 14rem)" }}
              aria-label={`Hebrew letter ${current.name}`}
            >
              {current.letter}
            </p>
            {current.finalForm && (
              <p className="he mt-2 text-ink/60">
                <span className="text-sm text-muted font-body">final form: </span>
                <span className="text-3xl font-bold">{current.finalForm}</span>
              </p>
            )}
            <h2 className="mt-4 font-display text-3xl font-bold">{current.name}</h2>
            <p className="mt-1 text-muted">
              Transliteration:{" "}
              <span className="font-mono text-ink/85">{current.transliteration}</span>
            </p>
          </div>

          <div className="border-t border-border bg-surface px-6 py-6 sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              How it sounds
            </p>
            <p className="mt-1.5 text-ink/90">{current.sound}</p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-bg p-4 sm:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                  Example word
                </p>
                <p className="he mt-1 text-3xl font-bold text-ink">
                  {current.example.he}
                </p>
                <p className="mt-1 text-sm text-muted">
                  <span className="font-mono">{current.example.trans}</span> —{" "}
                  {current.example.en}
                </p>
              </div>
              <SpeakButton
                text={current.example.he}
                size="lg"
                label={`Listen to ${current.example.he}`}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => go(-1)}
          disabled={isFirst}
          aria-label="Previous letter"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {isLast ? (
          <Button size="lg" onClick={finish} variant="accent">
            <CheckCircle2 className="h-4 w-4" />
            I know my alphabet
          </Button>
        ) : (
          <Button size="lg" onClick={() => go(1)} aria-label="Next letter">
            Next letter
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
