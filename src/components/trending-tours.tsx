'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Flame, MapPin, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrendingArtist {
  id: string;
  mbid: string;
  name: string;
  tour: string;
  genre: string;
  location: string;
  imageUrl: string;
  gradient: string;
}

const TRENDING_TOURS: TrendingArtist[] = [
  {
    id: 'coldplay',
    mbid: 'cc197bad-dc9c-440d-a5b5-d52ba2e14234',
    name: 'Coldplay',
    tour: 'Music of the Spheres Tour',
    genre: 'Pop / Alternative',
    location: 'World Tour',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    gradient: 'from-amber-500/20 via-zinc-900/60 to-black',
  },
  {
    id: 'metallica',
    mbid: '65f4f0c5-ef9e-490c-aee3-992688b82882',
    name: 'Metallica',
    tour: 'M72 World Tour',
    genre: 'Heavy Metal',
    location: 'Stadiums',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    gradient: 'from-yellow-500/20 via-zinc-900/60 to-black',
  },
  {
    id: 'dua-lipa',
    mbid: '0e4a2b09-77b6-4609-bda3-22da4692c124',
    name: 'Dua Lipa',
    tour: 'Radical Optimism Tour',
    genre: 'Dance Pop',
    location: 'Global Arenas',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop',
    gradient: 'from-purple-500/20 via-zinc-900/60 to-black',
  },
  {
    id: 'billie-eilish',
    mbid: 'f4abc0b5-3f7a-4eff-8f78-ac078dbce533',
    name: 'Billie Eilish',
    tour: 'Hit Me Hard and Soft: The Tour',
    genre: 'Alt Pop',
    location: 'North America / EU',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800&auto=format&fit=crop',
    gradient: 'from-cyan-500/20 via-zinc-900/60 to-black',
  },
];

export function TrendingTours() {
  const router = useRouter();

  const handleSelect = (artist: TrendingArtist) => {
    router.push(`/setlist/${artist.mbid}?artistName=${encodeURIComponent(artist.name)}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 px-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
          </div>
          <h3 className="text-sm font-extrabold tracking-wider uppercase text-white">
            Trending Tours
          </h3>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Active Now
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Instant 1-Click Aggregation
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TRENDING_TOURS.map((artist, idx) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            onClick={() => handleSelect(artist)}
            className="group relative h-48 rounded-2xl overflow-hidden border border-border/50 hover:border-setdrift-gold/50 shadow-md hover:shadow-[0_0_30px_rgba(245,158,11,0.18)] cursor-pointer transition-all duration-300 active:scale-[0.98]"
          >
            {/* Background Image with smooth zoom on hover */}
            <Image
              src={artist.imageUrl}
              alt={artist.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-75"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />

            {/* Gradient Overlays */}
            <div className={`absolute inset-0 bg-gradient-to-t ${artist.gradient}`} />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />

            {/* Top Badge */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-black/70 backdrop-blur-md text-setdrift-gold border border-setdrift-gold/30">
                {artist.genre}
              </span>
              <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-setdrift-gold group-hover:text-black transition-all">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
              <h4 className="text-base font-black text-white group-hover:text-amber-300 transition-colors leading-tight mb-0.5 truncate">
                {artist.name}
              </h4>
              <p className="text-xs text-zinc-300 font-medium truncate mb-1">
                {artist.tour}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold">
                <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">{artist.location}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
