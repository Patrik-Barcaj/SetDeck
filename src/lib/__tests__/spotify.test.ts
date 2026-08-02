import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getClientCredentialsToken,
  searchSpotifyArtists,
  searchSpotifyTrack,
  normalizeSpotifyTrackUri,
  addTracksToSpotifyPlaylist,
  createSpotifyPlaylist,
} from '../spotify';

describe('Spotify API Client Library', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...originalEnv,
      SPOTIFY_CLIENT_ID: 'test_client_id',
      SPOTIFY_CLIENT_SECRET: 'test_client_secret',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  describe('getClientCredentialsToken', () => {
    it('returns null if client ID or secret is missing', async () => {
      delete process.env.SPOTIFY_CLIENT_ID;
      const token = await getClientCredentialsToken();
      expect(token).toBeNull();
    });

    it('successfully fetches and returns access token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'mock_token_123', token_type: 'Bearer' }),
      } as Response);

      const token = await getClientCredentialsToken();
      expect(token).toBe('mock_token_123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.objectContaining({
          method: 'POST',
          body: 'grant_type=client_credentials',
        })
      );
    });

    it('returns null on fetch error or non-200 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      const token = await getClientCredentialsToken();
      expect(token).toBeNull();
    });
  });

  describe('searchSpotifyArtists', () => {
    it('returns empty array if no token is available', async () => {
      delete process.env.SPOTIFY_CLIENT_ID;
      const artists = await searchSpotifyArtists('Metallica');
      expect(artists).toEqual([]);
    });

    it('searches for artists with token and returns items', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          artists: {
            items: [{ id: 'art1', name: 'Metallica' }],
          },
        }),
      } as Response);

      const artists = await searchSpotifyArtists('Metallica', 'user_token_abc');
      expect(artists).toHaveLength(1);
      expect(artists[0].name).toBe('Metallica');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/search?q=Metallica&type=artist&limit=5',
        expect.objectContaining({
          headers: { Authorization: 'Bearer user_token_abc' },
        })
      );
    });
  });

  describe('searchSpotifyTrack', () => {
    it('returns null if token is empty', async () => {
      const track = await searchSpotifyTrack('Metallica', 'One', '');
      expect(track).toBeNull();
    });

    it('cleans parentheses and extra symbols and matches artist track', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tracks: {
            items: [
              {
                id: 'trk1',
                name: 'One',
                uri: 'spotify:track:trk1',
                duration_ms: 446000,
                preview_url: 'https://p.scdn.co/preview.mp3',
                artists: [{ id: 'art1', name: 'Metallica' }],
              },
            ],
          },
        }),
      } as Response);

      const track = await searchSpotifyTrack('Metallica', 'One (Remastered 2020)', 'token_123');
      expect(track).not.toBeNull();
      expect(track?.name).toBe('One');
      expect(track?.uri).toBe('spotify:track:trk1');
    });

    it('searches tracks cleanly even if artist is Unknown Artist', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tracks: {
            items: [
              {
                id: 'trk2',
                name: 'Master of Puppets',
                uri: 'spotify:track:trk2',
                duration_ms: 515000,
                preview_url: null,
                artists: [{ id: 'art1', name: 'Metallica' }],
              },
            ],
          },
        }),
      } as Response);

      const track = await searchSpotifyTrack('Unknown Artist', 'Master of Puppets', 'token_123');
      expect(track).not.toBeNull();
      expect(track?.uri).toBe('spotify:track:trk2');
    });

    it('returns null if no track found across query variations', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tracks: { items: [] } }),
      } as Response);

      const track = await searchSpotifyTrack('NonexistentArtist', 'NonexistentSong', 'token_123');
      expect(track).toBeNull();
    });
  });

  describe('normalizeSpotifyTrackUri', () => {
    it('normalizes standard spotify:track: URIs', () => {
      expect(normalizeSpotifyTrackUri('spotify:track:4iV5W9uYEdYUVa79Axb7Rh')).toBe(
        'spotify:track:4iV5W9uYEdYUVa79Axb7Rh'
      );
    });

    it('extracts track URI from open.spotify.com URL', () => {
      expect(
        normalizeSpotifyTrackUri('https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh?si=abc12345')
      ).toBe('spotify:track:4iV5W9uYEdYUVa79Axb7Rh');
    });

    it('converts 22-character Spotify track ID to URI', () => {
      expect(normalizeSpotifyTrackUri('4iV5W9uYEdYUVa79Axb7Rh')).toBe(
        'spotify:track:4iV5W9uYEdYUVa79Axb7Rh'
      );
    });

    it('returns null for invalid inputs', () => {
      expect(normalizeSpotifyTrackUri('')).toBeNull();
      expect(normalizeSpotifyTrackUri('invalid_id')).toBeNull();
    });
  });

  describe('addTracksToSpotifyPlaylist', () => {
    it('handles empty track URIs gracefully', async () => {
      global.fetch = vi.fn();
      await addTracksToSpotifyPlaylist('playlist_123', [], 'token_123');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('chunks track URIs into batches of 100 and sends POST requests', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '',
      } as Response);

      // Create 120 URIs to test chunking into 100 and 20
      const testUris = Array.from({ length: 120 }, (_, i) => `spotify:track:trk_${i}`);
      await addTracksToSpotifyPlaylist('pl_123', testUris, 'token_123');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        'https://api.spotify.com/v1/playlists/pl_123/tracks',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            uris: testUris.slice(0, 100),
          }),
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'https://api.spotify.com/v1/playlists/pl_123/tracks',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            uris: testUris.slice(100, 120),
          }),
        })
      );
    });
  });

  describe('createSpotifyPlaylist', () => {
    it('creates playlist via /me/playlists and attaches tracks', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'created_pl_id',
            name: 'Live Setlist: Metallica',
            external_urls: { spotify: 'https://open.spotify.com/playlist/created_pl_id' },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => '',
        } as Response);

      const playlist = await createSpotifyPlaylist(
        'user_123',
        'Live Setlist: Metallica',
        'Generated with SetDeck',
        ['spotify:track:t1', 'spotify:track:t2'],
        'token_123',
        false
      );

      expect(playlist.id).toBe('created_pl_id');
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        'https://api.spotify.com/v1/me/playlists',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Live Setlist: Metallica',
            description: 'Generated with SetDeck',
            public: false,
          }),
        })
      );
    });

    it('falls back to /users/{userId}/playlists if /me/playlists fails with 403/404', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => 'Forbidden',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'fallback_pl_id',
            name: 'Live Setlist: Metallica',
          }),
        } as Response);

      const playlist = await createSpotifyPlaylist(
        'user_123',
        'Live Setlist: Metallica',
        'Generated with SetDeck',
        [],
        'token_123',
        false
      );

      expect(playlist.id).toBe('fallback_pl_id');
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'https://api.spotify.com/v1/users/user_123/playlists',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
