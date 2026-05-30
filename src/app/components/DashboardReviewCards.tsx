import React from 'react';
import Link from 'next/link';
import { Layers, AlertCircle } from 'lucide-react';

interface DashboardReviewCardsProps {
  cardsDue: number;
  mistakesCount: number;
  firstDueDeckId: string | null;
}

export default function DashboardReviewCards({ cardsDue, mistakesCount, firstDueDeckId }: DashboardReviewCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Daily Review */}
      <div className="card-base p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'hsl(170 28% 32% / 0.1)' }}
          >
            <Layers size={22} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <p className="text-eyebrow text-muted">Daily Review</p>
            <p className="font-bold text-ink text-lg" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {cardsDue} cards due
            </p>
          </div>
        </div>
        {firstDueDeckId ? (
          <Link href={`/flashcards/${firstDueDeckId}`} className="btn-primary text-sm px-4 h-9 shrink-0">
            Review now
          </Link>
        ) : (
          <button disabled className="btn-primary text-sm px-4 h-9 shrink-0 opacity-50 cursor-not-allowed">
            Clean slate
          </button>
        )}
      </div>

      {/* Mistakes */}
      <div
        className="card-base p-5 flex items-center justify-between gap-4"
        style={{ backgroundColor: 'hsl(0 70% 52% / 0.04)', borderColor: 'hsl(0 70% 52% / 0.2)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'hsl(0 70% 52% / 0.12)' }}
          >
            <AlertCircle size={22} style={{ color: 'var(--danger)' }} />
          </div>
          <div>
            <p className="text-eyebrow" style={{ color: 'var(--danger)' }}>Mistakes</p>
            <p className="font-bold text-ink text-lg" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {mistakesCount} to fix
            </p>
          </div>
        </div>
        {mistakesCount > 0 ? (
          <Link
            href="/mistakes"
            className="btn-outline text-sm px-4 h-9 shrink-0"
            style={{ borderColor: 'hsl(0 70% 52% / 0.4)', color: 'var(--danger)' }}
          >
            Practice
          </Link>
        ) : (
          <button disabled className="btn-outline text-sm px-4 h-9 shrink-0 opacity-50 cursor-not-allowed" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            No errors
          </button>
        )}
      </div>
    </div>
  );
}
