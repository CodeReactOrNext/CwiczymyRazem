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
