import { describe, it, expect } from 'vitest';
import { aggregateTracks } from '../aggregateTracks';
import { SetlistShow } from '../../types';

describe('Festival Timetable Integration', () => {
  it('correctly condenses artist setlist for festival slot (~50m)', () => {
    const mockSongs = Array.from({ length: 20 }, (_, i) => ({ name: `Festival Track ${i + 1}` }));
    const mockShow: SetlistShow = {
      id: 'fest-show-1',
      eventDate: '01-07-2026',
      venue: { id: 'v1', name: 'Glastonbury', city: { name: 'Pilton', country: { code: 'GB', name: 'UK' } } },
      sets: { set: [{ song: mockSongs }] },
    };

    const condensed = aggregateTracks([mockShow], { mode: 'festival', targetTrackCount: 11 });
    expect(condensed.length).toBe(11);
    expect(condensed[0].name).toBe('Festival Track 1');
  });

  it('preserves full setlist in headline mode (~90-120m)', () => {
    const mockSongs = Array.from({ length: 18 }, (_, i) => ({ name: `Headline Track ${i + 1}` }));
    const mockShow: SetlistShow = {
      id: 'head-show-1',
      eventDate: '01-08-2026',
      venue: { id: 'v1', name: 'Wembley Stadium', city: { name: 'London', country: { code: 'GB', name: 'UK' } } },
      sets: { set: [{ song: mockSongs }] },
    };

    const fullSet = aggregateTracks([mockShow], { mode: 'headline' });
    expect(fullSet.length).toBe(18);
  });
});
