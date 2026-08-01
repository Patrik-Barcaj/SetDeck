'use client';

import { SearchBar } from '@/components/shared/SearchBar';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { ArtistCard } from '@/components/shared/ArtistCard';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Home() {
  const { recentSearches } = useRecentSearches();
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-background via-background to-[#082010]">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-spotify-green/10 blur-[120px] pointer-events-none animate-mesh-flow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-spotify-green/5 blur-[120px] pointer-events-none animate-mesh-flow" style={{ animationDelay: '5s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl mx-auto flex flex-col items-center text-center z-10"
      >
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-6">
          Prepare for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-spotify-green to-emerald-300">Show</span>.
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl font-medium leading-relaxed">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentSearches.slice(0, 4).map((search) => (
                <ArtistCard
                  key={search.id}
                  name={search.name}
                  imageUrl={search.imageUrl}
                  onClick={() => router.push(`/setlist/${search.id}`)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
