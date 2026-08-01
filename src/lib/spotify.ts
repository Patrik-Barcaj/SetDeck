const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export async function getClientCredentialsToken() {
  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

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
    throw new Error('Failed to get Spotify client credentials token');
  }

  const data = await res.json();
  return data.access_token;
}

export async function searchSpotifyArtists(query: string) {
  const token = await getClientCredentialsToken();
  const url = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(query)}&type=artist&limit=5`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Spotify artist search failed');
  }

  const data = await res.json();
  return data.artists?.items || [];
}

export async function searchSpotifyTrack(
  artistName: string,
  trackName: string,
  token: string
) {
  const cleanTrack = trackName.replace(/[\(\[\{\/\\].*?[\)\]\}]/g, '').trim();

  // Try field-filtered search first
  try {
    const q1 = `artist:${artistName} track:${cleanTrack || trackName}`;
    const res1 = await fetch(`${SPOTIFY_API_URL}/search?q=${encodeURIComponent(q1)}&type=track&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res1.ok) {
      const data1 = await res1.json();
      if (data1.tracks?.items?.length > 0) return data1.tracks.items[0];
    }
  } catch (e) {
    console.warn('Field search failed:', e);
  }

  // Fallback to broad text query
  try {
    const q2 = `${artistName} ${cleanTrack || trackName}`;
    const res2 = await fetch(`${SPOTIFY_API_URL}/search?q=${encodeURIComponent(q2)}&type=track&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.tracks?.items?.length > 0) return data2.tracks.items[0];
    }
  } catch (e) {
    console.warn('Broad search failed:', e);
  }

  return null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  external_urls?: {
    spotify?: string;
  };
  images?: Array<{ url: string }>;
}

export async function createSpotifyPlaylist(
  userId: string,
  name: string,
  description: string,
  trackUris: string[],
  token: string,
  isPublic = false
): Promise<SpotifyPlaylist> {
  // 1. Create Playlist using /me/playlists or /users/${userId}/playlists
  let playlist: SpotifyPlaylist | null = null;

  try {
    const res = await fetch(`${SPOTIFY_API_URL}/me/playlists`, {
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

    if (res.ok) {
      playlist = await res.json();
    } else {
      console.warn('POST /me/playlists returned status:', res.status, await res.text());
    }
  } catch (err) {
    console.warn('POST /me/playlists exception:', err);
  }

  // Fallback to /users/${userId}/playlists if /me/playlists failed
  if (!playlist && userId) {
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

    if (!fallbackRes.ok) {
      const errBody = await fallbackRes.text();
      throw new Error(`Failed to create playlist on Spotify: ${errBody}`);
    }
    playlist = await fallbackRes.json();
  }

  if (!playlist || !playlist.id) {
    throw new Error('Could not create playlist on Spotify');
  }

  // 2. Add Tracks in chunks of 100
  if (trackUris && trackUris.length > 0) {
    for (let i = 0; i < trackUris.length; i += 100) {
      const chunk = trackUris.slice(i, i + 100);
      const addRes = await fetch(`${SPOTIFY_API_URL}/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: chunk }),
      });
      if (!addRes.ok) {
        console.error('Failed to add track chunk to playlist:', await addRes.text());
      }
    }
  }

  return playlist;
}
