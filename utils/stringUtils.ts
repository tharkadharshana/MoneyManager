/**
 * Normalizes a string by removing common corporate suffixes, punctuation, 
 * and converting to uppercase.
 */
export function normalizeString(str: string): string {
    if (!str) return '';
    return str
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Remove punctuation
      .replace(/\b(POS|STORE|INC|LLC|LTD|PVT|CORP|SHOP|MARKET)\b/g, '') // Remove suffixes
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
  }
  
  /**
   * Calculates Jaro-Winkler similarity between two strings.
   * Returns a score between 0.0 (no similarity) and 1.0 (exact match).
   */
  export function jaroWinkler(s1: string, s2: string): number {
    const m = 0;
    if (s1.length === 0 || s2.length === 0) return 0;
    if (s1 === s2) return 1;
  
    const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    let matches = 0;
    let transpositions = 0;
  
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);
  
    // Calculate Matches
    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, s2.length);
  
      for (let j = start; j < end; j++) {
        if (s2Matches[j]) continue;
        if (s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  
    if (matches === 0) return 0;
  
    // Calculate Transpositions
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  
    const jaro = (
      (matches / s1.length) +
      (matches / s2.length) +
      ((matches - transpositions / 2) / matches)
    ) / 3;
  
    // Winkler Modification
    // Boost score if common prefix exists (up to 4 chars)
    let prefix = 0;
    for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }
  
    const p = 0.1; // Scaling factor
    return jaro + (prefix * p * (1 - jaro));
  }