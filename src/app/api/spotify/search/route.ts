import { NextResponse } from 'next/server';
import { searchSpotifyTrack, getClientCredentialsToken } from '@/lib/spotify';
import { getCatalogTrack } from '@/lib/trackCatalog';
import { auth } from '@/lib/auth';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const artist = searchParams.get('artist') || '';

  if (!q) {
    return NextResponse.json({ tracks: [] });
  }

  try {
    const session = await auth();
    const token = session?.accessToken || (await getClientCredentialsToken());

    if (token) {
      const url = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(q)}&type=track&limit=5`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const items = data.tracks?.items || [];
        if (items.length > 0) {
          return NextResponse.json({ tracks: items });
        }
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

