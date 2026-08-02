import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchArtistSetlists, fetchLast10Shows, fetchArtistDetails, fetchMusicBrainzArtistName } from '../setlistfm';

describe('Setlist.fm API Client Library', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...originalEnv,
      SETLISTFM_API_KEY: 'test_setlistfm_api_key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  describe('fetchArtistSetlists', () => {
    it('returns empty structure if status is 404', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
      } as Response);

      const res = await fetchArtistSetlists('unknown_mbid');
      expect(res).toEqual({
        type: 'setlists',
        items: [],
        total: 0,
        page: 1,
        itemsPerPage: 20,
      });
    });

    it('throws error when response status is non-ok and not 404', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
        ok: false,
      } as Response);

      await expect(fetchArtistSetlists('mbid_123')).rejects.toThrow(
        'Setlist.fm API error: 500 Internal Server Error'
      );
    });

    it('returns json payload on success', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          type: 'setlists',
          total: 100,
          page: 1,
          itemsPerPage: 20,
          setlist: [{ id: 'show_1' }],
        }),
      } as Response);

      const res = await fetchArtistSetlists('mbid_123', 1);
      expect(res.total).toBe(100);
      expect(res.setlist).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.setlist.fm/rest/1.0/artist/mbid_123/setlists?p=1',
        expect.objectContaining({
          headers: {
            'x-api-key': 'test_setlistfm_api_key',
            Accept: 'application/json',
          },
        })
      );
    });
  });

  describe('fetchArtistDetails', () => {
    it('returns artist name from Setlist.fm artist endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'Coldplay' }),
      } as Response);

      const name = await fetchArtistDetails('mbid_coldplay');
      expect(name).toBe('Coldplay');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.setlist.fm/rest/1.0/artist/mbid_coldplay',
        expect.objectContaining({
          headers: {
            'x-api-key': 'test_setlistfm_api_key',
            Accept: 'application/json',
          },
        })
      );
    });

    it('returns null on failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);
      const name = await fetchArtistDetails('invalid_mbid');
      expect(name).toBeNull();
    });
  });

  describe('fetchMusicBrainzArtistName', () => {
    it('returns artist name from MusicBrainz endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'Radiohead' }),
      } as Response);

      const name = await fetchMusicBrainzArtistName('mbid_radiohead');
      expect(name).toBe('Radiohead');
    });

    it('returns null on failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const name = await fetchMusicBrainzArtistName('invalid_mbid');
      expect(name).toBeNull();
    });
  });

  describe('fetchLast10Shows', () => {
    it('filters out empty shows and collects up to 10 valid shows', async () => {
      const validShow = (id: string) => ({
        id,
        eventDate: '01-08-2026',
        venue: { name: 'Stadium', city: { name: 'London', country: { name: 'UK', code: 'GB' } } },
        sets: {
          set: [{ song: [{ name: 'Track 1' }, { name: 'Track 2' }] }],
        },
      });

      const emptyShow = (id: string) => ({
        id,
        eventDate: '02-08-2026',
        venue: { name: 'Arena', city: { name: 'Paris', country: { name: 'FR', code: 'FR' } } },
        sets: {
          set: [],
        },
      });

      // Mock page 1 returning 2 valid shows and 1 empty show
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          type: 'setlists',
          total: 3,
          page: 1,
          itemsPerPage: 20,
          artist: { name: 'Metallica' },
          setlist: [validShow('s1'), emptyShow('s2'), validShow('s3')],
        }),
      } as Response);

      const result = await fetchLast10Shows('mbid_metallica');
      expect(result.artistName).toBe('Metallica');
      expect(result.shows).toHaveLength(2);
      expect(result.shows.map((s) => s.id)).toEqual(['s1', 's3']);
    });

    it('extracts artistName from setlist array if top-level artist is missing', async () => {
      const validShowWithArtist = (id: string) => ({
        id,
        eventDate: '01-08-2026',
        artist: { mbid: 'mbid_foo', name: 'Foo Fighters' },
        venue: { name: 'Stadium', city: { name: 'London', country: { name: 'UK', code: 'GB' } } },
        sets: {
          set: [{ song: [{ name: 'Everlong' }] }],
        },
      });

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          type: 'setlists',
          total: 1,
          page: 1,
          itemsPerPage: 20,
          setlist: [validShowWithArtist('s100')],
        }),
      } as Response);

      const result = await fetchLast10Shows('mbid_foo');
      expect(result.artistName).toBe('Foo Fighters');
      expect(result.shows).toHaveLength(1);
    });

    it('falls back to fetchArtistDetails if setlists do not contain artist name', async () => {
      const validShowNoArtist = (id: string) => ({
        id,
        eventDate: '01-08-2026',
        venue: { name: 'Stadium', city: { name: 'London', country: { name: 'UK', code: 'GB' } } },
        sets: {
          set: [{ song: [{ name: 'Yellow' }] }],
        },
      });

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => ({
            type: 'setlists',
            total: 1,
            page: 1,
            itemsPerPage: 20,
            setlist: [validShowNoArtist('s200')],
          }),
        } as Response)
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => ({
            name: 'Coldplay',
          }),
        } as Response);

      const result = await fetchLast10Shows('mbid_coldplay');
      expect(result.artistName).toBe('Coldplay');
      expect(result.shows).toHaveLength(1);
    });
  });
});
