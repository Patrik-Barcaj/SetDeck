import { NextResponse } from 'next/server';
import { searchSpotifyArtists } from '@/lib/spotify';
import { auth } from '@/lib/auth';

const SETLISTFM_BASE_URL = 'https://api.setlist.fm/rest/1.0';

interface SetlistFmArtist {
  mbid: string;
  name: string;
  sortName?: string;
  disambiguation?: string;
  totalShows?: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    // 1. Primary: search setlist.fm for artists (always works, no rate limit issues)
    const setlistFmResults = await searchSetlistFm(q);

    // 2. Secondary: try Spotify for images/genres (best-effort enrichment)
    const session = await auth();
    let spotifyResults: Array<{
      id: string;
      name: string;
      genres?: string[];
      images?: Array<{ url: string }>;
    }> = [];

    try {
      spotifyResults = (await searchSpotifyArtists(q, session?.accessToken)) || [];
    } catch {
      // Spotify search failed (429, etc.) — proceed without it
    }

    // 3. Merge: use setlist.fm artists as the base, enrich with Spotify data
    if (setlistFmResults.length > 0) {
      const merged = setlistFmResults.map((sfm) => {
        // Try to find matching Spotify artist by name
        const spotifyMatch = spotifyResults.find(
          (sp) => sp.name.toLowerCase() === sfm.name.toLowerCase()
        );
        return {
          id: sfm.mbid,
          mbid: sfm.mbid,
          name: sfm.name,
          genres: spotifyMatch?.genres || [],
          images: spotifyMatch?.images || [],
          disambiguation: sfm.disambiguation || '',
          totalShows: sfm.totalShows,
        };
      });
      return NextResponse.json(merged);
    }

    // 4. Fallback: if setlist.fm returned nothing, use Spotify results mapped to the format
    if (spotifyResults.length > 0) {
      const mapped = spotifyResults.map((sp) => ({
        id: sp.id,
        name: sp.name,
        genres: sp.genres || [],
        images: sp.images || [],
      }));
      return NextResponse.json(mapped);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Search Error:', error);
    return NextResponse.json({ error: 'Failed to search artists' }, { status: 500 });
  }
}

async function searchSetlistFm(query: string): Promise<SetlistFmArtist[]> {
  try {
    const apiKey = process.env.SETLISTFM_API_KEY || '';
    const res = await fetch(
      `${SETLISTFM_BASE_URL}/search/artists?artistName=${encodeURIComponent(query)}&p=1&sort=relevance`,
      {
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      if (res.status === 404) return [];
      console.warn(`Setlist.fm artist search returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const artists: SetlistFmArtist[] = data.artist || [];
    if (artists.length === 0) return [];

    // If only 1 artist returned, return immediately
    if (artists.length === 1) return artists;

    // Check show counts in parallel to bubble up active touring artists with valid shows
    const candidates = artists.slice(0, 8);
    const ranked = await Promise.all(
      candidates.map(async (artist) => {
        try {
          const showRes = await fetch(`${SETLISTFM_BASE_URL}/artist/${artist.mbid}/setlists?p=1`, {
            headers: {
              'x-api-key': apiKey,
              Accept: 'application/json',
            },
          });
          if (!showRes.ok) return { ...artist, totalShows: 0 };
          const showData = await showRes.json();
          return { ...artist, totalShows: showData.total || 0 };
        } catch {
          return { ...artist, totalShows: 0 };
        }
      })
    );

    ranked.sort((a, b) => b.totalShows - a.totalShows);
    return ranked.slice(0, 5);
  } catch (e) {
    console.warn('Setlist.fm search error:', e);
    return [];
  }
}
