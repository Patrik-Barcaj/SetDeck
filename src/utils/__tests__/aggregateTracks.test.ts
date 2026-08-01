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
    expect(result[0].count).toBe(1); // Seen only once per show
  });
});
