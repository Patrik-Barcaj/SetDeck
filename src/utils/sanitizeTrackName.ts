export function sanitizeTrackName(name: string): string {
  if (!name) return '';

  // Strip featuring credits outside or inside parentheses/brackets
  // e.g. "Song (feat. Artist)" or "Song feat. Artist" or "Song ft. Artist" or "Song (with Artist)"
  let sanitized = name.replace(/\s*(?:\[|\()?\s*(?:feat\.?|ft\.?|featuring|with)\s+[^()\]]+(?:\)|\])?/gi, '');

  // Strip standard setlist tags & parentheses/brackets content
  // e.g. "(Snippet)", "(Acoustic)", "(Live)", "(Tape intro)", "(Intro)", "(Outro)", "(Demo)", "(Interlude)", "(Reprise)"
  sanitized = sanitized.replace(/[\(\[].*?[\)\]]/g, '');

  // Strip common suffixes with dashes or colons
  sanitized = sanitized.replace(/-\s*Live(\s+at.*)?/gi, '');
  sanitized = sanitized.replace(/-\s*.*?Remaster.*/gi, '');
  sanitized = sanitized.replace(/-\s*Cover.*/gi, '');
  sanitized = sanitized.replace(/-\s*Acoustic.*/gi, '');
  sanitized = sanitized.replace(/-\s*Single(\s+Version)?/gi, '');
  sanitized = sanitized.replace(/-\s*Radio(\s+Edit)?/gi, '');
  sanitized = sanitized.replace(/-\s*Tape(\s+Intro)?/gi, '');

  // Clean remaining stray punctuation and extra whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').replace(/^["']|["']$/g, '').trim();

  return sanitized || name.trim();
}

