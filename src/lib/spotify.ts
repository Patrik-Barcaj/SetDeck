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
  if (!token) return null;

  const cleanTrack = trackName
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/"/g, '')
    .trim();

  // Try queries in order of specificity
  const queries = [
    `${artistName} ${cleanTrack || trackName}`,
    `${artistName} ${trackName}`,
    `artist:${artistName} track:${cleanTrack || trackName}`,
    cleanTrack || trackName,
  ];

  for (const q of queries) {
    try {
      const url = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(q)}&type=track&limit=5`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const items = (data.tracks?.items || []) as SpotifyTrack[];
        if (items.length > 0) {
          const match = items.find((item) =>
            item.artists?.some((a) =>
              a.name.toLowerCase().includes(artistName.toLowerCase()) ||
              artistName.toLowerCase().includes(a.name.toLowerCase())
            )
          ) || items[0];

          return match;
        }
      } else {
        console.warn(`Search for query "${q}" returned status ${res.status}`);
      }
    } catch (e) {
      console.warn(`Search error on query "${q}":`, e);
    }
  }

  return null;
}

export async function addTracksToSpotifyPlaylist(
  playlistId: string,
  trackUris: string[],
  token: string
): Promise<void> {
  const validUris = trackUris
    .map((uri) => uri.trim())
    .filter((uri) => uri.length > 0)
    .map((uri) => (uri.startsWith('spotify:track:') ? uri : `spotify:track:${uri}`));

  if (validUris.length === 0) {
    throw new Error('No valid track URIs provided to add to playlist');
  }

  for (let i = 0; i < validUris.length; i += 50) {
    const chunk = validUris.slice(i, i + 50);
    const res = await fetch(`${SPOTIFY_API_URL}/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: chunk }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to add tracks chunk (${i} to ${i + chunk.length}):`, errText);
      throw new Error(`Failed to add tracks to Spotify playlist: ${errText}`);
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
  } else {
    const errText = await createRes.text();
    console.warn('POST /me/playlists returned status:', createRes.status, errText);

    // Fallback to /users/{userId}/playlists
    if (userId) {
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
      } else {
        const fallbackErr = await fallbackRes.text();
        throw new Error(`Failed to create playlist on Spotify: ${fallbackErr}`);
      }
    } else {
      throw new Error(`Failed to create playlist on Spotify: ${errText}`);
    }
  }

  if (!playlist || !playlist.id) {
    throw new Error('Playlist created without a valid ID');
  }

  // 2. Add Tracks
  if (trackUris && trackUris.length > 0) {
    await addTracksToSpotifyPlaylist(playlist.id, trackUris, token);
  }

  return playlist;
}
