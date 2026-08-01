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
    next: { revalidate: 3000 }, // Spotify tokens expire in 1 hour (3600s)
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
  return data.artists.items;
}

export async function searchSpotifyTrack(
  artistName: string,
  trackName: string,
  token: string
) {
  const query = `artist:${artistName} track:${trackName}`;
  const url = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(query)}&type=track&limit=1`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (data.tracks && data.tracks.items.length > 0) {
    return data.tracks.items[0];
  }
  return null;
}

export async function createSpotifyPlaylist(
  userId: string,
  name: string,
  description: string,
  trackUris: string[],
  token: string,
  isPublic = false
) {
  // 1. Create Playlist
  const createRes = await fetch(`${SPOTIFY_API_URL}/users/${userId}/playlists`, {
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

  if (!createRes.ok) throw new Error('Failed to create playlist');
  const playlist = await createRes.json();

  // 2. Add Tracks in chunks of 100 (Spotify API limit)
  for (let i = 0; i < trackUris.length; i += 100) {
    const chunk = trackUris.slice(i, i + 100);
    await fetch(`${SPOTIFY_API_URL}/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: chunk }),
    });
  }

  return playlist;
}
