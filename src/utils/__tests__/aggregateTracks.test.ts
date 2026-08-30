import { describe, it, expect } from 'vitest';
import { aggregateTracks } from '../aggregateTracks';
import { SetlistShow } from '../../types';

describe('aggregateTracks', () => {
  it('aggregates tracks correctly and calculates likelihoods', () => {
    const mockShows: SetlistShow[] = [
      {
        id: '1',
        eventDate: '01-01-2026',
        venue: { id: 'v1', name: 'V', city: { name: 'C', country: { code: 'US', name: 'US' } } },
        sets: {
          set: [
            { song: [{ name: 'Song A' }, { name: 'Song B' }] }
          ]
        }
      },
      {
        id: '2',
        eventDate: '02-01-2026',
        venue: { id: 'v1', name: 'V', city: { name: 'C', country: { code: 'US', name: 'US' } } },
        sets: {
          set: [
            { song: [{ name: 'Song A' }, { name: 'Song C' }] }
          ]
        }
      }
    ];

    const result = aggregateTracks(mockShows);
    
    expect(result.length).toBe(3);
    
    const songA = result.find(t => t.id === 'song a');
    expect(songA?.count).toBe(2);
    expect(songA?.likelihood).toBe(100);
    expect(songA?.badge).toBe('Green');
    
    const songB = result.find(t => t.id === 'song b');
    expect(songB?.count).toBe(1);
    expect(songB?.likelihood).toBe(50);
    expect(songB?.badge).toBe('Yellow');
  });

  it('ignores tape/interludes with no name', () => {
    const mockShows: SetlistShow[] = [
      {
        id: '1',
        eventDate: '01-01-2026',
        venue: { id: 'v1', name: 'V', city: { name: 'C', country: { code: 'US', name: 'US' } } },
        sets: {
          set: [
            { song: [{ name: 'Song A' }, { name: '' }] }
          ]
        }
      }
    ];
    
    const result = aggregateTracks(mockShows);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Song A');
  });

  it('does not double count if played twice in same show', () => {
    const mockShows: SetlistShow[] = [
      {
        id: '1',
        eventDate: '01-01-2026',
        venue: { id: 'v1', name: 'V', city: { name: 'C', country: { code: 'US', name: 'US' } } },
        sets: {
          set: [
            { song: [{ name: 'Song A' }, { name: 'Song A' }] }
          ]
        }
      }
    ];
    
    const result = aggregateTracks(mockShows);
    expect(result.length).toBe(1);
    expect(result[0].count).toBe(1);
  });

  it('correctly identifies Main Set, Encore 1, and Encore 2 sections', () => {

    const mockShows: SetlistShow[] = [
      {
        id: '1',
        eventDate: '01-01-2026',
        venue: { id: 'v1', name: 'V', city: { name: 'C', country: { code: 'US', name: 'US' } } },
        sets: {
          set: [
            { name: 'Main Set', song: [{ name: 'Song 1' }, { name: 'Song 2' }] },
            { encore: 1, song: [{ name: 'Encore Song 1' }] },
            { encore: 2, song: [{ name: 'Encore Song 2' }] },
          ]
        }
      }
    ];

    const result = aggregateTracks(mockShows);
    expect(result).toHaveLength(4);

    const s1 = result.find(t => t.id === 'song 1');
    expect(s1?.section).toBe('Main Set');

    const enc1 = result.find(t => t.id === 'encore song 1');
    expect(enc1?.section).toBe('Encore 1');

    const enc2 = result.find(t => t.id === 'encore song 2');
    expect(enc2?.section).toBe('Encore 2');
  });

  it('identifies and pins opener and closer tracks with high occurrence', () => {
    const mockShows: SetlistShow[] = [
      {
        id: '1',
        eventDate: '01-01-2026',
        venue: { id: 'v1', name: 'V', city: { name: 'C', country: { code: 'US', name: 'US' } } },
        sets: {
          set: [
            { name: 'Main Set', song: [{ name: 'Opener Track' }, { name: 'Middle Song' }] },
            { encore: 1, song: [{ name: 'Closer Track' }] }
          ]
        }
      },
      {
        id: '2',
        eventDate: '02-01-2026',
        venue: { id: 'v1', name: 'V', city: { name: 'C', country: { code: 'US', name: 'US' } } },
        sets: {
          set: [
            { name: 'Main Set', song: [{ name: 'Opener Track' }, { name: 'Other Middle' }] },
            { encore: 1, song: [{ name: 'Closer Track' }] }
          ]
        }
      }
    ];

    const result = aggregateTracks(mockShows);
    const opener = result.find(t => t.id === 'opener track');
    const closer = result.find(t => t.id === 'closer track');

    expect(opener?.isOpener).toBe(true);
    expect(closer?.isCloser).toBe(true);
  });

  it('calculates tour evolution tags (NEW TO TOUR, TOUR STAPLE, ROTATING)', () => {
    const mockShows: SetlistShow[] = [
      // Recent shows (first half: shows 1 and 2)
      {
        id: '1',
        eventDate: '10-01-2026',
        venue: { id: 'v1', name: 'V', city: { name: 'C', country: { code: 'US', name: 'US' } } },
        sets: { set: [{ song: [{ name: 'Staple Song' }, { name: 'Brand New Debut' }] }] }
      },
      {
        id: '2',
        eventDate: '08-01-2026',
        venue: { id: 'v1', name: 'V', city: { name: 'C', country: { code: 'US', name: 'US' } } },
        sets: { set: [{ song: [{ name: 'Staple Song' }, { name: 'Brand New Debut' }] }] }
      },
      // Older shows (second half: shows 3 and 4)
      {
        id: '3',
        eventDate: '05-01-2026',
        venue: { id: 'v1', name: 'V', city: { name: 'C', country: { code: 'US', name: 'US' } } },
        sets: { set: [{ song: [{ name: 'Staple Song' }, { name: 'Rotating Slot Song' }] }] }
      },
      {
        id: '4',
        eventDate: '01-01-2026',
        venue: { id: 'v1', name: 'V', city: { name: 'C', country: { code: 'US', name: 'US' } } },
        sets: { set: [{ song: [{ name: 'Staple Song' }, { name: 'Rotating Slot Song' }] }] }
      }
    ];

    const result = aggregateTracks(mockShows);
    const staple = result.find(t => t.id === 'staple song');
    const newDebut = result.find(t => t.id === 'brand new debut');
    const rotating = result.find(t => t.id === 'rotating slot song');

    expect(staple?.tourEvolution).toBe('TOUR STAPLE');
    expect(newDebut?.tourEvolution).toBe('NEW TO TOUR');
    expect(rotating?.tourEvolution).toBe('ROTATING');
  });

  it('condenses track count in festival mode', () => {
    const mockSongs = Array.from({ length: 18 }, (_, i) => ({ name: `Song ${i + 1}` }));
    const mockShows: SetlistShow[] = [
      {
        id: '1',
        eventDate: '01-01-2026',
        venue: { id: 'v1', name: 'V', city: { name: 'C', country: { code: 'US', name: 'US' } } },
        sets: { set: [{ song: mockSongs }] }
      }
    ];

    const headlineResult = aggregateTracks(mockShows, { mode: 'headline' });
    expect(headlineResult.length).toBe(18);

    const festivalResult = aggregateTracks(mockShows, { mode: 'festival', targetTrackCount: 10 });
    expect(festivalResult.length).toBe(10);
  });

  it('filters out ultra low likelihood tracks (10% or below) when multiple shows exist', () => {
    // 10 shows where Song A is in all 10 (100%), Song B in 5 (50%), Song C in 2 (20%), and Song D in only 1 (10%)
    const mockShows: SetlistShow[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      eventDate: `0${(i % 9) + 1}-01-2026`,
      venue: { id: 'v1', name: 'V', city: { name: 'C', country: { code: 'US', name: 'US' } } },
      sets: {
        set: [
          {
            song: [
              { name: 'Song A' },
              ...(i < 5 ? [{ name: 'Song B' }] : []),
              ...(i < 2 ? [{ name: 'Song C' }] : []),
              ...(i === 0 ? [{ name: 'One-off Rare Song D' }] : []),
            ],
          },
        ],
      },
    }));

    const result = aggregateTracks(mockShows);
    expect(result.find((t) => t.id === 'song a')).toBeDefined();
    expect(result.find((t) => t.id === 'song b')).toBeDefined();
    expect(result.find((t) => t.id === 'song c')).toBeDefined();
    // 10% likelihood song should be filtered out
    expect(result.find((t) => t.id === 'one-off rare song d')).toBeUndefined();
    expect(result.length).toBe(3);
  });
});

