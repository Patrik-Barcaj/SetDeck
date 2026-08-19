import { NextResponse } from 'next/server';
import { fetchLast10Shows } from '@/lib/setlistfm';
import { aggregateTracks } from '@/utils/aggregateTracks';
import { detectRegion } from '@/utils/detectRegion';
import { redis } from '@/lib/redis';
import { SetlistData } from '@/types';
import { searchSpotifyTrack, getClientCredentialsToken } from '@/lib/spotify';
import { auth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mbid: string }> }
) {
  const resolvedParams = await params;
  const mbid = resolvedParams.mbid;

  if (!mbid) {
    return NextResponse.json({ error: 'Missing MBID' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const queryArtistName = (searchParams.get('artistName') || searchParams.get('artist') || '').trim();

  const cacheKey = `setlist:artist:${mbid}:last10`;

  // Check 12-hour Redis cache upfront
  try {
    const cached = await redis.get<SetlistData>(cacheKey);
    if (cached && cached.tracks && cached.tracks.length > 0) {
      return NextResponse.json(cached);
    }
  } catch (cacheErr) {
    console.warn('Redis cache lookup error:', cacheErr);
  }

  try {
    const { shows, artistName } = await fetchLast10Shows(mbid);
    
    if (shows.length === 0) {
      return NextResponse.json({ error: 'No recent valid shows found' }, { status: 404 });
    }
    
    const aggregated = aggregateTracks(shows);
    const region = detectRegion(shows);
    const tourName = `${new Date().getFullYear()} ${region === 'World' ? 'Global' : region} Tour`;

    let hydratedTracks = aggregated;
    let resolvedArtistName = (artistName && artistName !== 'Unknown Artist')
      ? artistName
      : (queryArtistName || 'Unknown Artist');

    if (resolvedArtistName === 'Unknown Artist') {
      const showWithArtist = shows.find((s) => s.artist?.name);
      if (showWithArtist?.artist?.name) {
        resolvedArtistName = showWithArtist.artist.name;
      }
    }

    try {
      const session = await auth();
      const spotifyToken = session?.accessToken || (await getClientCredentialsToken());
      
      if (spotifyToken) {
        // Hydrate tracks in parallel to eliminate waterfall
        hydratedTracks = await Promise.all(aggregated.map(async (track) => {
          const searchArtist = track.isCover && track.coverArtist 
            ? track.coverArtist 
            : (resolvedArtistName !== 'Unknown Artist' ? resolvedArtistName : '');

          try {
            const spotifyResult = await searchSpotifyTrack(searchArtist, track.name, spotifyToken);
            if (spotifyResult) {
              return {
                ...track,
                spotifyUri: spotifyResult.uri,
                previewUrl: spotifyResult.preview_url || null,
                durationMs: spotifyResult.duration_ms,
              };
            }
          } catch (err) {
            console.warn(`Failed to hydrate track ${track.name}:`, err);
          }
          
          return track;
        }));
      }
    } catch (spotifyErr) {
      console.warn('Failed to hydrate Spotify data during aggregation:', spotifyErr);
    }

    const data: SetlistData = {
      mbid,
      artistName: resolvedArtistName,
      tourName,
      tracks: hydratedTracks,
      region,
      totalValidShows: shows.length,
    };

    // Cache in Upstash Redis for 12 hours (43200s)
    try {
      await redis.set(cacheKey, data, { ex: 43200 });
    } catch (redisWriteErr) {
      console.warn('Redis cache write error:', redisWriteErr);
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Setlist fetch error:', error);
    
    const errMessage = error instanceof Error ? error.message : String(error);

    // Graceful degradation on 429/503: try cache fallback
    if (errMessage.includes('429') || errMessage.includes('503') || errMessage.includes('fetch failed')) {
      try {
        const cached = await redis.get<SetlistData>(cacheKey);
        if (cached) {
          return NextResponse.json(cached);
        }
      } catch {}
      return NextResponse.json({ error: 'Setlist.fm is currently rate-limiting requests. Please try again in a few minutes.' }, { status: 429 });
    }

    return NextResponse.json({ error: 'Failed to aggregate setlist data', details: errMessage }, { status: 500 });
  }
}

