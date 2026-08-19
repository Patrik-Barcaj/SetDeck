import { create } from 'zustand';
import { AggregatedTrack, SetlistData } from '@/types';
import { saveOfflineSetlist } from '@/utils/offlineStorage';

interface SetlistStore {
  data: SetlistData | null;
  tracks: AggregatedTrack[];
  mode: 'headline' | 'festival';
  setData: (data: SetlistData) => void;
  setMode: (mode: 'headline' | 'festival') => void;
  addTrack: (track: AggregatedTrack) => void;
  removeTrack: (id: string) => void;
  reorderTracks: (activeId: string, overId: string) => void;
  toggleExclude: (id: string) => void;
  toggleShuffle: () => void;
  reset: () => void;
}

export const useSetlistStore = create<SetlistStore>((set) => ({
  data: null,
  tracks: [],
  mode: 'headline',
  setData: (data) => {
    saveOfflineSetlist(data);
    set({ data, tracks: data.tracks, mode: data.mode || 'headline' });
  },
  setMode: (mode) =>
    set((state) => {
      if (!state.data) return { mode };
      if (mode === 'festival') {
        const targetCount = 11;
        const mandatoryTracks = state.data.tracks.filter((t) => t.isOpener || t.isCloser || t.likelihood >= 85);
        const remainingSlots = Math.max(0, targetCount - mandatoryTracks.length);
        const otherTracks = state.data.tracks
          .filter((t) => !mandatoryTracks.some((m) => m.id === t.id))
          .sort((a, b) => b.likelihood - a.likelihood)
          .slice(0, remainingSlots);

        const festivalSubset = [...mandatoryTracks, ...otherTracks];
        const condensed = state.data.tracks.filter((t) => festivalSubset.some((f) => f.id === t.id));
        return { mode, tracks: condensed };
      } else {
        return { mode, tracks: state.data.tracks };
      }
    }),
  addTrack: (track) => 
    set((state) => {
      if (state.tracks.find(t => t.id === track.id)) return state;
      const updatedTracks = [...state.tracks, track];
      if (state.data) {
        saveOfflineSetlist({ ...state.data, tracks: updatedTracks });
      }
      return { tracks: updatedTracks };
    }),
  removeTrack: (id) =>
    set((state) => {
      const updatedTracks = state.tracks.filter((t) => t.id !== id);
      if (state.data) {
        saveOfflineSetlist({ ...state.data, tracks: updatedTracks });
      }
      return { tracks: updatedTracks };
    }),
  reorderTracks: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.tracks.findIndex((t) => t.id === activeId);
      const newIndex = state.tracks.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;

      const newTracks = [...state.tracks];
      const [movedItem] = newTracks.splice(oldIndex, 1);
      newTracks.splice(newIndex, 0, movedItem);

      if (state.data) {
        saveOfflineSetlist({ ...state.data, tracks: newTracks });
      }

      return { tracks: newTracks };
    }),
  toggleExclude: (id) =>
    set((state) => {
      const updatedTracks = state.tracks.map((t) =>
        t.id === id ? { ...t, excluded: !t.excluded } : t
      );
      if (state.data) {
        saveOfflineSetlist({ ...state.data, tracks: updatedTracks });
      }
      return { tracks: updatedTracks };
    }),
  toggleShuffle: () =>
    set((state) => {
      const shuffled = [...state.tracks].sort(() => Math.random() - 0.5);
      if (state.data) {
        saveOfflineSetlist({ ...state.data, tracks: shuffled });
      }
      return { tracks: shuffled };
    }),
  reset: () =>
    set((state) => {
      const originalTracks = state.data ? [...state.data.tracks] : [];
      if (state.data) {
        saveOfflineSetlist({ ...state.data, tracks: originalTracks });
      }
      return { tracks: originalTracks };
    }),
}));

