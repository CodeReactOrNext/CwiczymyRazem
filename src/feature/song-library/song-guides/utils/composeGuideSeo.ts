import type { GuideLiveData, SongGuide } from "../types";

/**
 * Lookup-intent SEO strings for a song guide.
 *
 * These pages sit around position 7–9 for "is {song} hard to play", a SERP
 * owned by Reddit and Ultimate Guitar threads and not winnable from there.
 * They also rank for "{song} bpm / key / tuning / difficulty", where forums
 * are weak and a clean data answer can take the snippet. The composers below
 * retarget the title and description at those lookups.
 *
 * Two rules run through all of it: never emit a segment whose data is missing
 * (fall through to a shorter variant instead of printing "null" or a gap), and
 * never invent a value. `guide.lookup` is deliberately sparse — a song with no
 * single key simply has no key here — so every read is guarded.
 */

/** Google truncates the title around here; measured on the rendered string. */
const TITLE_MAX = 60;
/** Description cutoff. Clauses drop from the end until it fits. */
const DESCRIPTION_MAX = 155;

/**
 * Community rating when the song has one, editorial estimate otherwise — the
 * same precedence `resolveGuideFaq` already uses, so the number in the title
 * matches the number in the FAQ body. Both are real authored/measured values;
 * neither is invented.
 */
const resolveRating = (
  guide: SongGuide,
  liveData: GuideLiveData,
): string | null => {
  const live =
    liveData.song && liveData.song.ratingsCount > 0
      ? liveData.song.avgDifficulty
      : null;
  const rating = live ?? guide.editorial.difficulty;
  return Number.isFinite(rating) ? rating.toFixed(1) : null;
};

/**
 * First variant that has all its data *and* fits the budget wins. Variant 4
 * needs nothing beyond the song name, so the chain always terminates.
 */
export const composeGuideTitle = (
  guide: SongGuide,
  liveData: GuideLiveData,
): string => {
  const { bpm, tuning } = guide.lookup ?? {};
  const song = guide.title;
  const rating = resolveRating(guide, liveData);

  const variants = [
    bpm && tuning && rating
      ? `${song}: ${bpm} BPM, ${tuning}, ${rating}/10 Difficulty`
      : null,
    bpm && rating ? `${song}: ${bpm} BPM, ${rating}/10 Difficulty` : null,
    rating ? `${song} Guitar Difficulty: ${rating}/10` : null,
    `${song} on Guitar: Difficulty, BPM & Tuning`,
  ];

  // The last variant is returned even if it overruns: a too-long title Google
  // trims still beats no title at all.
  return (
    variants.find(
      (variant): variant is string =>
        Boolean(variant) && (variant as string).length <= TITLE_MAX,
    ) ?? (variants[variants.length - 1] as string)
  );
};

/**
 * Built clause by clause, then trimmed from the end until it fits — the
 * closing sentence is the first thing sacrificed to a long song or band name,
 * because the data clauses are what the lookup queries are after.
 */
export const composeGuideDescription = (
  guide: SongGuide,
  liveData: GuideLiveData,
): string => {
  const { bpm, tuning, musicalKey } = guide.lookup ?? {};
  const ratingsCount = liveData.song?.ratingsCount ?? 0;
  const rating =
    ratingsCount > 0 ? liveData.song?.avgDifficulty.toFixed(1) : null;

  // "212 BPM in E minor, E standard tuning". Tempo and key share one clause so
  // that dropping the tempo leaves "E minor, …" rather than a dangling "in".
  const tempoAndKey =
    bpm && musicalKey
      ? `${bpm} BPM in ${musicalKey}`
      : bpm
        ? `${bpm} BPM`
        : (musicalKey ?? null);

  const specs = [tempoAndKey, tuning ? `${tuning} tuning` : null].filter(
    Boolean,
  );

  const sentences: (string | null)[] = [];

  const opener = `${guide.title} by ${guide.artist}`;
  sentences.push(specs.length > 0 ? `${opener}: ${specs.join(", ")}.` : null);

  // Only ever attributed to real raters — never to the editorial estimate,
  // since this clause names a crowd that would not exist.
  sentences.push(
    rating
      ? `Rated ${rating}/10 by ${ratingsCount} guitarist${
          ratingsCount === 1 ? "" : "s"
        } who learned it.`
      : null,
  );

  sentences.push("Section-by-section difficulty map inside.");

  const clauses = sentences.filter((s): s is string => Boolean(s));

  for (let end = clauses.length; end > 1; end--) {
    const candidate = clauses.slice(0, end).join(" ");
    if (candidate.length <= DESCRIPTION_MAX) return candidate;
  }

  // Nothing but the opener survived; hand back whatever the guide already had
  // rather than shipping a lone fragment.
  const first = clauses[0];
  return first && first.length <= DESCRIPTION_MAX
    ? first
    : guide.seo.metaDescription;
};
