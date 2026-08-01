import { AggregatedTrack, LikelihoodBadge, SetlistShow, SetlistTrack } from '../types';
import { sanitizeTrackName } from './sanitizeTrackName';

function getBadge(percentage: number): LikelihoodBadge {
  if (percentage >= 80) return 'Green';
  if (percentage >= 40) return 'Yellow';
  return 'Red';
}

function normalizeKey(name: string): string {
  return sanitizeTrackName(name).toLowerCase();
}

export function aggregateTracks(shows: SetlistShow[]): AggregatedTrack[] {
  // A valid show must have at least 1 set with songs
  const validShows = shows.filter(
    (s) => s.sets && s.sets.set && s.sets.set.some((set) => set.song && set.song.length > 0)
  );

  const totalShows = validShows.length;
  if (totalShows === 0) return [];

  const trackMap = new Map<string, { count: number; track: SetlistTrack }>();

  // Count frequencies
  validShows.forEach((show) => {
    // To ensure we don't count a track twice if played twice in the same show
    const seenInShow = new Set<string>();

    let globalOrder = 0;
    
    show.sets.set.forEach((set) => {
      set.song.forEach((song) => {
        globalOrder++;
        if (!song.name) return; // Skip tape/interludes if no name

        const key = normalizeKey(song.name);
        
        if (!seenInShow.has(key)) {
          seenInShow.add(key);
          
          if (trackMap.has(key)) {
            const existing = trackMap.get(key)!;
            existing.count++;
          } else {
            trackMap.set(key, {
              count: 1,
              track: {
                name: song.name,
                info: song.info,
                cover: song.cover,
                originalOrder: globalOrder,
              }
            });
          }
        }
      });
    });
  });

  // Convert to array and calculate metrics
  const aggregated: AggregatedTrack[] = Array.from(trackMap.values()).map(({ count, track }) => {
    const likelihood = Math.round((count / totalShows) * 100);
    return {
      id: normalizeKey(track.name), // Unique ID for DnD
      name: track.name,
      count,
      totalShows,
      likelihood,
      badge: getBadge(likelihood),
      isCover: !!track.cover,
      coverArtist: track.cover?.name,
      originalOrder: track.originalOrder, // Use the order from the first time it was seen (most recent show)
    };
  });

  // Order resolution: Mirror the structural flow of the most recent concert
  // We use `originalOrder` which comes from the most recent show the track appeared in.
  // We sort by `originalOrder`. Tracks from older shows will naturally fall towards where they were played in those shows.
  aggregated.sort((a, b) => a.originalOrder - b.originalOrder);

  return aggregated;
}
