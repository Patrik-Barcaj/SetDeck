import { NextResponse } from 'next/server';
import { searchSpotifyArtists } from '@/lib/spotify';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    const session = await auth();
    const artists = await searchSpotifyArtists(q, session?.accessToken);
    return NextResponse.json(artists);
  } catch (error) {
    console.error('Spotify Search Error:', error);
    return NextResponse.json({ error: 'Failed to search artists' }, { status: 500 });
  }
}
