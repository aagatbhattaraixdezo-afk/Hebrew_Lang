'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, Play, Sparkles, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import SpeakButton from '@/components/SpeakButton';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { completeLesson } from './actions';

type Option = { id: string; text: string; isCorrect: boolean };
type MCQ = {
  id: string;
  promptNe: string;
  hebrewText: string | null;
  explanationNe: string | null;
  options: Option[];
};

interface LessonForRunner {
  id: string;
  title: string;
  bodyEn: string | null;
  bodyNe: string | null;
  videoUrl: string | null;
  mcqs: MCQ[];
  moduleTitle: string;
}

interface LessonRunnerProps {
  lesson: LessonForRunner;
  previouslyCompleted: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D'];
type Phase = 'intro' | 'mcq' | 'complete';

export function LessonRunner({ lesson, previouslyCompleted }: LessonRunnerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  
  // Track stats
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState(0);
  const [firstTry, setFirstTry] = useState<boolean[]>([]);
  const [attempts, setAttempts] = useState<{ mcqId: string; correct: boolean }[]>([]);

  const mcqs = lesson.mcqs;
  const currentMcq = mcqs[currentIdx];
  const totalMcqs = mcqs.length;
  const isLast = currentIdx === totalMcqs - 1;

  const xpEarned = useMemo(() => {
    // 10 XP per first-try correct answer, plus 20 XP completion bonus
    return firstTry.filter(Boolean).length * 10 + 20;
  }, [firstTry]);

  const handleCheck = () => {
    if (!selected || !currentMcq) return;
    const opt = currentMcq.options.find((o) => o.id === selected);
    if (!opt) return;

    setRevealed(true);
    setAttempts((prev) => [...prev, { mcqId: currentMcq.id, correct: opt.isCorrect }]);
    
    if (opt.isCorrect) {
      setFirstTry((prev) => [...prev, true]);
      setFirstTryCorrectCount((prev) => prev + 1);
      toast.success('+10 XP', { duration: 1500 });
    } else {
      setFirstTry((prev) => [...prev, false]);
    }
  };

  const handleNext = () => {
    if (isLast) {
      // Save progress to database on finishing
      startTransition(async () => {
        const score = totalMcqs ? Math.round((firstTryCorrectCount / totalMcqs) * 100) : 100;
        const result = await completeLesson({
          lessonId: lesson.id,
          score,
          xpEarned,
          attempts,
        });
        if (result.ok) {
          setPhase('complete');
          router.refresh();
        } else {
          toast.error('Failed to save lesson progress');
        }
      });
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const getOptionState = (opt: Option) => {
    if (!revealed) {
      if (selected === opt.id) return 'selected';
      return 'idle';
    }
    if (opt.isCorrect) return 'correct';
    if (selected === opt.id && !opt.isCorrect) return 'wrong';
    return 'dimmed';
  };

  const optionStyles: Record<string, string> = {
    idle: 'border-border text-ink hover:border-primary/50 hover:bg-primary/5',
    selected: 'border-primary bg-primary/8 text-ink',
    correct: 'border-success bg-success/10 text-ink',
    wrong: 'border-danger bg-danger/10 text-ink',
    dimmed: 'border-border text-muted opacity-60',
  };

  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <Link href="/" className="btn-ghost self-start gap-1.5 text-sm px-3 h-9">
          <ChevronLeft size={16} />
          Back to dashboard
        </Link>

        <div className="card-base p-8 flex flex-col gap-6">
          <div>
            <p className="text-eyebrow text-primary-color mb-2">{lesson.moduleTitle} · Lesson</p>
            <h1 className="text-section text-ink">{lesson.title}</h1>
            {previouslyCompleted && (
              <p className="text-xs font-semibold text-success-color mt-1">
                ✓ Already completed — feel free to review.
              </p>
            )}
          </div>

          {lesson.videoUrl && (
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-secondary text-sm font-medium text-ink hover:border-primary transition-all self-start"
            >
              <Play size={16} style={{ color: 'var(--primary)' }} />
              Watch the lesson video
            </a>
          )}

          <div className="prose-shalom">
            <ReactMarkdown
              components={{
                strong: ({ children }) => (
                  <strong className="text-hebrew font-bold" style={{ color: 'var(--primary)' }}>
                    {children}
                  </strong>
                ),
              }}
            >
              {lesson.bodyEn ?? lesson.bodyNe ?? ''}
            </ReactMarkdown>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
            <p className="text-sm text-muted">
              {totalMcqs} practice question{totalMcqs === 1 ? '' : 's'} ahead
            </p>
            <button onClick={() => setPhase('mcq')} className="btn-accent gap-2" disabled={totalMcqs === 0}>
              Start practice
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className="max-w-lg mx-auto">
        <div
          className="rounded-2xl p-8 flex flex-col items-center gap-5 text-center"
          style={{ background: 'linear-gradient(135deg, #2d5550 0%, #3d6b65 50%, #7a5c10 100%)', boxShadow: 'var(--shadow-lift)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Sparkles size={28} style={{ color: 'var(--accent-fg)' }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-fg)' }}>Lesson complete!</h2>
            <p className="text-sm" style={{ color: 'hsl(40 38% 97% / 0.8)' }}>
              {firstTryCorrectCount}/{totalMcqs} correct — nice work
            </p>
          </div>
          <span
            className="px-5 py-2 rounded-full text-lg font-bold"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            +{xpEarned} XP
          </span>
          <div className="flex gap-3 mt-2">
            <Link href="/" className="btn-outline" style={{ color: 'var(--primary-fg)', borderColor: 'hsl(40 38% 97% / 0.3)' }}>
              Dashboard
            </Link>
            <button
              onClick={() => {
                setPhase('mcq');
                setCurrentIdx(0);
                setSelected(null);
                setRevealed(false);
                setFirstTryCorrectCount(0);
                setFirstTry([]);
                setAttempts([]);
              }}
              className="btn-accent"
            >
              Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MCQ phase
  const isCorrectSelected = revealed && selected && currentMcq ? currentMcq.options.find((o) => o.id === selected)?.isCorrect : false;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${(currentIdx / totalMcqs) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-muted shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {currentIdx + 1}/{totalMcqs}
        </span>
      </div>

      <div className="card-base p-6 sm:p-8 flex flex-col gap-6">
        {/* Hebrew display */}
        {currentMcq.hebrewText && (
          <div
            className="rounded-xl p-6 flex flex-col items-center gap-3 text-center"
            style={{ backgroundColor: 'hsl(40 38% 97% / 0.8)', border: '1px solid var(--border)' }}
          >
            <p className="text-hebrew-mcq text-ink" dir="rtl">{currentMcq.hebrewText}</p>
            <SpeakButton text={currentMcq.hebrewText} size={18} />
          </div>
        )}

        {/* Question */}
        <p className="text-base font-medium text-ink text-center">{currentMcq.promptNe}</p>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {currentMcq.options.map((opt, i) => {
            const state = getOptionState(opt);
            return (
              <button
                key={opt.id}
                disabled={revealed}
                onClick={() => !revealed && setSelected(opt.id)}
                className={`flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all duration-150 ${optionStyles[state]}`}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all"
                  style={{
                    borderColor: state === 'correct' ? 'var(--success)' : state === 'wrong' ? 'var(--danger)' : state === 'selected' ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: state === 'correct' ? 'var(--success)' : state === 'wrong' ? 'var(--danger)' : state === 'selected' ? 'var(--primary)' : 'transparent',
                    color: state === 'correct' || state === 'wrong' || state === 'selected' ? '#fff' : 'var(--muted)',
                  }}
                >
                  {state === 'correct' ? '✓' : state === 'wrong' ? '✕' : LETTERS[i]}
                </span>
                <span className="text-sm font-medium">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Reveal panel */}
        {revealed && (
          <div
            className="rounded-xl p-5 flex flex-col gap-2"
            style={{
              backgroundColor: isCorrectSelected ? 'hsl(145 55% 38% / 0.08)' : 'hsl(0 70% 52% / 0.08)',
              border: `1px solid ${isCorrectSelected ? 'hsl(145 55% 38% / 0.25)' : 'hsl(0 70% 52% / 0.25)'}`,
            }}
          >
            <div className="flex items-center gap-2">
              {isCorrectSelected
                ? <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                : <XCircle size={18} style={{ color: 'var(--danger)' }} />
              }
              <p className="font-bold text-sm" style={{ color: isCorrectSelected ? 'var(--success)' : 'var(--danger)' }}>
                {isCorrectSelected ? 'Correct!' : 'Not quite'}
              </p>
            </div>
            {currentMcq.explanationNe && (
              <p className="text-sm text-muted leading-relaxed">{currentMcq.explanationNe}</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {firstTry.filter(Boolean).length * 10} XP earned so far
          </span>
          {!revealed ? (
            <button
              onClick={handleCheck}
              disabled={!selected}
              className="btn-primary"
            >
              Check
            </button>
          ) : (
            <button onClick={handleNext} className="btn-accent" disabled={isPending}>
              {isPending && <Loader2 size={16} className="animate-spin mr-1" />}
              {isLast ? 'Finish lesson' : 'Next question'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
