import { LikelihoodBadge as BadgeType } from '@/types';

interface LikelihoodBadgeProps {
  type: BadgeType;
  likelihood: number;
}

export function LikelihoodBadge({ type, likelihood }: LikelihoodBadgeProps) {
  let dotColor = 'bg-zinc-500 shadow-[0_0_6px_rgba(113,113,122,0.6)]';
  let badgeBg = 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400';
  let label = 'Tour Rotation';

  if (type === 'Green' || likelihood >= 90) {
    dotColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
    badgeBg = 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
    label = likelihood === 100 ? 'Core Staple' : 'Tour Staple';
  } else if (type === 'Yellow' || likelihood >= 50) {
    dotColor = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
    badgeBg = 'bg-amber-950/40 border-amber-500/30 text-amber-300';
    label = 'Regular Rotation';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-tight backdrop-blur-sm transition-colors ${badgeBg}`}
      title={`${likelihood}% Likelihood • ${label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{likelihood}%</span>
    </div>
  );
}

