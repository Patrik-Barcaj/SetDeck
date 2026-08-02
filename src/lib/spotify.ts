import { sanitizeTrackName } from '@/utils/sanitizeTrackName';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  external_urls?: {
    spotify?: string;
  };
  images?: Array<{ url: string }>;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  preview_url: string | null;
  artists?: Array<{ id: string; name: string }>;
  album?: {
    name: string;
    images: Array<{ url: string }>;
  };
}

export async function getClientCredentialsToken(): Promise<string | null> {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      next: { revalidate: 3000 },
    });

    if (!res.ok) {
      console.warn('Spotify Client Credentials token error:', res.status);
      return null;
    }

    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.warn('getClientCredentialsToken exception:', err);
    return null;
  }
}

export async function searchSpotifyArtists(query: string, userToken?: string) {
  const token = userToken || (await getClientCredentialsToken());
  if (!token) return [];

  const url = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(query)}&type=artist&limit=5`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.warn('Spotify artist search failed with status:', res.status);
      return [];
    }

    const data = await res.json();
    return data.artists?.items || [];
  } catch (e) {
    console.warn('searchSpotifyArtists exception:', e);
    return [];
  }
}

export async function searchSpotifyTrack(
  artistName: string,
  trackName: string,
  token: string
): Promise<SpotifyTrack | null> {
  if (!token || !trackName) return null;

  const cleanTrack = sanitizeTrackName(trackName) || trackName.trim();
  const validArtist = artistName && artistName.trim() !== '' && artistName.toLowerCase() !== 'unknown artist' 
    ? artistName.trim() 
    : '';

  // Build tiered list of search queries
  const queries: string[] = [];

  if (validArtist) {
    queries.push(`artist:"${validArtist}" track:"${cleanTrack}"`);
    queries.push(`track:"${cleanTrack}" artist:"${validArtist}"`);
    queries.push(`"${validArtist}" "${cleanTrack}"`);
    queries.push(`${validArtist} ${cleanTrack}`);
  }

  // General fallbacks based on track name
  queries.push(`track:"${cleanTrack}"`);
  queries.push(cleanTrack);
  if (cleanTrack !== trackName.trim()) {
    queries.push(trackName.trim());
  }

  for (const q of queries) {
    try {
      const url = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(q)}&type=track&limit=5`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let searchRes = res;
      if (searchRes.status === 401) {
        const clientToken = await getClientCredentialsToken();
        if (clientToken && clientToken !== token) {
          searchRes = await fetch(url, {
            headers: { Authorization: `Bearer ${clientToken}` },
          });
        }
      }

      if (searchRes.ok) {
        const data = await searchRes.json();
        const items = (data.tracks?.items || []) as SpotifyTrack[];
        if (items.length > 0) {
          if (validArtist) {
            const lowerArtist = validArtist.toLowerCase();
            const match = items.find((item) =>
              item.artists?.some((a) =>
                a.name.toLowerCase().includes(lowerArtist) ||
                lowerArtist.includes(a.name.toLowerCase())
              )
            );
            if (match) return match;
          }
          return items[0];
        }
      } else {
        console.warn(`[Spotify Search] Query "${q}" returned status ${searchRes.status}`);
      }
    } catch (e) {
      console.warn(`[Spotify Search] Error on query "${q}":`, e);
    }
  }

  return null;
}

export function normalizeSpotifyTrackUri(uriOrIdOrUrl: string): string | null {
  if (!uriOrIdOrUrl || typeof uriOrIdOrUrl !== 'string') return null;
  const trimmed = uriOrIdOrUrl.trim();
  if (trimmed.startsWith('spotify:track:')) {
    const id = trimmed.replace('spotify:track:', '').split('?')[0].trim();
    return id ? `spotify:track:${id}` : null;
  }
  const urlMatch = trimmed.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (urlMatch && urlMatch[1]) {
    return `spotify:track:${urlMatch[1]}`;
  }
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return `spotify:track:${trimmed}`;
  }
  return null;
}

export async function addTracksToSpotifyPlaylist(
  playlistId: string,
  trackUris: string[],
  token: string
): Promise<void> {
  const validUris: string[] = trackUris
    .map((uri) => normalizeSpotifyTrackUri(uri))
    .filter((uri): uri is string => Boolean(uri));

  if (validUris.length === 0) {
    console.warn(`[Spotify API] No valid track URIs provided to add to playlist ${playlistId}`);
    return;
  }

  // Spotify allows max 100 tracks per batch
  const CHUNK_SIZE = 100;
  for (let i = 0; i < validUris.length; i += CHUNK_SIZE) {
    const chunk = validUris.slice(i, i + CHUNK_SIZE);
    console.log(`[Spotify API] Adding chunk of ${chunk.length} tracks to playlist ${playlistId} (offset ${i})...`);

    const res = await fetch(`${SPOTIFY_API_URL}/playlists/${encodeURIComponent(playlistId)}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: chunk }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Spotify API Error] Failed to add tracks (status ${res.status}) to playlist ${playlistId}:`, errText);
      throw new Error(`Failed to add tracks to Spotify playlist (status ${res.status}): ${errText}`);
    } else {
      console.log(`[Spotify API] Successfully added ${chunk.length} tracks to playlist ${playlistId}.`);
    }
  }
}

export async function createSpotifyPlaylist(
  userId: string,
  name: string,
  description: string,
  trackUris: string[],
  token: string,
  isPublic = false
): Promise<SpotifyPlaylist> {
  let playlist: SpotifyPlaylist | null = null;
  console.log(`[Spotify API] Creating playlist "${name}" (public: ${isPublic})...`);

  // 1. Create Playlist via /me/playlists
  const createRes = await fetch(`${SPOTIFY_API_URL}/me/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      public: isPublic,
    }),
  });

  if (createRes.ok) {
    playlist = await createRes.json();
    console.log(`[Spotify API] Playlist created successfully via /me/playlists: ${playlist?.id}`);
  } else {
    const errText = await createRes.text();
    console.warn(`[Spotify API] POST /me/playlists returned status ${createRes.status}:`, errText);

    // Fallback to /users/{userId}/playlists
    if (userId) {
      console.log(`[Spotify API] Trying fallback /users/${userId}/playlists...`);
      const fallbackRes = await fetch(`${SPOTIFY_API_URL}/users/${encodeURIComponent(userId)}/playlists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          public: isPublic,
        }),
      });

      if (fallbackRes.ok) {
        playlist = await fallbackRes.json();
        console.log(`[Spotify API] Playlist created successfully via fallback: ${playlist?.id}`);
      } else {
        const fallbackErr = await fallbackRes.text();
        console.error(`[Spotify API Error] Fallback playlist creation failed (status ${fallbackRes.status}):`, fallbackErr);
        throw new Error(`Failed to create playlist on Spotify (status ${fallbackRes.status}): ${fallbackErr}`);
      }
    } else {
      console.error(`[Spotify API Error] Failed to create playlist (status ${createRes.status}):`, errText);
      throw new Error(`Failed to create playlist on Spotify (status ${createRes.status}): ${errText}`);
    }
  }

  if (!playlist || !playlist.id) {
    throw new Error('Playlist created without a valid ID');
  }

  // 2. Add Tracks
  if (trackUris && trackUris.length > 0) {
    await addTracksToSpotifyPlaylist(playlist.id, trackUris, token);
  } else {
    console.warn(`[Spotify API] Warning: No track URIs provided when creating playlist ${playlist.id}`);
  }

  return playlist;
}
