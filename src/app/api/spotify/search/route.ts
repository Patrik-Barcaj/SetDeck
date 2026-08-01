import { NextResponse } from 'next/server';
import { getClientCredentialsToken } from '@/lib/spotify';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    const token = await getClientCredentialsToken();
    const url = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(q)}&type=track&limit=5`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Spotify API Error');
    }

    const data = await res.json();
    return NextResponse.json({ tracks: data.tracks.items });
  } catch (error) {
    console.error('Spotify Search API Error:', error);
    return NextResponse.json({ error: 'Failed to search Spotify' }, { status: 500 });
  }
}
