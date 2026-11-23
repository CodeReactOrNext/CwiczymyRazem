/**
 * Whether two step titles are the same skill under different words. Shared by
 * the check on the skeleton (before anything is written) and the quality gate
 * on the finished roadmap, so the two cannot disagree about what a duplicate is.
 */

/** Connector words dropped before comparing two step titles for overlap. */
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "on",
  "in",
  "with",
  "to",
  "for",
  "your",
  "you",
  "by",
  "at",
  "into",
  "over",
  "under",
  "up",
  "down",
]);

/**
 * Rough stemming — just enough to see "anchors" and "anchoring" as the same
 * word, which is what turns "Thumb-Over Bass Anchors" and "Thumb-Over Bass
 * Anchoring (Comping)" from an 0.4 overlap into an obvious 0.75.
 */
const stem = (word: string): string => {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
};

export const titleTokens = (title: string): Set<string> =>
  new Set(
    title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length > 1 && !STOPWORDS.has(word))
      .map(stem),
  );

export const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  a.forEach((word) => {
    if (b.has(word)) intersection++;
  });
  return intersection / new Set([...a, ...b]).size;
};

/**
 * Two titles count as near-duplicates once most of their real words overlap.
 * High on purpose: two titles that merely share a genre word or a phase-local
 * theme ("Pentatonic Box 1" / "Pentatonic Box 2") are a legitimate
 * progression, not a duplicate — this only fires when almost nothing besides
 * the shared words is left.
 */
export const NEAR_DUPLICATE_THRESHOLD = 0.7;

/** Every pair of titles that mostly overlap, each pair once, exact repeats left out. */
export const nearDuplicateTitles = (titles: string[]): [string, string][] => {
  const tokens = titles.map(titleTokens);
  const seen = new Set<string>();
  const pairs: [string, string][] = [];
  for (let i = 0; i < titles.length; i++) {
    for (let j = i + 1; j < titles.length; j++) {
      const a = titles[i];
      const b = titles[j];
      if (a.trim().toLowerCase() === b.trim().toLowerCase()) continue;
      if (tokens[i].size < 2 || tokens[j].size < 2) continue;
      if (jaccard(tokens[i], tokens[j]) < NEAR_DUPLICATE_THRESHOLD) continue;
      const key = [a, b].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push([a, b]);
    }
  }
  return pairs;
};
