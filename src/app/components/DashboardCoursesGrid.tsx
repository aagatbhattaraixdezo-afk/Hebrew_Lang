import React from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

type EnrolledCourse = {
  course: {
    id: string;
    title: string;
    description: string | null;
    level: string | null;
    coverColor: string | null;
  };
  lessons: any[];
  done: number;
  pct: number;
};

interface DashboardCoursesGridProps {
  courses: EnrolledCourse[];
}

export default function DashboardCoursesGrid({ courses }: DashboardCoursesGridProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-section text-ink">Your courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {courses?.map(({ course, lessons, done, pct }) => (
          <div key={course.id} className="card-base p-5 card-lift flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 text-white font-he"
                style={{ backgroundColor: course.coverColor ?? 'var(--primary)', fontFamily: 'var(--font-heebo)' }}
              >
                ש
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="badge-level self-start">{course.level ?? 'Course'}</span>
                <h3 className="font-bold text-ink text-base leading-snug">{course.title}</h3>
                {course.description && (
                  <p className="text-sm text-muted line-clamp-2">{course.description}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{done}/{lessons.length} lessons</span>
                <span>{pct}%</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <Link
              href={`/courses/${course.id}`}
              className="btn-ghost self-start h-9 px-3 text-sm gap-1.5"
              style={{ color: 'var(--primary)' }}
            >
              <BookOpen size={14} />
              Open course
            </Link>
          </div>
        ))}
        {courses?.length === 0 && (
          <div className="card-base p-8 text-center text-muted col-span-2">
            You are not enrolled in any courses yet.
          </div>
        )}
      </div>
    </div>
  );
}
