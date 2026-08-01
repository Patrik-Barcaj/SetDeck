import { create } from 'zustand';
import { AggregatedTrack, SetlistData } from '@/types';

interface SetlistStore {
  data: SetlistData | null;
  tracks: AggregatedTrack[];
  setData: (data: SetlistData) => void;
  addTrack: (track: AggregatedTrack) => void;
  removeTrack: (id: string) => void;
  reorderTracks: (activeId: string, overId: string) => void;
  toggleShuffle: () => void;
  reset: () => void;
}

export const useSetlistStore = create<SetlistStore>((set) => ({
  data: null,
  tracks: [],
  setData: (data) => set({ data, tracks: data.tracks }),
  addTrack: (track) => 
    set((state) => {
      if (state.tracks.find(t => t.id === track.id)) return state;
      return { tracks: [...state.tracks, track] };
    }),
  removeTrack: (id) =>
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== id),
    })),
  reorderTracks: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.tracks.findIndex((t) => t.id === activeId);
      const newIndex = state.tracks.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;

      const newTracks = [...state.tracks];
      const [movedItem] = newTracks.splice(oldIndex, 1);
      newTracks.splice(newIndex, 0, movedItem);

      return { tracks: newTracks };
    }),
  toggleShuffle: () =>
    set((state) => {
      const shuffled = [...state.tracks].sort(() => Math.random() - 0.5);
      return { tracks: shuffled };
    }),
  reset: () =>
    set((state) => ({
      tracks: state.data ? [...state.data.tracks] : [],
    })),
}));
