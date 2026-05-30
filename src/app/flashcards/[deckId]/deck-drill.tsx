'use client';

import React, { useState, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Keyboard, Volume2, Sparkles, RotateCcw, Loader2 } from 'lucide-react';
import SpeakButton from '@/components/SpeakButton';
import { toast } from 'sonner';
import { gradeCard } from './actions';
import { awardDrillXp } from './drills/actions';

type CardDTO = {
  id: string;
  front: string;
  back: string;
  transliteration: string | null;
  exampleHe: string | null;
  exampleNe: string | null;
  isNew: boolean;
  isDue: boolean;
  ease: number;
  intervalDays: number;
  reps: number;
  dueOn: string;
};

type DrillMode = 'flip' | 'listen' | 'type';
type Grade = 'again' | 'hard' | 'good' | 'easy';

interface GradeCount {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

interface DeckDrillProps {
  cards: CardDTO[];
  deckId: string;
  deckTitle: string;
  moduleTitle: string;
  dueCount: number;
  newCount: number;
}

const LETTERS = ['A', 'B', 'C', 'D'];

export function DeckDrill({ cards, deckId, deckTitle, moduleTitle, dueCount, newCount }: DeckDrillProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<DrillMode>('flip');
  
  // Filter cards due or new for this session
  const initialCards = cards.filter((c) => c.isDue || c.isNew);
  const [queue, setQueue] = useState<CardDTO[]>(initialCards);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [grades, setGrades] = useState<GradeCount>({ again: 0, hard: 0, good: 0, easy: 0 });
  const [completed, setCompleted] = useState(false);

  // Listening drill state
  const [listenSelected, setListenSelected] = useState<string | null>(null);
  const [listenRevealed, setListenRevealed] = useState(false);
  const [listenOptions, setListenOptions] = useState<CardDTO[]>([]);

  // Typing drill state
  const [typeInput, setTypeInput] = useState('');
  const [typeRevealed, setTypeRevealed] = useState(false);
  const [typeChecked, setTypeChecked] = useState(false);
  const [typeCorrect, setTypeCorrect] = useState<boolean | null>(null);

  const card = queue[currentIdx];
  const totalCards = queue.length;
  const progress = totalCards > 0 ? Math.round((currentIdx / totalCards) * 100) : 0;

  // Generate listen options (1 correct, 3 distractors)
  const generateListenOptions = useCallback((currentCard: CardDTO) => {
    if (!currentCard) return;
    const others = cards.filter((c) => c.id !== currentCard.id).sort(() => 0.5 - Math.random()).slice(0, 3);
    const opts = [currentCard, ...others].sort(() => 0.5 - Math.random());
    setListenOptions(opts);
  }, [cards]);

  // Trigger listen options generation when card changes
  React.useEffect(() => {
    if (card && mode === 'listen') {
      generateListenOptions(card);
    }
  }, [card, mode, generateListenOptions]);

  const saveFlipGrade = (grade: Grade) => {
    if (!card || isPending) return;

    const xpMap: Record<Grade, number> = { again: 0, hard: 2, good: 3, easy: 4 };
    const gained = xpMap[grade];
    setXpEarned((prev) => prev + gained);
    setGrades((prev) => ({ ...prev, [grade]: prev[grade] + 1 }));

    startTransition(async () => {
      const res = await gradeCard({
        cardId: card.id,
        ease: card.ease,
        intervalDays: card.intervalDays,
        reps: card.reps,
        grade,
      });

      if (!res.ok) {
        toast.error('Failed to save progress');
        return;
      }

      if (gained > 0) {
        toast.success(`+${gained} XP`, { duration: 1000 });
      }

      // If user marked Again, re-queue this card at the end of the session
      if (grade === 'again') {
        setQueue((prev) => {
          const next = [...prev];
          const [requeue] = next.splice(currentIdx, 1);
          next.push({
            ...requeue,
            ease: res.ease,
            intervalDays: res.intervalDays,
            reps: res.reps,
            dueOn: res.dueOn,
          });
          return next;
        });
        setFlipped(false);
      } else {
        // Update local card state so subsequent viewings use updated stats
        const updated = queue.find((c) => c.id === card.id);
        if (updated) {
          updated.ease = res.ease;
          updated.intervalDays = res.intervalDays;
          updated.reps = res.reps;
          updated.dueOn = res.dueOn;
        }

        if (currentIdx + 1 >= queue.length) {
          setCompleted(true);
          router.refresh();
        } else {
          setCurrentIdx((i) => i + 1);
          setFlipped(false);
        }
      }
    });
  };

  const nextListenCard = () => {
    if (currentIdx + 1 >= totalCards) {
      // Save listening drill XP
      startTransition(async () => {
        if (xpEarned > 0) {
          await awardDrillXp({ xpEarned });
        }
        setCompleted(true);
        router.refresh();
      });
    } else {
      setCurrentIdx((i) => i + 1);
      setListenSelected(null);
      setListenRevealed(false);
    }
  };

  const checkType = () => {
    if (!card) return;
    const normalize = (s: string) =>
      s.replace(/[\u0591-\u05C7]/g, '').replace(/\s/g, '').toLowerCase().trim();
    const correct = normalize(typeInput) === normalize(card.front);
    setTypeCorrect(correct);
    setTypeChecked(true);
    if (correct) {
      setXpEarned((prev) => prev + 10);
      toast.success('+10 XP', { duration: 1000 });
    }
  };

  const nextTypeCard = () => {
    if (currentIdx + 1 >= totalCards) {
      // Save typing drill XP
      startTransition(async () => {
        if (xpEarned > 0) {
          await awardDrillXp({ xpEarned });
        }
        setCompleted(true);
        router.refresh();
      });
    } else {
      setCurrentIdx((i) => i + 1);
      setTypeInput('');
      setTypeChecked(false);
      setTypeCorrect(null);
      setTypeRevealed(false);
    }
  };

  const resetDrill = () => {
    setQueue(initialCards);
    setCurrentIdx(0);
    setFlipped(false);
    setXpEarned(0);
    setGrades({ again: 0, hard: 0, good: 0, easy: 0 });
    setCompleted(false);
    setListenSelected(null);
    setListenRevealed(false);
    setTypeInput('');
    setTypeChecked(false);
    setTypeCorrect(null);
    setTypeRevealed(false);
  };

  const switchMode = (m: DrillMode) => {
    setMode(m);
    resetDrill();
  };

  if (initialCards.length === 0) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center gap-6 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: 'hsl(145 55% 38% / 0.12)' }}>
          ✓
        </div>
        <h2 className="text-2xl font-bold text-ink">All caught up!</h2>
        <p className="text-muted">No cards are due right now. Come back tomorrow to keep your streak going.</p>
        <Link href="/" className="btn-primary">Back to dashboard</Link>
      </div>
    );
  }

  if (completed) {
    const gradeColors: Record<Grade, string> = {
      again: 'var(--danger)',
      hard: 'var(--accent)',
      good: 'var(--primary)',
      easy: 'var(--success)',
    };
    const gradeBgs: Record<Grade, string> = {
      again: 'hsl(0 70% 52% / 0.1)',
      hard: 'hsl(32 78% 56% / 0.1)',
      good: 'hsl(170 28% 32% / 0.1)',
      easy: 'hsl(145 55% 38% / 0.1)',
    };

    return (
      <div className="max-w-lg mx-auto flex flex-col gap-5">
        <div
          className="rounded-2xl p-8 flex flex-col items-center gap-5 text-center"
          style={{ background: 'linear-gradient(135deg, #2d5550 0%, #3d6b65 50%, #7a5c10 100%)', boxShadow: 'var(--shadow-lift)' }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
            <Sparkles size={28} style={{ color: 'var(--accent-fg)' }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--primary-fg)' }}>Session complete!</h2>
            <p className="text-sm mt-1" style={{ color: 'hsl(40 38% 97% / 0.8)' }}>
              {totalCards} cards reviewed
            </p>
          </div>
          <span className="px-5 py-2 rounded-full text-lg font-bold" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}>
            +{xpEarned} XP
          </span>
        </div>

        {/* Grade breakdown (only for flip/srs mode) */}
        {mode === 'flip' && (
          <div className="card-base p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-ink">Session breakdown</p>
            <div className="grid grid-cols-4 gap-2">
              {(['again', 'hard', 'good', 'easy'] as Grade[]).map((g) => (
                <div
                  key={`grade-stat-${g}`}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                  style={{ backgroundColor: gradeBgs[g] }}
                >
                  <span className="text-2xl font-bold" style={{ color: gradeColors[g], fontVariantNumeric: 'tabular-nums' }}>
                    {grades[g]}
                  </span>
                  <span className="text-xs font-semibold capitalize" style={{ color: gradeColors[g] }}>
                    {g}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={resetDrill} className="btn-outline flex-1 gap-2" disabled={isPending}>
            <RotateCcw size={15} />
            Review again
          </button>
          <Link href="/" className="btn-primary flex-1 justify-center">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Back CTA */}
      <Link href="/" className="btn-ghost self-start gap-1.5 text-sm px-3 h-9">
        <ChevronLeft size={16} />
        Back to dashboard
      </Link>

      {/* Header */}
      <div>
        <p className="text-eyebrow text-primary-color mb-1">
          Flashcards · {moduleTitle}
        </p>
        <h1 className="text-xl font-bold text-ink">{deckTitle}</h1>
        <p className="text-sm text-muted mt-1">
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{dueCount} due today</span>
          {' · '}
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{newCount} new</span>
          {' · '}
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{cards.length} total</span>
        </p>
      </div>

      {/* Mode picker */}
      <div className="flex items-center gap-2 p-1 rounded-xl border border-border bg-surface self-start">
        {[
          { key: 'flip' as DrillMode, label: 'Flip cards (SRS)' },
          { key: 'listen' as DrillMode, label: 'Listening drill', icon: Volume2 },
          { key: 'type' as DrillMode, label: 'Typing drill', icon: Keyboard },
        ].map((m) => (
          <button
            key={`mode-${m.key}`}
            onClick={() => switchMode(m.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              mode === m.key ? 'tab-active' : 'tab-inactive'
            }`}
          >
            {m.icon && <m.icon size={14} />}
            {m.label}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm font-medium text-muted shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {currentIdx + 1}/{totalCards}
        </span>
      </div>

      {/* FLIP MODE */}
      {mode === 'flip' && card && (
        <div className="flex flex-col gap-4">
          <div className="card-flip-container" style={{ height: 320 }}>
            <div className={`card-flip-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
              {/* Front */}
              <div className="card-flip-front w-full h-full">
                <button
                  className="w-full h-full rounded-2xl border border-border flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-lift transition-all"
                  style={{ background: 'linear-gradient(135deg, hsl(170 28% 32% / 0.04) 0%, hsl(32 78% 56% / 0.04) 100%)' }}
                  onClick={() => setFlipped(true)}
                  aria-label="Flip card to reveal answer"
                >
                  <p className="text-hebrew-hero text-ink" dir="rtl">{card.front}</p>
                  <p className="text-xs text-muted">Tap to reveal</p>
                </button>
              </div>

              {/* Back */}
              <div className="card-flip-back w-full h-full">
                <div
                  className="w-full h-full rounded-2xl border border-border flex flex-col items-center justify-center gap-4 p-6 text-center"
                  style={{ background: 'linear-gradient(135deg, hsl(32 78% 56% / 0.05) 0%, hsl(170 28% 32% / 0.05) 100%)' }}
                >
                  <p
                    className="text-hebrew font-bold"
                    dir="rtl"
                    style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', color: 'var(--ink)' }}
                  >
                    {card.front}
                  </p>
                  <SpeakButton text={card.front} size={18} />
                  {card.transliteration && (
                    <p className="font-mono text-sm text-muted">{card.transliteration}</p>
                  )}
                  <p className="text-2xl font-bold text-ink">{card.back}</p>
                  {card.exampleHe && (
                    <div
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm max-w-full"
                      style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
                    >
                      <span className="text-hebrew text-sm text-muted" dir="rtl">{card.exampleHe}</span>
                      {card.exampleNe && (
                        <>
                          <span className="text-muted mx-1">·</span>
                          <span className="text-muted text-xs truncate">{card.exampleNe}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rating buttons — only show when flipped */}
          {flipped && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { grade: 'again' as Grade, label: 'Again', bg: 'hsl(0 70% 52% / 0.1)', color: 'var(--danger)', border: 'hsl(0 70% 52% / 0.3)' },
                { grade: 'hard' as Grade, label: 'Hard', bg: 'hsl(32 78% 56% / 0.1)', color: '#8b5e10', border: 'hsl(32 78% 56% / 0.3)' },
                { grade: 'good' as Grade, label: 'Good', bg: 'hsl(170 28% 32% / 0.1)', color: 'var(--primary)', border: 'hsl(170 28% 32% / 0.3)' },
                { grade: 'easy' as Grade, label: 'Easy', bg: 'hsl(145 55% 38% / 0.1)', color: 'var(--success)', border: 'hsl(145 55% 38% / 0.3)' },
              ].map((btn) => (
                <button
                  key={`grade-btn-${btn.grade}`}
                  onClick={() => saveFlipGrade(btn.grade)}
                  disabled={isPending}
                  className="py-3 rounded-xl font-semibold text-sm transition-all duration-150 hover:opacity-90 active:scale-95 border"
                  style={{ backgroundColor: btn.bg, color: btn.color, borderColor: btn.border }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LISTEN MODE */}
      {mode === 'listen' && card && (
        <div className="flex flex-col gap-4">
          <div
            className="card-base p-8 flex flex-col items-center gap-5 text-center"
          >
            <p className="text-eyebrow text-primary-color flex items-center gap-1.5">
              <Volume2 size={14} />
              LISTENING DRILL
            </p>
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center cursor-pointer hover:shadow-lift transition-all"
              style={{ backgroundColor: 'hsl(170 28% 32% / 0.1)' }}
            >
              <SpeakButton text={card.front} size={32} autoPlay />
            </div>
            <p className="text-sm text-muted">Tap to play again · Choose the correct English meaning</p>
          </div>

          <div className="flex flex-col gap-2">
            {listenOptions.map((opt) => {
              const isSelected = listenSelected === opt.id;
              const isCorrect = opt.id === card.id;
              let state = 'idle';
              if (listenRevealed) {
                if (isCorrect) state = 'correct';
                else if (isSelected) state = 'wrong';
                else state = 'dimmed';
              } else if (isSelected) {
                state = 'selected';
              }
              const styles: Record<string, string> = {
                idle: 'border-border text-ink hover:border-primary/50',
                selected: 'border-primary bg-primary/8 text-ink',
                correct: 'border-success bg-success/10 text-ink',
                wrong: 'border-danger bg-danger/10 text-ink',
                dimmed: 'border-border text-muted opacity-60',
              };
              return (
                <button
                  key={`listen-opt-${opt.id}`}
                  disabled={listenRevealed}
                  onClick={() => {
                    if (!listenRevealed) {
                      setListenSelected(opt.id);
                      setListenRevealed(true);
                      if (opt.id === card.id) {
                        setXpEarned((p) => p + 5);
                        toast.success('+5 XP', { duration: 1000 });
                      }
                    }
                  }}
                  className={`px-5 py-4 rounded-xl border-2 text-left font-medium text-sm transition-all duration-150 ${styles[state]}`}
                >
                  {opt.back}
                </button>
              );
            })}
          </div>

          {listenRevealed && (
            <button onClick={nextListenCard} className="btn-accent self-end" disabled={isPending}>
              {currentIdx + 1 >= totalCards ? 'Finish' : 'Next card'}
            </button>
          )}
        </div>
      )}

      {/* TYPE MODE */}
      {mode === 'type' && card && (
        <div className="flex flex-col gap-4">
          <div className="card-base p-8 flex flex-col items-center gap-4 text-center">
            <p className="text-eyebrow text-primary-color flex items-center gap-1.5">
              <Keyboard size={14} />
              TYPING DRILL
            </p>
            <p className="text-sm text-muted">Read the English, type the Hebrew.</p>
            <p className="text-3xl font-bold text-ink">{card.back}</p>
            {card.transliteration && (
              <p className="font-mono text-sm text-muted">
                Sounds like: <span className="text-ink font-semibold">{card.transliteration}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-eyebrow text-muted">Type the Hebrew word</label>
            <input
              className="input-base input-rtl text-xl font-bold text-center"
              style={{ height: 56, fontSize: '1.5rem', direction: 'rtl', fontFamily: 'var(--font-heebo)' }}
              placeholder="…type here"
              dir="rtl"
              value={typeInput}
              onChange={(e) => setTypeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (!typeChecked) checkType();
                  else nextTypeCard();
                }
              }}
              disabled={typeChecked}
            />
            <p className="text-xs text-muted text-center">Vowel marks (nikud) are optional — we match leniently. Press Enter to check.</p>
          </div>

          {typeChecked && (
            <div
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{
                backgroundColor: typeRevealed ? 'hsl(32 78% 56% / 0.08)' : typeCorrect ? 'hsl(145 55% 38% / 0.08)' : 'hsl(0 70% 52% / 0.08)',
                border: `1px solid ${typeRevealed ? 'hsl(32 78% 56% / 0.25)' : typeCorrect ? 'hsl(145 55% 38% / 0.25)' : 'hsl(0 70% 52% / 0.25)'}`,
              }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="font-bold text-sm"
                  style={{ color: typeRevealed ? '#8b5e10' : typeCorrect ? 'var(--success)' : 'var(--danger)' }}
                >
                  {typeRevealed ? 'Revealed' : typeCorrect ? 'Correct!' : 'Not quite'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-hebrew font-bold text-lg" dir="rtl" style={{ color: 'var(--primary)' }}>{card.front}</p>
                  <SpeakButton text={card.front} size={16} />
                </div>
              </div>
              {!typeCorrect && !typeRevealed && (
                <p className="text-xs text-muted">The correct answer is shown above.</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            {!typeChecked ? (
              <>
                <button
                  type="button"
                  onClick={() => { setTypeRevealed(true); setTypeChecked(true); setTypeCorrect(false); }}
                  className="btn-ghost text-sm h-9 px-3 gap-1.5"
                >
                  Reveal answer
                </button>
                <button
                  onClick={checkType}
                  disabled={!typeInput.trim()}
                  className="btn-primary"
                >
                  Check
                </button>
              </>
            ) : (
              <button onClick={nextTypeCard} className="btn-accent ml-auto" disabled={isPending}>
                {currentIdx + 1 >= totalCards ? 'Finish' : 'Next card'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
