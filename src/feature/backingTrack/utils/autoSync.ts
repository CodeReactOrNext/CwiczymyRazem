import type { TabSourceMeasure } from "./alignment";
import { tabNoteEvents } from "./alignment";
import type { RecordingFeatures } from "./audioFeatures";
import { fft, snapToOnset } from "./audioFeatures";
import { estimatePeriod, trackBeats } from "./beatTracker";
import type { TempoAnchor } from "./tempoMap";
import { createRecordingTempoMap } from "./tempoMap";

/**
 * Finding where a tab sits in a recording, without a human dragging lines.
 *
 * The tab is read as the whole band, not just the part being practised: a
 * "guitar backing track" is the song with the guitar taken *out*, so the one
 * part the player is learning is the one part the recording does not have.
 * The drums and bass in the Guitar Pro file are what it does have.
 *
 * Every instrument is matched where it lives in the spectrum — kick and bass
 * in the low band, snare and guitars in the middle, cymbals on top. A hi-hat
 * on every eighth fits anywhere on the eighth grid; a kick on one and three
 * and a snare on two and four fit one way only, and the bands are what let
 * them be told apart.
 *
 * Three passes, each narrowing the last:
 *
 * 1. **Where and how fast, roughly.** Each band's notes are slid along that
 *    band's attack curve at every tempo within ±10% of the score's; one FFT
 *    cross-correlation per band and tempo does every start at once.
 * 2. **Which of those.** A riff that repeats fits a bar early or late almost
 *    as well, so the best few are scored on whether the recording sounds the
 *    tab's pitches where the tab plays them.
 * 3. **Exactly, then drift.** Bar 1 and the opening tempo are searched again
 *    on the opening bars, then pinned to the real attacks with a line through
 *    them; the whole tab is then walked against the recording with dynamic
 *    time warping, and bars are pinned only where that measurably helps.
 */

/** Open strings, string 1 first, for tabs that carry no sounding pitch. */
const GUITAR_OPEN_MIDI = [64, 59, 55, 50, 45, 40, 35];
const BASS_OPEN_MIDI = [43, 38, 33, 28, 23];
/** Standard, Eb, D and a semitone up — tried only when the pitches above are
 *  guesses; a Guitar Pro file says the real pitch of every note. */
const TUNING_SHIFTS = [0, -1, -2, 1];

/** General MIDI drum keys, grouped by where they hit hardest. */
const KICK = new Set([35, 36]);
const SNARE = new Set([37, 38, 39, 40]);
const HATS = new Set([42, 44, 46]);
const CYMBALS = new Set([49, 51, 52, 53, 55, 57, 59]);
const TOMS = new Set([41, 43, 45, 47, 48, 50]);

const COARSE_FPS = 50;
const TEMPO_SPAN = 0.1;
const TEMPO_STEP = 0.002;
/** The tab may start this long before the recording does. */
const MAX_LEAD_SEC = 5;
const CANDIDATES_PER_TEMPO = 3;
const CANDIDATE_POOL = 12;
const CHROMA_WEIGHT = 1.5;

/** Bars at the start searched again on their own for bar 1 and the opening tempo. */
const OPENING_BARS = 8;
/** Windows the line through the first attacks is tried on, shortest first: a
 *  band that drifts bends the line over a long one. */
const LINE_WINDOWS_BARS = [4, 8, 16];
/** How far from the whole-song fit bar 1 may turn out to be. */
const OPENING_SEARCH_SEC = 1;

/**
 * Timing slack, in frames of the attack curve (~5.8 ms each). A drummer is
 * ±20 ms off the grid without anyone calling it sloppy, so scores look a few
 * frames either side; "did the note land on a hit" looks a little wider.
 */
const SCORE_RADIUS = 3;
const HIT_RADIUS = 6;
/** An attack counts as a note's own within this much of it, for the line fit. */
const MATCH_TOLERANCE_SEC = 0.04;
const OUTLIER_SEC = 0.03;
const HIT_STRENGTH = 0.15;

/** How far the band may wander from a straight line before it is not drift
 *  but a different place in the song. */
const DRIFT_BAND_SEC = 2.5;
/** Drift smaller than this is not worth a pinned bar. */
const DRIFT_TOLERANCE_SEC = 0.02;
const MAX_ANCHORS = 64;

/** Margin the best fit needs over a genuinely different one to be trusted. */
const MIN_MARGIN = 0.04;
/**
 * Hit rates are chance-corrected (see beyondChance): 0 is what notes dropped
 * anywhere would score against this recording, 1 is every note on an attack.
 * Raw rates flatter a busy or noisy recording, where any moment is close to
 * some attack.
 */
const MIN_START_BEYOND_CHANCE = 0.3;
/** Or, regardless of rivals: the notes land on attacks far beyond chance. A
 *  band that drifts blurs every whole-song fit, the right one included. */
const SURE_BEYOND_CHANCE = 0.5;
const SURE_START_BEYOND_CHANCE = 0.4;

export type SyncBand = "all" | "low" | "mid" | "high";
const BANDS: SyncBand[] = ["all", "low", "mid", "high"];

export interface SyncEvent {
  beat: number;
  durationBeats: number;
  /** Where in the spectrum this hit should show up. */
  band: SyncBand;
  /** How much it counts — a kick more than a hi-hat, a chord more than a note. */
  weight: number;
  /** Pitch classes sounding, empty for a drum hit. */
  pitchClasses: number[];
  /** Pitches read off the file rather than guessed from standard tuning. */
  exactPitch?: boolean;
  /** The drums and bass — what a backing track keeps of the band. */
  rhythmSection?: boolean;
}

/** One Guitar Pro track, as the search reads it. */
export interface SyncTrack {
  trackType?: "guitar" | "bass" | "drums" | "vocals";
  measures: TabSourceMeasure[];
}

const pitchClassOf = (midi: number) => ((Math.round(midi) % 12) + 12) % 12;

function drumBand(midi: number | undefined): [SyncBand, number] {
  if (midi === undefined) return ["all", 0.5];
  if (KICK.has(midi)) return ["low", 1];
  if (SNARE.has(midi)) return ["mid", 1];
  if (HATS.has(midi)) return ["high", 0.35];
  if (CYMBALS.has(midi)) return ["high", 0.8];
  if (TOMS.has(midi)) return ["mid", 0.6];
  return ["all", 0.4];
}

/**
 * Every track of the tab, digested into what the search reads. Vocals are
 * left out: a sung line is the least reliable thing to time a recording by.
 */
export function syncEventsFromTracks(tracks: SyncTrack[]): SyncEvent[] {
  const events: SyncEvent[] = [];
  for (const track of tracks) {
    const type = track.trackType ?? "guitar";
    if (type === "vocals") continue;
    for (const event of tabNoteEvents(track.measures)) {
      if (type === "drums") {
        const bands = new Map<SyncBand, number>();
        for (const note of event.notes) {
          const [band, weight] = drumBand(note.midiNote);
          bands.set(band, Math.max(bands.get(band) ?? 0, weight));
        }
        for (const [band, weight] of bands) {
          events.push({
            beat: event.beat,
            durationBeats: event.durationBeats,
            band,
            weight,
            pitchClasses: [],
            rhythmSection: true,
          });
        }
        continue;
      }
      // Guitar and bass: a Guitar Pro file gives the sounding pitch of every
      // note (tuning, capo and all); anything else falls back to standard.
      const open = type === "bass" ? BASS_OPEN_MIDI : GUITAR_OPEN_MIDI;
      const pitchClasses = new Set<number>();
      let exact = true;
      for (const note of event.notes) {
        if (typeof note.midiNote === "number") pitchClasses.add(pitchClassOf(note.midiNote));
        else {
          exact = false;
          const base = open[note.string - 1];
          if (base !== undefined) pitchClasses.add(pitchClassOf(base + note.fret));
        }
      }
      events.push({
        beat: event.beat,
        durationBeats: event.durationBeats,
        band: type === "bass" ? "low" : "mid",
        weight: type === "bass" ? 0.8 : Math.min(1, 0.4 + 0.15 * event.notes.length),
        pitchClasses: [...pitchClasses],
        exactPitch: exact,
        rhythmSection: type === "bass",
      });
    }
  }
  return events.sort((a, b) => a.beat - b.beat);
}

/** A lone guitar tab — what a tab without a Guitar Pro file amounts to. */
export const syncEventsFromTab = (measures: TabSourceMeasure[] | undefined): SyncEvent[] =>
  syncEventsFromTracks([{ trackType: "guitar", measures: measures ?? [] }]);

export interface AutoSyncInput {
  features: RecordingFeatures;
  events: SyncEvent[];
  beatsPerBar: number;
  /** Where the tempo search is centred — the score's own tempo. */
  nominalBpm: number;
}

export interface AutoSyncResult {
  offsetMs: number;
  sourceBpm: number;
  tempoAnchors: TempoAnchor[];
  /** Whether the fit stands clear of the alternatives. */
  confident: boolean;
  /** Share of the tab's notes that land on an attack in the recording, 0..1. */
  hitRate: number;
  /** How much of the recording the tab spans, 0..1 — a tab of the first
   *  minute of a five-minute song can only ever line up for that minute. */
  coverage?: number;
  /** The numbers the verdict was reached on — for tuning, never shown. */
  diagnostics?: { margin: number; start: number; overall: number };
}

interface Fit {
  offsetSec: number;
  bpm: number;
}

type Envelopes = Record<SyncBand, Float32Array>;

// ── Small helpers ─────────────────────────────────────────────────────────

const nextPow2 = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(2, n)));

/** Each value replaced by the largest within `radius` frames — tolerance. */
function widen(values: Float32Array, radius: number): Float32Array {
  if (radius <= 0) return values;
  const out = new Float32Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    let best = 0;
    for (let k = Math.max(0, i - radius); k <= Math.min(values.length - 1, i + radius); k += 1) {
      if (values[k] > best) best = values[k];
    }
    out[i] = best;
  }
  return out;
}

/** Max-pools a curve onto a coarser frame rate. */
function resample(values: Float32Array, fromFps: number, toFps: number, length: number): Float32Array {
  const out = new Float32Array(length);
  for (let i = 0; i < values.length; i += 1) {
    const j = Math.floor((i / fromFps) * toFps);
    if (j < length && values[i] > out[j]) out[j] = values[i];
  }
  return out;
}

/** Each band's attack curve, falling back to the overall one where a band is missing. */
function bandEnvelopes(features: RecordingFeatures): Envelopes {
  return {
    all: features.onset,
    low: features.onsetLow ?? features.onset,
    mid: features.onsetMid ?? features.onset,
    high: features.onsetHigh ?? features.onset,
  };
}

const widenAll = (envelopes: Envelopes, radius: number): Envelopes => ({
  all: widen(envelopes.all, radius),
  low: widen(envelopes.low, radius),
  mid: widen(envelopes.mid, radius),
  high: widen(envelopes.high, radius),
});

/** Weighted mean attack strength under the tab's notes, each in its own band. */
function attackScore(
  envelopes: Envelopes,
  fps: number,
  events: SyncEvent[],
  secForBeat: (beat: number) => number,
): number {
  let sum = 0;
  let weights = 0;
  for (const event of events) {
    const envelope = envelopes[event.band];
    const frame = Math.round(secForBeat(event.beat) * fps);
    if (frame < 0 || frame >= envelope.length) continue;
    sum += event.weight * envelope[frame];
    weights += event.weight;
  }
  return weights > 0 ? sum / weights : 0;
}

/**
 * Share of notes (by weight) that land on an attack, with luck taken out: how
 * much better than notes dropped at random moments of the same stretch, per
 * band — 0 = no better, 1 = every note.
 */
function landing(
  envelopes: Envelopes,
  fps: number,
  events: SyncEvent[],
  secForBeat: (beat: number) => number,
): { rate: number; beyondChance: number } {
  if (events.length === 0) return { rate: 0, beyondChance: 0 };
  const from = Math.max(0, Math.floor(secForBeat(events[0].beat) * fps));
  const to = Math.ceil(secForBeat(events[events.length - 1].beat) * fps);
  const busyShare = new Map<SyncBand, number>();
  for (const band of BANDS) {
    const envelope = envelopes[band];
    const end = Math.min(envelope.length, to);
    if (end <= from) continue;
    let busy = 0;
    for (let i = from; i < end; i += 1) if (envelope[i] >= HIT_STRENGTH) busy += 1;
    busyShare.set(band, busy / (end - from));
  }
  let hits = 0;
  let chance = 0;
  let weights = 0;
  for (const event of events) {
    const envelope = envelopes[event.band];
    const frame = Math.round(secForBeat(event.beat) * fps);
    if (frame < 0 || frame >= envelope.length) continue;
    weights += event.weight;
    chance += event.weight * (busyShare.get(event.band) ?? 0);
    if (envelope[frame] >= HIT_STRENGTH) hits += event.weight;
  }
  if (weights === 0) return { rate: 0, beyondChance: 0 };
  const rate = hits / weights;
  const luck = chance / weights;
  return { rate, beyondChance: luck >= 1 ? 0 : Math.max(0, (rate - luck) / (1 - luck)) };
}

/** How well the recording's pitch content agrees with the tab's notes. */
function chromaAgreement(
  chroma: Float32Array,
  fps: number,
  events: SyncEvent[],
  fit: Fit,
  shift: number,
): number {
  const frames = chroma.length / 12;
  const secPerBeat = 60 / fit.bpm;
  let sum = 0;
  let weights = 0;
  for (const event of events) {
    if (event.pitchClasses.length === 0) continue;
    const start = Math.round((fit.offsetSec + event.beat * secPerBeat) * fps);
    if (start < 0 || start >= frames) continue;
    const span = Math.max(1, Math.round(Math.min(event.durationBeats * secPerBeat, 0.25) * fps));
    const end = Math.min(frames, start + span);
    let dot = 0;
    for (let f = start; f < end; f += 1) {
      for (const pc of event.pitchClasses) dot += chroma[f * 12 + (((pc + shift) % 12) + 12) % 12];
    }
    dot /= (end - start) * Math.sqrt(event.pitchClasses.length);
    sum += event.weight * dot;
    weights += event.weight;
  }
  return weights > 0 ? sum / weights : 0;
}

/** Best tuning shift for these events at this fit, and how well it agrees. */
function bestChroma(features: RecordingFeatures, events: SyncEvent[], fit: Fit): { chroma: number; shift: number } {
  const pitched = events.filter((event) => event.pitchClasses.length > 0);
  if (pitched.length === 0) return { chroma: 0, shift: 0 };
  const shifts = pitched.every((event) => event.exactPitch) ? [0] : TUNING_SHIFTS;
  let best = { chroma: 0, shift: 0 };
  for (const shift of shifts) {
    const chroma = chromaAgreement(features.chroma, features.chromaFps, pitched, fit, shift);
    if (chroma > best.chroma) best = { chroma, shift };
  }
  return best;
}

// ── Pass 1 + 2: where, roughly ────────────────────────────────────────────

interface Candidate extends Fit {
  attack: number;
  chroma: number;
  shift: number;
  total: number;
}

function coarseCandidates(input: AutoSyncInput): Candidate[] {
  const { features, events, nominalBpm } = input;
  const envLength = Math.ceil(features.durationSec * COARSE_FPS) + 1;
  const lastBeat = events.reduce((max, event) => Math.max(max, event.beat), 0);
  const lead = Math.round(MAX_LEAD_SEC * COARSE_FPS);
  const slowest = nominalBpm * (1 - TEMPO_SPAN);
  const longestTab = Math.ceil(((lastBeat * 60) / slowest) * COARSE_FPS) + 2;
  const size = nextPow2(envLength + lead + longestTab);

  // Each band's recording, in the frequency domain, with room in front for a
  // tab that starts before the recording does. ±2 frames of slack: a tempo a
  // fraction of a percent off still lines up for a while.
  const envelopes = bandEnvelopes(features);
  const used = BANDS.filter((band) => events.some((event) => event.band === band));
  const spectra = new Map<SyncBand, { re: Float64Array; im: Float64Array }>();
  for (const band of used) {
    const coarse = widen(resample(envelopes[band], features.onsetFps, COARSE_FPS, envLength), 2);
    const re = new Float64Array(size);
    const im = new Float64Array(size);
    for (let i = 0; i < envLength; i += 1) re[lead + i] = coarse[i];
    fft(re, im);
    spectra.set(band, { re, im });
  }

  const tplRe = new Float64Array(size);
  const tplIm = new Float64Array(size);
  const sumRe = new Float64Array(size);
  const sumIm = new Float64Array(size);
  const candidates: Candidate[] = [];

  for (let ratio = 1 - TEMPO_SPAN; ratio <= 1 + TEMPO_SPAN + 1e-9; ratio += TEMPO_STEP) {
    const bpm = nominalBpm * ratio;
    const framesPerBeat = (60 / bpm) * COARSE_FPS;
    sumRe.fill(0);
    sumIm.fill(0);
    for (const band of used) {
      tplRe.fill(0);
      tplIm.fill(0);
      for (const event of events) {
        if (event.band !== band) continue;
        const frame = Math.round(event.beat * framesPerBeat);
        if (frame < size) tplRe[frame] += event.weight;
      }
      fft(tplRe, tplIm);
      // Cross-correlation, summed across bands: recording × conj(pattern).
      const spectrum = spectra.get(band) as { re: Float64Array; im: Float64Array };
      for (let k = 0; k < size; k += 1) {
        sumRe[k] += spectrum.re[k] * tplRe[k] + spectrum.im[k] * tplIm[k];
        sumIm[k] += spectrum.im[k] * tplRe[k] - spectrum.re[k] * tplIm[k];
      }
    }
    fft(sumRe, sumIm, true);

    // Best few starts at this tempo, at least half a beat apart.
    const valid = lead + envLength;
    const separation = Math.max(1, Math.round(framesPerBeat / 2));
    const taken: number[] = [];
    for (let pick = 0; pick < CANDIDATES_PER_TEMPO; pick += 1) {
      let best = -1;
      let bestValue = 0;
      for (let k = 0; k < valid; k += 1) {
        if (sumRe[k] <= bestValue) continue;
        if (taken.some((t) => Math.abs(t - k) < separation)) continue;
        best = k;
        bestValue = sumRe[k];
      }
      if (best < 0) break;
      taken.push(best);
      candidates.push({
        offsetSec: (best - lead) / COARSE_FPS,
        bpm,
        attack: bestValue / size,
        chroma: 0,
        shift: 0,
        total: 0,
      });
    }
  }

  candidates.sort((a, b) => b.attack - a.attack);
  const pool = candidates.slice(0, CANDIDATE_POOL);
  const topAttack = pool[0]?.attack || 1;
  for (const candidate of pool) {
    const { chroma, shift } = bestChroma(features, events, candidate);
    candidate.chroma = chroma;
    candidate.shift = shift;
    candidate.total = candidate.attack / topAttack + CHROMA_WEIGHT * chroma;
  }
  return pool.sort((a, b) => b.total - a.total);
}

/** Least squares sec = a + b·beat. */
function fitLine(points: { beat: number; sec: number }[]): { a: number; b: number } | null {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (const { beat, sec } of points) {
    sx += beat;
    sy += sec;
    sxx += beat * beat;
    sxy += beat * sec;
  }
  const denominator = n * sxx - sx * sx;
  if (Math.abs(denominator) < 1e-9) return null;
  const b = (n * sxy - sx * sy) / denominator;
  if (!(b > 0)) return null;
  return { a: (sy - b * sx) / n, b };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * The line, moved to pass through the first bar's attacks.
 *
 * Bar 1 is the number people check by ear, and a least-squares line through a
 * band that is already speeding up lands its intercept a little off it. The
 * slope stays; the start moves by the median miss over the first bar — the
 * median, so one drummer's flam does not drag it.
 */
function throughFirstBar(
  line: { a: number; b: number },
  points: { beat: number; sec: number }[],
  beatsPerBar: number,
): Fit {
  const firstBeat = points.reduce((earliest, point) => Math.min(earliest, point.beat), Number.POSITIVE_INFINITY);
  const residuals = points
    .filter((point) => point.beat < firstBeat + beatsPerBar)
    .map((point) => point.sec - (line.a + line.b * point.beat))
    .filter((residual) => Math.abs(residual) <= OUTLIER_SEC);
  const shift = residuals.length > 0 ? median(residuals) : 0;
  return { offsetSec: line.a + shift, bpm: 60 / line.b };
}

// ── Pass 3a: exactly ──────────────────────────────────────────────────────

/**
 * Bar 1 and the opening tempo, searched again on the opening bars alone.
 *
 * The whole-song fit decides *where* in the recording the tab is, but a band
 * that drifts makes it a compromise — right in the middle, a third of a second
 * out at bar 1. Searching the opening on its own, close to that place, puts
 * bar 1 where the opening actually is.
 */
function openingFit(input: AutoSyncInput, around: Candidate, tolerant: Envelopes): Fit {
  const { features, events, beatsPerBar, nominalBpm } = input;
  const opening = events.filter((event) => event.beat < OPENING_BARS * beatsPerBar);
  if (opening.length < 6) return around;
  const fps = features.onsetFps;

  const scored: (Fit & { attack: number })[] = [];
  const offsetSteps = Math.round(OPENING_SEARCH_SEC * fps);
  for (let ratio = 1 - TEMPO_SPAN; ratio <= 1 + TEMPO_SPAN + 1e-9; ratio += TEMPO_STEP) {
    const bpm = nominalBpm * ratio;
    const secPerBeat = 60 / bpm;
    for (let s = -offsetSteps; s <= offsetSteps; s += 1) {
      const offsetSec = around.offsetSec + s / fps;
      const attack = attackScore(tolerant, fps, opening, (beat) => offsetSec + beat * secPerBeat);
      scored.push({ offsetSec, bpm, attack });
    }
  }
  scored.sort((a, b) => b.attack - a.attack);

  // The best few genuinely different starts, told apart by what they sound —
  // an eighth-note riff fits nearly as well an eighth early.
  const distinct: (Fit & { attack: number })[] = [];
  for (const fit of scored) {
    if (distinct.some((other) => Math.abs(other.offsetSec - fit.offsetSec) < 0.06)) continue;
    distinct.push(fit);
    if (distinct.length === 6) break;
  }
  const topAttack = distinct[0]?.attack || 1;
  let best: Fit = around;
  let bestTotal = Number.NEGATIVE_INFINITY;
  for (const fit of distinct) {
    const pitched = opening.filter((event) => event.pitchClasses.length > 0);
    const chroma = pitched.length
      ? chromaAgreement(features.chroma, features.chromaFps, pitched, fit, around.shift)
      : 0;
    const total = fit.attack / topAttack + CHROMA_WEIGHT * chroma;
    if (total > bestTotal) {
      bestTotal = total;
      best = { offsetSec: fit.offsetSec, bpm: fit.bpm };
    }
  }
  return best;
}

function refine(input: AutoSyncInput, rough: Fit, tolerant: Envelopes, raw: Envelopes): Fit {
  const { features, events, beatsPerBar } = input;
  const fps = features.onsetFps;
  const opening = events.filter((event) => event.beat < OPENING_BARS * beatsPerBar);
  const subset = opening.length >= 8 ? opening : events;

  // A fine grid first: the passes before were 0.2% wide.
  let best = rough;
  let bestScore = -1;
  const offsetSteps = Math.round(0.03 * fps);
  for (let r = -0.004; r <= 0.004 + 1e-9; r += 0.0002) {
    const bpm = rough.bpm * (1 + r);
    const secPerBeat = 60 / bpm;
    for (let s = -offsetSteps; s <= offsetSteps; s += 1) {
      const offsetSec = rough.offsetSec + s / fps;
      const score = attackScore(tolerant, fps, subset, (beat) => offsetSec + beat * secPerBeat);
      if (score > bestScore) {
        bestScore = score;
        best = { offsetSec, bpm };
      }
    }
  }

  // Then a straight line through the attacks the notes actually landed on,
  // each looked for in its own band — finer than any grid, and immune to the
  // odd note the band skipped. On the shortest opening that has enough of
  // them: a drifting band bends a long one.
  for (const bars of LINE_WINDOWS_BARS) {
    const window = events.filter((event) => event.beat < bars * beatsPerBar);
    let points = window
      .map((event) => {
        const predicted = best.offsetSec + (event.beat * 60) / best.bpm;
        const hit = snapToOnset({
          sec: predicted,
          onset: raw[event.band],
          onsetFps: fps,
          toleranceSec: MATCH_TOLERANCE_SEC,
          minStrength: HIT_STRENGTH,
        });
        return hit === null ? null : { beat: event.beat, sec: hit };
      })
      .filter((point): point is { beat: number; sec: number } => point !== null);
    if (points.length < 8) continue;

    for (let round = 0; round < 3; round += 1) {
      const line = fitLine(points);
      if (!line) break;
      const kept = points.filter((point) => Math.abs(line.a + line.b * point.beat - point.sec) <= OUTLIER_SEC);
      if (kept.length === points.length || kept.length < 8) return throughFirstBar(line, kept, beatsPerBar);
      points = kept;
    }
    const line = fitLine(points);
    if (line) return throughFirstBar(line, points, beatsPerBar);
  }
  return best;
}

// ── Pass 3b: drift ────────────────────────────────────────────────────────

/** Ramer–Douglas–Peucker: the fewest points that keep a curve within `epsilon`. */
function simplify(points: { x: number; y: number }[], epsilon: number): number[] {
  const keep = new Set<number>([0, points.length - 1]);
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [from, to] = stack.pop() as [number, number];
    let worst = -1;
    let worstDistance = epsilon;
    for (let i = from + 1; i < to; i += 1) {
      const t = (points[i].x - points[from].x) / (points[to].x - points[from].x || 1);
      const y = points[from].y + t * (points[to].y - points[from].y);
      const distance = Math.abs(points[i].y - y);
      if (distance > worstDistance) {
        worst = i;
        worstDistance = distance;
      }
    }
    if (worst >= 0) {
      keep.add(worst);
      stack.push([from, worst], [worst, to]);
    }
  }
  return [...keep].sort((a, b) => a - b);
}

function driftAnchors(input: AutoSyncInput, fit: Fit, shift: number): TempoAnchor[] {
  const { features, events, beatsPerBar } = input;
  const fps = features.chromaFps;
  const recFrames = features.chroma.length / 12;
  const recOnset = widen(resample(features.onset, features.onsetFps, fps, recFrames), 1);
  const secPerBeat = 60 / fit.bpm;
  const lastBeat = events.reduce((max, event) => Math.max(max, event.beat + event.durationBeats), 0);
  const tabFrames = Math.ceil(lastBeat * secPerBeat * fps) + 1;
  if (tabFrames < 2 || lastBeat < beatsPerBar * 8) return [];

  // The tab as the same two features, laid out at the straight-line fit.
  const tabChroma = new Float32Array(tabFrames * 12);
  const tabOnsetRaw = new Float32Array(tabFrames);
  const ring = Math.round(0.3 * fps);
  const decay = 0.6 * fps;
  for (const event of events) {
    const start = Math.round(event.beat * secPerBeat * fps);
    if (start >= tabFrames) continue;
    tabOnsetRaw[start] = Math.min(1, tabOnsetRaw[start] + event.weight * 0.5);
    if (event.pitchClasses.length === 0) continue;
    const length = Math.max(1, Math.round(event.durationBeats * secPerBeat * fps)) + ring;
    for (let k = 0; k < length && start + k < tabFrames; k += 1) {
      const amount = Math.exp(-k / decay);
      for (const pc of event.pitchClasses) {
        tabChroma[(start + k) * 12 + ((((pc + shift) % 12) + 12) % 12)] += amount;
      }
    }
  }
  const tabOnset = widen(tabOnsetRaw, 1);
  const tabHasPitch = new Uint8Array(tabFrames);
  for (let i = 0; i < tabFrames; i += 1) {
    let norm = 0;
    for (let c = 0; c < 12; c += 1) norm += tabChroma[i * 12 + c] ** 2;
    if (norm <= 0) continue;
    norm = Math.sqrt(norm);
    for (let c = 0; c < 12; c += 1) tabChroma[i * 12 + c] /= norm;
    tabHasPitch[i] = 1;
  }
  const pitched = events.some((event) => event.pitchClasses.length > 0);
  const chromaShare = pitched ? 0.5 : 0;

  // Dynamic time warping inside a band around the straight line.
  const band = Math.round(DRIFT_BAND_SEC * fps);
  const width = 2 * band + 1;
  const base = Math.round(fit.offsetSec * fps);
  const cost = (i: number, j: number) => {
    if (j < 0 || j >= recFrames) return 1;
    let chromaCost = 0.5;
    if (tabHasPitch[i]) {
      let dot = 0;
      for (let c = 0; c < 12; c += 1) dot += tabChroma[i * 12 + c] * features.chroma[j * 12 + c];
      chromaCost = 1 - dot;
    }
    return chromaShare * chromaCost + (1 - chromaShare) * Math.abs(tabOnset[i] - recOnset[j]);
  };

  const total = new Float32Array(tabFrames * width).fill(Number.POSITIVE_INFINITY);
  // 0 diagonal, 1 tab advanced alone, 2 recording advanced alone.
  const step = new Uint8Array(tabFrames * width);
  const STRAIGHT_PENALTY = 1.3;
  for (let i = 0; i < tabFrames; i += 1) {
    for (let k = 0; k < width; k += 1) {
      const c = cost(i, base + i + k - band);
      const index = i * width + k;
      if (i === 0) {
        // Free start anywhere inside the band.
        const left = k > 0 ? total[index - 1] + c * STRAIGHT_PENALTY : Number.POSITIVE_INFINITY;
        total[index] = Math.min(c, left);
        step[index] = left < c ? 2 : 0;
        continue;
      }
      const diagonal = total[index - width] + c;
      const tabOnly = k + 1 < width ? total[index - width + 1] + c * STRAIGHT_PENALTY : Number.POSITIVE_INFINITY;
      const recOnly = k > 0 ? total[index - 1] + c * STRAIGHT_PENALTY : Number.POSITIVE_INFINITY;
      if (diagonal <= tabOnly && diagonal <= recOnly) {
        total[index] = diagonal;
        step[index] = 0;
      } else if (tabOnly <= recOnly) {
        total[index] = tabOnly;
        step[index] = 1;
      } else {
        total[index] = recOnly;
        step[index] = 2;
      }
    }
  }

  // Walk back from the best end, noting where each tab frame landed.
  let k = 0;
  for (let c = 1; c < width; c += 1) {
    if (total[(tabFrames - 1) * width + c] < total[(tabFrames - 1) * width + k]) k = c;
  }
  const landedSum = new Float64Array(tabFrames);
  const landedCount = new Uint16Array(tabFrames);
  let i = tabFrames - 1;
  while (i >= 0) {
    landedSum[i] += base + i + k - band;
    landedCount[i] += 1;
    const move = step[i * width + k];
    if (i === 0 && move !== 2) break;
    if (move === 0) i -= 1;
    else if (move === 1) {
      i -= 1;
      k += 1;
    } else k -= 1;
    if (k < 0 || k >= width) break;
  }

  // How far each bar start sits from the straight line.
  const bars: { beat: number; drift: number }[] = [];
  // Only as far as the last note: past it the walk has nothing to hold on to.
  const lastNote = events.reduce((max, event) => Math.max(max, event.beat), 0);
  for (let beat = 0; beat <= lastNote; beat += beatsPerBar) {
    const frame = Math.min(tabFrames - 1, Math.round(beat * secPerBeat * fps));
    if (landedCount[frame] === 0) continue;
    const landed = landedSum[frame] / landedCount[frame] / fps;
    bars.push({ beat, drift: landed - (fit.offsetSec + beat * secPerBeat) });
  }
  if (bars.length < 8) return [];
  // A stray frame — 23 ms — must not become a pinned bar, so each bar takes
  // the median of itself and its neighbours. Three, not more: a band that is
  // speeding up is a curve, and a wider window flattens its ends.
  const smoothed = bars.map((bar, index) =>
    index === 0 || index === bars.length - 1
      ? bar.drift
      : median([bars[index - 1].drift, bar.drift, bars[index + 1].drift]),
  );
  // Bar 1 is already exact (pass 3a); only movement relative to it is drift.
  const relative = smoothed.map((value) => value - smoothed[0]);
  if (Math.max(...relative.map(Math.abs)) < DRIFT_TOLERANCE_SEC) return [];

  const kept = simplify(
    bars.map((bar, index) => ({ x: bar.beat, y: relative[index] })),
    DRIFT_TOLERANCE_SEC,
  ).filter((index) => bars[index].beat > 0);

  const anchors: TempoAnchor[] = [];
  let lastSec = fit.offsetSec;
  for (const index of kept.slice(0, MAX_ANCHORS)) {
    const beat = bars[index].beat;
    const estimate = fit.offsetSec + beat * secPerBeat + relative[index];
    // Onto the actual downbeat, when there is one close by.
    const snapped = snapToOnset({
      sec: estimate,
      onset: features.onset,
      onsetFps: features.onsetFps,
      toleranceSec: 0.035,
      minStrength: 0.2,
    });
    const sec = snapped ?? estimate;
    if (sec <= lastSec + 0.05) continue;
    anchors.push({ beat, sec });
    lastSec = sec;
  }
  return anchors;
}

// ── All together ──────────────────────────────────────────────────────────

/** The grid search over a constant tempo — for recordings too short to track. */
function gridSync(input: AutoSyncInput): AutoSyncResult {
  const { features, events, beatsPerBar } = input;
  const empty: AutoSyncResult = {
    offsetMs: 0,
    sourceBpm: input.nominalBpm,
    tempoAnchors: [],
    confident: false,
    hitRate: 0,
  };
  if (events.length < 4 || features.onset.length === 0 || !(input.nominalBpm > 0)) return empty;

  const candidates = coarseCandidates(input);
  const best = candidates[0];
  if (!best) return empty;

  const raw = bandEnvelopes(features);
  const tolerant = widenAll(raw, SCORE_RADIUS);
  const fit = refine(input, openingFit(input, best, tolerant), tolerant, raw);

  // A runner-up only counts if it is a genuinely different place.
  const beatSec = 60 / best.bpm;
  const rival = candidates.find((candidate) => Math.abs(candidate.offsetSec - best.offsetSec) > beatSec / 2);
  const margin = rival ? (best.total - rival.total) / best.total : 1;

  const straight = (beat: number) => fit.offsetSec + (beat * 60) / fit.bpm;

  // Drift: kept only when it lands more of the notes on attacks than the
  // straight line does — a pinned bar has to earn its place.
  let anchors = driftAnchors(input, fit, best.shift);
  let secForBeat = straight;
  if (anchors.length > 0) {
    const map = createRecordingTempoMap({
      anchors,
      offsetMs: fit.offsetSec * 1000,
      sourceBpm: fit.bpm,
    });
    const withDrift = attackScore(tolerant, features.onsetFps, events, map.secForBeat);
    const without = attackScore(tolerant, features.onsetFps, events, straight);
    if (withDrift > without * 1.01) secForBeat = map.secForBeat;
    else anchors = [];
  }

  // Judged on what the recording can be expected to contain: with drums or
  // bass in the file, those — a backing track may well have no guitar at all.
  const rhythm = events.filter((event) => event.rhythmSection);
  const judged = rhythm.length >= 16 ? rhythm : events;
  const hitting = widenAll(raw, HIT_RADIUS);
  const overall = landing(hitting, features.onsetFps, judged, secForBeat);
  const openingEvents = judged.filter((event) => event.beat < OPENING_BARS * beatsPerBar);
  const start = landing(hitting, features.onsetFps, openingEvents.length ? openingEvents : judged, secForBeat);
  const confident =
    (margin >= MIN_MARGIN && start.beyondChance >= MIN_START_BEYOND_CHANCE) ||
    (overall.beyondChance >= SURE_BEYOND_CHANCE && start.beyondChance >= SURE_START_BEYOND_CHANCE);

  return {
    offsetMs: Math.round(fit.offsetSec * 1000),
    sourceBpm: Math.round(fit.bpm * 100) / 100,
    tempoAnchors: anchors,
    confident,
    hitRate: overall.rate,
    diagnostics: { margin, start: start.beyondChance, overall: overall.beyondChance },
  };
}

// ── On the recording's own beats ──────────────────────────────────────────

/** Fewer tracked beats than this and the old grid search does the job. */
const MIN_TRACKED_BEATS = 32;
/** How far apart, in robust z units, the winner must stand from the next. */
const MIN_PLACEMENT_GAP = 0.2;
/** Bars either side used to smooth the tracker's beat-to-beat jitter. */
const SMOOTH_BARS = 2;

const robustZ = (values: number[]) => {
  const centre = median(values);
  const spread = median(values.map((value) => Math.abs(value - centre))) || 1e-9;
  return values.map((value) => (value - centre) / spread);
};

const argmax = (values: number[]) =>
  values.reduce((best, value, index) => (value > values[best] ? index : best), 0);

/** A tab beat's moment on the tracked beats, tab beat 0 on beat `first`. */
function onBeats(beats: number[], first: number, beat: number): number | null {
  const whole = Math.floor(beat);
  const index = first + whole;
  if (index < 0 || index + 1 >= beats.length) return null;
  return beats[index] + (beat - whole) * (beats[index + 1] - beats[index]);
}

interface Placement {
  first: number;
  shift: number;
  confident: boolean;
}

/**
 * Which tracked beat the tab's first beat belongs on.
 *
 * Every placement is scored two independent ways — do the tab's hits land on
 * the recording's attacks, band by band; does the recording sound the tab's
 * pitches where the tab plays them — each turned into robust z-scores across
 * all placements, so neither swamps the other. It is trusted when the winner
 * stands clear and at least one of the two, on its own, picks the same beat:
 * a placement only the sum likes is two weak hunches, not an answer.
 */
function placeOnBeats(input: AutoSyncInput, beats: number[], tolerant: Envelopes): Placement {
  const { features, events, beatsPerBar } = input;
  const fps = features.onsetFps;
  const pitched = events.filter((event) => event.pitchClasses.length > 0);
  const shifts = pitched.length > 0 && pitched.every((event) => event.exactPitch) ? [0] : TUNING_SHIFTS;
  const frames = features.chroma.length / 12;
  const totalWeight = events.reduce((sum, event) => sum + event.weight, 0) || 1;

  const firsts: number[] = [];
  const attacks: number[] = [];
  const chromas: number[] = [];
  const shiftsAt: number[] = [];
  for (let first = -beatsPerBar * 2; first < beats.length - beatsPerBar * 2; first += 1) {
    let attack = 0;
    for (const event of events) {
      const sec = onBeats(beats, first, event.beat);
      if (sec === null) continue;
      const envelope = tolerant[event.band];
      const frame = Math.round(sec * fps);
      if (frame >= 0 && frame < envelope.length) attack += event.weight * envelope[frame];
    }
    let bestChroma = 0;
    let bestShift = 0;
    for (const shift of shifts) {
      let sum = 0;
      for (const event of pitched) {
        const sec = onBeats(beats, first, event.beat);
        if (sec === null) continue;
        const start = Math.round(sec * features.chromaFps);
        const end = Math.min(frames, start + Math.max(1, Math.round(0.15 * features.chromaFps)));
        if (start < 0 || start >= end) continue;
        let dot = 0;
        for (let f = start; f < end; f += 1) {
          for (const pc of event.pitchClasses) dot += features.chroma[f * 12 + (((pc + shift) % 12) + 12) % 12];
        }
        sum += dot / (end - start) / Math.sqrt(event.pitchClasses.length);
      }
      const chroma = pitched.length > 0 ? sum / pitched.length : 0;
      if (chroma > bestChroma) {
        bestChroma = chroma;
        bestShift = shift;
      }
    }
    firsts.push(first);
    attacks.push(attack / totalWeight);
    chromas.push(bestChroma);
    shiftsAt.push(bestShift);
  }

  const zAttack = robustZ(attacks);
  const zChroma = pitched.length > 0 ? robustZ(chromas) : chromas.map(() => 0);
  const totals = zAttack.map((value, index) => value + zChroma[index]);
  const winner = argmax(totals);
  const runnerUp = Math.max(...totals.filter((_, index) => index !== winner));
  const gap = totals[winner] - runnerUp;
  const agrees =
    pitched.length === 0 ? true : argmax(zAttack) === winner || argmax(zChroma) === winner;

  return {
    first: firsts[winner],
    shift: shiftsAt[winner],
    confident: agrees && gap >= MIN_PLACEMENT_GAP && zAttack[winner] > 0,
  };
}

/**
 * The tab hung on the tracked beats, as bar 1, a tempo, and pinned bars
 * wherever the band moves away from that tempo.
 */
function alignmentOnBeats(
  input: AutoSyncInput,
  beats: number[],
  first: number,
  raw: Envelopes,
): { offsetSec: number; bpm: number; anchors: TempoAnchor[] } | null {
  const { features, events, beatsPerBar } = input;
  const lastNote = events.reduce((max, event) => Math.max(max, event.beat), 0);

  // Each bar start, read off a line through the beats around it: the tracker
  // places a beat on its attack frame, and a frame of jitter per beat is not
  // drift worth pinning.
  const bars: { beat: number; sec: number }[] = [];
  for (let beat = 0; beat <= lastNote; beat += beatsPerBar) {
    const points: { beat: number; sec: number }[] = [];
    for (let k = beat - SMOOTH_BARS * beatsPerBar; k <= beat + SMOOTH_BARS * beatsPerBar; k += 1) {
      const sec = onBeats(beats, first, k);
      if (sec !== null) points.push({ beat: k, sec });
    }
    const line = fitLine(points);
    if (!line) continue;
    bars.push({ beat, sec: line.a + line.b * beat });
  }
  if (bars.length < 2) return null;

  // The tempo the beats run at overall, and bar 1 on the first bar's attacks.
  const spans = bars.slice(1).map((bar, index) => (bar.sec - bars[index].sec) / (bar.beat - bars[index].beat));
  const secPerBeat = median(spans);
  const firstBar = events.filter((event) => event.beat < bars[0].beat + beatsPerBar);
  const misses = firstBar
    .map((event) => {
      const expected = bars[0].sec + (event.beat - bars[0].beat) * secPerBeat;
      const hit = snapToOnset({
        sec: expected,
        onset: raw[event.band],
        onsetFps: features.onsetFps,
        toleranceSec: MATCH_TOLERANCE_SEC,
        minStrength: HIT_STRENGTH,
      });
      return hit === null ? null : hit - expected;
    })
    .filter((miss): miss is number => miss !== null && Math.abs(miss) <= OUTLIER_SEC);
  const offsetSec = bars[0].sec - bars[0].beat * secPerBeat + (misses.length >= 2 ? median(misses) : 0);

  // Pinned bars only where the band leaves that tempo by more than a hair —
  // the fewest that keep every bar within tolerance.
  const drift = bars.map((bar) => bar.sec - (offsetSec + bar.beat * secPerBeat));
  const anchors: TempoAnchor[] = [];
  if (Math.max(...drift.map(Math.abs)) >= DRIFT_TOLERANCE_SEC) {
    const kept = simplify(
      bars.map((bar, index) => ({ x: bar.beat, y: drift[index] })),
      DRIFT_TOLERANCE_SEC,
    ).filter((index) => bars[index].beat > 0);
    let lastSec = offsetSec;
    for (const index of kept.slice(0, MAX_ANCHORS)) {
      const { beat, sec } = bars[index];
      if (sec <= lastSec + 0.05) continue;
      anchors.push({ beat, sec });
      lastSec = sec;
    }
  }
  return { offsetSec, bpm: 60 / secPerBeat, anchors };
}

function beatSync(input: AutoSyncInput): AutoSyncResult | null {
  const { features, events, nominalBpm } = input;
  const fps = features.onsetFps;
  const beats = trackBeats(features.onset, fps, estimatePeriod(features.onset, fps, nominalBpm));
  if (beats.length < MIN_TRACKED_BEATS) return null;

  const raw = bandEnvelopes(features);
  const tolerant = widenAll(raw, SCORE_RADIUS);
  const placement = placeOnBeats(input, beats, tolerant);
  const alignment = alignmentOnBeats(input, beats, placement.first, raw);
  if (!alignment) return null;

  // The pinned bars have to earn their place against the plain line, judged
  // on the sharp curve — the tolerant one forgives the very error they fix.
  const straight = (beat: number) => alignment.offsetSec + (beat * 60) / alignment.bpm;
  let anchors = alignment.anchors;
  let secForBeat = straight;
  if (anchors.length > 0) {
    const map = createRecordingTempoMap({
      anchors,
      offsetMs: alignment.offsetSec * 1000,
      sourceBpm: alignment.bpm,
    });
    const sharp = widenAll(raw, 1);
    if (attackScore(sharp, fps, events, map.secForBeat) > attackScore(sharp, fps, events, straight)) {
      secForBeat = map.secForBeat;
    } else anchors = [];
  }

  const rhythm = events.filter((event) => event.rhythmSection);
  const judged = rhythm.length >= 16 ? rhythm : events;
  const overall = landing(widenAll(raw, HIT_RADIUS), fps, judged, secForBeat);
  const lastNote = events.reduce((max, event) => Math.max(max, event.beat + event.durationBeats), 0);

  return {
    offsetMs: Math.round(alignment.offsetSec * 1000),
    sourceBpm: Math.round(alignment.bpm * 100) / 100,
    tempoAnchors: anchors,
    confident: placement.confident,
    hitRate: overall.rate,
    coverage: Math.min(1, (secForBeat(lastNote) - secForBeat(0)) / Math.max(1, features.durationSec)),
  };
}

/**
 * Where the tab sits in the recording: on the recording's tracked beats when
 * there are enough of them, by the grid search otherwise.
 */
export function autoSync(input: AutoSyncInput): AutoSyncResult {
  if (input.events.length >= 4 && input.features.onset.length > 0 && input.nominalBpm > 0) {
    const onBeatsResult = beatSync(input);
    if (onBeatsResult) return onBeatsResult;
  }
  return gridSync(input);
}
