'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Plus, Music, Clock } from 'lucide-react';
import { useSetlistStore } from '@/hooks/useSetlistStore';
import { useDebounce } from '@/hooks/useDebounce';
import { AggregatedTrack } from '@/types';
import { toast } from 'sonner';

interface SpotifySearchTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  preview_url?: string | null;
  album?: {
    name?: string;
    release_date?: string;
    images?: Array<{ url: string; height?: number; width?: number }>;
  };
  artists?: Array<{ id: string; name: string }>;
}

export function AddTrackInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifySearchTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);
  const { data, tracks, addTrack } = useSetlistStore();
  const artistName = data?.artistName || '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live track suggestions scoped to current artist
  useEffect(() => {
    async function searchTracks() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsSearching(true);
      try {
        const artistParam = artistName ? `&artist=${encodeURIComponent(artistName)}` : '';
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(debouncedQuery)}${artistParam}`);
        if (!res.ok) throw new Error('Search failed');
        const searchData = await res.json();
        const items: SpotifySearchTrack[] = searchData.tracks || [];
        setResults(items);
        setIsOpen(items.length > 0);
      } catch (e) {
        console.warn('Track search error:', e);
      } finally {
        setIsSearching(false);
      }
    }

    searchTracks();
  }, [debouncedQuery, artistName]);

  const handleSelectTrack = (track: SpotifySearchTrack) => {
    // Check if track is already in setlist
    if (tracks.some((t) => t.name.toLowerCase() === track.name.toLowerCase())) {
      toast.info(`"${track.name}" is already in the setlist`);
      setQuery('');
      setIsOpen(false);
      return;
    }

    const releaseDate = track.album?.release_date;
    const releaseYear = releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : undefined;
    const albumImageUrl = track.album?.images?.[0]?.url;

    const newTrack: AggregatedTrack = {
      id: `custom-${track.id || Date.now()}`,
      name: track.name,
      count: 1,
      totalShows: 1,
      likelihood: 100,
      badge: 'Green',
      tourEvolution: 'NEW TO TOUR',
      isCover: false,
      originalOrder: tracks.length + 1,
      previewUrl: track.preview_url || null,
      durationMs: track.duration_ms,
      spotifyUri: track.uri,
      albumName: track.album?.name,
      albumImageUrl,
      releaseYear,
    };

    addTrack(newTrack);
    setQuery('');
    setIsOpen(false);
    setResults([]);
    toast.success(`Added "${track.name}" to setlist`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelectTrack(results[0]);
    } else if (query.trim()) {
      // Direct custom track addition if no Spotify match
      const manualTrack: AggregatedTrack = {
        id: `custom-${Date.now()}`,
        name: query.trim(),
        count: 1,
        totalShows: 1,
        likelihood: 100,
        badge: 'Green',
        tourEvolution: 'NEW TO TOUR',
        isCover: false,
        originalOrder: tracks.length + 1,
      };
      addTrack(manualTrack);
      setQuery('');
      setIsOpen(false);
      toast.success(`Added "${manualTrack.name}" to setlist`);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="mt-4 pt-4 border-t border-border/20 relative z-30">
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          value={query}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={artistName ? `Search songs by ${artistName} to add...` : 'Search to add a track...'}
          className="w-full bg-[#161820] border border-zinc-700/60 text-sm rounded-full pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all placeholder:text-zinc-400 text-white shadow-inner"
        />
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="absolute inset-y-1.5 right-1.5 flex items-center justify-center w-8 h-8 rounded-full bg-setdrift-gold text-black disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-md"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </form>

      {/* Live Track Results Dropdown Scoped to Artist */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#161820] border border-amber-500/20 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 max-h-72 overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            {artistName ? `Tracks by ${artistName}` : 'Suggested Tracks'}
          </div>
          {results.map((track) => {
            const albumImage = track.album?.images?.[0]?.url;
            const releaseYear = track.album?.release_date?.slice(0, 4);

            return (
              <div
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {albumImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={albumImage}
                      alt={track.name}
                      className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10 shrink-0 text-zinc-400">
                      <Music className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {track.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate mt-0.5">
                      <span className="truncate">{track.album?.name || artistName}</span>
                      {releaseYear && <span>• {releaseYear}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {track.duration_ms && (
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(track.duration_ms)}
                    </span>
                  )}
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
