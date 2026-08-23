// Converts elapsed playback seconds into beat positions, honouring per-measure
// tempo automation from GP imports. This mirrors the math the TablatureViewer
// worker uses for the visual cursor (computeBeatsElapsed) so note matching and
// drawing can never disagree about "where in the song we are".
import type { TablatureMeasure } from "../../../types/exercise.types";

export interface TempoPoint {
  /** Cumulative beat position (quarter-note units) where this tempo takes effect. */
  beatPos: number;
  /** Tempo ratio relative to the score's base tempo (effective BPM = ratio × userBpm). */
  ratio: number;
}

/** Extract the tempo map from parsed measures — same shape as useTablatureRenderData. */
export function buildTempoMap(measures: TablatureMeasure[]): TempoPoint[] {
  const map: TempoPoint[] = [];
  let pos = 0;
  for (const m of measures) {
    if (m.tempoChange !== undefined) map.push({ beatPos: pos, ratio: m.tempoChange });
    pos += m.beats.reduce((s, b) => s + b.duration, 0);
  }
  return map;
}

export interface BeatClock {
  /** Wall/audio seconds for one full pass of the exercise. */
  loopSeconds: number;
  /** Elapsed seconds since playback start → cumulative beats (grows across loops). */
  toBeats(elapsedSec: number): number;
}

export function createBeatClock(
  tempoMap: TempoPoint[],
  totalBeats: number,
  bpm: number,
): BeatClock {
  // Constant-tempo fast path — regular exercises carry no tempo automation.
  if (tempoMap.length === 0 || totalBeats <= 0) {
    const bps = bpm / 60;
    return {
      loopSeconds: bps > 0 ? totalBeats / bps : 0,
      toBeats: elapsedSec => elapsedSec * bps,
    };
  }

  interface Segment { startBeat: number; endBeat: number; bps: number; }
  const segments: Segment[] = [];
  let loopSeconds = 0;
  for (let i = 0; i < tempoMap.length; i++) {
    const startBeat = tempoMap[i].beatPos;
    const endBeat = i + 1 < tempoMap.length ? tempoMap[i + 1].beatPos : totalBeats;
    const bps = (tempoMap[i].ratio * bpm) / 60;
    segments.push({ startBeat, endBeat, bps });
    if (bps > 0) loopSeconds += (endBeat - startBeat) / bps;
  }

  const firstBps = segments[0].bps;

  return {
    loopSeconds,
    toBeats(elapsedSec: number): number {
      // Pre-roll (latency compensation can push elapsed slightly negative before
      // the first beat) — extrapolate linearly at the opening tempo.
      if (elapsedSec < 0) return elapsedSec * firstBps;
      if (loopSeconds <= 0) return 0;

      const loops = Math.floor(elapsedSec / loopSeconds);
      let t = elapsedSec - loops * loopSeconds;

      let beatPos = totalBeats;
      for (const seg of segments) {
        if (seg.bps <= 0) continue;
        const segSeconds = (seg.endBeat - seg.startBeat) / seg.bps;
        if (t <= segSeconds + 1e-9) { beatPos = seg.startBeat + t * seg.bps; break; }
        t -= segSeconds;
      }
      return loops * totalBeats + Math.min(beatPos, totalBeats);
    },
  };
}

// ── Tempo ruler ───────────────────────────────────────────────────────────────
// `createBeatClock` above answers "given elapsed seconds, what beat are we on?",
// which is what a cursor needs. Schedulers need the opposite: "this note sits at
// beat N — when does it sound?". Rather than hand every scheduler the segment
// walk, the ruler folds the tempo curve into a single *warped beat* coordinate:
//
//     seconds(beat) = toWarped(beat) × 60 / bpm
//
// A stretch of beats played at ratio r costs 1/r warped beats, so a bar taken at
// double tempo occupies half the time a plain bar does. The pay-off is that any
// existing `beats × secondsPerBeat` line becomes correct by swapping in warped
// beats — no scheduler has to learn what a tempo map is, and the user's BPM knob
// still scales the whole piece because `bpm` stays outside the warp.

export interface TempoRuler {
  /** Score beats → warped beats. Multiply by 60/bpm for seconds. */
  toWarped(beat: number): number;
  /** Warped beats → score beats. Inverse of `toWarped`. */
  fromWarped(warped: number): number;
  /** Warped length of one full pass — the loop duration in warped beats. */
  totalWarped: number;
  /** Tempo ratio in force at a score beat (1 where nothing is automated). */
  ratioAt(beat: number): number;
  /** No automation at all, so warped beats == score beats. Lets callers keep a fast path. */
  isConstant: boolean;
}

/** A ratio has to be a positive finite number to divide by — anything else means
 *  "no change here", which is safer than propagating NaN into an audio clock. */
const safeRatio = (ratio: number): number =>
  Number.isFinite(ratio) && ratio > 0 ? ratio : 1;

export function createTempoRuler(tempoMap: TempoPoint[], totalBeats: number): TempoRuler {
  const usable = tempoMap.filter(p => Number.isFinite(p.beatPos) && p.beatPos >= 0);

  if (usable.length === 0) {
    return {
      toWarped:   beat   => beat,
      fromWarped: warped => warped,
      totalWarped: Math.max(0, totalBeats),
      ratioAt:    () => 1,
      isConstant: true,
    };
  }

  const points = [...usable].sort((a, b) => a.beatPos - b.beatPos);
  // A map that starts mid-piece leaves the opening bars at the base tempo.
  if (points[0].beatPos > 0) points.unshift({ beatPos: 0, ratio: 1 });

  // Cumulative warped position at the start of each segment, so a lookup is one
  // scan plus one multiply rather than re-walking the curve every call.
  const startBeats:  number[] = [];
  const startWarped: number[] = [];
  const ratios:      number[] = [];
  let warpedCursor = 0;
  for (let i = 0; i < points.length; i++) {
    const ratio = safeRatio(points[i].ratio);
    startBeats.push(points[i].beatPos);
    startWarped.push(warpedCursor);
    ratios.push(ratio);
    if (i + 1 < points.length) warpedCursor += (points[i + 1].beatPos - points[i].beatPos) / ratio;
  }

  const lastIdx = points.length - 1;
  const tailBeats = Math.max(0, totalBeats - startBeats[lastIdx]);
  const totalWarped = startWarped[lastIdx] + tailBeats / ratios[lastIdx];

  /** Index of the segment covering `beat` — the last one starting at or before it. */
  const segmentAt = (beat: number): number => {
    let lo = 0, hi = lastIdx;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (startBeats[mid] <= beat) lo = mid; else hi = mid - 1;
    }
    return lo;
  };

  return {
    isConstant: false,
    totalWarped,

    ratioAt(beat: number): number {
      return ratios[segmentAt(beat)];
    },

    toWarped(beat: number): number {
      // Before the piece starts (latency pre-roll) the opening tempo is all we
      // have to extrapolate from; past the end, the closing tempo.
      if (beat <= 0) return beat / ratios[0];
      const i = segmentAt(beat);
      return startWarped[i] + (beat - startBeats[i]) / ratios[i];
    },

    fromWarped(warped: number): number {
      if (warped <= 0) return warped * ratios[0];
      let lo = 0, hi = lastIdx;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (startWarped[mid] <= warped) lo = mid; else hi = mid - 1;
      }
      return startBeats[lo] + (warped - startWarped[lo]) * ratios[lo];
    },
  };
}

/** Convenience for callers that hold measures rather than a prepared map. */
export function createTempoRulerFromMeasures(
  measures: TablatureMeasure[] | undefined,
): TempoRuler {
  if (!measures?.length) return createTempoRuler([], 0);
  const totalBeats = measures.reduce(
    (sum, m) => sum + m.beats.reduce((s, b) => s + b.duration, 0),
    0,
  );
  return createTempoRuler(buildTempoMap(measures), totalBeats);
}
