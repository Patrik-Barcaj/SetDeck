'use client';

import { AggregatedTrack } from '@/types';
import { LikelihoodBadge } from '../shared/LikelihoodBadge';
import { GripVertical, X, Music } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TrackCardProps {
  track: AggregatedTrack;
  onRemove: (id: string) => void;
}

export function TrackCard({ track, onRemove }: TrackCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 mb-3 bg-card/60 backdrop-blur-md rounded-xl border ${
        isDragging ? 'border-spotify-green shadow-[0_0_20px_rgba(29,185,84,0.2)]' : 'border-border/50'
      } hover:border-border hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 group relative`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center flex-shrink-0">
        <Music className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 overflow-hidden">
        <h4 className="text-lg font-bold truncate">{track.name}</h4>
        {track.isCover && (
          <p className="text-sm text-muted-foreground truncate">
            Cover: {track.coverArtist}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <LikelihoodBadge type={track.badge} likelihood={track.likelihood} />
        
        <button
          onClick={() => onRemove(track.id)}
          className="text-muted-foreground hover:text-destructive transition-colors p-2 md:opacity-0 group-hover:opacity-100"
          aria-label="Remove track"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
