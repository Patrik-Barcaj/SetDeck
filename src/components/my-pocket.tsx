'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllOfflineSetlists } from '@/utils/offlineStorage';
import { SetlistData } from '@/types';
import { Bookmark, Clock, ChevronRight, Music } from 'lucide-react';
import { motion } from 'framer-motion';

export function MyStagePocket() {
  const [pocketSets, setPocketSets] = useState<SetlistData[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loaded = getAllOfflineSetlists();
    setPocketSets(loaded);

    const handleStorageChange = () => {
      setPocketSets(getAllOfflineSetlists());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (pocketSets.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full max-w-4xl mx-auto my-6 px-4"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-setdrift-gold/15 border border-setdrift-gold/30 flex items-center justify-center text-setdrift-gold">
            <Bookmark className="w-3.5 h-3.5 fill-setdrift-gold" />
          </div>
          <h3 className="text-sm font-extrabold tracking-wider uppercase text-white">
            My Stage Pocket
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground border border-border/40">
            {pocketSets.length} {pocketSets.length === 1 ? 'set' : 'sets'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => router.push('/saved')}
          className="text-xs text-muted-foreground hover:text-setdrift-gold transition-colors flex items-center gap-0.5 font-medium"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal Scrollable Container */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x snap-mandatory">
        {pocketSets.map((set) => {
          const activeTracks = set.tracks ? set.tracks.filter((t) => !t.excluded) : [];
          const totalDurationMs = activeTracks.reduce((acc, t) => acc + (t.durationMs || 210000), 0);
          const totalMinutes = Math.round(totalDurationMs / 60000);

          return (
            <div
              key={`pocket-${set.mbid}`}
              onClick={() => router.push(`/setlist/${set.mbid}?artistName=${encodeURIComponent(set.artistName)}`)}
              className="flex-shrink-0 w-64 p-4 rounded-2xl bg-card/70 hover:bg-card/95 border border-border/50 hover:border-setdrift-gold/40 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group snap-start"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-white group-hover:text-setdrift-gold transition-colors truncate">
                    {set.artistName}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate font-medium">
                    {set.tourName || 'Live Setlist'}
                  </p>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-extrabold bg-setdrift-gold/15 text-setdrift-gold border border-setdrift-gold/30">
                  {set.region}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium pt-2 border-t border-border/30">
                <div className="flex items-center gap-1">
                  <Music className="w-3 h-3 text-emerald-400" />
                  <span>{activeTracks.length} tracks</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>~{totalMinutes} min</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
