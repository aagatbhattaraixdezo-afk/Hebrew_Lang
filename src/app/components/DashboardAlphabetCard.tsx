import React from 'react';
import Link from 'next/link';
import { Languages } from 'lucide-react';

export default function DashboardAlphabetCard() {
  return (
    <div
      className="card-base p-6 relative overflow-hidden card-lift"
      style={{ background: 'linear-gradient(135deg, hsl(170 28% 32% / 0.06) 0%, hsl(32 78% 56% / 0.06) 100%)' }}
    >
      {/* Ghost watermark */}
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 text-hebrew select-none pointer-events-none font-bold leading-none"
        style={{
          fontSize: 'clamp(5rem, 18vw, 9rem)',
          color: 'hsl(32 78% 56% / 0.12)',
          fontFamily: 'var(--font-heebo)',
        }}
      >
        א
      </div>

      <div className="relative flex flex-col gap-3 max-w-[65%]">
        <div className="flex items-center gap-2">
          <Languages size={16} style={{ color: 'var(--primary)' }} />
          <p className="text-eyebrow text-primary-color">BUILDING BLOCKS</p>
        </div>
        <h3 className="text-xl font-bold text-ink">Master the Hebrew alphabet</h3>
        <p className="text-sm text-muted leading-relaxed">
          22 letters, each with a name and sound. Start with Alef and build your reading foundation.
        </p>
        <Link href="/alphabet" className="btn-primary self-start mt-1 text-sm h-9 px-4">
          Start with א
        </Link>
      </div>
    </div>
  );
}
