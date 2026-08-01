import { LikelihoodBadge as BadgeType } from '@/types';

export function LikelihoodBadge({ type, likelihood }: { type: BadgeType; likelihood: number }) {
  let dotColor = 'bg-gray-500';

  if (type === 'Green') {
    dotColor = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]';
  } else if (type === 'Yellow') {
    dotColor = 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]';
  } else if (type === 'Red') {
    dotColor = 'bg-stone-600 shadow-[0_0_8px_rgba(87,83,78,0.6)]';
  }

  return (
    <div className="flex items-center gap-1.5" title={`${likelihood}% Likelihood`}>
      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span className="text-[10px] text-muted-foreground font-medium">{likelihood}%</span>
    </div>
  );
}
