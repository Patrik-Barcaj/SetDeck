'use client';

import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Library, Disc, ArrowRight, Music, Trash2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function SavedPage() {
  const { recentSearches, removeSearch } = useRecentSearches();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground pt-16 pb-28 px-4 max-w-lg mx-auto flex flex-col gap-6">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Library className="w-5 h-5 text-setdrift-gold" />
            Saved & Recent
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your generated warm-up setlists and recent tour artists
          </p>
        </div>
      </motion.div>

      {recentSearches.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-2.5"
        >
          {recentSearches.map((search) => (
            <div
              key={search.id}
              onClick={() => router.push(`/setlist/${search.id}?artistName=${encodeURIComponent(search.name)}`)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/40 border border-border/40 hover:border-setdrift-gold/50 hover:bg-secondary/70 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {search.imageUrl ? (
                  <img
                    src={search.imageUrl}
                    alt={search.name}
                    className="w-12 h-12 rounded-xl object-cover border border-border shrink-0 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-border shrink-0">
                    <Disc className="w-6 h-6 text-setdrift-gold" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate group-hover:text-setdrift-gold transition-colors">
                    {search.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Music className="w-3 h-3 text-setdrift-gold" />
                    <span>Live Warm-Up Setlist</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSearch(search.id);
                  }}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="p-2 text-muted-foreground group-hover:text-setdrift-gold transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-secondary/20 border border-border/40 mt-12 gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-setdrift-gold/10 border border-setdrift-gold/30 flex items-center justify-center text-setdrift-gold">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-base">No Saved Setlists Yet</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Search for any tour artist to generate live warm-up setlists. They will automatically appear here for quick access.
            </p>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-setdrift-gold text-black font-bold text-xs hover:bg-amber-400 transition-all shadow-md mt-2"
          >
            Find an Artist
          </Link>
        </motion.div>
      )}
    </div>
  );
}
