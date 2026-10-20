import type { HarmonyKind } from "./keyDetection";
import type { BarInfo, NoteEvent } from "./noteEvents";

/**
 * The feel the band plays in. The meter itself (4/4, 7/8, 12/8…) is handled
 * bar by bar through its groups; the groove only decides the texture on top.
 */
export type GrooveId =
  | "rock"
  | "pop"
  | "ballad"
  | "shuffle"
  | "metal"
  | "doom"
  | "thrash"
  | "halftime"
  | "compound"
  | "waltz"
  // Only ever set by the boss-fight score, never chosen from a tab.
  | "boss";

export interface GrooveInput {
  bars: readonly BarInfo[];
  notes: readonly NoteEvent[];
  bpm: number;
  /** Title + description, for the few styles a tab can't show on its own. */
  text?: string;
  kind: HarmonyKind;
}

const EPS = 1e-6;

const isCompoundMeter = ([numerator, denominator]: [number, number]) =>
  denominator === 8 && numerator % 3 === 0 && numerator > 3;

/** Bars whose beat grid is plain quarters (2/4, 3/4, 4/4, 6/4, 8/4, 2/2). */
export const isSimpleMeter = ([numerator, denominator]: [number, number]) =>
  denominator === 4 || (denominator === 2 && numerator <= 4);

function share(
  notes: readonly NoteEvent[],
  test: (note: NoteEvent) => boolean,
): number {
  let hit = 0;
  let total = 0;
  for (const note of notes) {
    total += note.weight;
    if (test(note)) hit += note.weight;
  }
  return total > 0 ? hit / total : 0;
}

const onGrid = (value: number, step: number) =>
  Math.abs(value / step - Math.round(value / step)) < EPS;

export function chooseGroove({
  bars,
  notes,
  bpm,
  text = "",
}: GrooveInput): GrooveId {
  const meters = bars.map((bar) => bar.timeSignature);
  if (meters.length > 0 && meters.every(isCompoundMeter)) return "compound";
  if (meters.length > 0 && meters.every(([n, d]) => n === 3 && d === 4))
    return "waltz";

  const words = text.toLowerCase();
  if (/metal|thrash|gallop|tremolo|doom|djent|chug|heavy|puppets/.test(words)) {
    if (bpm >= 170) return "thrash";
    return bpm < 90 ? "doom" : "metal";
  }

  // Triplet subdivisions (a third or two thirds of a beat) are the shuffle.
  const triplets = share(
    notes,
    (note) => !onGrid(note.posInBar, 0.25) && onGrid(note.posInBar * 3, 1),
  );
  if (/blues|shuffle|swing|boogie/.test(words) || triplets > 0.35)
    return "shuffle";

  if (bpm < 72) return "ballad";
  if (bpm >= 165) return "halftime";
  const sixteenths = share(
    notes,
    (note) => !onGrid(note.posInBar, 0.5) && onGrid(note.posInBar, 0.25),
  );
  return sixteenths > 0.3 && bpm <= 110 ? "pop" : "rock";
}

/**
 * Where a bar's groups begin, in beats. Quarter-note meters count every beat;
 * compound meters count dotted quarters; odd eighth meters group in twos and a
 * three — unless the tab spells its own grouping with accents, as the meter
 * drills do (2+2+3 in one bar, 3+2+2 in the next).
 */
export function groupStarts(bar: BarInfo): number[] {
  const [numerator, denominator] = bar.timeSignature;
  const written = numerator * (4 / denominator);
  if (Math.abs(written - bar.length) > EPS) return [0];
  if (isSimpleMeter(bar.timeSignature)) {
    return Array.from({ length: Math.round(bar.length) }, (_, i) => i).filter(
      (beat) => beat < bar.length - EPS,
    );
  }
  if (isCompoundMeter(bar.timeSignature)) {
    return Array.from({ length: numerator / 3 }, (_, i) => i * 1.5);
  }
  if (denominator !== 8) return [0];

  const accents = [...bar.accents].sort((a, b) => a - b);
  if (accents.length >= 2 && accents.every((a) => onGrid(a, 0.5))) {
    // A group is two eighths at least: an accent closer than that to the last
    // group (or to the bar line) is a melodic accent — the meter drills also
    // accent the note pair that closes each bar — not a new group.
    const starts = [0];
    for (const accent of accents) {
      if (
        accent - starts[starts.length - 1] >= 1 - EPS &&
        bar.length - accent >= 1 - EPS
      )
        starts.push(accent);
    }
    if (starts.length >= 2) return starts;
  }
  const sizes: number[] =
    numerator === 5 ? [3, 2] : numerator === 8 ? [3, 3, 2] : [];
  if (sizes.length === 0) {
    let left = numerator;
    while (left > 0) {
      const size = left === 3 ? 3 : 2;
      sizes.push(Math.min(size, left));
      left -= size;
    }
  }
  const starts: number[] = [];
  let at = 0;
  for (const size of sizes) {
    starts.push(at * 0.5);
    at += size;
  }
  return starts;
}

/**
 * Kick or snare on each group: kick on the one, then alternating, and an odd
 * count of three or more ends on the snare — which turns 3/4 into the waltz's
 * boom-chick-chick and keeps two kicks from colliding across the bar line.
 */
export function groupHits(count: number): ("kick" | "snare")[] {
  const hits = Array.from({ length: count }, (_, i): "kick" | "snare" =>
    i % 2 === 0 ? "kick" : "snare",
  );
  if (count >= 3 && count % 2 === 1) hits[count - 1] = "snare";
  return hits;
}
