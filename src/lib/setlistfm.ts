import { SetlistShow } from '../types';

const BASE_URL = 'https://api.setlist.fm/rest/1.0';

export async function fetchArtistSetlists(mbid: string, page = 1) {
  const url = `${BASE_URL}/artist/${mbid}/setlists?p=${page}`;
  
  const res = await fetch(url, {
    headers: {
      'x-api-key': process.env.SETLISTFM_API_KEY!,
      Accept: 'application/json',
    },
    next: { revalidate: 3600 }, // optionally cache at fetch level if needed
  });

  if (res.status === 404) {
    return { type: 'setlists', items: [], total: 0, page: 1, itemsPerPage: 20 };
  }

  if (!res.ok) {
    throw new Error(`Setlist.fm API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchArtistDetails(mbid: string): Promise<string | null> {
  const url = `${BASE_URL}/artist/${mbid}`;
  try {
    const res = await fetch(url, {
      headers: {
        'x-api-key': process.env.SETLISTFM_API_KEY!,
        Accept: 'application/json',
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.name || null;
  } catch {
    return null;
  }
}

export async function fetchMusicBrainzArtistName(mbid: string): Promise<string | null> {
  try {
    const res = await fetch(`https://musicbrainz.org/ws/2/artist/${mbid}?fmt=json`, {
      headers: {
        'User-Agent': 'SetDeck/1.0 (contact@setdeck.app)',
        Accept: 'application/json',
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.name || null;
  } catch {
    return null;
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchLast10Shows(mbid: string): Promise<{ shows: SetlistShow[], artistName: string }> {
  let validShows: SetlistShow[] = [];
  let page = 1;
  let hasMore = true;
  let artistName = 'Unknown Artist';

  while (validShows.length < 10 && hasMore) {
    const data = await fetchArtistSetlists(mbid, page);
    
    if (!data || !data.setlist || data.setlist.length === 0) {
      hasMore = false;
      break;
    }

    if (artistName === 'Unknown Artist') {
      if (data.artist?.name) {
        artistName = data.artist.name;
      } else if (data.setlist?.[0]?.artist?.name) {
        artistName = data.setlist[0].artist.name;
      } else {
        const found = data.setlist?.find((s: { artist?: { name?: string } }) => s.artist?.name);
        if (found?.artist?.name) {
          artistName = found.artist.name;
        }
      }
    }

    // A valid show is one that has at least one set with songs
    const pageValidShows = data.setlist.filter(
      (s: { sets?: { set?: { song?: unknown[] }[] } }) => 
        s.sets && s.sets.set && s.sets.set.some((set) => set.song && set.song.length > 0)
    ) as SetlistShow[];

    validShows = [...validShows, ...pageValidShows];
    
    // Check if we've reached the end of the available pages
    if (page * data.itemsPerPage >= data.total) {
      hasMore = false;
    }

    page++;

    // Safety limit to avoid infinite loops or crazy high API usage if an artist has hundreds of empty shows
    if (page > 5) break; 

    // Respect Setlist.fm rate limits (2 requests per second recommended)
    if (validShows.length < 10 && hasMore) {
      await delay(500);
    }
  }

  if (artistName === 'Unknown Artist' && validShows.length > 0) {
    const showWithArtist = validShows.find((s) => s.artist?.name);
    if (showWithArtist?.artist?.name) {
      artistName = showWithArtist.artist.name;
    }
  }

  // Fallback to direct artist lookup if still Unknown Artist
  if (artistName === 'Unknown Artist') {
    const setlistArtistName = await fetchArtistDetails(mbid);
    if (setlistArtistName) {
      artistName = setlistArtistName;
    } else {
      const mbArtistName = await fetchMusicBrainzArtistName(mbid);
      if (mbArtistName) {
        artistName = mbArtistName;
      }
    }
  }

  // We only need the last 10 valid shows
  return { shows: validShows.slice(0, 10), artistName };
}
