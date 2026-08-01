export function sanitizeTrackName(name: string): string {
  // Strip anything in parentheses/brackets (e.g. "Live", "Cover", "Acoustic")
  // e.g. "Nothing Else Matters (Live)" -> "Nothing Else Matters"
  let sanitized = name.replace(/[\(\[].*?[\)\]]/g, '');

  // Strip common suffixes
  sanitized = sanitized.replace(/- Live( at.*)?/gi, '');
  sanitized = sanitized.replace(/- .*?Remaster.*/gi, '');
  sanitized = sanitized.replace(/ - Cover/gi, '');

  // Trim extra whitespace
  return sanitized.trim();
}
