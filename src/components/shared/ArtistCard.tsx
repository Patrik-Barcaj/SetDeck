'use client';

import Image from 'next/image';
import { Radio } from 'lucide-react';

interface ArtistCardProps {
  name: string;
  imageUrl?: string;
  genres?: string[];
  disambiguation?: string;
  totalShows?: number;
  onClick: () => void;
}

export function ArtistCard({
  name,
  imageUrl,
  genres,
  disambiguation,
  totalShows,
  onClick,
}: ArtistCardProps) {
  const genreText = genres && genres.length > 0 ? genres.slice(0, 2).join(', ') : undefined;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 w-full p-3.5 rounded-xl hover:bg-[#1f222e] transition-colors text-left border border-transparent hover:border-amber-500/20 group"
    >
      <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-muted relative border border-white/10 group-hover:border-amber-500/40 transition-colors">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-lg">
            ?
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors truncate">
            {name}
          </h3>
          {typeof totalShows === 'number' && totalShows > 0 && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>{totalShows.toLocaleString()} {totalShows === 1 ? 'show' : 'shows'}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400 truncate mt-0.5">
          {disambiguation && (
            <span className="font-semibold text-zinc-300">
              {disambiguation}
            </span>
          )}
          {disambiguation && genreText && <span>•</span>}
          {genreText && (
            <span className="truncate">
              {genreText}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
