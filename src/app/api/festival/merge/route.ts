import { NextResponse } from 'next/server';
import { fetchLast10Shows } from '@/lib/setlistfm';
import { aggregateTracks } from '@/utils/aggregateTracks';
import { searchSpotifyTrack, getClientCredentialsToken } from '@/lib/spotify';
import { auth } from '@/lib/auth';
import { AggregatedTrack, FestivalArtistSlot } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slots: FestivalArtistSlot[] = body.slots || [];
    const festivalName: string = (body.festivalName || 'Festival Warm-Up').trim();

    if (!slots || slots.length === 0) {
      return NextResponse.json({ error: 'At least one artist slot is required' }, { status: 400 });
    }

    const session = await auth();
    const spotifyToken = session?.accessToken || (await getClientCredentialsToken());

    const mergedTracks: AggregatedTrack[] = [];

    for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
      const slot = slots[slotIndex];
      const targetCount = slot.trackCount || 8;
      const stageInfo = slot.stageName ? ` • ${slot.stageName}` : '';
      const timeInfo = slot.startTime ? ` (${slot.startTime})` : '';
      const sectionName = `${slot.artistName}${stageInfo}${timeInfo}`;

      try {
        const { shows } = await fetchLast10Shows(slot.artistMbid);
        if (shows.length > 0) {
          const aggregated = aggregateTracks(shows, { mode: 'festival', targetTrackCount: targetCount });
          
          // Hydrate with Spotify in parallel
          const hydrated = await Promise.all(aggregated.slice(0, targetCount).map(async (track) => {
            let updated = {
              ...track,
              section: sectionName,
            };

            if (spotifyToken) {
              try {
                const searchArtist = track.isCover && track.coverArtist ? track.coverArtist : slot.artistName;
                const spotifyResult = await searchSpotifyTrack(searchArtist, track.name, spotifyToken);
                if (spotifyResult) {
                  updated = {
                    ...updated,
                    spotifyUri: spotifyResult.uri,
                    previewUrl: spotifyResult.preview_url || null,
                    durationMs: spotifyResult.duration_ms,
                    albumName: spotifyResult.album?.name,
                    albumImageUrl: spotifyResult.album?.images?.[0]?.url,
                  };
                }
              } catch (e) {
                console.warn(`[Festival Merge] Failed to hydrate track ${track.name}:`, e);
              }
            }

            return updated;
          }));

          mergedTracks.push(...hydrated);
        }
      } catch (err) {
        console.warn(`[Festival Merge] Error fetching setlist for ${slot.artistName}:`, err);
      }
    }

    return NextResponse.json({
      festivalName,
      totalArtists: slots.length,
      totalTracks: mergedTracks.length,
      tracks: mergedTracks,
    });
  } catch (error) {
    console.error('[Festival Merge Error]:', error);
    return NextResponse.json({ error: 'Failed to merge festival setlist' }, { status: 500 });
  }
}
