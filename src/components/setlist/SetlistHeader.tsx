'use client';

import { useSetlistStore } from '@/hooks/useSetlistStore';
import { Shuffle, RotateCcw, Clock, MapPin, Music } from 'lucide-react';

export function SetlistHeader() {
  const { data, tracks, toggleShuffle, reset } = useSetlistStore();

  if (!data) return null;

  const totalDurationMs = tracks.reduce((acc, track) => acc + (track.durationMs || 0), 0);
  const totalHours = Math.floor(totalDurationMs / (1000 * 60 * 60));
  const totalMinutes = Math.floor((totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationString = totalDurationMs > 0 ? `~${totalHours > 0 ? `${totalHours}h ` : ''}${totalMinutes}m` : 'Duration unknown';

  return (
    <div className="sticky top-14 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border/40 py-3 px-4 mb-4 flex flex-col gap-3 shadow-sm">
      
      {/* Stats Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
          <Clock className="w-3.5 h-3.5" />
          {durationString}
        </div>
        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
          <Music className="w-3.5 h-3.5" />
          {tracks.length} tracks
        </div>
        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
          <MapPin className="w-3.5 h-3.5" />
          {data.region} Tour
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-1">
        <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-setdeck-gold to-amber-400">
          Warm-Up Setlist
        </h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={reset}
            className="p-2 rounded-full bg-secondary/80 hover:bg-secondary transition-all"
            title="Original Order"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={toggleShuffle}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-setdeck-gold text-black hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all font-bold"
          >
            <Shuffle className="w-4 h-4" />
            <span className="text-xs">Shuffle</span>
          </button>
        </div>
      </div>
    </div>
  );
}
