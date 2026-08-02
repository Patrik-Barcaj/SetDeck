import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../search/route';
import * as spotifyLib from '@/lib/spotify';
import * as authLib from '@/lib/auth';
import type { SetDeckSession } from '@/lib/auth';

vi.mock('@/lib/spotify');
vi.mock('@/lib/auth');

describe('GET /api/setlist/search', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 400 if query parameter "q" is missing', async () => {
    const req = new Request('http://localhost/api/setlist/search');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing query parameter');
  });

  it('calls searchSpotifyArtists and returns list of artists', async () => {
    const mockArtists = [
      { id: 'art1', name: 'Metallica', images: [{ url: 'https://img.jpg' }] },
    ];
    const mockSession: SetDeckSession = {
      accessToken: 'test_token',
      user: { id: 'u1', name: 'User 1' },
      providerAccountId: 'spotify_u1',
    };
    vi.mocked(authLib.auth).mockResolvedValue(mockSession);
    vi.mocked(spotifyLib.searchSpotifyArtists).mockResolvedValue(mockArtists as never);

    const req = new Request('http://localhost/api/setlist/search?q=Metallica');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(mockArtists);
    expect(spotifyLib.searchSpotifyArtists).toHaveBeenCalledWith('Metallica', 'test_token');
  });
});
