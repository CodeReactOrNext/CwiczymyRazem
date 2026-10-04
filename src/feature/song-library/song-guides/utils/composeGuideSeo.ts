import type { GuideLiveData, SongGuide } from "../types";

/**
 * Lookup-intent SEO strings for a song guide.
 *
 * These pages sit around position 7–9 for "is {song} hard to play", a SERP
 * owned by Reddit and Ultimate Guitar threads and not winnable from there.
 * They also rank for "{song} bpm / key / tuning / difficulty", where forums
 * are weak and a clean data answer can take the snippet. The composer below
 * retargets the description at those lookups. (A matching title composer was
 * removed on 2026-10-04: two lookup-title variants moved neither CTR nor
 * clicks, and titles are now hand-written "How to Play …" lines.)
 *
 * Two rules run through all of it: never emit a segment whose data is missing
 * (fall through to a shorter variant instead of printing "null" or a gap), and
 * never invent a value. `guide.lookup` is deliberately sparse — a song with no
 * single key simply has no key here — so every read is guarded.
 */

/** Description cutoff. Clauses drop from the end until it fits. */
const DESCRIPTION_MAX = 155;

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
