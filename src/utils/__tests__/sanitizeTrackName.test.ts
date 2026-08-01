import { describe, it, expect } from 'vitest';
import { sanitizeTrackName } from '../sanitizeTrackName';

describe('sanitizeTrackName', () => {
  it('strips parentheses content like (Live)', () => {
    expect(sanitizeTrackName('Nothing Else Matters (Live)')).toBe('Nothing Else Matters');
    expect(sanitizeTrackName('Creep (Acoustic Version)')).toBe('Creep');
  });

  it('strips brackets content', () => {
    expect(sanitizeTrackName('Everlong [Live at Wembley]')).toBe('Everlong');
  });

  it('strips common suffixes with dashes', () => {
    expect(sanitizeTrackName('Master of Puppets - Live')).toBe('Master of Puppets');
    expect(sanitizeTrackName('Hotel California - 2013 Remaster')).toBe('Hotel California');
    expect(sanitizeTrackName('All Along The Watchtower - Cover')).toBe('All Along The Watchtower');
  });

  it('handles combination of characters', () => {
    expect(sanitizeTrackName('Let It Be - Live (1970)')).toBe('Let It Be');
  });

  it('leaves clean names alone', () => {
    expect(sanitizeTrackName('Smells Like Teen Spirit')).toBe('Smells Like Teen Spirit');
  });
});
