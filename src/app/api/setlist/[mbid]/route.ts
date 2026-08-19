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
  const modeParam = searchParams.get('mode') === 'festival' ? 'festival' : 'headline';

  const cacheKey = `setlist:artist:${mbid}:last10:${modeParam}`;

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
    
    const aggregated = aggregateTracks(shows, { mode: modeParam });
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
              const releaseDate = spotifyResult.album?.release_date;
              const releaseYear = releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : undefined;
              const albumName = spotifyResult.album?.name || undefined;
              const albumImageUrl = spotifyResult.album?.images?.[0]?.url || undefined;

              return {
                ...track,
                spotifyUri: spotifyResult.uri,
                previewUrl: spotifyResult.preview_url || null,
                durationMs: spotifyResult.duration_ms,
                albumName,
                albumImageUrl,
                releaseYear,
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

    // Determine latest release year for Era categorization
    const knownYears = hydratedTracks.map((t) => t.releaseYear).filter((y): y is number => typeof y === 'number' && !isNaN(y));
    const latestYear = knownYears.length > 0 ? Math.max(...knownYears) : new Date().getFullYear();

    // Assign Era Category to each track
    hydratedTracks = hydratedTracks.map((track) => {
      let eraCategory: 'New Album' | 'Classic Era' | 'Deep Cut / Rarity' = 'Classic Era';
      if (track.releaseYear && track.releaseYear >= latestYear - 2) {
        eraCategory = 'New Album';
      } else if (track.likelihood >= 75 || (track.releaseYear && track.releaseYear <= latestYear - 8)) {
        eraCategory = 'Classic Era';
      } else {
        eraCategory = 'Deep Cut / Rarity';
      }
      return { ...track, eraCategory };
    });

    // Calculate Album Breakdown
    const albumCountMap = new Map<string, { count: number; year?: number }>();
    hydratedTracks.forEach((t) => {
      const album = t.albumName || 'Other / Singles';
      const curr = albumCountMap.get(album) || { count: 0, year: t.releaseYear };
      curr.count++;
      if (t.releaseYear) curr.year = t.releaseYear;
      albumCountMap.set(album, curr);
    });

    const PALETTE = [
      '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6',
      '#06b6d4', '#f97316', '#14b8a6', '#3b82f6', '#84cc16'
    ];

    const totalHydrated = hydratedTracks.length || 1;
    const albumBreakdown = Array.from(albumCountMap.entries())
      .map(([name, { count, year }], idx) => ({
        name,
        count,
        percentage: Math.round((count / totalHydrated) * 100),
        color: PALETTE[idx % PALETTE.length],
        year,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate Era Breakdown
    const eraCounts: Record<string, number> = {
      'New Album': 0,
      'Classic Era': 0,
      'Deep Cut / Rarity': 0,
    };
    hydratedTracks.forEach((t) => {
      if (t.eraCategory) {
        eraCounts[t.eraCategory] = (eraCounts[t.eraCategory] || 0) + 1;
      }
    });

    const eraColors = {
      'New Album': '#10b981',       // Emerald
      'Classic Era': '#f59e0b',     // Amber / Gold
      'Deep Cut / Rarity': '#6366f1' // Indigo
    };

    const eraBreakdown = (['New Album', 'Classic Era', 'Deep Cut / Rarity'] as const)
      .map((era) => ({
        name: era,
        count: eraCounts[era] || 0,
        percentage: Math.round(((eraCounts[era] || 0) / totalHydrated) * 100),
        color: eraColors[era],
      }))
      .filter((e) => e.count > 0);

    const data: SetlistData = {
      mbid,
      artistName: resolvedArtistName,
      tourName,
      tracks: hydratedTracks,
      region,
      totalValidShows: shows.length,
      albumBreakdown,
      eraBreakdown,
      mode: modeParam,
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

