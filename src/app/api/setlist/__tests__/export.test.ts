import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../export/route';
import * as spotifyLib from '@/lib/spotify';
import * as authLib from '@/lib/auth';
import type { SetDeckSession } from '@/lib/auth';

vi.mock('@/lib/spotify');
vi.mock('@/lib/auth');

describe('/api/setlist/export', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET', () => {
    it('returns status message', async () => {
      const res = await GET();
      const json = await res.json();
      expect(json.status).toBe('Spotify Export API is active');
    });
  });

  describe('POST', () => {
    it('returns 401 if user is not authenticated', async () => {
      vi.mocked(authLib.auth).mockResolvedValue(null);

      const req = new Request('http://localhost/api/setlist/export', {
        method: 'POST',
        body: JSON.stringify({ artistName: 'Metallica', tracks: [] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 if artistName or tracks are missing/empty', async () => {
      const mockSession: SetDeckSession = {
        accessToken: 'token_123',
        user: { id: 'u1', name: 'User 1' },
        providerAccountId: 'spotify_user_456',
      };
      vi.mocked(authLib.auth).mockResolvedValue(mockSession);

      const req = new Request('http://localhost/api/setlist/export', {
        method: 'POST',
        body: JSON.stringify({ artistName: '', tracks: [] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('resolves track URIs and calls createSpotifyPlaylist', async () => {
      const mockSession: SetDeckSession = {
        accessToken: 'token_123',
        providerAccountId: 'spotify_user_456',
        user: { id: 'u1', name: 'User 1' },
      };
      vi.mocked(authLib.auth).mockResolvedValue(mockSession);

      vi.mocked(spotifyLib.searchSpotifyTrack).mockResolvedValue({
        id: 'trk1',
        name: 'One',
        uri: 'spotify:track:resolved_trk1',
        duration_ms: 440000,
        preview_url: null,
      });

      vi.mocked(spotifyLib.createSpotifyPlaylist).mockResolvedValue({
        id: 'mock_pl_id',
        name: 'Metallica - WorldWired Tour',
        external_urls: { spotify: 'https://open.spotify.com/playlist/mock_pl_id' },
        images: [{ url: 'https://cover.jpg' }],
      });

      const req = new Request('http://localhost/api/setlist/export', {
        method: 'POST',
        body: JSON.stringify({
          artistName: 'Metallica',
          tourName: 'WorldWired Tour',
          tracks: [
            { id: '1', name: 'One', count: 10, totalShows: 10, likelihood: 100, badge: 'Green', originalOrder: 1, isCover: false },
            { id: '2', name: 'Enter Sandman', count: 9, totalShows: 10, likelihood: 90, badge: 'Green', originalOrder: 2, isCover: false, spotifyUri: 'spotify:track:pre_existing_uri' },
          ],
          isPublic: false,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.id).toBe('mock_pl_id');
      expect(json.url).toBe('https://open.spotify.com/playlist/mock_pl_id');
      expect(json.tracksCount).toBe(2);

      expect(spotifyLib.createSpotifyPlaylist).toHaveBeenCalledWith(
        'spotify_user_456',
        'Metallica - WorldWired Tour',
        expect.stringContaining('SetDeck'),
        ['spotify:track:resolved_trk1', 'spotify:track:pre_existing_uri'],
        'token_123',
        false
      );
    });
  });
});
