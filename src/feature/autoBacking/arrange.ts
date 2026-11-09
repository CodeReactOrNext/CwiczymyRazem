import type {
  TablatureBeat,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

import type { GrooveId } from "./grooves";
import { groupHits, groupStarts, isSimpleMeter } from "./grooves";
import type { ChordSpan } from "./harmonize";
import type { BarInfo } from "./noteEvents";
import { pulseOf } from "./noteEvents";
import type { BandStyleId } from "./styles";
import type { Chord } from "./theory";
import { bassOf, QUALITY_INTERVALS } from "./theory";

const EPS = 1e-6;

/**
 * The grooves a style may replace with its own figures, in a plain 4/4 bar.
 * The others carry the feel themselves (a shuffle's triplets, a waltz's
 * three, a thrash skank) and keep their patterns, played on the style's kit.
 */
const RESTYLED_GROOVES: ReadonlySet<GrooveId> = new Set([
  "rock",
  "pop",
  "ballad",
]);

/** A whole 4/4 bar the style plays its own figures in. */
const styledBar = (
  bar: BarInfo,
  groove: GrooveId,
  style: BandStyleId | undefined,
): style is Exclude<BandStyleId, "ambient" | "dark"> =>
  style !== undefined &&
  style !== "ambient" &&
  style !== "dark" &&
  RESTYLED_GROOVES.has(groove) &&
  isSimpleMeter(bar.timeSignature) &&
  Math.abs(bar.length - 4) < EPS;

// ── Seeded randomness — the same exercise always gets the same backing ───────

export type Rng = () => number;

export function createRng(seed: string): Rng {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Building measures from timed events ──────────────────────────────────────

export interface TrackEvent {
  pos: number;
  notes: TablatureNote[];
  /** How long the notes sound; omitted = until the next event. */
  length?: number;
}

/**
 * Turn events into the beats the tab synth plays. A note sounds for its beat's
 * duration, so a short note followed by silence becomes a beat plus a rest.
 * The bar keeps the tab's exact length, meter and tempo marks, which is what
 * keeps every track on one clock.
 */
export function buildMeasure(
  events: TrackEvent[],
  bar: BarInfo,
): TablatureMeasure {
  const merged: TrackEvent[] = [];
  for (const event of [...events]
    .filter((e) => e.pos < bar.length - EPS)
    .sort((a, b) => a.pos - b.pos)) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(last.pos - event.pos) < EPS) {
      last.notes = [...last.notes, ...event.notes];
      if (event.length !== undefined)
        last.length = Math.min(last.length ?? Infinity, event.length);
    } else {
      merged.push({ ...event, notes: [...event.notes] });
    }
  }

  const beats: TablatureBeat[] = [];
  if (merged.length === 0 || merged[0].pos > EPS) {
    beats.push({
      duration: merged.length ? merged[0].pos : bar.length,
      notes: [],
    });
  }
  merged.forEach((event, i) => {
    const gap =
      (i + 1 < merged.length ? merged[i + 1].pos : bar.length) - event.pos;
    if (event.length !== undefined && event.length < gap - EPS) {
      beats.push({ duration: event.length, notes: event.notes });
      beats.push({ duration: gap - event.length, notes: [] });
    } else {
      beats.push({ duration: gap, notes: event.notes });
    }
  });

  return {
    beats,
    timeSignature: bar.timeSignature,
    ...(bar.tempoChange !== undefined ? { tempoChange: bar.tempoChange } : {}),
    ...(bar.firstLoopOnly ? { firstLoopOnly: true } : {}),
    ...(bar.lastLoopOnly ? { lastLoopOnly: true } : {}),
  };
}

/** The chords sounding inside one bar, clipped to it (positions relative to the bar). */
export interface BarSegment {
  chord: Chord;
  from: number;
  to: number;
  /** Beats since the chord began — patterns that walk (boogie) carry on across bars. */
  sinceChordStart: number;
  /** The chord after this one, for approach notes. */
  next: Chord;
  /** The chord ends with this segment, rather than carrying on into the next bar. */
  ends: boolean;
}

export function segmentsForBar(
  spans: readonly ChordSpan[],
  barStart: number,
  barLength: number,
): BarSegment[] {
  const segments: BarSegment[] = [];
  spans.forEach((span, i) => {
    const from = Math.max(span.start, barStart);
    const to = Math.min(span.start + span.length, barStart + barLength);
    if (to - from <= EPS) return;
    segments.push({
      chord: span.chord,
      from: from - barStart,
      to: to - barStart,
      sinceChordStart: from - span.start,
      next: spans[(i + 1) % spans.length].chord,
      ends: span.start + span.length <= barStart + barLength + EPS,
    });
  });
  return segments;
}

// ── Drums ─────────────────────────────────────────────────────────────────────

const KICK = 36;
const SIDE_STICK = 37;
const SNARE = 38;
const HAT = 42;
const OPEN_HAT = 46;
const CRASH = 49;
const RIDE = 51;
const HIGH_TOM = 48;
const LOW_TOM = 45;

const drum = (midiNote: number, dynamics: number): TablatureNote => ({
  string: 1,
  fret: 0,
  midiNote,
  dynamics,
});

/**
 * Where a bar sits in the song the backing plays: a pad-only intro, then the
 * groove, a lift onto the ride, a breakdown that thins the kit out and a
 * build back into the groove. A loop that has to end with the tab plays
 * `groove` throughout.
 */
export type Section = "intro" | "groove" | "lift" | "breakdown" | "build";

export interface DrumBarContext {
  groove: GrooveId;
  bpm: number;
  isFill: boolean;
  isCrash: boolean;
  rng: Rng;
  section?: Section;
  /** In the second half of its section — where a build starts to push. */
  late?: boolean;
  /** Who plays: lofi, synthwave and house have their own beats in 4/4. */
  style?: BandStyleId;
}

/** Positions from `from` to `to` every `step`. */
export const every = (step: number, from: number, to: number) => {
  const out: number[] = [];
  for (let p = from; p < to - EPS; p += step)
    out.push(Math.round(p * 1e6) / 1e6);
  return out;
};

function baseCymbals(
  groove: GrooveId,
  bar: BarInfo,
  busy: boolean,
): { pos: number; dynamics: number; note: number }[] {
  const pulse = pulseOf(bar.timeSignature);
  const simple = isSimpleMeter(bar.timeSignature);
  const strongAt = (pos: number) =>
    Math.abs(pos / pulse - Math.round(pos / pulse)) < EPS;
  const hats = (step: number, onBeat: number, offBeat: number, note = HAT) =>
    every(step, 0, bar.length).map((pos) => ({
      pos,
      dynamics: strongAt(pos) ? onBeat : offBeat,
      note,
    }));

  if (!simple) return hats(0.5, 0.7, 0.45);
  switch (busy ? "pop" : groove) {
    case "pop":
      return every(0.25, 0, bar.length).map((pos) => ({
        pos,
        dynamics: strongAt(pos)
          ? 0.65
          : Math.abs((pos % 1) - 0.5) < EPS
            ? 0.45
            : 0.3,
        note: HAT,
      }));
    case "ballad":
      return hats(0.5, 0.5, 0.32);
    case "shuffle":
      return every(1, 0, bar.length).flatMap((beat) => [
        { pos: beat, dynamics: 0.7, note: RIDE },
        ...(beat + 2 / 3 < bar.length - EPS
          ? [{ pos: beat + 2 / 3, dynamics: 0.4, note: RIDE }]
          : []),
      ]);
    case "thrash":
    case "halftime":
      return hats(1, 0.7, 0.7, groove === "thrash" ? RIDE : HAT);
    case "doom":
      return hats(1, 0.65, 0.65, RIDE);
    case "waltz":
      return hats(1, 0.5, 0.5);
    default:
      return hats(0.5, 0.7, 0.45);
  }
}

function cymbalGrid(
  groove: GrooveId,
  bar: BarInfo,
  { ride = false, busy = false }: { ride?: boolean; busy?: boolean } = {},
): { pos: number; dynamics: number; note: number }[] {
  const grid = baseCymbals(groove, bar, busy);
  // The lift moves the time onto the ride, the way a drummer opens a chorus up.
  return ride
    ? grid.map((hit) => (hit.note === HAT ? { ...hit, note: RIDE } : hit))
    : grid;
}

/**
 * A style's own beat over a 4/4 bar, up to where a fill takes over.
 * - lofi: a lazy boom-bap — kick on the one and the "and" of three, a ghost
 *   kick now and then, quiet eighth hats that never hit two alike.
 * - synthwave: kick on one and three, the big snare on two and four,
 *   sixteenth hats (eighths when fast); the lift drives a kick on every beat.
 * - house: four on the floor, a clap on two and four, the open hat on every
 *   "and"; the lift fills the sixteenths in between.
 */
function styledDrums(
  style: Exclude<BandStyleId, "ambient" | "dark">,
  ctx: DrumBarContext,
  fillFrom: number,
  hit: (pos: number, note: TablatureNote) => void,
) {
  const { bpm, rng, section = "groove" } = ctx;
  const lift = section === "lift";
  const pushing = section === "build" && !!ctx.late;
  const play = (pos: number, note: number, dynamics: number) => {
    if (pos >= fillFrom - EPS) return;
    if (pos < EPS && ctx.isCrash && (note === HAT || note === RIDE)) return;
    hit(pos, drum(note, dynamics));
  };

  if (style === "lofi") {
    const cymbal = lift ? RIDE : HAT;
    for (const pos of every(0.5, 0, 4)) {
      const onBeat = Math.abs(pos % 1) < EPS;
      // Never two hats alike: a drum machine is what lofi plays against.
      play(pos, cymbal, (onBeat ? 0.5 : 0.3) + rng() * 0.12);
    }
    if (pushing) for (const pos of every(0.5, 2, 4)) play(pos + 0.25, HAT, 0.2);
    play(0, KICK, 0.9);
    play(2.5, KICK, 0.75);
    if (rng() < 0.4) play(1.75, KICK, 0.45);
    if (lift && rng() < 0.5) play(3.5, OPEN_HAT, 0.4);
    play(1, SNARE, 0.75);
    play(3, SNARE, 0.8);
    if (rng() < 0.3) play(3.75, SIDE_STICK, 0.3);
    return;
  }

  if (style === "synthwave") {
    const step = bpm <= 110 || pushing ? 0.25 : 0.5;
    for (const pos of every(step, 0, 4)) {
      const onBeat = Math.abs(pos % 1) < EPS;
      const onEighth = Math.abs((pos * 2) % 1) < EPS;
      play(pos, HAT, onBeat ? 0.6 : onEighth ? 0.42 : 0.26);
    }
    for (const beat of lift || pushing ? [0, 1, 2, 3] : [0, 2])
      play(beat, KICK, beat % 2 === 0 ? 0.95 : 0.75);
    if (!lift && rng() < 0.4) play(2.5, KICK, 0.65);
    play(1, SNARE, 0.9);
    play(3, SNARE, 0.95);
    return;
  }

  // House.
  for (const beat of [0, 1, 2, 3]) play(beat, KICK, 0.95);
  for (const beat of [1, 3]) play(beat, SNARE, 0.85);
  for (const beat of [0, 1, 2, 3]) play(beat + 0.5, OPEN_HAT, 0.5);
  if (lift || pushing)
    for (const beat of [0, 1, 2, 3]) {
      play(beat + 0.25, HAT, 0.24);
      play(beat + 0.75, HAT, 0.3);
    }
}

/** A run of snare into the toms over the last `fillLength` beats, from `fillFrom`. */
function drumFill(
  groove: GrooveId,
  simple: boolean,
  longFill: boolean,
  bpm: number,
  fillFrom: number,
  fillLength: number,
  hit: (pos: number, note: TablatureNote) => void,
) {
  const triplet = groove === "shuffle" || !simple;
  const count = triplet
    ? 3
    : longFill
      ? bpm <= 110
        ? 8
        : 4
      : bpm <= 120
        ? 4
        : 2;
  const sequence =
    count >= 4
      ? [...Array<number>(count - 2).fill(SNARE), HIGH_TOM, LOW_TOM]
      : count === 3
        ? [SNARE, HIGH_TOM, LOW_TOM]
        : [SNARE, LOW_TOM];
  sequence.forEach((note, i) => {
    hit(
      fillFrom + (i * fillLength) / count,
      drum(note, 0.6 + (0.35 * i) / (count - 1)),
    );
  });
  hit(fillFrom, drum(KICK, 0.8));
}

export function drumBar(bar: BarInfo, ctx: DrumBarContext): TrackEvent[] {
  const { groove, bpm, rng, section = "groove" } = ctx;
  const events: TrackEvent[] = [];
  const hit = (pos: number, note: TablatureNote) =>
    events.push({ pos, notes: [note] });

  const starts = groupStarts(bar);
  const roles = groupHits(starts.length);
  const simple = isSimpleMeter(bar.timeSignature);

  // The intro is the pad alone; the beat comes in with the groove.
  if (section === "intro") return events;

  // The breakdown keeps only a pulse: a soft kick on the one and a rim click
  // where the backbeat was, so the time is still there to play against.
  if (section === "breakdown") {
    if (ctx.isCrash) hit(0, drum(CRASH, 0.55));
    hit(0, drum(KICK, 0.7));
    starts.forEach((pos, i) => {
      if (roles[i] === "snare") hit(pos, drum(SIDE_STICK, 0.45));
    });
    return events;
  }

  // A fill takes over the last pulse of a phrase and leads into the crash;
  // the build's runs over the last half bar.
  const pulse = pulseOf(bar.timeSignature);
  const longFill = section === "build" && simple && bar.length >= 4 - EPS;
  const fillLength = longFill ? 2 : bar.length >= 2 ? Math.min(pulse, 1.5) : 0;
  const fillFrom =
    ctx.isFill && fillLength > 0 ? bar.length - fillLength : Infinity;

  if (styledBar(bar, groove, ctx.style)) {
    if (ctx.isCrash) hit(0, drum(CRASH, 0.8));
    styledDrums(ctx.style, ctx, fillFrom, hit);
    if (fillFrom < Infinity)
      drumFill(groove, simple, longFill, bpm, fillFrom, fillLength, hit);
    return events;
  }

  const cymbals = cymbalGrid(groove, bar, {
    ride: section === "lift",
    busy: section === "build" && !!ctx.late,
  });
  for (const { pos, dynamics, note } of cymbals) {
    if (pos >= fillFrom - EPS) continue;
    if (pos < EPS && ctx.isCrash) continue;
    hit(pos, drum(note, dynamics));
  }
  if (ctx.isCrash) hit(0, drum(CRASH, 0.8));

  if (groove === "thrash" && simple) {
    // The thrash "skank" beat: kick on every beat, snare on every off-beat.
    every(1, 0, bar.length).forEach((beat) => {
      if (beat < fillFrom - EPS) hit(beat, drum(KICK, 0.95));
      if (beat + 0.5 < fillFrom - EPS) hit(beat + 0.5, drum(SNARE, 0.85));
    });
  } else if (groove === "halftime" && simple && bar.length >= 4 - EPS) {
    hit(0, drum(KICK, 0.95));
    if (2 < fillFrom - EPS) hit(2, drum(SNARE, 0.9));
    if (rng() < 0.5 && 2.5 < fillFrom - EPS) hit(2.5, drum(KICK, 0.8));
  } else {
    starts.forEach((pos, i) => {
      if (pos >= fillFrom - EPS) return;
      if (roles[i] === "kick") {
        hit(pos, drum(KICK, i === 0 ? 0.95 : 0.85));
      } else {
        const soft =
          groove === "waltz" ||
          (!simple && starts.length >= 3 && roles[i - 1] === "snare");
        hit(
          pos,
          drum(groove === "waltz" ? SIDE_STICK : SNARE, soft ? 0.6 : 0.9),
        );
      }
    });

    if (simple && groove === "metal") {
      // Eighth-note double kick under the backbeat.
      every(0.5, 0, Math.min(bar.length, fillFrom)).forEach((pos) => {
        if (
          !starts.some(
            (s, i) => roles[i] === "snare" && Math.abs(s - pos) < EPS,
          )
        )
          hit(pos, drum(KICK, 0.8));
      });
    } else if (
      simple &&
      (groove === "rock" || groove === "pop" || groove === "ballad") &&
      bar.length >= 4 - EPS
    ) {
      // Variation: the "and" of three, sometimes — a bar that never changes
      // reads as a drum machine.
      // The lift pushes a little more.
      const extraKick = section === "lift" ? 0.75 : 0.5;
      if (rng() < extraKick && 2.5 < fillFrom - EPS) hit(2.5, drum(KICK, 0.75));
      if (groove === "pop" && rng() < 0.4 && 3.75 < fillFrom - EPS)
        hit(3.75, drum(SNARE, 0.22));
      if (groove === "rock" && !ctx.isFill && rng() < 0.25) {
        const at = bar.length - 0.5;
        const idx = events.findIndex(
          (e) => Math.abs(e.pos - at) < EPS && e.notes[0].midiNote === HAT,
        );
        if (idx >= 0) events[idx] = { pos: at, notes: [drum(OPEN_HAT, 0.55)] };
      }
    } else if (groove === "shuffle" && simple) {
      every(1, 0, Math.min(bar.length, fillFrom)).forEach((beat) => {
        if (rng() < 0.3 && beat + 2 / 3 < fillFrom - EPS)
          hit(beat + 2 / 3, drum(KICK, 0.55));
      });
    }
  }

  if (fillFrom < Infinity)
    drumFill(groove, simple, longFill, bpm, fillFrom, fillLength, hit);
  return events;
}

// ── Bass ──────────────────────────────────────────────────────────────────────

const BASS_OPEN = [43, 38, 33, 28];

/** Root of a chord in the bass's home octave, E1–D#2. */
const bassRoot = (pc: number) => 28 + ((pc - 4 + 12) % 12);

export function bassNote(pitch: number, dynamics: number): TablatureNote {
  const index = BASS_OPEN.findIndex((open) => pitch >= open);
  const stringIndex = index < 0 ? 3 : index;
  return {
    string: stringIndex + 1,
    fret: Math.max(0, pitch - BASS_OPEN[stringIndex]),
    dynamics,
  };
}

const thirdOf = (chord: Chord) =>
  chord.quality === "min" || chord.quality === "min7" || chord.quality === "dim"
    ? 3
    : 4;
const fifthOf = (chord: Chord) => (chord.quality === "dim" ? 6 : 7);

/** A half step into the next root — from below, or from above where the
 *  bass has no lower string. */
function approach(next: Chord): number {
  const target = bassRoot(bassOf(next));
  return target - 1 >= BASS_OPEN[3] ? target - 1 : target + 1;
}

export function bassBar(
  bar: BarInfo,
  segments: readonly BarSegment[],
  playedGroove: GrooveId,
  section: Section = "groove",
  style?: BandStyleId,
): TrackEvent[] {
  const events: TrackEvent[] = [];
  // The bass waits out the intro and drops out for the breakdown — the dip a
  // listener feels most, since the bass carries most of the band's weight.
  if (section === "intro" || section === "breakdown") return events;
  const groove: GrooveId = playedGroove;
  const add = (pos: number, pitch: number, length: number, dynamics: number) =>
    events.push({ pos, length, notes: [bassNote(pitch, dynamics)] });
  const simple = isSimpleMeter(bar.timeSignature);
  const starts = groupStarts(bar);
  const styled = styledBar(bar, groove, style) ? style : null;

  for (const seg of segments) {
    const root = bassRoot(bassOf(seg.chord));
    // Over a slash bass the line is the point: hold the named note, no fifth.
    const fifth =
      seg.chord.bass !== undefined ? root : root + fifthOf(seg.chord);
    const changes = bassOf(seg.next) !== bassOf(seg.chord);
    const span = seg.to - seg.from;

    if (styled === "synthwave") {
      // The octave pulse: root and the octave above it in eighths.
      const positions = every(0.5, seg.from, seg.to);
      positions.forEach((pos, i) => {
        const last = i === positions.length - 1;
        const pitch =
          last && changes && span >= 2
            ? approach(seg.next)
            : root + (i % 2 === 1 ? 12 : 0);
        add(pos, pitch, 0.4, i % 2 === 0 ? 0.85 : 0.65);
      });
      continue;
    }
    if (styled === "house") {
      // Off the beat, between the kicks — the bass and the kick never meet.
      every(1, seg.from, seg.to).forEach((beat, i, beats) => {
        if (beat + 0.5 >= seg.to - EPS) return;
        const last = i === beats.length - 1;
        const pitch =
          last && changes && span >= 2
            ? approach(seg.next)
            : root + (i % 4 === 2 ? 12 : 0);
        add(beat + 0.5, pitch, 0.38, 0.85);
      });
      continue;
    }
    if (styled === "lofi") {
      // Long root under the electric piano, a pickup into the fifth.
      for (let pos = seg.from; pos < seg.to - EPS; pos += 4) {
        const room = seg.to - pos;
        add(pos, root, Math.min(1.4, room), 0.9);
        if (room > 1.5 + EPS) add(pos + 1.5, root, 0.4, 0.55);
        if (room > 2.5 + EPS)
          add(
            pos + 2.5,
            changes && room <= 4 + EPS ? approach(seg.next) : fifth,
            Math.min(1.3, room - 2.5),
            0.8,
          );
      }
      continue;
    }

    if (!simple || groove === "compound") {
      // Odd and compound meters: root on each group, the fifth on alternate ones.
      starts
        .filter((s) => s >= seg.from - EPS && s < seg.to - EPS)
        .forEach((s, i, list) => {
          const end = i + 1 < list.length ? list[i + 1] : seg.to;
          add(
            s,
            i % 2 === 1 ? fifth : root,
            Math.max(0.25, (end - s) * 0.9),
            i === 0 ? 0.9 : 0.75,
          );
        });
      if (!events.some((e) => Math.abs(e.pos - seg.from) < EPS))
        add(seg.from, root, Math.min(span, 1.5), 0.85);
      continue;
    }

    switch (groove) {
      case "rock":
      case "metal":
      case "thrash": {
        const positions = every(0.5, seg.from, seg.to);
        positions.forEach((pos, i) => {
          const last = i === positions.length - 1;
          const pitch =
            last && changes && span >= 2 ? approach(seg.next) : root;
          add(pos, pitch, 0.45, Math.abs(pos % 1) < EPS ? 0.85 : 0.7);
        });
        break;
      }
      case "shuffle": {
        const walk =
          thirdOf(seg.chord) === 3
            ? [0, 3, 7, 10, 12, 10, 7, 3]
            : [0, 4, 7, 9, 10, 9, 7, 4];
        every(1, seg.from, seg.to).forEach((pos) => {
          const step = Math.round(seg.sinceChordStart + pos - seg.from);
          add(pos, root + walk[step % walk.length], 0.9, 0.8);
        });
        break;
      }
      case "waltz":
        add(seg.from, root, 1, 0.85);
        if (seg.from + 2 < seg.to - EPS) add(seg.from + 2, fifth, 0.9, 0.7);
        break;
      case "ballad":
      case "doom":
      case "halftime":
        every(2, seg.from, seg.to).forEach((pos, i) => {
          add(
            pos,
            i % 2 === 1 ? fifth : root,
            Math.min(2, seg.to - pos) * 0.95,
            0.85,
          );
        });
        break;
      default: {
        // Pop: dotted quarter, eighth, then the fifth — the common "push" figure.
        for (let pos = seg.from; pos < seg.to - EPS; pos += 4) {
          const room = seg.to - pos;
          add(pos, root, Math.min(1.5, room), 0.9);
          if (room > 1.5 + EPS)
            add(pos + 1.5, root, Math.min(0.5, room - 1.5), 0.7);
          if (room > 2 + EPS) add(pos + 2, fifth, Math.min(1, room - 2), 0.8);
          if (room > 3 + EPS)
            add(
              pos + 3,
              changes && room <= 4 + EPS ? approach(seg.next) : root,
              Math.min(1, room - 3) * 0.9,
              0.75,
            );
        }
      }
    }
  }
  return events;
}

// ── Keys ──────────────────────────────────────────────────────────────────────

const KEYS_LOW = 52;
const KEYS_HIGH = 74;

/** Every close-position voicing of the chord that fits the keys' register. */
function voicingsOf(chord: Chord): number[][] {
  const intervals =
    chord.quality === "5" ? [0, 7, 12] : [...QUALITY_INTERVALS[chord.quality]];
  const out: number[][] = [];
  for (let base = KEYS_LOW - 12; base <= KEYS_HIGH; base++) {
    if ((base - chord.root + 120) % 12 !== 0) continue;
    for (let inversion = 0; inversion < intervals.length; inversion++) {
      const voices = intervals
        .map((interval, i) => base + interval + (i < inversion ? 12 : 0))
        .sort((a, b) => a - b);
      // Two neighbouring voices a semitone apart turn a colour into a cluster.
      const clustered = voices.some((v, i) => i > 0 && v - voices[i - 1] === 1);
      if (
        voices[0] >= KEYS_LOW &&
        voices[voices.length - 1] <= KEYS_HIGH &&
        !clustered
      )
        out.push(voices);
    }
  }
  return out;
}

/** The voicing that moves least from the last one — smooth voice leading. */
export function voiceLead(chord: Chord, previous: number[] | null): number[] {
  const options = voicingsOf(chord);
  if (options.length === 0) return [];
  const cost = (voices: number[]) => {
    if (!previous)
      return Math.abs(voices.reduce((s, v) => s + v, 0) / voices.length - 62);
    return voices.reduce(
      (s, v) => s + Math.min(...previous.map((p) => Math.abs(p - v))),
      0,
    );
  };
  return options.reduce((best, voices) =>
    cost(voices) < cost(best) ? voices : best,
  );
}

/** A chord's notes, levelled so four voices sound no louder than three. */
const keysChord = (voices: number[], dynamics: number): TablatureNote[] => {
  const level = dynamics * Math.sqrt(3 / Math.max(3, voices.length));
  return voices.map((midiNote, i) => ({
    string: i + 1,
    fret: 0,
    midiNote,
    dynamics: level,
  }));
};

export interface KeysState {
  voices: number[] | null;
}

export function keysBar(
  bar: BarInfo,
  segments: readonly BarSegment[],
  groove: GrooveId,
  state: KeysState,
  style?: BandStyleId,
): TrackEvent[] {
  const events: TrackEvent[] = [];
  const simple = isSimpleMeter(bar.timeSignature);
  const starts = groupStarts(bar);
  const styled = styledBar(bar, groove, style) ? style : null;

  for (const seg of segments) {
    const voices = voiceLead(seg.chord, state.voices);
    state.voices = voices;
    if (voices.length === 0) continue;
    const add = (pos: number, length: number, dynamics: number) =>
      events.push({ pos, length, notes: keysChord(voices, dynamics) });
    /** Hits at these beats of every four from the chord's start, each held until the next. */
    const comp = (
      offsets: number[],
      length: (gap: number) => number,
      dynamics: number[],
    ) => {
      for (let window = seg.from; window < seg.to - EPS; window += 4) {
        const hits = offsets
          .map((offset) => window + offset)
          .filter((pos) => pos < seg.to - EPS);
        hits.forEach((pos, i) => {
          const gap =
            (i + 1 < hits.length ? hits[i + 1] : Math.min(seg.to, window + 4)) -
            pos;
          add(pos, length(gap), dynamics[i % dynamics.length]);
        });
      }
    };

    if (styled === "lofi") {
      // The electric piano comps: on the one, then pushed onto the "and" of two.
      comp([0, 1.5], (gap) => gap * 0.92, [0.42, 0.34]);
    } else if (styled === "house") {
      // Short stabs on the tresillo, three over the bar's eight eighths.
      comp([0, 1.5, 3], (gap) => Math.min(0.35, gap), [0.42, 0.36, 0.38]);
    } else if (groove === "waltz" && simple) {
      every(1, seg.from, seg.to).forEach((pos) => {
        if (Math.abs(pos) > EPS) add(pos, 0.7, 0.36);
      });
      if (Math.abs(seg.from) > EPS) add(seg.from, 0.9, 0.4);
    } else if (groove === "shuffle" && simple) {
      // Stabs on two and four, where the shuffle snare sits.
      every(1, seg.from, seg.to).forEach((pos) => {
        if (Math.round(pos) % 2 === 1) add(pos, 0.45, 0.42);
      });
    } else if (groove === "compound" || !simple) {
      const inSeg = starts.filter(
        (s) => s >= seg.from - EPS && s < seg.to - EPS,
      );
      if (inSeg.length === 0 || inSeg[0] > seg.from + EPS)
        inSeg.unshift(seg.from);
      inSeg.forEach((s, i) =>
        add(
          s,
          ((i + 1 < inSeg.length ? inSeg[i + 1] : seg.to) - s) * 0.95,
          i === 0 ? 0.4 : 0.32,
        ),
      );
    } else if (groove === "pop") {
      every(2, seg.from, seg.to).forEach((pos) =>
        add(pos, Math.min(2, seg.to - pos) * 0.95, 0.38),
      );
    } else {
      // Rock, ballad, half-time: a held chord, struck again each bar.
      add(seg.from, (seg.to - seg.from) * 0.97, 0.36);
    }
  }
  return events;
}

// ── Arpeggio ──────────────────────────────────────────────────────────────────

/** Up and back down the chord, the arpeggiator's oldest pattern. */
const ARP_PATTERN = [0, 1, 2, 3, 2, 1];
const ARP_PATTERNS: Partial<Record<BandStyleId, readonly number[]>> = {
  synthwave: [0, 1, 2, 3],
  lofi: [2, 0, 3, 1],
};
const ARP_FLOOR = 62;

/** Up to four chord tones from the D above middle C upwards. */
export function arpTones(chord: Chord): number[] {
  const intervals =
    chord.quality === "5" ? [0, 7, 12] : [...QUALITY_INTERVALS[chord.quality]];
  const root = ARP_FLOOR + ((((chord.root - ARP_FLOOR) % 12) + 12) % 12);
  const tones = [...new Set(intervals.map((interval) => root + interval))].sort(
    (a, b) => a - b,
  );
  if (tones.length < 4) tones.push(root + 12);
  return tones.slice(0, 4);
}

export interface ArpState {
  /** Steps played so far — the pattern carries on across bars and chords. */
  step: number;
}

/**
 * A soft synth arpeggio through the chord, in eighths (quarters at a fast
 * tempo, where eighths would crowd the guitar). Each note is a short pluck;
 * the echo does the rest.
 */
export function arpBar(
  bar: BarInfo,
  segments: readonly BarSegment[],
  bpm: number,
  state: ArpState,
  style?: BandStyleId,
): TrackEvent[] {
  const events: TrackEvent[] = [];
  // Synthwave runs straight up the chord in sixteenths; lofi plinks a slow
  // broken chord in quarters; the rest go up and back in eighths.
  const step =
    style === "synthwave"
      ? bpm <= 100
        ? 0.25
        : 0.5
      : style === "lofi"
        ? 1
        : bpm > 125
          ? 1
          : 0.5;
  const pattern = ARP_PATTERNS[style ?? "ambient"] ?? ARP_PATTERN;
  for (const seg of segments) {
    const tones = arpTones(seg.chord);
    for (const pos of every(step, seg.from, seg.to)) {
      const index = Math.min(
        tones.length - 1,
        pattern[state.step % pattern.length],
      );
      const onBeat = Math.abs(pos - Math.round(pos)) < EPS;
      events.push({
        pos,
        length: step * 0.9,
        // Alternate "strings" so the band can swing each note to the other side.
        notes: [
          {
            string: (state.step % 2) + 1,
            fret: 0,
            midiNote: tones[index],
            dynamics: onBeat ? 0.55 : 0.42,
          },
        ],
      });
      state.step++;
    }
  }
  return events;
}
