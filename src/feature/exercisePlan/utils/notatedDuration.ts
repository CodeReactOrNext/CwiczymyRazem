// Our model stores `beat.duration` as the note's actual *sounding* length, in
// quarter notes — for a tuplet that is already time-compressed (a triplet eighth
// sounds for 1/3 of a quarter, not 1/2). Notation instead wants the *written*
// value: a power-of-two note, optionally dotted, with the tuplet drawn on top.
// This recovers that written value, shared by the AlphaTab score and the tab
// board's own rhythm lane so the two never disagree.

/** Note-value codes — the denominator of the note (4 = quarter, 8 = eighth, …). */
const DURATION_CODES = [1, 2, 4, 8, 16, 32, 64] as const;

// Default tuplet denominator per numerator (matches AlphaTab's own
// AlphaTex1LanguageHandler._getTupletDenominator: 3→2, 5/6/7→4, 9/10/11/12→8).
// A tuplet packs `numerator` notes into the time of `denominator` — a triplet
// packs 3 notes into the time of 2, so each sounds for 2/3 of its written length.
export const TUPLET_DENOMINATORS: Record<number, number> = { 3: 2, 5: 4, 6: 4, 7: 4, 9: 8, 10: 8, 11: 8, 12: 8 };

const EPS = 1e-3;

export interface NotatedDuration {
  /** Written note value as a code (4 = quarter, 8 = eighth, …). */
  code: number;
  dots: 0 | 1 | 2;
  /** Tuplet the note is written under — the beat's own, or one inferred from its length. */
  tuplet?: number;
}

function matchPlain(written: number): Omit<NotatedDuration, "tuplet"> | null {
  for (const code of DURATION_CODES) {
    const base = 4 / code;
    if (Math.abs(written - base) < EPS) return { code, dots: 0 };
    if (Math.abs(written - base * 1.5) < EPS) return { code, dots: 1 };
    if (Math.abs(written - base * 1.75) < EPS) return { code, dots: 2 };
  }
  return null;
}

/**
 * The tuplet a beat with no `tuplet` of its own is evidently written under: a
 * length that isn't a plain or dotted note but is one once the triplet's 2/3
 * compression is undone (1/3, 2/3, 1/6 of a quarter…). Hand-written exercise
 * data often stores triplets as `duration: 0.333` alone, which would otherwise
 * be drawn — and played by AlphaTab — as sixteenths.
 */
export function inferTuplet(duration: number): number | undefined {
  if (!duration || duration <= 0 || matchPlain(duration)) return undefined;
  return matchPlain(duration * 1.5) ? 3 : undefined;
}

export function resolveNotatedDuration(duration: number, tuplet?: number): NotatedDuration {
  if (!duration || duration <= 0) return { code: 4, dots: 0, tuplet };

  const effectiveTuplet = tuplet ?? inferTuplet(duration);
  const denominator = effectiveTuplet ? TUPLET_DENOMINATORS[effectiveTuplet] : undefined;
  // Undo the tuplet's time compression to recover the written base duration.
  const written = denominator ? duration * (effectiveTuplet! / denominator) : duration;

  const plain = matchPlain(written);
  if (plain) return { ...plain, tuplet: effectiveTuplet };

  // Fallback: nearest base duration, no dot — only for values that don't cleanly
  // resolve to a plain, dotted or tupleted note.
  const raw = 4 / written;
  const code = DURATION_CODES.reduce<number>((closest, candidate) =>
    Math.abs(candidate - raw) < Math.abs(closest - raw) ? candidate : closest, DURATION_CODES[0]);
  return { code, dots: 0, tuplet: effectiveTuplet };
}

/** Flags (or beams) a written note value carries: eighth 1, sixteenth 2, shorter 3. */
export function flagCountForCode(code: number): number {
  return code >= 32 ? 3 : code === 16 ? 2 : code === 8 ? 1 : 0;
}
