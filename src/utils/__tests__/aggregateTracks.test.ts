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
});

