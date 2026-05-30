import React from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

interface DashboardScenariosCardProps {
  scenarioCount: number;
}

export default function DashboardScenariosCard({ scenarioCount }: DashboardScenariosCardProps) {
  const icons = ['🛒', '🧭', '📞', '💊'];
  return (
    <div
      className="card-base p-6 relative overflow-hidden card-lift"
      style={{ background: 'linear-gradient(135deg, hsl(32 78% 56% / 0.06) 0%, hsl(170 28% 32% / 0.06) 100%)' }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} style={{ color: 'var(--accent)' }} />
          <p className="text-eyebrow" style={{ color: 'var(--accent)' }}>PRACTICE SCENARIOS</p>
        </div>
        <h3 className="text-xl font-bold text-ink">Real conversations, before you need them</h3>
        <p className="text-sm text-muted leading-relaxed">
          Practice {scenarioCount} real-world situations with an AI partner that replies in Hebrew.
        </p>
        <div className="flex items-center gap-2 mt-1">
          {icons.map((icon, i) => (
            <span
              key={`scenario-icon-${i}`}
              className="text-2xl"
              style={{ opacity: 1 - i * 0.18 }}
            >
              {icon}
            </span>
          ))}
        </div>
        <Link href="/scenarios" className="btn-outline self-start mt-1 text-sm h-9 px-4">
          Try a scenario
        </Link>
      </div>
    </div>
  );
}
