import { create } from 'zustand';
import { AggregatedTrack, SetlistData } from '@/types';
import { saveOfflineSetlist } from '@/utils/offlineStorage';

interface SetlistStore {
  data: SetlistData | null;
  tracks: AggregatedTrack[];
  setData: (data: SetlistData) => void;
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
  setData: (data) => {
    saveOfflineSetlist(data);
    set({ data, tracks: data.tracks });
  },
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

