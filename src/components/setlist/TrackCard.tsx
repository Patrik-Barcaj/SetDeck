'use client';

import { AggregatedTrack } from '@/types';
import { LikelihoodBadge } from '../shared/LikelihoodBadge';
import { Minus, Plus, Trash2, Play, Square } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';

interface TrackCardProps {
  track: AggregatedTrack;
  onRemove: (id: string) => void;
  onToggleExclude: (id: string) => void;
}

export function TrackCard({ track, onRemove, onToggleExclude }: TrackCardProps) {
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

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Find other audio elements and pause them
        document.querySelectorAll('audio').forEach((el) => {
          if (el !== audioRef.current) el.pause();
        });
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const isExcluded = track.excluded ?? false;

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
        className={`relative bg-background/80 backdrop-blur-sm flex items-center gap-3 py-3 px-2 w-full touch-pan-y ${
          isExcluded ? 'opacity-40' : ''
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExclude(track.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${
            isExcluded
              ? 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'
              : 'border-red-500/40 text-red-400 hover:bg-red-500/10'
          }`}
          aria-label={isExcluded ? 'Re-include track' : 'Exclude track'}
        >
          {isExcluded ? (
            <Plus className="w-2.5 h-2.5" />
          ) : (
            <Minus className="w-2.5 h-2.5" />
          )}
        </button>

        <div className="flex-1 overflow-hidden">
          <h4 className={`text-base font-bold truncate pr-2 transition-all ${
            isExcluded ? 'line-through text-muted-foreground decoration-2' : ''
          }`}>{track.name}</h4>
          {track.isCover && (
            <p className="text-xs text-muted-foreground truncate">
              Cover: {track.coverArtist}
            </p>
          )}
        </div>

        <div className="flex items-center flex-shrink-0 gap-2">
          {track.previewUrl && !isExcluded && (
            <button
              onClick={togglePlay}
              onPointerDown={(e) => e.stopPropagation()} // Prevent drag conflict
              className="w-7 h-7 flex items-center justify-center rounded-full bg-setdrift-gold text-black hover:scale-110 active:scale-95 transition-transform"
            >
              {isPlaying ? <Square className="w-3 h-3 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black ml-0.5" />}
            </button>
          )}
          {!isExcluded && <LikelihoodBadge type={track.badge} likelihood={track.likelihood} />}
        </div>
        
        {track.previewUrl && (
          <audio 
            ref={audioRef} 
            src={track.previewUrl} 
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />
        )}
      </motion.div>
    </div>
  );
}

