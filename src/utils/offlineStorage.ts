import { SetlistData } from '@/types';

const OFFLINE_SETLISTS_KEY = 'setdrift_offline_setlists';
const OFFLINE_MAX_SETLISTS = 30;
const DB_NAME = 'setdrift_db';
const DB_VERSION = 1;
const STORE_NAME = 'setlists';

export interface StoredOfflineSetlist {
  mbid: string;
  data: SetlistData;
  savedAt: number;
}

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'mbid' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('IndexedDB open error:', request.error);
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

function notifyStorageChange(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('setdrift_storage_change'));
    window.dispatchEvent(new Event('storage'));
  } catch {}
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

export async function getOfflineSetlistAsync(mbid: string): Promise<SetlistData | null> {
  const local = getOfflineSetlist(mbid);
  if (local) return local;

  const db = await openDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(mbid);

      req.onsuccess = () => {
        const result = req.result as StoredOfflineSetlist | undefined;
        resolve(result?.data || null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function saveOfflineSetlist(data: SetlistData): void {
  if (typeof window === 'undefined' || !data || !data.mbid) return;
  
  const entry: StoredOfflineSetlist = {
    mbid: data.mbid,
    data,
    savedAt: Date.now(),
  };

  // Sync to localStorage
  try {
    localStorage.setItem(`${OFFLINE_SETLISTS_KEY}_${data.mbid}`, JSON.stringify(entry));
    const indexRaw = localStorage.getItem(OFFLINE_SETLISTS_KEY);
    const indexList: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    const updatedIndex = [data.mbid, ...indexList.filter((id) => id !== data.mbid)].slice(0, OFFLINE_MAX_SETLISTS);
    localStorage.setItem(OFFLINE_SETLISTS_KEY, JSON.stringify(updatedIndex));
  } catch (e) {
    console.warn('Failed to save offline setlist to localStorage:', e);
  }

  // Also sync to recent searches for consistency
  try {
    const storedSearches = localStorage.getItem('setdrift_recent_searches');
    const list: Array<{ id: string; name: string; imageUrl?: string }> = storedSearches ? JSON.parse(storedSearches) : [];
    const firstTrackImage = data.tracks?.find((t) => t.albumImageUrl)?.albumImageUrl;
    const updatedSearches = [
      { id: data.mbid, name: data.artistName, imageUrl: firstTrackImage },
      ...list.filter((s) => s.id !== data.mbid),
    ].slice(0, OFFLINE_MAX_SETLISTS);
    localStorage.setItem('setdrift_recent_searches', JSON.stringify(updatedSearches));
  } catch {}

  notifyStorageChange();

  // Persist to IndexedDB asynchronously
  openDB().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(entry);
    } catch (e) {
      console.warn('Failed to save setlist to IndexedDB:', e);
    }
  });
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

  // 1. Remove from offline setlist stores
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

  // 2. Also remove from recent searches store
  try {
    const storedSearches = localStorage.getItem('setdrift_recent_searches');
    if (storedSearches) {
      const list: Array<{ id: string; name: string; imageUrl?: string }> = JSON.parse(storedSearches);
      const updatedSearches = list.filter((s) => s.id !== mbid);
      localStorage.setItem('setdrift_recent_searches', JSON.stringify(updatedSearches));
    }
  } catch {}

  notifyStorageChange();

  // 3. Remove from IndexedDB
  openDB().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(mbid);
    } catch {}
  });
}
