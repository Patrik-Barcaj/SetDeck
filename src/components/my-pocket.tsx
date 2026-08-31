'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllOfflineSetlists } from '@/utils/offlineStorage';
import { SetlistData } from '@/types';
import { Bookmark, Play, ChevronRight } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-setdrift-gold/15 border border-setdrift-gold/30 flex items-center justify-center text-setdrift-gold">
            <Bookmark className="w-3.5 h-3.5 fill-setdrift-gold" />
          </div>
          <h3 className="text-sm font-extrabold tracking-wider uppercase text-white">
            My Stage Pocket
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground border border-border/40">
            {pocketSets.length}
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

      {/* Horizontal Scrollable Visual Tiles */}
      <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory">
        {pocketSets.map((set) => {
          const firstTrackWithImage = set.tracks?.find((t) => t.albumImageUrl);
          const coverImage =
            firstTrackWithImage?.albumImageUrl ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop';

          return (
            <div
              key={`pocket-${set.mbid}`}
              onClick={() =>
                router.push(`/setlist/${set.mbid}?artistName=${encodeURIComponent(set.artistName)}`)
              }
              className="flex-shrink-0 w-60 h-56 rounded-2xl overflow-hidden relative group border border-white/5 bg-[#161820] shadow-md hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all duration-300 cursor-pointer snap-start active:scale-[0.98]"
            >
              {/* Cover Image with hover zoom */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt={set.artistName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-65 group-hover:opacity-85"
              />

              {/* Bottom gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E12] via-black/40 to-transparent" />

              {/* Top region badge */}
              <div className="absolute top-3 left-3 pointer-events-none">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-black/60 backdrop-blur-md text-setdrift-gold border border-setdrift-gold/30">
                  {set.region} Tour
                </span>
              </div>

              {/* Bottom-left Content */}
              <div className="absolute bottom-3.5 left-3.5 right-12 pointer-events-none">
                <h4 className="text-sm md:text-base font-black text-white group-hover:text-amber-300 transition-colors leading-tight truncate">
                  {set.artistName}
                </h4>
                <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                  {set.tourName || 'Live Setlist'}
                </p>
              </div>

              {/* Floating Action Button (FAB) */}
              <div className="absolute bottom-3.5 right-3.5 w-8 h-8 rounded-full bg-setdrift-gold text-black flex items-center justify-center scale-100 group-hover:scale-110 shadow-lg shadow-amber-500/25 transition-transform duration-200">
                <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
