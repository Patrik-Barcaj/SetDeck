import { NextResponse } from 'next/server';
import { getClientCredentialsToken } from '@/lib/spotify';
import { getCatalogTrack } from '@/lib/trackCatalog';
import { auth } from '@/lib/auth';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const artist = (searchParams.get('artist') || searchParams.get('artistName') || '').trim();

  if (!q) {
    return NextResponse.json({ tracks: [] });
  }

  try {
    const session = await auth();
    const token = session?.accessToken || (await getClientCredentialsToken());

    if (token) {
      // 1. First try strictly scoping: "track:TITLE artist:ARTIST"
      const scopedQuery = artist ? `track:${q} artist:${artist}` : q;
      let url = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(scopedQuery)}&type=track&limit=10`;
      let res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data = res.ok ? await res.json() : null;
      let items = data?.tracks?.items || [];

      // 2. Fallback: if strict field filter was too restrictive, try "ARTIST TITLE"
      if (items.length === 0 && artist) {
        url = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(`${artist} ${q}`)}&type=track&limit=10`;
        res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          data = await res.json();
          items = data?.tracks?.items || [];
        }
      }

      // 3. Fallback: generic query if still empty
      if (items.length === 0) {
        url = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(q)}&type=track&limit=10`;
        res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          data = await res.json();
          items = data?.tracks?.items || [];
        }
      }

      if (items.length > 0) {
        return NextResponse.json({ tracks: items });
      }
    }

    // Fallback to trackCatalog
    const catalogItem = getCatalogTrack(artist, q);
    if (catalogItem) {
      return NextResponse.json({
        tracks: [
          {
            id: catalogItem.uri.replace('spotify:track:', ''),
            name: catalogItem.name,
            uri: catalogItem.uri,
            duration_ms: catalogItem.durationMs || 210000,
            preview_url: catalogItem.previewUrl || null,
            artists: [{ id: 'catalog', name: catalogItem.artist }],
          },
        ],
      });
    }

    return NextResponse.json({ tracks: [] });
  } catch (error) {
    console.error('Spotify Search API Error:', error);
    return NextResponse.json({ tracks: [] });
  }
}
