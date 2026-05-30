'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  BookOpen,
  Layers,
  BookCheck,
  Lock,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateEnrollmentCode } from '@/app/admin/enrollments/actions';

interface LessonItem {
  id: string;
  title: string;
  status: 'completed' | 'available' | 'locked';
}

interface QuizItem {
  id: string;
  title: string;
  status: 'completed' | 'available' | 'locked';
  score: number | null;
}

interface DeckItem {
  id: string;
  title: string;
  status: 'completed' | 'available' | 'locked';
  cardCount: number;
}

interface ModuleItem {
  id: string;
  title: string;
  description: string | null;
  lessons: LessonItem[];
  quizzes: QuizItem[];
  decks: DeckItem[];
}

interface CodeItem {
  id: string;
  code: string;
  createdAt: string;
  redeemedBy: string | null;
}

interface CourseDetailClientProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    level: string | null;
    lessonsCompleted: number;
    totalLessons: number;
    modules: ModuleItem[];
  };
  enrollmentCodes: CodeItem[];
  isAdmin: boolean;
}

const statusIcon = (status: 'completed' | 'available' | 'locked') => {
  if (status === 'completed') return <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />;
  if (status === 'available') return <Circle size={16} style={{ color: 'var(--primary)' }} />;
  return <Lock size={14} className="text-muted" />;
};

const statusLabel = (status: 'completed' | 'available' | 'locked') => {
  if (status === 'completed') return 'Completed';
  if (status === 'available') return 'Ready to learn';
  return 'Locked';
};

export default function CourseDetailClient({ course, enrollmentCodes, isAdmin }: CourseDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(course.modules.map((m) => m.id))
  );
  const [copied, setCopied] = useState<string | null>(null);

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const handleGenerateCode = () => {
    startTransition(async () => {
      const res = await generateEnrollmentCode(course.id);
      if (res.ok) {
        toast.success(`Code generated: ${res.code}`);
        router.refresh();
      } else {
        toast.error('Failed to generate code');
      }
    });
  };

  const pct = course.totalLessons > 0 ? Math.round((course.lessonsCompleted / course.totalLessons) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link href="/" className="btn-ghost self-start gap-1.5 text-sm px-3 h-9">
        <ChevronLeft size={16} />
        Back to dashboard
      </Link>

      {/* Course header */}
      <div
        className="rounded-2xl p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #2d5550 0%, #3d6b65 45%, #7a5c10 100%)', boxShadow: 'var(--shadow-lift)' }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              {course.level && (
                <span
                  className="self-start px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'hsl(32 78% 56% / 0.25)', color: 'hsl(32 78% 80%)' }}
                >
                  {course.level}
                </span>
              )}
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--primary-fg)' }}>
                {course.title}
              </h1>
              {course.description && (
                <p className="text-sm" style={{ color: 'hsl(40 38% 97% / 0.75)' }}>
                  {course.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(40 38% 97% / 0.8)' }}>
              <span>{course.lessonsCompleted}/{course.totalLessons} lessons completed</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full" style={{ backgroundColor: 'hsl(40 38% 97% / 0.2)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: 'var(--accent)', transition: 'width 0.7s ease-out' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-ink">Modules</h2>
        <div className="flex flex-col gap-0 relative">
          {/* Dashed guide line */}
          <div
            className="absolute left-6 top-8 bottom-8 w-0.5 pointer-events-none"
            style={{ borderLeft: '2px dashed var(--border)' }}
          />

          {course.modules.map((mod, modIdx) => (
            <div key={mod.id} className="relative pl-16 mb-4">
              {/* Number tile */}
              <div
                className="absolute left-0 w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold z-10"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-fg)' }}
              >
                {String(modIdx + 1).padStart(2, '0')}
              </div>

              <div className="card-base overflow-hidden">
                {/* Module header */}
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-all"
                >
                  <div className="flex flex-col items-start gap-1">
                    <h3 className="font-bold text-ink text-base">{mod.title}</h3>
                    <p className="text-xs text-muted">
                      {mod.lessons.length} lessons · {mod.quizzes.length} quiz{mod.quizzes.length === 1 ? '' : 'zes'} · {mod.decks.length} deck{mod.decks.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  {expandedModules.has(mod.id)
                    ? <ChevronUp size={18} className="text-muted shrink-0" />
                    : <ChevronDown size={18} className="text-muted shrink-0" />
                  }
                </button>

                {expandedModules.has(mod.id) && (
                  <div className="border-t border-border divide-y divide-border">
                    {/* Lessons */}
                    {mod.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`flex items-center gap-4 px-5 py-3.5 transition-all ${
                          lesson.status === 'locked' ? 'opacity-50' : 'hover:bg-secondary/40'
                        }`}
                      >
                        <div className="shrink-0">{statusIcon(lesson.status)}</div>
                        <BookOpen size={15} className="shrink-0 text-muted" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{lesson.title}</p>
                          <p className="text-xs text-muted">{statusLabel(lesson.status)}</p>
                        </div>
                        {lesson.status !== 'locked' ? (
                          <Link
                            href={`/lessons/${lesson.id}`}
                            className="text-xs font-semibold shrink-0"
                            style={{ color: 'var(--primary)' }}
                          >
                            {lesson.status === 'completed' ? 'Review' : 'Start'}
                          </Link>
                        ) : (
                          <Lock size={14} className="text-muted shrink-0" />
                        )}
                      </div>
                    ))}

                    {/* Quizzes */}
                    {mod.quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className={`flex items-center gap-4 px-5 py-3.5 transition-all ${
                          quiz.status === 'locked' ? 'opacity-50' : 'hover:bg-secondary/40'
                        }`}
                      >
                        <div className="shrink-0">{statusIcon(quiz.status)}</div>
                        <BookCheck size={15} className="shrink-0" style={{ color: 'var(--accent)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{quiz.title}</p>
                          <p className="text-xs text-muted">
                            {quiz.score !== null ? `Quiz · ${quiz.score}% best score` : 'Quiz · graded'}
                          </p>
                        </div>
                        {quiz.status !== 'locked' ? (
                          <Link
                            href={`/quizzes/${quiz.id}`}
                            className="text-xs font-semibold shrink-0"
                            style={{ color: 'var(--primary)' }}
                          >
                            {quiz.score !== null ? 'Retry' : 'Start'}
                          </Link>
                        ) : (
                          <Lock size={14} className="text-muted shrink-0" />
                        )}
                      </div>
                    ))}

                    {/* Decks */}
                    {mod.decks.map((deck) => (
                      <div
                        key={deck.id}
                        className={`flex items-center gap-4 px-5 py-3.5 transition-all ${
                          deck.status === 'locked' ? 'opacity-50' : 'hover:bg-secondary/40'
                        }`}
                      >
                        <div className="shrink-0">{statusIcon(deck.status)}</div>
                        <Layers size={15} className="shrink-0" style={{ color: 'var(--primary)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{deck.title}</p>
                          <p className="text-xs text-muted">
                            Flashcards · spaced repetition · {deck.cardCount} cards
                          </p>
                        </div>
                        {deck.status !== 'locked' ? (
                          <Link
                            href={`/flashcards/${deck.id}`}
                            className="text-xs font-semibold shrink-0"
                            style={{ color: 'var(--primary)' }}
                          >
                            Study
                          </Link>
                        ) : (
                          <Lock size={14} className="text-muted shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enrollment codes (Only for Admin view) */}
      {isAdmin && (
        <div className="card-base p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink">Enrollment codes</h3>
              <p className="text-sm text-muted">Share these codes so new students can self-enroll.</p>
            </div>
            <button 
              onClick={handleGenerateCode} 
              disabled={isPending}
              className="btn-primary text-sm h-9 px-4 gap-1.5"
            >
              <Plus size={15} />
              Generate code
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {enrollmentCodes.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-sm font-bold text-ink">{c.code}</span>
                  {c.redeemedBy ? (
                    <span className="badge-success text-xs">Used by {c.redeemedBy.split('@')[0]}</span>
                  ) : (
                    <span className="badge-level text-xs">Available</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted hidden sm:block">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                  {!c.redeemedBy && (
                    <button
                      onClick={() => copyCode(c.code, c.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-all text-muted hover:text-ink"
                      aria-label="Copy code"
                    >
                      {copied === c.id
                        ? <Check size={14} style={{ color: 'var(--success)' }} />
                        : <Copy size={14} />
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}
            {enrollmentCodes.length === 0 && (
              <div className="text-sm text-muted text-center py-4">
                No active codes for this course yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
