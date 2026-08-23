/**
 * Where the tab's bars actually fall inside a recording that wasn't played to a
 * click.
 *
 * `sourceBpm` alone says "this recording runs at one steady tempo", which is
 * true of a programmed backing and false of almost every real band. One steady
 * tempo means the grid lines up at the start and is a bar out by the end, and no
 * amount of nudging the offset fixes that — the error grows with time.
 *
 * So instead of one number, the alignment carries **anchors**: "bar 33's
 * downbeat is at 71.4s in this recording". Between two anchors the tempo is
 * taken as steady, which is what makes the maths here piecewise-linear rather
 * than a curve fit. Bar 1 is always anchored — that is what `offsetMs` already
 * meant — so a recording with no anchors behaves exactly as it did before.
 *
 * Everything is pure so both the drawing and the sync loop can be tested
 * without audio.
 */

/** A tab beat pinned to the moment it happens in the recording. */
export interface TempoAnchor {
  /** Quarter notes from the tab's beat 0. Always > 0 — beat 0 is `offsetMs`. */
  beat: number;
  /** Where that beat lands in the recording's own timeline, in seconds. */
  sec: number;
}

export interface RecordingTempoMapInput {
  anchors: readonly TempoAnchor[] | undefined;
  /** Where the tab's beat 0 sits in the recording. The bar-1 anchor. */
  offsetMs: number;
  /** Nominal tempo — used before any anchor exists, and as the ratio baseline. */
  sourceBpm: number;
}

export interface RecordingTempoMap {
  /** No anchors: the map is a straight line and callers can keep a fast path. */
  isConstant: boolean;
  /** Recording seconds for a tab beat. The piecewise trackTimeForBeat. */
  secForBeat(beat: number): number;
  /** Tab beat at a moment in the recording. Inverse of `secForBeat`. */
  beatForSec(sec: number): number;
  /** Tempo the recording actually runs at around this beat, in BPM. */
  bpmAtBeat(beat: number): number;
  /** How far the session clock must bend here: `bpmAtBeat / sourceBpm`. */
  ratioAtBeat(beat: number): number;
  /** The nominal tempo the ratios are measured against. */
  sourceBpm: number;
  /** The anchors in force, bar 1 included, sorted and de-conflicted. */
  points: readonly TempoAnchor[];
}

/** Matches the clamp the persistence layer applies to `sourceBpm`. */
export const MIN_TEMPO_BPM = 20;
export const MAX_TEMPO_BPM = 400;

const clampBpm = (bpm: number): number =>
  Math.min(MAX_TEMPO_BPM, Math.max(MIN_TEMPO_BPM, bpm));

/**
 * Tempo implied by two anchors, in BPM.
 *
 * Exported because the editor shows it on every span: dragging a bar line is
 * really editing this number, and the player needs to see what they just made.
 */
export function bpmBetween(from: TempoAnchor, to: TempoAnchor): number {
  const beats = to.beat - from.beat;
  const seconds = to.sec - from.sec;
  if (!(beats > 0) || !(seconds > 0)) return Number.NaN;
  return (beats * 60) / seconds;
}

/**
 * Drops anchors that would imply a stopped or reversed recording.
 *
 * A dragged bar line can be thrown past its neighbour, and an anchor at or
 * behind the previous one means a segment of zero or negative length — an
 * infinite tempo, and a division by zero in every consumer. Rejecting them here
 * keeps that impossible no matter what the UI or a stale saved document says.
 */
function usableAnchors(
  anchors: readonly TempoAnchor[] | undefined,
  zeroSec: number,
): TempoAnchor[] {
  if (!anchors?.length) return [];

  const sorted = anchors
    .filter((a) => Number.isFinite(a.beat) && Number.isFinite(a.sec) && a.beat > 0)
    .sort((a, b) => a.beat - b.beat);

  const kept: TempoAnchor[] = [];
  let lastBeat = 0;
  let lastSec = zeroSec;
  for (const anchor of sorted) {
    // Time and beats must both move forward, or the segment is not playable.
    if (anchor.beat <= lastBeat || anchor.sec <= lastSec) continue;
    kept.push(anchor);
    lastBeat = anchor.beat;
    lastSec = anchor.sec;
  }
  return kept;
}

export function createRecordingTempoMap({
  anchors,
  offsetMs,
  sourceBpm,
}: RecordingTempoMapInput): RecordingTempoMap {
  const baseBpm = Number.isFinite(sourceBpm) && sourceBpm > 0 ? sourceBpm : 120;
  const zeroSec = Number.isFinite(offsetMs) ? offsetMs / 1000 : 0;
  const kept = usableAnchors(anchors, zeroSec);

  if (kept.length === 0) {
    const secPerBeat = 60 / baseBpm;
    return {
      isConstant: true,
      sourceBpm: baseBpm,
      points: [{ beat: 0, sec: zeroSec }],
      secForBeat: (beat) => zeroSec + beat * secPerBeat,
      beatForSec: (sec) => (sec - zeroSec) / secPerBeat,
      bpmAtBeat: () => baseBpm,
      ratioAtBeat: () => 1,
    };
  }

  const points: TempoAnchor[] = [{ beat: 0, sec: zeroSec }, ...kept];
  const lastIdx = points.length - 1;

  // Tempo of each span, plus the one to carry past the final anchor. Extending
  // the last measured tempo beats falling back to the nominal: it is the most
  // recent evidence of what the band was actually doing.
  const segmentBpms: number[] = [];
  for (let i = 0; i < lastIdx; i++) {
    segmentBpms.push(clampBpm(bpmBetween(points[i], points[i + 1])));
  }
  const tailBpm = segmentBpms[segmentBpms.length - 1];

  /** Index of the span starting at or before `beat`; lastIdx means the tail. */
  const spanForBeat = (beat: number): number => {
    if (beat <= 0) return 0;
    let lo = 0;
    let hi = lastIdx;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (points[mid].beat <= beat) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };

  const spanForSec = (sec: number): number => {
    if (sec <= zeroSec) return 0;
    let lo = 0;
    let hi = lastIdx;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (points[mid].sec <= sec) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };

  const bpmOfSpan = (i: number): number => (i >= lastIdx ? tailBpm : segmentBpms[i]);

  return {
    isConstant: false,
    sourceBpm: baseBpm,
    points,

    secForBeat(beat: number): number {
      const i = spanForBeat(beat);
      // Before bar 1 and past the last anchor there is no span to interpolate
      // inside, so both ends run on at their nearest known tempo.
      return points[i].sec + ((beat - points[i].beat) * 60) / bpmOfSpan(i);
    },

    beatForSec(sec: number): number {
      const i = spanForSec(sec);
      return points[i].beat + ((sec - points[i].sec) * bpmOfSpan(i)) / 60;
    },

    bpmAtBeat(beat: number): number {
      return bpmOfSpan(spanForBeat(beat));
    },

    ratioAtBeat(beat: number): number {
      return bpmOfSpan(spanForBeat(beat)) / baseBpm;
    },
  };
}

/**
 * Moves one anchor, keeping the list sorted and free of duplicates.
 *
 * Returns a new array; `sec` null removes the anchor, handing its bars back to
 * the span that used to run through them.
 */
export function withAnchorAt(
  anchors: readonly TempoAnchor[] | undefined,
  beat: number,
  sec: number | null,
): TempoAnchor[] {
  const rest = (anchors ?? []).filter((a) => a.beat !== beat);
  if (sec === null || !Number.isFinite(sec)) return rest.sort((a, b) => a.beat - b.beat);
  return [...rest, { beat, sec }].sort((a, b) => a.beat - b.beat);
}
