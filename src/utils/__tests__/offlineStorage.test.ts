import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveOfflineSetlist,
  getOfflineSetlist,
  getAllOfflineSetlists,
  removeOfflineSetlist,
} from '../offlineStorage';
import { SetlistData } from '@/types';

const mockData: SetlistData = {
  mbid: 'test-artist-123',
  artistName: 'Radiohead',
  tourName: '2026 World Tour',
  region: 'World',
  totalValidShows: 10,
  tracks: [
    {
      id: 'track-1',
      name: 'Karma Police',
      count: 10,
      totalShows: 10,
      likelihood: 100,
      badge: 'Green',
      originalOrder: 1,
      section: 'Main Set',
      isCover: false,
    },
  ],
};

// Mock localStorage for Node test environment
let store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    store = {};
  },
};

Object.defineProperty(global, 'window', {
  value: { localStorage: mockLocalStorage },
  writable: true,
});
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('offlineStorage utility', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });


  it('saves and retrieves an offline setlist', () => {
    saveOfflineSetlist(mockData);
    const retrieved = getOfflineSetlist('test-artist-123');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.artistName).toBe('Radiohead');
    expect(retrieved?.tracks[0].name).toBe('Karma Police');
  });

  it('returns null for non-existent mbid', () => {
    const result = getOfflineSetlist('nonexistent-mbid');
    expect(result).toBeNull();
  });

  it('lists all saved offline setlists', () => {
    saveOfflineSetlist(mockData);
    saveOfflineSetlist({
      ...mockData,
      mbid: 'test-artist-456',
      artistName: 'The Smile',
    });

    const all = getAllOfflineSetlists();
    expect(all).toHaveLength(2);
    expect(all.map((s) => s.artistName)).toContain('Radiohead');
    expect(all.map((s) => s.artistName)).toContain('The Smile');
  });

  it('removes an offline setlist by mbid', () => {
    saveOfflineSetlist(mockData);
    expect(getOfflineSetlist('test-artist-123')).not.toBeNull();

    removeOfflineSetlist('test-artist-123');
    expect(getOfflineSetlist('test-artist-123')).toBeNull();
  });
});
