'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { AggregatedTrack } from '@/types';
import { LikelihoodBadge } from '../shared/LikelihoodBadge';
import { Minus, Plus, Trash2, Play, Pause } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, useMotionValue, useTransform } from 'framer-motion';

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

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-80, -20, 0], [1, 0, 0]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.9 : 1,
  };

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current || !track.previewUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Broadcast event so any other playing audio stops immediately
      window.dispatchEvent(new CustomEvent('setdrift-audio-play', { detail: { id: track.id } }));
      audioRef.current.play().catch((err) => {
        console.warn('Audio play error:', err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [isPlaying, track.id, track.previewUrl]);

  useEffect(() => {
    const handleOtherPlay = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id !== track.id && audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener('setdrift-audio-play', handleOtherPlay);
    return () => {
      window.removeEventListener('setdrift-audio-play', handleOtherPlay);
    };
  }, [track.id, isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 30;
      setProgress(Math.min((current / duration) * 100, 100));
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const isExcluded = track.excluded ?? false;

  // SVG circle calculations for 28px diameter ring (radius 12, stroke 2)
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className={`text-base font-bold truncate pr-2 transition-all ${
              isExcluded ? 'line-through text-muted-foreground decoration-2' : ''
            }`}>{track.name}</h4>

            {track.isOpener && !isExcluded && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                ⚡ Opener
              </span>
            )}
            {track.isCloser && !isExcluded && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                ★ Closer
              </span>
            )}
            {track.tourEvolution && !isExcluded && !track.isOpener && !track.isCloser && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                track.tourEvolution === 'NEW TO TOUR'
                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                  : track.tourEvolution === 'TOUR STAPLE'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
              }`}>
                {track.tourEvolution === 'NEW TO TOUR' ? 'New' : track.tourEvolution === 'TOUR STAPLE' ? 'Staple' : 'Rotating'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground truncate mt-0.5">
            {track.isCover && (
              <span>Cover: {track.coverArtist}</span>
            )}
            {track.albumName && (
              <span className="truncate">
                {track.albumName}
                {track.releaseYear ? ` (${track.releaseYear})` : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center flex-shrink-0 gap-2">
          {track.previewUrl && !isExcluded && (
            <button
              onClick={togglePlay}
              onPointerDown={(e) => e.stopPropagation()} // Prevent drag conflict
              className="relative w-8 h-8 flex items-center justify-center rounded-full bg-secondary/80 hover:bg-secondary text-setdrift-gold transition-all hover:scale-105 active:scale-95 group"
              title={isPlaying ? 'Pause Preview' : 'Play 30s Preview'}
              aria-label={isPlaying ? 'Pause Preview' : 'Play 30s Preview'}
            >
              {/* Circular Progress Ring */}
              <svg className="absolute inset-0 w-8 h-8 -rotate-90 pointer-events-none" viewBox="0 0 28 28">
                {/* Background track circle */}
                <circle
                  cx="14"
                  cy="14"
                  r={radius}
                  className="stroke-zinc-700/40"
                  strokeWidth="2"
                  fill="transparent"
                />
                {/* Active animated progress circle */}
                {isPlaying && (
                  <circle
                    cx="14"
                    cy="14"
                    r={radius}
                    className="stroke-setdrift-gold transition-all duration-150 ease-linear"
                    strokeWidth="2.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                )}
              </svg>

              {/* Icon */}
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-setdrift-gold text-setdrift-gold" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-setdrift-gold text-setdrift-gold ml-0.5" />
              )}
            </button>
          )}

          {!isExcluded && <LikelihoodBadge type={track.badge} likelihood={track.likelihood} />}
        </div>
        
        {track.previewUrl && (
          <audio 
            ref={audioRef} 
            src={track.previewUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />
        )}
      </motion.div>
    </div>
  );
}


