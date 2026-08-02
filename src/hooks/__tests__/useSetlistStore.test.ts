import { describe, it, expect, beforeEach } from 'vitest';
import { useSetlistStore } from '../useSetlistStore';
import { AggregatedTrack, SetlistData } from '@/types';

const mockTrack1: AggregatedTrack = {
  id: 'track-1',
  name: 'Enter Sandman',
  count: 10,
  totalShows: 10,
  likelihood: 100,
  badge: 'Green',
  originalOrder: 1,
  isCover: false,
};

const mockTrack2: AggregatedTrack = {
  id: 'track-2',
  name: 'Master of Puppets',
  count: 9,
  totalShows: 10,
  likelihood: 90,
  badge: 'Green',
  originalOrder: 2,
  isCover: false,
};

const mockTrack3: AggregatedTrack = {
  id: 'track-3',
  name: 'One',
  count: 8,
  totalShows: 10,
  likelihood: 80,
  badge: 'Green',
  originalOrder: 3,
  isCover: false,
};

const mockSetlistData: SetlistData = {
  mbid: 'test-mbid',
  artistName: 'Metallica',
  tourName: 'M72 World Tour',
  region: 'World',
  totalValidShows: 10,
  tracks: [mockTrack1, mockTrack2, mockTrack3],
};

describe('useSetlistStore', () => {
  beforeEach(() => {
    useSetlistStore.setState({ data: null, tracks: [] });
  });

  it('initializes with empty data and tracks', () => {
    const state = useSetlistStore.getState();
    expect(state.data).toBeNull();
    expect(state.tracks).toEqual([]);
  });

  it('sets data and initializes tracks', () => {
    useSetlistStore.getState().setData(mockSetlistData);
    const state = useSetlistStore.getState();
    expect(state.data).toEqual(mockSetlistData);
    expect(state.tracks).toHaveLength(3);
    expect(state.tracks[0].name).toBe('Enter Sandman');
  });

  it('adds a track and ignores duplicates with same id', () => {
    useSetlistStore.getState().setData(mockSetlistData);

    const newTrack: AggregatedTrack = {
      id: 'track-4',
      name: 'Fade to Black',
      count: 5,
      totalShows: 10,
      likelihood: 50,
      badge: 'Yellow',
      originalOrder: 4,
      isCover: false,
    };

    useSetlistStore.getState().addTrack(newTrack);
    expect(useSetlistStore.getState().tracks).toHaveLength(4);
    expect(useSetlistStore.getState().tracks[3].id).toBe('track-4');

    // Attempt to add duplicate
    useSetlistStore.getState().addTrack(newTrack);
    expect(useSetlistStore.getState().tracks).toHaveLength(4);
  });

  it('removes a track by id', () => {
    useSetlistStore.getState().setData(mockSetlistData);
    useSetlistStore.getState().removeTrack('track-2');

    const tracks = useSetlistStore.getState().tracks;
    expect(tracks).toHaveLength(2);
    expect(tracks.find((t) => t.id === 'track-2')).toBeUndefined();
    expect(tracks[0].id).toBe('track-1');
    expect(tracks[1].id).toBe('track-3');
  });

  it('reorders tracks properly', () => {
    useSetlistStore.getState().setData(mockSetlistData);
    // Move track-3 (index 2) to active position track-1 (index 0)
    useSetlistStore.getState().reorderTracks('track-3', 'track-1');

    const tracks = useSetlistStore.getState().tracks;
    expect(tracks.map((t) => t.id)).toEqual(['track-3', 'track-1', 'track-2']);
  });

  it('shuffles tracks retaining the same items', () => {
    useSetlistStore.getState().setData(mockSetlistData);
    useSetlistStore.getState().toggleShuffle();

    const tracks = useSetlistStore.getState().tracks;
    expect(tracks).toHaveLength(3);
    const ids = tracks.map((t) => t.id).sort();
    expect(ids).toEqual(['track-1', 'track-2', 'track-3']);
  });

  it('resets tracks back to original setlist data', () => {
    useSetlistStore.getState().setData(mockSetlistData);
    useSetlistStore.getState().removeTrack('track-1');
    expect(useSetlistStore.getState().tracks).toHaveLength(2);

    useSetlistStore.getState().reset();
    expect(useSetlistStore.getState().tracks).toHaveLength(3);
    expect(useSetlistStore.getState().tracks[0].id).toBe('track-1');
  });
});
