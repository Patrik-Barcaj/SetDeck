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

  it('strips snippet, tape intro, and setlist interlude markers', () => {
    expect(sanitizeTrackName('Intro (Tape intro)')).toBe('Intro');
    expect(sanitizeTrackName('Seven Nation Army (Snippet)')).toBe('Seven Nation Army');
    expect(sanitizeTrackName('My Generation (Interlude)')).toBe('My Generation');
    expect(sanitizeTrackName('Time (Reprise)')).toBe('Time');
    expect(sanitizeTrackName('The Song Remains the Same (Demo)')).toBe('The Song Remains the Same');
  });

  it('strips featuring credits and collaborations', () => {
    expect(sanitizeTrackName('Starboy (feat. Daft Punk)')).toBe('Starboy');
    expect(sanitizeTrackName('Bad Blood ft. Kendrick Lamar')).toBe('Bad Blood');
    expect(sanitizeTrackName('All The Stars (with SZA)')).toBe('All The Stars');
    expect(sanitizeTrackName('Levitating [feat. DaBaby]')).toBe('Levitating');
  });

  it('leaves clean names alone', () => {
    expect(sanitizeTrackName('Smells Like Teen Spirit')).toBe('Smells Like Teen Spirit');
  });
});

