import { describe, it, expect } from 'vitest';
import { detectRegion } from '../detectRegion';
import { SetlistShow } from '../../types';

function createMockShow(countryCode: string): SetlistShow {
  return {
    id: '1',
    eventDate: '01-01-2026',
    venue: {
      id: 'v1',
      name: 'Arena',
      city: {
        name: 'City',
        country: { code: countryCode, name: 'Country' }
      }
    },
    sets: { set: [] }
  };
}

describe('detectRegion', () => {
  it('returns World for empty or null input', () => {
    expect(detectRegion([])).toBe('World');
  });

  it('detects US correctly', () => {
    const shows = [createMockShow('US'), createMockShow('CA'), createMockShow('US')];
    expect(detectRegion(shows)).toBe('US');
  });

  it('detects EU correctly', () => {
    const shows = [createMockShow('GB'), createMockShow('FR'), createMockShow('DE')];
    expect(detectRegion(shows)).toBe('EU');
  });

  it('detects Australia correctly', () => {
    const shows = [createMockShow('AU'), createMockShow('NZ'), createMockShow('AU')];
    expect(detectRegion(shows)).toBe('Australia');
  });

  it('falls back to World for mixed/other regions', () => {
    const shows = [createMockShow('JP'), createMockShow('BR'), createMockShow('ZA')];
    expect(detectRegion(shows)).toBe('World');
  });

  it('returns World if no region is > 50%', () => {
    const shows = [createMockShow('US'), createMockShow('GB'), createMockShow('AU')];
    expect(detectRegion(shows)).toBe('World');
  });
});
