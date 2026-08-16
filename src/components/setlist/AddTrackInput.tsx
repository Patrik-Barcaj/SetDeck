'use client';

import { useState } from 'react';
import { Search, Loader2, Plus } from 'lucide-react';
import { useSetlistStore } from '@/hooks/useSetlistStore';
import { AggregatedTrack } from '@/types';
import { toast } from 'sonner';

export function AddTrackInput() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { addTrack, tracks } = useSetlistStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      
      const items = data.tracks;
      if (items && items.length > 0) {
        const track = items[0];
        
        const newTrack: AggregatedTrack = {
          id: `custom-${track.id}`,
          name: track.name,
          count: 1,
          totalShows: 1,
          likelihood: 100,
          badge: 'Green',
          isCover: false,
          originalOrder: tracks.length + 1,
          previewUrl: track.preview_url,
          durationMs: track.duration_ms,
          spotifyUri: track.uri,
        };
        
        addTrack(newTrack);
        setQuery('');
        toast.success(`Added ${track.name}`);
      } else {
        toast.error('No matching track found');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to find track');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border/20">
      <form onSubmit={handleSearch} className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search to add missing track..."
          className="w-full bg-secondary/50 border border-border/50 text-sm rounded-full pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-setdrift-gold transition-shadow placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="absolute inset-y-1.5 right-1.5 flex items-center justify-center w-8 h-8 rounded-full bg-setdrift-gold text-black disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
