import type { WeightedNote } from "./fit";
import { notesFit } from "./fit";
import type { HarmonyKind, KeyAnalysis } from "./keyDetection";
import type { BarInfo, TabContent } from "./noteEvents";
import type { Chord, ChordQuality, DegreeChord, PitchClass } from "./theory";
import {
  chordOfDegree,
  chordTonesOf,
  sameChord,
  templatesFor,
  vocabularyFor,
} from "./theory";

/** A chord held over a stretch of the backing. Positions are backing beats. */
export interface ChordSpan {
  chord: Chord;
  start: number;
  length: number;
}

/**
 * Where the chords came from:
 * - `tab`         — chord names written in the tab;
 * - `melody`      — the notes outline chords (arpeggios, riffs) and the
 *                   harmony follows them;
 * - `progression` — a stock progression of the key that the melody accepts;
 * - `vamp`        — one chord, the tonic, held under everything;
 * - `drone`       — a root and fifth, no third;
 * - `none`        — drums only.
 */
export type HarmonySource =
  | "tab"
  | "melody"
  | "progression"
  | "vamp"
  | "drone"
  | "none";

export interface HarmonyPlan {
  kind: HarmonyKind;
  source: HarmonySource;
  spans: ChordSpan[];
}

/** A slice of the backing that holds one chord at most: half a 4/4 bar, a whole
 *  bar of an odd meter. Chords may change only at unit edges. */
export interface HarmonicUnit {
  backingBar: number;
  start: number;
  length: number;
  isBarStart: boolean;
  notes: WeightedNote[];
}

const EPS = 1e-6;

// ── Units ─────────────────────────────────────────────────────────────────────

/** How a bar splits for harmony: 4/4 in halves, long bars in their natural halves. */
export function unitLengths(bar: BarInfo): number[] {
  const [numerator, denominator] = bar.timeSignature;
  const written = numerator * (4 / denominator);
  if (Math.abs(written - bar.length) > EPS) return [bar.length];
  const split = (length: number, n: number): number[] => {
    if (length === 4 && (n === 4 || n === 2) && denominator <= 4) return [2, 2];
    if (length > 4 && n % 2 === 0)
      return [...split(length / 2, n / 2), ...split(length / 2, n / 2)];
    return [length];
  };
  return split(bar.length, numerator);
}

export function buildUnits(
  content: TabContent,
  barMap: readonly number[],
): HarmonicUnit[] {
  const units: HarmonicUnit[] = [];
  let backingStart = 0;
  barMap.forEach((tabBarIndex, backingBar) => {
    const bar = content.bars[tabBarIndex];
    let offset = 0;
    unitLengths(bar).forEach((length, i) => {
      const from = bar.start + offset;
      const to = from + length;
      const notes: WeightedNote[] = [];
      for (const note of content.notes) {
        if (note.start >= from - EPS && note.start < to - EPS) {
          notes.push({
            pc: note.pc,
            pitch: note.pitch,
            start: note.start,
            weight: note.weight,
          });
        } else if (
          note.start < from - EPS &&
          note.start + note.duration > from + EPS &&
          note.bar === bar.index
        ) {
          // Still ringing from earlier in the bar (a held chord): counts, but less.
          notes.push({
            pc: note.pc,
            pitch: note.pitch,
            start: from,
            weight: note.weight * 0.5,
          });
        }
      }
      units.push({
        backingBar,
        start: backingStart + offset,
        length,
        isBarStart: i === 0,
        notes,
      });
      offset += length;
    });
    backingStart += bar.length;
  });
  return units;
}

// ── Path scoring ──────────────────────────────────────────────────────────────

interface Candidate {
  chord: Chord;
  prior: number;
}

interface ScoreContext {
  units: HarmonicUnit[];
  fits: number[][];
  candidates: Candidate[];
  tonic: PitchClass;
}

/** How much a chord's commonness in the key counts next to how it fits, per beat. */
const PRIOR_WEIGHT = 0.3;
/** Changing chord costs this much — a change has to buy more fit than that,
 *  so a scale run doesn't drag the band through a chord per bar. */
const CHANGE_AT_BAR = -0.8;
const CHANGE_MID_BAR = -1.4;
const TONIC_START = 0.6;

/** Root motion a listener hears as "going somewhere": down a fifth (V→I,
 *  ii→V) or home to the tonic. */
function motionBonus(from: Chord, to: Chord, tonic: PitchClass): number {
  let bonus = 0;
  if ((to.root - from.root + 12) % 12 === 5) bonus += 0.15;
  if (to.root === tonic) bonus += 0.1;
  return bonus;
}

function transition(
  ctx: ScoreContext,
  from: number,
  to: number,
  atBar: boolean,
): number {
  if (from === to) return 0;
  return (
    (atBar ? CHANGE_AT_BAR : CHANGE_MID_BAR) +
    motionBonus(ctx.candidates[from].chord, ctx.candidates[to].chord, ctx.tonic)
  );
}

/** Best chord per unit given the notes, the key's habits and the cost of
 *  changing — dynamic programming over a closed loop (one pass per opening chord). */
function viterbi(ctx: ScoreContext): number[] {
  const { units, fits, candidates } = ctx;
  const n = candidates.length;
  const local = (u: number, c: number) =>
    units[u].length * (fits[u][c] + PRIOR_WEIGHT * candidates[c].prior);
  let bestPath: number[] = [];
  let bestScore = -Infinity;

  for (let first = 0; first < n; first++) {
    let scores = candidates.map((_, c) =>
      c === first ? local(0, c) : -Infinity,
    );
    const back: number[][] = [];
    for (let u = 1; u < units.length; u++) {
      const next: number[] = new Array(n).fill(-Infinity);
      const pointers: number[] = new Array(n).fill(0);
      for (let to = 0; to < n; to++) {
        for (let from = 0; from < n; from++) {
          if (scores[from] === -Infinity) continue;
          const s =
            scores[from] + transition(ctx, from, to, units[u].isBarStart);
          if (s > next[to]) {
            next[to] = s;
            pointers[to] = from;
          }
        }
        next[to] += local(u, to);
      }
      back.push(pointers);
      scores = next;
    }
    for (let last = 0; last < n; last++) {
      if (scores[last] === -Infinity) continue;
      // The backing loops, so the last chord also has to lead back into the first.
      const total =
        scores[last] +
        transition(ctx, last, first, true) +
        (candidates[first].chord.root === ctx.tonic ? TONIC_START : 0);
      if (total > bestScore) {
        bestScore = total;
        const path = [last];
        for (let u = back.length - 1; u >= 0; u--)
          path.unshift(back[u][path[0]]);
        bestPath = path;
      }
    }
  }
  return bestPath;
}

/** Average fit per beat of a path — how the melody sits over it, regardless of length. */
function meanFit(ctx: ScoreContext, path: readonly number[]): number {
  let sum = 0;
  let beats = 0;
  path.forEach((c, u) => {
    sum += ctx.units[u].length * ctx.fits[u][c];
    beats += ctx.units[u].length;
  });
  return beats > 0 ? sum / beats : 0;
}

function touches(barUnits: readonly HarmonicUnit[], chord: Chord): boolean {
  const played = new Set(
    barUnits.flatMap((unit) => unit.notes.map((note) => note.pc)),
  );
  if (played.size === 0 || played.has(chord.root)) return true;
  return chordTonesOf(chord).filter((tone) => played.has(tone)).length >= 2;
}

// ── Chord names written in the tab ────────────────────────────────────────────

const ROOTS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function parseChordSymbol(symbol: string): Chord | null {
  const match = /^([A-G])([#b]?)([^/]*)/.exec(symbol.trim());
  if (!match) return null;
  const root =
    (ROOTS[match[1]] + (match[2] === "#" ? 1 : match[2] === "b" ? 11 : 0)) % 12;
  const suffix = match[3].trim();
  let quality: ChordQuality = "maj";
  if (/^(maj7|M7|Δ)/.test(suffix)) quality = "maj7";
  else if (/^(m7|min7|-7)/.test(suffix)) quality = "min7";
  else if (/^(dim|°)/.test(suffix)) quality = "dim";
  else if (/^(m|min|-)(?!aj)/.test(suffix)) quality = "min";
  else if (/^7/.test(suffix)) quality = "7";
  else if (/^5/.test(suffix)) quality = "5";
  return { root, quality };
}

function closeSpans(spans: ChordSpan[], total: number): ChordSpan[] {
  const merged: ChordSpan[] = [];
  for (const span of spans) {
    const previous = merged[merged.length - 1];
    if (previous && sameChord(previous.chord, span.chord)) continue;
    merged.push({ ...span });
  }
  merged.forEach((span, i) => {
    span.length =
      (i + 1 < merged.length ? merged[i + 1].start : total) - span.start;
  });
  return merged;
}

/** The chords the tab names over its beats, laid out bar by bar along `barMap`. */
export function spansFromChordNames(
  content: TabContent,
  barMap: readonly number[],
): ChordSpan[] | null {
  if (!content.bars.some((bar) => bar.chordName?.length)) return null;
  const spans: ChordSpan[] = [];
  let backingStart = 0;
  for (const tabBar of barMap) {
    const bar = content.bars[tabBar];
    for (const { pos, name } of bar.chordName ?? []) {
      const chord = parseChordSymbol(name);
      if (chord) spans.push({ chord, start: backingStart + pos, length: 0 });
    }
    backingStart += bar.length;
  }
  if (spans.length === 0) return null;
  // A tab that names its first chord later than beat one: hold it from the top.
  spans[0] = { ...spans[0], start: 0 };
  return closeSpans(spans, backingStart);
}

// ── Entry ─────────────────────────────────────────────────────────────────────

export interface HarmonizeInput {
  content: TabContent;
  analysis: KeyAnalysis;
  /** Tab bar played at each bar of the backing (the tab may repeat inside it). */
  barMap: readonly number[];
  /** Picks between progressions that fit equally well, so exercises in the
   *  same key don't all get the same one. Seeded: same exercise, same pick. */
  random?: () => number;
}

/**
 * The note a riff keeps returning to underneath: the lowest note, played on
 * most downbeats. A melody line has no bass of its own, but a pedal like the
 * low E of a metal riff is one, and the band's chord should sit on it.
 */
export function pedalOf(
  content: TabContent,
  histogram: readonly number[],
): PitchClass | null {
  if (content.notes.length === 0) return null;
  const lowest = content.notes.reduce((low, note) =>
    note.pitch < low.pitch ? note : low,
  );
  let downbeats = 0;
  let onPedal = 0;
  for (const bar of content.bars) {
    const first = content.notes.filter(
      (note) => note.bar === bar.index && note.posInBar < EPS,
    );
    if (first.length === 0) continue;
    downbeats++;
    if (
      first.reduce((low, note) => (note.pitch < low.pitch ? note : low)).pc ===
      lowest.pc
    )
      onPedal++;
  }
  return downbeats > 0 &&
    onPedal / downbeats >= 0.6 &&
    histogram[lowest.pc] >= 0.2
    ? lowest.pc
    : null;
}

const PEDAL_BONUS = 0.25;

/** The chord vocabulary of the detected key, adjusted to what the notes show. */
function vocabularyForKey(analysis: KeyAnalysis): DegreeChord[] {
  const key = analysis.key!;
  const chordScale = key.scale.chordScale;
  let vocabulary = [...vocabularyFor(chordScale)];
  const has = (offset: number) =>
    analysis.histogram[(key.tonic + offset) % 12] >= 0.03;
  // A natural-minor tune that raises its seventh is asking for a major V.
  if (chordScale === "aeolian" && has(11))
    vocabulary.push({ degree: "V", offset: 7, quality: "maj", prior: 0.6 });
  // A blues without a major third is a minor blues: m7 chords, not dominants.
  if (chordScale === "blues" && !has(4)) {
    vocabulary = vocabulary.map((degree) => ({
      ...degree,
      quality: "min7" as ChordQuality,
    }));
  }
  return vocabulary;
}

export function harmonize({
  content,
  analysis,
  barMap,
  random,
}: HarmonizeInput): HarmonyPlan {
  const total = barMap.reduce((sum, bar) => sum + content.bars[bar].length, 0);

  const named = spansFromChordNames(content, barMap);
  if (named) return { kind: "tonal", source: "tab", spans: named };

  const { key } = analysis;
  if (analysis.kind === "rhythm" || !key)
    return { kind: "rhythm", source: "none", spans: [] };

  if (analysis.kind === "drone") {
    return {
      kind: "drone",
      source: "drone",
      spans: [
        { chord: { root: key.tonic, quality: "5" }, start: 0, length: total },
      ],
    };
  }

  const chordScale = key.scale.chordScale;
  const keyPcs = new Set(
    key.scale.intervals.map((interval) => (key.tonic + interval) % 12),
  );
  if (
    analysis.histogram[(key.tonic + 11) % 12] >= 0.03 &&
    chordScale === "aeolian"
  )
    keyPcs.add((key.tonic + 11) % 12);

  // Without a third in the notes there is no telling major from minor — power
  // chords say neither and so can't contradict the player.
  const voiced = (chord: Chord): Chord =>
    key.thirdKnown ? chord : { root: chord.root, quality: "5" };

  const candidates: Candidate[] = [];
  const degreeIndex = new Map<string, number>();
  for (const degree of vocabularyForKey(analysis)) {
    const chord = voiced(chordOfDegree(key.tonic, degree));
    let index = candidates.findIndex((c) => sameChord(c.chord, chord));
    if (index < 0) {
      index = candidates.length;
      candidates.push({ chord, prior: degree.prior });
    }
    degreeIndex.set(degree.degree, index);
  }

  const units = buildUnits(content, barMap);
  const pedal = pedalOf(content, analysis.histogram);
  const fits = units.map((unit) =>
    candidates.map(
      (c) =>
        notesFit(unit.notes, c.chord, keyPcs, chordScale) +
        (unit.notes.length && c.chord.root === pedal ? PEDAL_BONUS : 0),
    ),
  );
  const ctx: ScoreContext = { units, fits, candidates, tonic: key.tonic };

  let path = viterbi(ctx);
  const moves = path.some((c) => c !== path[0]);
  let source: HarmonySource = moves ? "melody" : "vamp";

  // A scale run fits nearly any chord of its key, so on its notes alone the
  // band would only ever hold the tonic. A stock progression keeps it moving —
  // as long as the melody sits over it almost as well and no chord puts an
  // avoid note under it. Notes that outline chords of their own (`melody`)
  // keep them: they already say where the harmony goes.
  if (!moves && analysis.distinctPitchClasses >= 5) {
    const baseline = meanFit(ctx, path);
    const tolerance = 0.2;
    const passing: { path: number[]; value: number }[] = [];
    for (const template of templatesFor(chordScale)) {
      const period = template.degrees.length;
      if (barMap.length % period !== 0 && barMap.length < 8) continue;
      const indices = template.degrees.map((degree) => degreeIndex.get(degree));
      if (indices.some((index) => index === undefined)) continue;
      const candidatePath = units.map(
        (unit) => indices[unit.backingBar % period]!,
      );
      if (candidatePath.every((c) => c === candidatePath[0])) continue;
      // Rests say nothing, so only units with notes can veto the progression.
      const sounding = units
        .map((unit, u) => ({
          unit,
          chord: candidates[candidatePath[u]].chord,
          fit: fits[u][candidatePath[u]],
        }))
        .filter(({ unit }) => unit.notes.length > 0);
      if (sounding.some(({ fit }) => fit < 0.1)) continue;
      // Each chord has to be touched by the melody of the bar it sits under —
      // its root or two of its tones — or the band is playing a song the
      // player isn't.
      const untouched = template.degrees.some((_, step) =>
        units.some(
          (unit, u) =>
            unit.backingBar % period === step &&
            unit.isBarStart &&
            !touches(
              units.filter((other) => other.backingBar === unit.backingBar),
              candidates[candidatePath[u]].chord,
            ),
        ),
      );
      if (untouched) continue;
      const fit = meanFit(ctx, candidatePath);
      if (fit < baseline - tolerance) continue;
      passing.push({ path: candidatePath, value: fit + 0.3 * template.prior });
    }
    if (passing.length > 0) {
      const top = Math.max(...passing.map((p) => p.value));
      const near = passing.filter((p) => p.value >= top - 0.08);
      const pick = random
        ? near[Math.floor(random() * near.length)]
        : near.find((p) => p.value === top)!;
      path = pick.path;
      source = "progression";
    }
  }

  const spans = closeSpans(
    path.map((c, u) => ({
      chord: candidates[c].chord,
      start: units[u].start,
      length: 0,
    })),
    total,
  );
  return { kind: "tonal", source, spans };
}
