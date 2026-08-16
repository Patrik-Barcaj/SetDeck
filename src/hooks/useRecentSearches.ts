import { useState, useEffect } from 'react';

export interface RecentSearch {
  id: string; // mbid
  name: string;
  imageUrl?: string;
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('setdrift_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  const addSearch = (search: RecentSearch) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.id !== search.id);
      const updated = [search, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('setdrift_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent searches', e);
      }
      return updated;
    });
  };

  const removeSearch = (id: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('setdrift_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent searches', e);
      }
      return updated;
    });
  };

  return { recentSearches, addSearch, removeSearch };
}
