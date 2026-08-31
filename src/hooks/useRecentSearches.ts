import { useState, useEffect, useCallback } from 'react';
import { removeOfflineSetlist } from '@/utils/offlineStorage';

export interface RecentSearch {
  id: string; // mbid
  name: string;
  imageUrl?: string;
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  const loadSearches = useCallback(() => {
    try {
      const stored = localStorage.getItem('setdrift_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      } else {
        setRecentSearches([]);
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  useEffect(() => {
    loadSearches();

    const handleStorageChange = () => {
      loadSearches();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('setdrift_storage_change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('setdrift_storage_change', handleStorageChange);
    };
  }, [loadSearches]);

  const addSearch = (search: RecentSearch) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.id !== search.id);
      const updated = [search, ...filtered].slice(0, 20);
      try {
        localStorage.setItem('setdrift_recent_searches', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('setdrift_storage_change'));
      } catch (e) {
        console.error('Failed to save recent searches', e);
      }
      return updated;
    });
  };

  const removeSearch = (id: string) => {
    removeOfflineSetlist(id);
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('setdrift_recent_searches', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('setdrift_storage_change'));
      } catch (e) {
        console.error('Failed to save recent searches', e);
      }
      return updated;
    });
  };

  return { recentSearches, addSearch, removeSearch };
}
