'use client';

import { AggregatedTrack } from '@/types';
import { LikelihoodBadge } from '../shared/LikelihoodBadge';
import { Music, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, useMotionValue, useTransform } from 'framer-motion';

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
    opacity: isDragging ? 0.9 : 1,
  };

  const x = useMotionValue(0);
  // Fade background to red slightly when swiping
  const bgOpacity = useTransform(x, [-80, -20, 0], [1, 0, 0]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative border-b border-border/20 ${
        isDragging ? 'shadow-2xl scale-105 z-50 bg-background/50' : 'bg-transparent'
      } transition-transform duration-200`}
    >
      {/* Background delete layer */}
      <motion.div 
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 bg-red-600/90 flex items-center justify-end px-6"
      >
        <Trash2 className="w-5 h-5 text-white" />
      </motion.div>

      {/* Foreground track layer */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -60) {
            onRemove(track.id);
          }
        }}
        style={{ x }}
        {...attributes}
        {...listeners}
        className="relative bg-background/80 backdrop-blur-sm flex items-center gap-3 py-3 px-2 w-full touch-pan-y"
      >
        <div className="w-10 h-10 rounded bg-secondary/50 flex items-center justify-center flex-shrink-0">
          <Music className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="flex-1 overflow-hidden">
          <h4 className="text-base font-bold truncate pr-2">{track.name}</h4>
          {track.isCover && (
            <p className="text-xs text-muted-foreground truncate">
              Cover: {track.coverArtist}
            </p>
          )}
        </div>

        <div className="flex items-center flex-shrink-0">
          <LikelihoodBadge type={track.badge} likelihood={track.likelihood} />
        </div>
      </motion.div>
    </div>
  );
}
