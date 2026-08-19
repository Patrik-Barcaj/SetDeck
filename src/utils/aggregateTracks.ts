import { AggregatedTrack, LikelihoodBadge, SetlistShow, SetlistTrack, TourEvolution } from '../types';
import { sanitizeTrackName } from './sanitizeTrackName';

function getBadge(percentage: number): LikelihoodBadge {
  if (percentage >= 90) return 'Green';
  if (percentage >= 50) return 'Yellow';
  return 'Red';
}

function getSectionName(set: { name?: string; encore?: number }): string {
  if (set.encore) {
    return set.encore === 1 ? 'Encore 1' : set.encore === 2 ? 'Encore 2' : `Encore ${set.encore}`;
  }
  if (set.name && set.name.trim()) {
    const trimmed = set.name.trim();
    if (/^encore\s*1$/i.test(trimmed)) return 'Encore 1';
    if (/^encore\s*2$/i.test(trimmed)) return 'Encore 2';
    if (/^encore\s*3$/i.test(trimmed)) return 'Encore 3';
    if (/^main\s*set$/i.test(trimmed)) return 'Main Set';
    return trimmed;
  }
  return 'Main Set';
}

function normalizeKey(name: string): string {
  return sanitizeTrackName(name).toLowerCase();
}

export interface AggregateOptions {
  mode?: 'headline' | 'festival';
  targetTrackCount?: number;
}

export function aggregateTracks(shows: SetlistShow[], options?: AggregateOptions): AggregatedTrack[] {
  // A valid show must have at least 1 set with songs
  const validShows = shows.filter(
    (s) => s.sets && s.sets.set && s.sets.set.some((set) => set.song && set.song.length > 0)
  );

  const totalShows = validShows.length;
  if (totalShows === 0) return [];

  const trackMap = new Map<string, { count: number; track: SetlistTrack; sectionCounts: Map<string, number> }>();
  const openerCounts = new Map<string, number>();
  const closerCounts = new Map<string, number>();

  // Split shows for tour evolution diffing (recent half vs older half)
  const recentSplitIndex = Math.max(1, Math.ceil(totalShows / 2));
  const recentShows = validShows.slice(0, recentSplitIndex);

  const recentTrackCounts = new Map<string, number>();
  const olderTrackCounts = new Map<string, number>();

  validShows.forEach((show, showIndex) => {
    const isRecent = showIndex < recentSplitIndex;
    const seenInShow = new Set<string>();

    // Collect all songs in this show flattened to detect absolute opener and closer
    const allShowSongs: { song: { name: string; info?: string; cover?: { mbid: string; name: string } }; section: string }[] = [];

    show.sets.set.forEach((set) => {
      const sectionName = getSectionName(set);
      set.song.forEach((song) => {
        if (song.name && song.name.trim()) {
          allShowSongs.push({ song, section: sectionName });
        }
      });
    });

    if (allShowSongs.length > 0) {
      const firstSongKey = normalizeKey(allShowSongs[0].song.name);
      openerCounts.set(firstSongKey, (openerCounts.get(firstSongKey) || 0) + 1);

      const lastSongKey = normalizeKey(allShowSongs[allShowSongs.length - 1].song.name);
      closerCounts.set(lastSongKey, (closerCounts.get(lastSongKey) || 0) + 1);
    }

    let globalOrder = 0;
    allShowSongs.forEach(({ song, section }) => {
      globalOrder++;
      const key = normalizeKey(song.name);

      if (!seenInShow.has(key)) {
        seenInShow.add(key);

        if (isRecent) {
          recentTrackCounts.set(key, (recentTrackCounts.get(key) || 0) + 1);
        } else {
          olderTrackCounts.set(key, (olderTrackCounts.get(key) || 0) + 1);
        }

        if (trackMap.has(key)) {
          const existing = trackMap.get(key)!;
          existing.count++;
          existing.sectionCounts.set(section, (existing.sectionCounts.get(section) || 0) + 1);
        } else {
          const sectionCounts = new Map<string, number>();
          sectionCounts.set(section, 1);
          trackMap.set(key, {
            count: 1,
            sectionCounts,
            track: {
              name: song.name,
              info: song.info,
              cover: song.cover,
              originalOrder: globalOrder,
              section,
            },
          });
        }
      }
    });
  });

  // Convert to array and calculate metrics
  let aggregated: AggregatedTrack[] = Array.from(trackMap.values()).map(({ count, track, sectionCounts }) => {
    const key = normalizeKey(track.name);
    const likelihood = Math.round((count / totalShows) * 100);

    // Opener check (>80% or highest rate)
    const openerRate = (openerCounts.get(key) || 0) / totalShows;
    const isOpener = openerRate >= 0.75;

    // Closer check (>80% or highest rate)
    const closerRate = (closerCounts.get(key) || 0) / totalShows;
    const isCloser = closerRate >= 0.75;

    // Tour Evolution Diffing
    let tourEvolution: TourEvolution | undefined = undefined;
    if (totalShows >= 3) {
      const recentCount = recentTrackCounts.get(key) || 0;
      const olderCount = olderTrackCounts.get(key) || 0;

      if (olderCount === 0 && recentCount >= Math.min(2, recentShows.length)) {
        tourEvolution = 'NEW TO TOUR';
      } else if (likelihood >= 85) {
        tourEvolution = 'TOUR STAPLE';
      } else if (likelihood >= 30 && likelihood <= 75) {
        tourEvolution = 'ROTATING';
      }
    } else if (likelihood >= 85) {
      tourEvolution = 'TOUR STAPLE';
    }

    // Determine primary section by max occurrence
    let primarySection = track.section || 'Main Set';
    let maxSectionOccurrences = 0;
    sectionCounts.forEach((secCount, secName) => {
      if (secCount > maxSectionOccurrences) {
        maxSectionOccurrences = secCount;
        primarySection = secName;
      }
    });

    return {
      id: key,
      name: track.name,
      count,
      totalShows,
      likelihood,
      badge: getBadge(likelihood),
      isCover: !!track.cover,
      coverArtist: track.cover?.name,
      originalOrder: track.originalOrder,
      section: primarySection,
      isOpener,
      isCloser,
      tourEvolution,
    };
  });

  // Order resolution: Maintain relative concert progression
  aggregated.sort((a, b) => {
    // Keep opener at the very top of Main Set
    if (a.isOpener && !b.isOpener && a.section === 'Main Set') return -1;
    if (!a.isOpener && b.isOpener && b.section === 'Main Set') return 1;

    // Keep closer at the very bottom
    if (a.isCloser && !b.isCloser) return 1;
    if (!a.isCloser && b.isCloser) return -1;

    // Section ordering (Main Set -> Encore 1 -> Encore 2 -> Encore 3)
    const sectionWeight = (sec?: string) => {
      if (!sec || sec === 'Main Set') return 10;
      if (sec === 'Encore 1') return 20;
      if (sec === 'Encore 2') return 30;
      if (sec === 'Encore 3') return 40;
      if (sec.startsWith('Encore')) return 25;
      return 15;
    };

    const secDiff = sectionWeight(a.section) - sectionWeight(b.section);
    if (secDiff !== 0) return secDiff;

    return a.originalOrder - b.originalOrder;
  });

  // Handle Festival Slot condensation mode (top 10-12 tracks)
  if (options?.mode === 'festival') {
    const targetCount = options.targetTrackCount || 11;
    if (aggregated.length > targetCount) {
      // Guaranteed inclusion for opener and closer
      const opener = aggregated.find((t) => t.isOpener);
      const closer = aggregated.find((t) => t.isCloser && t.id !== opener?.id);

      const guaranteed: AggregatedTrack[] = [];
      if (opener) guaranteed.push(opener);
      if (closer) guaranteed.push(closer);

      const remainingNeeded = Math.max(0, targetCount - guaranteed.length);
      const otherTracks = aggregated
        .filter((t) => !guaranteed.some((g) => g.id === t.id))
        .sort((a, b) => b.likelihood - a.likelihood)
        .slice(0, remainingNeeded);

      const festivalIdSet = new Set([...guaranteed.map((g) => g.id), ...otherTracks.map((o) => o.id)]);
      aggregated = aggregated.filter((t) => festivalIdSet.has(t.id));
    }
  }

  return aggregated;
}


