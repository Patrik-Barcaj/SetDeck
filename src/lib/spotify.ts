import { sanitizeTrackName } from '@/utils/sanitizeTrackName';
import { getCatalogTrack } from './trackCatalog';

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
    release_date?: string;
  };
}

let cachedClientToken: { token: string; expiresAt: number } | null = null;

export async function getClientCredentialsToken(): Promise<string | null> {
  if (cachedClientToken && cachedClientToken.expiresAt > Date.now() + 60000) {
    return cachedClientToken.token;
  }

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
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('Spotify Client Credentials token error:', res.status);
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      cachedClientToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      };
      return data.access_token;
    }
    return null;
  } catch (err) {
    console.warn('getClientCredentialsToken exception:', err);
    return null;
  }
}

export async function searchSpotifyArtists(query: string, userToken?: string) {
  let token = userToken || (await getClientCredentialsToken());
  if (!token) return [];

  const url = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(query)}&type=artist&limit=5`;

  try {
    let res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      const clientToken = await getClientCredentialsToken();
      if (clientToken && clientToken !== token) {
        token = clientToken;
        res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }

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

export function _clearSpotifyCacheForTesting() {
  cachedClientToken = null;
  trackSearchMemoryCache.clear();
}

const trackSearchMemoryCache = new Map<string, SpotifyTrack | null>();

export async function searchSpotifyTrack(
  artistName: string,
  trackName: string,
  token: string
): Promise<SpotifyTrack | null> {
  if (!trackName) return null;
  if (!token) return null;

  const cleanTrack = sanitizeTrackName(trackName) || trackName.trim();
  const validArtist = artistName && artistName.trim() !== '' && artistName.toLowerCase() !== 'unknown artist' 
    ? artistName.trim() 
    : '';

  const cacheKey = `${validArtist.toLowerCase()}:::${cleanTrack.toLowerCase()}`;
  if (trackSearchMemoryCache.has(cacheKey)) {
    return trackSearchMemoryCache.get(cacheKey) || null;
  }

  const effectiveToken = token;

  // Build prioritized list of search queries: strict first, then fallback
  const queries: string[] = [];
  if (validArtist) {
    queries.push(`track:"${cleanTrack}" artist:"${validArtist}"`);
    queries.push(`${validArtist} ${cleanTrack}`);
  } else {
    queries.push(`track:"${cleanTrack}"`);
  }
  queries.push(`track:${cleanTrack}`);
  queries.push(cleanTrack);


  let rateLimitedFully = false;

  for (const q of queries) {
    if (rateLimitedFully) break;
    try {
      const url = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(q)}&type=track&limit=5`;
      let res = await fetch(url, {
        headers: { Authorization: `Bearer ${effectiveToken}` },
      });

      if (res.status === 401) {
        const clientToken = await getClientCredentialsToken();
        if (clientToken && clientToken !== effectiveToken) {
          res = await fetch(url, {
            headers: { Authorization: `Bearer ${clientToken}` },
          });
        }
      }

      // On 429, wait the suggested retry-after time and retry once
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
        const waitMs = Math.min(retryAfter * 1000, 5000); // Cap at 5s
        await new Promise(resolve => setTimeout(resolve, waitMs));
        res = await fetch(url, {
          headers: { Authorization: `Bearer ${effectiveToken}` },
        });
        if (res.status === 429) {
          rateLimitedFully = true;
          break;
        }
      }

      if (res.ok) {
        const data = await res.json();
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
            if (match) {
              trackSearchMemoryCache.set(cacheKey, match);
              return match;
            }
          }
          trackSearchMemoryCache.set(cacheKey, items[0]);
          return items[0];
        }
      } else {
        console.warn(`[Spotify Search] Query "${q}" returned status ${res.status}`);
      }
    } catch (e) {
      console.warn(`[Spotify Search] Error on query "${q}":`, e);
    }
  }

  // Resilient fallback to built-in high-confidence catalog if live search was rate-limited or yielded no match
  const catalogMatch = getCatalogTrack(validArtist, cleanTrack);
  if (catalogMatch) {
    const trackObj: SpotifyTrack = {
      id: catalogMatch.uri.replace('spotify:track:', ''),
      name: catalogMatch.name,
      uri: catalogMatch.uri,
      duration_ms: catalogMatch.durationMs || 210000,
      preview_url: catalogMatch.previewUrl || null,
      artists: [{ id: 'catalog', name: catalogMatch.artist }],
    };
    trackSearchMemoryCache.set(cacheKey, trackObj);
    return trackObj;
  }

  trackSearchMemoryCache.set(cacheKey, null);
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

    // Try new /items endpoint first (Spotify 2026 standard), then fallback to /tracks
    const endpoints = [
      `${SPOTIFY_API_URL}/playlists/${encodeURIComponent(playlistId)}/items`,
      `${SPOTIFY_API_URL}/playlists/${encodeURIComponent(playlistId)}/tracks`,
    ];

    let success = false;
    let lastError = '';

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris: chunk }),
        });

        if (res.ok) {
          console.log(`[Spotify API] Successfully added ${chunk.length} tracks to playlist ${playlistId} via ${endpoint}.`);
          success = true;
          break;
        }

        // If 429 rate limit, wait and retry the same endpoint
        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get('Retry-After') || '3', 10);
          await new Promise((r) => setTimeout(r, Math.max(retryAfter * 1000, 2000)));
          const retryRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uris: chunk }),
          });
          if (retryRes.ok) {
            console.log(`[Spotify API] Successfully added ${chunk.length} tracks on retry.`);
            success = true;
            break;
          }
          const retryErr = await retryRes.text();
          lastError = `retry status ${retryRes.status}: ${retryErr}`;
          continue;
        }

        const errText = await res.text();
        lastError = `status ${res.status}: ${errText}`;
        console.warn(`[Spotify API] ${endpoint} returned ${lastError}`);
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    if (!success) {
      console.error(`[Spotify API Error] Failed to add tracks to playlist ${playlistId}: ${lastError}`);
      throw new Error(`Failed to add tracks to Spotify playlist: ${lastError}`);
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
  } else if (createRes.status === 429) {
    // Rate limited — wait and retry once
    const retryAfter = parseInt(createRes.headers.get('Retry-After') || '3', 10);
    await new Promise(r => setTimeout(r, Math.max(retryAfter * 1000, 2000)));
    const retryRes = await fetch(`${SPOTIFY_API_URL}/me/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description, public: isPublic }),
    });
    if (retryRes.ok) {
      playlist = await retryRes.json();
      console.log(`[Spotify API] Playlist created on retry: ${playlist?.id}`);
    } else {
      const errText = await retryRes.text();
      console.warn(`[Spotify API] POST /me/playlists retry returned status ${retryRes.status}:`, errText);
    }
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
