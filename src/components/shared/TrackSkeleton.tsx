export function TrackSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 mb-2 bg-card rounded-xl border border-border animate-pulse">
      <div className="w-5 h-5 bg-muted rounded"></div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-5 bg-muted rounded w-2/3"></div>
        <div className="h-4 bg-muted rounded w-1/3"></div>
      </div>
      <div className="w-12 h-6 bg-muted rounded"></div>
    </div>
  );
}
