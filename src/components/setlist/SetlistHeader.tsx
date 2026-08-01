'use client';

import { useSetlistStore } from '@/hooks/useSetlistStore';
import { Shuffle, RotateCcw, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export function SetlistHeader() {
  const { data, toggleShuffle, reset } = useSetlistStore();

  if (!data) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/40 py-3 px-4 mb-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 -ml-2 text-muted-foreground hover:text-setdeck-gold transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-base font-bold truncate max-w-[140px] sm:max-w-[200px] md:max-w-xs">
            {data.artistName}
          </h1>
          <p className="text-xs text-setdeck-gold truncate max-w-[140px] sm:max-w-[200px] md:max-w-xs">
            {data.tourName}
          </p>
        </div>
      </div>
      
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
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-setdeck-gold text-black hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all font-bold"
        >
          <Shuffle className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Shuffle</span>
        </button>
      </div>
    </div>
  );
}
