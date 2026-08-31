'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { ArtistCard } from './ArtistCard';
import { Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { ArtistResult } from '@/types';
import { toast } from 'sonner';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArtistResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const { addSearch } = useRecentSearches();

  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/setlist/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    performSearch();
  }, [debouncedQuery]);

  const handleSelectArtist = async (artist: ArtistResult) => {
    setIsLoading(true);
    try {
      // If the search result already has an mbid (from setlist.fm), use it directly
      const mbid = (artist as ArtistResult & { mbid?: string }).mbid;
      if (mbid) {
        const imageUrl = artist.images && artist.images.length > 0 ? artist.images[0].url : undefined;
        addSearch({ id: mbid, name: artist.name, imageUrl });
        router.push(`/setlist/${mbid}?artistName=${encodeURIComponent(artist.name)}`);
        return;
      }

      // Fallback: resolve via setlist.fm API
      const res = await fetch(`/api/setlist/resolve?artistName=${encodeURIComponent(artist.name)}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Artist not found on Setlist.fm");
          setIsLoading(false);
          return;
        }
        throw new Error('Resolve failed');
      }
      const data = await res.json();
      
      const imageUrl = artist.images && artist.images.length > 0 ? artist.images[0].url : undefined;
      addSearch({ id: data.mbid, name: artist.name, imageUrl });
      
      router.push(`/setlist/${data.mbid}?artistName=${encodeURIComponent(artist.name)}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect to Setlist.fm");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <input
          type="text"
          className="w-full bg-[#1b1b1b] border border-border/20 rounded-full py-4 pl-14 pr-12 text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:shadow-[0_0_30px_rgba(245,158,11,0.25)] transition-all"
          placeholder="Search for an artist..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
        )}
      </div>

      {query.trim() && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-4 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="p-2">
            {results.map((artist) => (
              <ArtistCard
                key={artist.id}
                name={artist.name}
                genres={artist.genres}
                imageUrl={artist.images?.[0]?.url}
                onClick={() => handleSelectArtist(artist)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
