import { NextResponse } from 'next/server';
import { searchSpotifyArtists } from '@/lib/spotify';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    const artists = await searchSpotifyArtists(q);
    return NextResponse.json(artists);
  } catch (error) {
    console.error('Spotify Search Error:', error);
    return NextResponse.json({ error: 'Failed to search artists' }, { status: 500 });
  }
}
