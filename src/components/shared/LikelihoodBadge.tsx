import { LikelihoodBadge as BadgeType } from '@/types';

export function LikelihoodBadge({ type, likelihood }: { type: BadgeType; likelihood: number }) {
  let bgColor = 'bg-gray-500/20';
  let textColor = 'text-gray-400';

  if (type === 'Green') {
    bgColor = 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
    textColor = 'text-black';
  } else if (type === 'Yellow') {
    bgColor = 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
    textColor = 'text-black';
  } else if (type === 'Red') {
    bgColor = 'bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
    textColor = 'text-white';
  }

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-bold ${bgColor} ${textColor}`}>
      {likelihood}%
    </span>
  );
}
