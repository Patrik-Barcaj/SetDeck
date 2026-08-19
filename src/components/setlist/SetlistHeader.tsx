'use client';

import { useSetlistStore } from '@/hooks/useSetlistStore';
import { Shuffle, RotateCcw, Clock, MapPin, Music, Sparkles, Tent } from 'lucide-react';
import { AlbumEraBreakdown } from './AlbumEraBreakdown';

export function SetlistHeader() {
  const { data, tracks, mode, setMode, toggleShuffle, reset } = useSetlistStore();

  if (!data) return null;

  const totalDurationMs = tracks
    .filter((t) => !t.excluded)
    .reduce((acc, track) => acc + (track.durationMs || 210000), 0);
  const totalHours = Math.floor(totalDurationMs / (1000 * 60 * 60));
  const totalMinutes = Math.floor((totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationString = totalDurationMs > 0 ? `~${totalHours > 0 ? `${totalHours}h ` : ''}${totalMinutes}m` : 'Duration unknown';

  const activeTracksCount = tracks.filter((t) => !t.excluded).length;

  return (
    <div className="sticky top-14 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border/40 py-3 px-4 mb-4 flex flex-col gap-3 shadow-sm">
      
      {/* Stats Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium flex-wrap gap-1.5">
        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
          <Clock className="w-3.5 h-3.5 text-setdrift-gold" />
          <span>{durationString}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
          <Music className="w-3.5 h-3.5 text-emerald-400" />
          <span>{activeTracksCount} tracks</span>
        </div>
        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>{data.region} Tour</span>
        </div>

        {/* Headline vs Festival Mode Selector */}
        <div className="flex items-center bg-secondary/80 p-0.5 rounded-xl border border-border/40 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setMode('headline')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              mode === 'headline'
                ? 'bg-setdrift-gold text-black shadow-sm'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Headline (Full)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('festival')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              mode === 'festival'
                ? 'bg-setdrift-gold text-black shadow-sm'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Tent className="w-3 h-3" />
            <span>Festival (45-60m)</span>
          </button>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-1">
        <div className="min-w-0 pr-2">
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-setdrift-gold to-amber-300 truncate">
            {data.artistName !== 'Unknown Artist' ? data.artistName : 'Live Setlist'}
          </h2>
          <p className="text-xs text-muted-foreground truncate font-medium">
            {data.tourName || 'Live Warm-Up Setlist'} • {mode === 'festival' ? 'Condensed Festival Slot' : 'Standard 90-120 min Set'}
          </p>
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <button
            onClick={reset}
            className="p-2 rounded-full bg-secondary/80 hover:bg-secondary transition-all"
            title="Reset to Predicted Order"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground hover:text-white" />
          </button>
          <button
            onClick={toggleShuffle}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-setdrift-gold text-black hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all font-bold shadow-md shadow-setdrift-gold/20"
          >
            <Shuffle className="w-4 h-4" />
            <span className="text-xs">Shuffle</span>
          </button>
        </div>
      </div>

      {/* Album & Era Visual Breakdown Bar */}
      <AlbumEraBreakdown
        albumBreakdown={data.albumBreakdown}
        eraBreakdown={data.eraBreakdown}
      />
    </div>
  );
}
