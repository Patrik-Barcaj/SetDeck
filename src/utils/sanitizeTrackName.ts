export function sanitizeTrackName(name: string): string {
  if (!name) return '';

  // Strip featuring credits outside or inside parentheses/brackets
  // e.g. "Song (feat. Artist)" or "Song feat. Artist" or "Song ft. Artist" or "Song (with Artist)"
  let sanitized = name.replace(/\s*(?:\[|\()?\s*(?:feat\.?|ft\.?|featuring|with)\s+[^()\]]+(?:\)|\])?/gi, '');

  // Strip common suffixes with dashes or colons first (e.g. "Let It Be - Live (1970)")
  sanitized = sanitized.replace(/\s*-\s*Live(\s+(?:at|from|in|\(\d+\)).*?)?$/gi, '');
  sanitized = sanitized.replace(/\s*-\s*Live\b.*$/gi, '');
  sanitized = sanitized.replace(/\s*-\s*.*?Remaster.*?$/gi, '');
  sanitized = sanitized.replace(/\s*-\s*Cover.*?$/gi, '');
  sanitized = sanitized.replace(/\s*-\s*Acoustic.*?$/gi, '');
  sanitized = sanitized.replace(/\s*-\s*Single(\s+Version)?$/gi, '');
  sanitized = sanitized.replace(/\s*-\s*Radio(\s+Edit)?$/gi, '');
  sanitized = sanitized.replace(/\s*-\s*Tape(\s+Intro|\s+Outro)?$/gi, '');
  sanitized = sanitized.replace(/\s*-\s*Snippet$/gi, '');

  // Strip standard setlist/parentheses/brackets content
  sanitized = sanitized.replace(/\s*[\(\[][^()\]]*[\)\]]/g, '');

  // Strip any lingering double quotes, single quotes, stray hyphens or punctuation
  sanitized = sanitized.replace(/^[-–—:\s"']+|[-–—:\s"']+$/g, '');
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized || name.trim();
}

