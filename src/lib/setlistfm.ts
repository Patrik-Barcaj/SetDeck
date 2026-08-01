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

    if (page === 1 && data.artist && data.artist.name) {
      artistName = data.artist.name;
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

  // We only need the last 10 valid shows
  return { shows: validShows.slice(0, 10), artistName };
}
