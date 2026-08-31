'use client';

import { SearchBar } from '@/components/shared/SearchBar';
import { MyStagePocket } from '@/components/my-pocket';
import { TrendingTours } from '@/components/trending-tours';
import { FestivalHubBanner } from '@/components/festival-card';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X, History } from 'lucide-react';

export default function Home() {
  const { recentSearches, removeSearch } = useRecentSearches();
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-6 pb-20 relative overflow-x-hidden bg-[#0D0E12]">
      {/* Background ambient gradient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#F59E0B]/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />

      {/* Hero Section & Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl mx-auto flex flex-col items-center text-center px-4 pt-4 pb-2 z-10"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <span>AI & Live Tour Aggregator</span>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-3 text-white">
          Prepare for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] to-amber-300">Show</span>.
        </h1>

        <p className="text-sm md:text-lg text-muted-foreground mb-8 max-w-2xl font-medium leading-relaxed px-2">
          SetDrift aggregates recent setlists into data-driven, accurate live warm-up playlists on Spotify.
        </p>

        {/* Search Bar - Preserved Core */}
        <div className="w-full mb-6">
          <SearchBar />
        </div>

        {/* Recent Searches (if any) */}
        {recentSearches.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="w-full max-w-2xl text-left mb-4"
          >
            <div className="flex items-center gap-2 mb-2 px-1">
              <History className="w-3.5 h-3.5 text-muted-foreground" />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent Searches</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 4).map((search) => (
                <div
                  key={search.id}
                  className="flex items-center gap-2 bg-secondary/60 hover:bg-secondary border border-border/40 hover:border-[#F59E0B]/40 px-3 py-1.5 rounded-full transition-all cursor-pointer group"
                  onClick={() => router.push(`/setlist/${search.id}?artistName=${encodeURIComponent(search.name)}`)}
                >
                  {search.imageUrl ? (
                    <img src={search.imageUrl} alt={search.name} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      {search.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-white group-hover:text-[#F59E0B] transition-colors">{search.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSearch(search.id);
                    }}
                    className="p-0.5 text-muted-foreground hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Part 2 Components */}
      {/* 1. My Stage Pocket (Reads recent sets, hides if empty) */}
      <MyStagePocket />

      {/* 2. Festival Hub Promotional Banner */}
      <FestivalHubBanner />

      {/* 3. Trending Tours 4-Card Responsive Grid */}
      <TrendingTours />
    </div>
  );
}
