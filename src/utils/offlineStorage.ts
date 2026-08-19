import { SetlistData } from '@/types';

const OFFLINE_SETLISTS_KEY = 'setdrift_offline_setlists';
const OFFLINE_MAX_SETLISTS = 25;

export interface StoredOfflineSetlist {
  mbid: string;
  data: SetlistData;
  savedAt: number;
}

export function getOfflineSetlist(mbid: string): SetlistData | null {
  if (typeof window === 'undefined' || !mbid) return null;
  try {
    const raw = localStorage.getItem(`${OFFLINE_SETLISTS_KEY}_${mbid}`);
    if (raw) {
      const parsed: StoredOfflineSetlist = JSON.parse(raw);
      return parsed.data;
    }
  } catch (e) {
    console.warn('Failed to read offline setlist from localStorage:', e);
  }
  return null;
}

export function saveOfflineSetlist(data: SetlistData): void {
  if (typeof window === 'undefined' || !data || !data.mbid) return;
  try {
    const entry: StoredOfflineSetlist = {
      mbid: data.mbid,
      data,
      savedAt: Date.now(),
    };
    localStorage.setItem(`${OFFLINE_SETLISTS_KEY}_${data.mbid}`, JSON.stringify(entry));

    // Update index of saved mbid keys
    const indexRaw = localStorage.getItem(OFFLINE_SETLISTS_KEY);
    const indexList: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    const updatedIndex = [data.mbid, ...indexList.filter((id) => id !== data.mbid)].slice(0, OFFLINE_MAX_SETLISTS);
    localStorage.setItem(OFFLINE_SETLISTS_KEY, JSON.stringify(updatedIndex));
  } catch (e) {
    console.warn('Failed to save offline setlist to localStorage:', e);
  }
}

export function getAllOfflineSetlists(): SetlistData[] {
  if (typeof window === 'undefined') return [];
  try {
    const indexRaw = localStorage.getItem(OFFLINE_SETLISTS_KEY);
    if (!indexRaw) return [];
    const indexList: string[] = JSON.parse(indexRaw);
    return indexList
      .map((mbid) => getOfflineSetlist(mbid))
      .filter((s): s is SetlistData => Boolean(s));
  } catch (e) {
    console.warn('Failed to get all offline setlists:', e);
    return [];
  }
}

export function removeOfflineSetlist(mbid: string): void {
  if (typeof window === 'undefined' || !mbid) return;
  try {
    localStorage.removeItem(`${OFFLINE_SETLISTS_KEY}_${mbid}`);
    const indexRaw = localStorage.getItem(OFFLINE_SETLISTS_KEY);
    if (indexRaw) {
      const indexList: string[] = JSON.parse(indexRaw);
      const updatedIndex = indexList.filter((id) => id !== mbid);
      localStorage.setItem(OFFLINE_SETLISTS_KEY, JSON.stringify(updatedIndex));
    }
  } catch (e) {
    console.warn('Failed to remove offline setlist from localStorage:', e);
  }
}
