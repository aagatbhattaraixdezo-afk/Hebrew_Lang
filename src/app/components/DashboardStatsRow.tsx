'use client';
import React from 'react';

interface DashboardStatsRowProps {
  xp: number;
  level: number;
  streak: number;
  xpForNextLevel: number;
}

export default function DashboardStatsRow({ xp, level, streak, xpForNextLevel }: DashboardStatsRowProps) {
  const xpInLevel = xp % xpForNextLevel;
  const progress = xpInLevel / xpForNextLevel;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * (1 - progress);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* XP Ring Card */}
      <div className="card-base p-5 flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64" className="rotate-[-90deg]">
            <circle
              cx="32" cy="32" r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth="5"
            />
            <circle
              cx="32" cy="32" r={radius}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              style={{ transition: 'stroke-dashoffset 0.7s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
              Lv{level}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-eyebrow text-muted">Total XP</p>
          <p className="text-2xl font-bold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{xp}</p>
          <p className="text-xs text-muted">{xpInLevel}/{xpForNextLevel} to Level {level + 1}</p>
        </div>
      </div>

      {/* Streak Card */}
      <div className="card-base p-5 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
          style={{ backgroundColor: 'hsl(18 88% 56% / 0.12)' }}
        >
          <span className="streak-flame">🔥</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-eyebrow text-muted">Streak</p>
          <p className="text-2xl font-bold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {streak} day{streak === 1 ? '' : 's'}
          </p>
          <p className="text-xs text-muted">Keep it going!</p>
        </div>
      </div>

      {/* Today Card */}
      <div className="card-base p-5 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'hsl(170 28% 32% / 0.1)' }}
        >
          <span className="text-2xl">⭐</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-eyebrow text-muted">Today</p>
          <p className="text-sm font-semibold text-ink">Practice daily to build fluency</p>
          <span className="badge-level mt-1 self-start">{xp} XP · Level {level}</span>
        </div>
      </div>
    </div>
  );
}
