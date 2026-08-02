import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../resolve/route';

describe('GET /api/setlist/resolve', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns 400 if artistName is missing', async () => {
    const req = new Request('http://localhost/api/setlist/resolve');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing artistName parameter');
  });

  it('returns 404 when setlist.fm returns 404 or empty list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
    } as Response);

    const req = new Request('http://localhost/api/setlist/resolve?artistName=NonExistent');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('returns exact match MBID when artist list matches name', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        artist: [
          { mbid: 'mbid-tribute', name: 'Metallica Tribute Band' },
          { mbid: 'mbid-metallica', name: 'Metallica' },
        ],
      }),
    } as Response);

    const req = new Request('http://localhost/api/setlist/resolve?artistName=Metallica');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.mbid).toBe('mbid-metallica');
  });
});
