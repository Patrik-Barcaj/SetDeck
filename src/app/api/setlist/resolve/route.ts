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

  // 1. Try Setlist.fm search
  try {
    const apiKey = process.env.SETLISTFM_API_KEY || '';
    const res = await fetch(
      `${SETLISTFM_BASE_URL}/search/artists?artistName=${encodeURIComponent(artistName)}&p=1`,
      {
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.artist && data.artist.length > 0) {
        const exactMatches = data.artist.filter(
          (a: Artist) => a.name.toLowerCase() === artistName.toLowerCase()
        );
        const candidates: Artist[] = exactMatches.length > 0 ? exactMatches : data.artist.slice(0, 5);

        if (candidates.length === 1) {
          return NextResponse.json({ mbid: candidates[0].mbid });
        }

        // Rank multiple candidate MBIDs by their actual live show count on Setlist.fm
        const ranked = await Promise.all(
          candidates.map(async (c: Artist) => {
            try {
              const showRes = await fetch(`${SETLISTFM_BASE_URL}/artist/${c.mbid}/setlists?p=1`, {
                headers: {
                  'x-api-key': apiKey,
                  Accept: 'application/json',
                },
              });
              if (!showRes.ok) return { mbid: c.mbid, total: 0 };
              const d = await showRes.json();
              return { mbid: c.mbid, total: d.total || 0 };
            } catch {
              return { mbid: c.mbid, total: 0 };
            }
          })
        );
        ranked.sort((a, b) => b.total - a.total);
        return NextResponse.json({ mbid: ranked[0].mbid });
      }
    }
  } catch (sfmErr) {
    console.warn('Setlist.fm resolve attempt failed, trying MusicBrainz fallback:', sfmErr);
  }

  // 2. Fallback: Query MusicBrainz directly (free, highly reliable)
  try {
    const mbRes = await fetch(
      `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artistName)}&fmt=json`,
      {
        headers: {
          'User-Agent': 'SetDrift/1.0 (contact@setdrift.app)',
          Accept: 'application/json',
        },
      }
    );

    if (mbRes.ok) {
      const mbData = await mbRes.json();
      if (mbData.artists && mbData.artists.length > 0) {
        const exactMatch = mbData.artists.find(
          (a: { name: string; id: string }) => a.name.toLowerCase() === artistName.toLowerCase()
        );
        const mbid = exactMatch ? exactMatch.id : mbData.artists[0].id;
        return NextResponse.json({ mbid });
      }
    }
  } catch (mbErr) {
    console.error('MusicBrainz resolve error:', mbErr);
  }

  return NextResponse.json({ error: 'Artist not found on Setlist.fm' }, { status: 404 });
}
