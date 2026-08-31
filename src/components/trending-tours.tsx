'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Flame, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrendingArtist {
  id: string;
  mbid: string;
  name: string;
  tour: string;
  imageUrl: string;
}

const TRENDING_TOURS: TrendingArtist[] = [
  {
    id: 'coldplay',
    mbid: 'cc197bad-dc9c-440d-a5b5-d52ba2e14234',
    name: 'Coldplay',
    tour: 'Music of the Spheres Tour',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'metallica',
    mbid: '65f4f0c5-ef9e-490c-aee3-992688b82882',
    name: 'Metallica',
    tour: 'M72 World Tour',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'dua-lipa',
    mbid: '0e4a2b09-77b6-4609-bda3-22da4692c124',
    name: 'Dua Lipa',
    tour: 'Radical Optimism Tour',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'billie-eilish',
    mbid: 'f4abc0b5-3f7a-4eff-8f78-ac078dbce533',
    name: 'Billie Eilish',
    tour: 'Hit Me Hard and Soft: The Tour',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800&auto=format&fit=crop',
  },
];

export function TrendingTours() {
  const router = useRouter();

  const handleSelect = (artist: TrendingArtist) => {
    router.push(`/setlist/${artist.mbid}?artistName=${encodeURIComponent(artist.name)}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 px-4">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Flame className="w-3.5 h-3.5 fill-amber-400" />
        </div>
        <h3 className="text-sm font-extrabold tracking-wider uppercase text-white">
          Trending Tours
        </h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {TRENDING_TOURS.map((artist, idx) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            onClick={() => handleSelect(artist)}
            className="h-56 rounded-2xl overflow-hidden relative group border border-white/5 bg-[#161820] cursor-pointer shadow-md hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all duration-300 active:scale-[0.98]"
          >
            {/* Cover Image with smooth hover micro-zoom */}
            <Image
              src={artist.imageUrl}
              alt={artist.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-85"
              sizes="(max-width: 768px) 50vw, 25vw"
            />

            {/* Smooth bottom gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E12] via-black/40 to-transparent" />

            {/* Bottom-left Content */}
            <div className="absolute bottom-3.5 left-3.5 right-12 pointer-events-none">
              <h4 className="text-sm md:text-base font-black text-white group-hover:text-amber-300 transition-colors leading-tight truncate">
                {artist.name}
              </h4>
              <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                {artist.tour}
              </p>
            </div>

            {/* Floating Action Button (FAB) */}
            <div className="absolute bottom-3.5 right-3.5 w-8 h-8 rounded-full bg-setdrift-gold text-black flex items-center justify-center scale-100 group-hover:scale-110 shadow-lg shadow-amber-500/25 transition-transform duration-200">
              <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
