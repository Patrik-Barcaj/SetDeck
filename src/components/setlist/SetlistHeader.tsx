'use client';

import { useSetlistStore } from '@/hooks/useSetlistStore';
import { Shuffle, RotateCcw } from 'lucide-react';

export function SetlistHeader() {
  const { data, toggleShuffle, reset } = useSetlistStore();

  if (!data) return null;

  return (
    <div className="w-full relative overflow-hidden py-20 px-6 mb-8 rounded-b-[3rem] shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-spotify-green/30 via-background to-black pointer-events-none" />
      <div className="absolute top-[-30%] left-[-10%] w-[70%] h-[70%] rounded-full bg-spotify-green/20 blur-[100px] pointer-events-none animate-mesh-flow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none animate-mesh-flow" style={{ animationDelay: '3s' }} />
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            {data.artistName}
          </h1>
          <p className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-spotify-green to-emerald-400 font-bold">
            {data.tourName}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Based on the last {data.totalValidShows} shows
          </p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/80 backdrop-blur-md hover:bg-secondary border border-border/50 hover:border-border transition-all shadow-lg"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-bold">Original Order</span>
          </button>
          <button
            onClick={toggleShuffle}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-spotify-green text-black hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(29,185,84,0.3)] font-bold"
          >
            <Shuffle className="w-4 h-4" />
            <span className="text-sm">Shuffle</span>
          </button>
        </div>
      </div>
    </div>
  );
}
