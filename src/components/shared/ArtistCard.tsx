'use client';

import Image from 'next/image';

interface ArtistCardProps {
  name: string;
  imageUrl?: string;
  genres?: string[];
  disambiguation?: string;
  onClick: () => void;
}

export function ArtistCard({ name, imageUrl, genres, disambiguation, onClick }: ArtistCardProps) {
  const subtitle = disambiguation || (genres && genres.length > 0 ? genres.slice(0, 3).join(', ') : undefined);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-secondary/50 transition-colors text-left border border-transparent hover:border-border"
    >
      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-muted relative">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-lg">
            ?
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <h3 className="text-lg font-bold truncate">{name}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}
