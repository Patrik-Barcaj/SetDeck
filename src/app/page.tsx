'use client';

import { SearchBar } from '@/components/shared/SearchBar';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Home() {
  const { recentSearches, removeSearch } = useRecentSearches();
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-background via-background to-[#082010]">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-setdeck-gold/10 blur-[120px] pointer-events-none animate-mesh-flow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-setdeck-gold/5 blur-[120px] pointer-events-none animate-mesh-flow" style={{ animationDelay: '5s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl mx-auto flex flex-col items-center text-center z-10"
      >
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          Prepare for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-setdeck-gold to-amber-300">Show</span>.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl font-medium leading-relaxed px-4">
          SetDeck aggregates an artist&apos;s recent setlists to create the ultimate live warm-up playlist on Spotify.
        </p>

        <div className="w-full mb-16">
          <SearchBar />
        </div>

        {recentSearches.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="w-full max-w-2xl text-left"
          >
            <h3 className="text-lg font-medium mb-4 text-muted-foreground">Recent Searches</h3>
            <div className="flex flex-col gap-1">
              {recentSearches.slice(0, 4).map((search) => (
                <div key={search.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors group">
                  <div 
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => router.push(`/setlist/${search.id}?artistName=${encodeURIComponent(search.name)}`)}
                  >
                    {search.imageUrl ? (
                      <img src={search.imageUrl} alt={search.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-xs font-bold text-muted-foreground">{search.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="text-sm font-medium">{search.name}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeSearch(search.id); }}
                    className="p-2 text-muted-foreground hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
