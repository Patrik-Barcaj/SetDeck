import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../search/route';
import * as spotifyLib from '@/lib/spotify';
import * as authLib from '@/lib/auth';
import type { SetDriftSession } from '@/lib/auth';

vi.mock('@/lib/spotify');
vi.mock('@/lib/auth');

// Mock global fetch for setlist.fm calls
const originalFetch = globalThis.fetch;

describe('GET /api/setlist/search', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('returns 400 if query parameter "q" is missing', async () => {
    const req = new Request('http://localhost/api/setlist/search');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing query parameter');
  });

  it('returns merged results from setlist.fm and spotify', async () => {
    const mockSession: SetDriftSession = {
      accessToken: 'test_token',
      user: { id: 'u1', name: 'User 1' },
      providerAccountId: 'spotify_u1',
    };
    vi.mocked(authLib.auth).mockResolvedValue(mockSession);

    // Mock Spotify returns enrichment data
    const spotifyArtists = [
      { id: 'sp1', name: 'Metallica', genres: ['metal'], images: [{ url: 'https://img.jpg' }] },
    ];
    vi.mocked(spotifyLib.searchSpotifyArtists).mockResolvedValue(spotifyArtists as never);

    // Mock fetch for setlist.fm call
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('api.setlist.fm')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            artist: [{ mbid: 'mbid-1', name: 'Metallica', sortName: 'Metallica' }],
          }),
        });
      }
      return originalFetch(url);
    });

    const req = new Request('http://localhost/api/setlist/search?q=Metallica');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json).toHaveLength(1);
    expect(json[0].name).toBe('Metallica');
    expect(json[0].mbid).toBe('mbid-1');
    // Should be enriched with Spotify data
    expect(json[0].genres).toEqual(['metal']);
    expect(json[0].images).toEqual([{ url: 'https://img.jpg' }]);
  });
});
