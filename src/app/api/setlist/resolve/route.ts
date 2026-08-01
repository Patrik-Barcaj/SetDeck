import { NextResponse } from 'next/server';

const SETLISTFM_BASE_URL = 'https://api.setlist.fm/rest/1.0';

interface Artist {
  mbid: string;
  name: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistName = searchParams.get('artistName');

  if (!artistName) {
    return NextResponse.json({ error: 'Missing artistName parameter' }, { status: 400 });
  }

  try {
    const res = await fetch(`${SETLISTFM_BASE_URL}/search/artists?artistName=${encodeURIComponent(artistName)}&p=1`, {
      headers: {
        'x-api-key': process.env.SETLISTFM_API_KEY!,
        Accept: 'application/json',
      },
    });

    if (res.status === 404) {
      return NextResponse.json({ error: 'Artist not found on Setlist.fm' }, { status: 404 });
    }

    if (!res.ok) {
      throw new Error(`Setlist.fm error: ${res.status}`);
    }

    const data = await res.json();
    if (!data.artist || data.artist.length === 0) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Attempt exact match first, fallback to first result
    const exactMatch = data.artist.find(
      (a: Artist) => a.name.toLowerCase() === artistName.toLowerCase()
    );

    const mbid = exactMatch ? exactMatch.mbid : data.artist[0].mbid;

    return NextResponse.json({ mbid });
  } catch (error) {
    console.error('Setlist.fm MBID resolve error:', error);
    return NextResponse.json({ error: 'Failed to resolve MBID' }, { status: 500 });
  }
}
