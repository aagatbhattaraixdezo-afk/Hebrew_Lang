import React from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';

interface DashboardHeroCardProps {
  courseTitle: string;
  nextLesson: string;
  nextLessonId: string | null;
  lessonsCompleted: number;
  totalLessons: number;
  courseId: string;
}

export default function DashboardHeroCard({
  courseTitle,
  nextLesson,
  nextLessonId,
  lessonsCompleted,
  totalLessons,
  courseId,
}: DashboardHeroCardProps) {
  const pct = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

  return (
    <div
      className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #2d5550 0%, #3d6b65 45%, #7a5c10 100%)',
        boxShadow: 'var(--shadow-lift)',
      }}
    >
      {/* Glowing blob */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
          filter: 'blur(32px)',
        }}
      />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-eyebrow" style={{ color: 'hsl(32 78% 56% / 0.9)' }}>
            CONTINUE LEARNING
          </p>
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--primary-fg)' }}>
            {courseTitle}
          </h2>
          <p className="text-sm" style={{ color: 'hsl(40 38% 97% / 0.75)' }}>
            Up next: <span className="font-semibold" style={{ color: 'var(--primary-fg)' }}>{nextLesson}</span>
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'hsl(40 38% 97% / 0.2)', maxWidth: 180 }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: 'var(--accent)', transition: 'width 0.7s ease-out' }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: 'hsl(40 38% 97% / 0.8)' }}>
              {lessonsCompleted}/{totalLessons} lessons
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
          {nextLessonId ? (
            <Link href={`/lessons/${nextLessonId}`} className="btn-accent gap-2">
              Start lesson
              <ArrowRight size={16} />
            </Link>
          ) : (
            <button disabled className="btn-accent gap-2 opacity-50 cursor-not-allowed">
              Course complete
              <ArrowRight size={16} />
            </button>
          )}
          <Link href={`/courses/${courseId}`} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'hsl(40 38% 97% / 0.75)' }}>
            <BookOpen size={14} />
            View full course
          </Link>
        </div>
      </div>
    </div>
  );
}
