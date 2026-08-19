export type Region = 'EU' | 'US' | 'Australia' | 'World';
export type LikelihoodBadge = 'Green' | 'Yellow' | 'Red';
export type TourEvolution = 'NEW TO TOUR' | 'TOUR STAPLE' | 'ROTATING';
export type EraCategory = 'New Album' | 'Classic Era' | 'Deep Cut / Rarity';

export interface ArtistResult {
  id: string; // Spotify ID or MBID
  name: string;
  images: { url: string; height: number; width: number }[];
  genres: string[];
  mbid?: string;
}

export interface SetlistTrack {
  name: string;
  info?: string;
  cover?: { mbid: string; name: string };
  originalOrder: number;
  section?: string;
}

export interface SetlistShow {
  id: string;
  eventDate: string;
  artist?: {
    mbid?: string;
    name?: string;
    sortName?: string;
  };
  venue: {
    id: string;
    name: string;
    city: {
      name: string;
      country: { code: string; name: string };
    };
  };
  sets: {
    set: {
      name?: string;
      encore?: number;
      song: { name: string; info?: string; cover?: { mbid: string; name: string } }[];
    }[];
  };
}

export interface AggregatedTrack {
  id: string;
  name: string;
  count: number;
  totalShows: number;
  likelihood: number; // 0 to 100
  badge: LikelihoodBadge;
  isCover: boolean;
  coverArtist?: string;
  originalOrder: number; // Used to maintain logical flow
  section?: string; // e.g. "Main Set", "Encore 1", "Encore 2"
  previewUrl?: string | null;
  durationMs?: number;
  spotifyUri?: string;
  excluded?: boolean;
  isOpener?: boolean;
  isCloser?: boolean;
  albumName?: string;
  albumImageUrl?: string;
  releaseYear?: number;
  eraCategory?: EraCategory;
  tourEvolution?: TourEvolution;
}

export interface AlbumBreakdownItem {
  name: string;
  percentage: number;
  count: number;
  color: string;
  year?: number;
}

export interface EraBreakdownItem {
  name: EraCategory;
  percentage: number;
  count: number;
  color: string;
}

export interface SetlistData {
  mbid: string;
  artistName: string;
  tourName: string;
  tracks: AggregatedTrack[];
  region: Region;
  totalValidShows: number;
  albumBreakdown?: AlbumBreakdownItem[];
  eraBreakdown?: EraBreakdownItem[];
  mode?: 'headline' | 'festival';
}

export interface ConcertEvent {
  id: string;
  artistName: string;
  mbid?: string;
  venue: string;
  city: string;
  country: string;
  date: string;
  tourName?: string;
  artistImageUrl?: string;
  distanceKm?: number;
}

export interface FestivalArtistSlot {
  artistMbid: string;
  artistName: string;
  imageUrl?: string;
  stageName?: string;
  startTime?: string;
  endTime?: string;
  trackCount: number;
  tracks?: AggregatedTrack[];
}

