export type Region = 'EU' | 'US' | 'Australia' | 'World';
export type LikelihoodBadge = 'Green' | 'Yellow' | 'Red';

export interface ArtistResult {
  id: string; // Spotify ID
  name: string;
  images: { url: string; height: number; width: number }[];
  genres: string[];
}

export interface SetlistTrack {
  name: string;
  info?: string;
  cover?: { mbid: string; name: string };
  originalOrder: number;
}

export interface SetlistShow {
  id: string;
  eventDate: string;
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
}

export interface SetlistData {
  mbid: string;
  artistName: string;
  tourName: string;
  tracks: AggregatedTrack[];
  region: Region;
  totalValidShows: number;
}
