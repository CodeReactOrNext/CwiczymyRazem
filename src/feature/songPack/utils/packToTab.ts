import type { BackingAlignment } from "feature/backingTrack/types/backingTrack.types";
import type { TempoAnchor } from "feature/backingTrack/utils/tempoMap";
import { createRecordingTempoMap, MAX_TEMPO_BPM, MIN_TEMPO_BPM } from "feature/backingTrack/utils/tempoMap";
import type { BendPoint, TablatureBeat, TablatureMeasure, TablatureNote } from "feature/exercisePlan/types/exercise.types";
import type { ParsedGp } from "feature/songs/services/gp5Parser.service";

import type { SongPackBeat, SongPackNote, SongPackPart, SongPackTab } from "../types/songPack.types";

/**
 * A song package says *when* each note is played, in seconds into its own
 * recording — never how long a note is worth. A tab is the other way round.
 *
 * The bridge between the two is the package's beat grid: every beat is a
 * quarter note, every marked beat starts a bar. That gives the bars, and where
 * each bar falls in the recording — which is exactly what a hand-aligned
 * backing track stores (feature/backingTrack/utils/tempoMap). So the same map
 * is built here and used twice: once to place the notes in the bars, once as
 * the alignment that will play the recording under them. Tab and recording
 * cannot disagree, because one was laid out with the other.
 */

/** Positions snap to a 192nd note: finer than anything played, coarse enough to land on the grid. */
const TICKS_PER_QUARTER = 48;

/** A bar line this close to where steady tempo puts it is not a tempo change. */
const ANCHOR_TOLERANCE_SEC = 0.002;

/** Longest a picked note with no sustain is written, in ticks — a quarter. */
const PICKED_NOTE_TICKS = TICKS_PER_QUARTER;

/** A held note this much shorter than the gap after it is followed by a rest. */
const REST_AFTER_TICKS = TICKS_PER_QUARTER / 4;

/** What the desktop store keeps per song (electron/backingTrackStore.js). */
const MAX_ANCHORS = 512;

const RATIO_EPSILON = 1e-4;

const STANDARD_OPEN_MIDI: Record<SongPackPart["kind"], number[]> = {
  guitar: [40, 45, 50, 55, 59, 64],
  bass: [28, 33, 38, 43],
};

// Sections a package marks that are not parts of the song to announce.
const UNNAMED_SECTIONS = new Set(["noguitar", "nobass", ""]);

export interface PackTab {
  parsed: ParsedGp;
  /** Where the tab's bars fall in the package's recording. */
  alignment: Pick<BackingAlignment, "offsetMs" | "sourceBpm" | "tempoAnchors">;
}

interface Bar {
  startSec: number;
  /** Quarter notes from the tab's beat 0. */
  startBeat: number;
  quarters: number;
}

function barsOf(beats: readonly SongPackBeat[]): { bars: Bar[]; endSec: number } {
  const times = beats.map((beat) => beat.time).filter(Number.isFinite);
  if (times.length < 2) throw new Error("The song package has no beat grid");

  // A grid with no bar marked at all is read as 4/4 rather than one endless bar.
  const hasBars = beats.some((beat, i) => i > 0 && beat.bar);
  const bars: Bar[] = [];
  beats.forEach((beat, i) => {
    const startsBar = i === 0 || (hasBars ? beat.bar : i % 4 === 0);
    if (startsBar) bars.push({ startSec: beat.time, startBeat: i, quarters: 1 });
    else bars[bars.length - 1].quarters += 1;
  });

  // The last beat has no next one to end it: it runs as long as the one before.
  const last = times.length - 1;
  return { bars, endSec: times[last] + (times[last] - times[last - 1]) };
}

/** The tempo most of the song runs at, as a whole number a metronome can be set to. */
function nominalTempo(beats: readonly SongPackBeat[]): number {
  const bpms: number[] = [];
  for (let i = 1; i < beats.length; i++) {
    const gap = beats[i].time - beats[i - 1].time;
    if (gap > 0) bpms.push(60 / gap);
  }
  if (bpms.length === 0) return 120;
  bpms.sort((a, b) => a - b);
  const median = bpms[Math.floor(bpms.length / 2)];
  return Math.min(MAX_TEMPO_BPM, Math.max(MIN_TEMPO_BPM, Math.round(median)));
}

/**
 * The bar lines worth pinning: only those where the tempo actually moves.
 *
 * Every bar line of the package is known, but a song played to a click would
 * come out as hundreds of pins that all say the same thing. A bar line is kept
 * when leaving it out would put any bar between its neighbours more than a
 * couple of milliseconds off.
 */
function anchorsWithin(points: readonly TempoAnchor[], toleranceSec: number): TempoAnchor[] {
  const kept: TempoAnchor[] = [];
  let from = 0;
  while (from < points.length - 1) {
    // Stretch the span as far as a straight line still passes through every bar line in it.
    let to = from + 1;
    for (let candidate = from + 2; candidate < points.length; candidate++) {
      const a = points[from];
      const b = points[candidate];
      const slope = (b.sec - a.sec) / (b.beat - a.beat);
      let fits = true;
      for (let i = from + 1; i < candidate; i++) {
        if (Math.abs(a.sec + (points[i].beat - a.beat) * slope - points[i].sec) > toleranceSec) {
          fits = false;
          break;
        }
      }
      if (!fits) break;
      to = candidate;
    }
    kept.push(points[to]);
    from = to;
  }
  return kept;
}

function anchorsOf(bars: readonly Bar[], endSec: number): TempoAnchor[] {
  const points: TempoAnchor[] = bars.map((bar) => ({ beat: bar.startBeat, sec: bar.startSec }));
  const lastBar = bars[bars.length - 1];
  points.push({ beat: lastBar.startBeat + lastBar.quarters, sec: endSec });

  // A long song by a band that never sat on a click can ask for more pins than
  // the store keeps; a looser fit is better than losing the end of the song.
  let tolerance = ANCHOR_TOLERANCE_SEC;
  let kept = anchorsWithin(points, tolerance);
  while (kept.length > MAX_ANCHORS && tolerance < 0.05) {
    tolerance *= 2;
    kept = anchorsWithin(points, tolerance);
  }
  return kept;
}

const sectionTitle = (name: string): string | null => {
  const key = name.trim().toLowerCase();
  if (UNNAMED_SECTIONS.has(key)) return null;
  return key.charAt(0).toUpperCase() + key.slice(1);
};

function bendCurveOf(note: SongPackNote): BendPoint[] | undefined {
  if (!note.bends?.length) return undefined;
  const length = note.sustain > 0 ? note.sustain : Math.max(...note.bends.map((bend) => bend.time - note.time), 0.05);
  const curve = note.bends
    .map((bend) => ({
      position: Math.min(1, Math.max(0, (bend.time - note.time) / length)),
      cents: Math.round(bend.step * 100),
    }))
    .sort((a, b) => a.position - b.position);
  // A bend that starts later than the note starts from the fretted pitch.
  if (curve[0].position > 0) curve.unshift({ position: 0, cents: 0 });
  return curve;
}

function tabNoteOf(note: SongPackNote, part: SongPackPart, openMidi: readonly number[]): TablatureNote {
  const bendCurve = bendCurveOf(note);
  const peakCents = bendCurve ? Math.max(...bendCurve.map((point) => point.cents)) : 0;

  const tabNote: TablatureNote = {
    // A tab counts strings from the highest; a package from the lowest.
    string: part.stringCount - note.string,
    fret: note.fret,
    midiNote: openMidi[note.string] + note.fret,
    dynamics: 0.8,
  };
  if (note.accent) tabNote.isAccented = true;
  if (note.hammerOn) tabNote.isHammerOn = true;
  if (note.pullOff) tabNote.isPullOff = true;
  if (note.vibrato) tabNote.isVibrato = true;
  if (note.tap) tabNote.isTap = true;
  if (note.mute) tabNote.isDead = true;
  if (note.palmMute) tabNote.isPalmMute = true;
  if (note.pinchHarmonic) tabNote.harmonicType = 4;
  else if (note.harmonic) tabNote.harmonicType = 1;
  // AlphaTab's slide-out kinds, which the tab draws: 1 lands on the next note,
  // 3 and 4 trail off up or down the neck.
  if (note.slideTo !== undefined) tabNote.slideOut = 1;
  else if (note.slideUnpitchTo !== undefined) tabNote.slideOut = note.slideUnpitchTo >= note.fret ? 3 : 4;
  if (bendCurve && peakCents > 0) {
    tabNote.isBend = true;
    tabNote.bendCurve = bendCurve;
    tabNote.bendSemitones = Math.round(peakCents / 100);
    if (bendCurve[0].cents > 0) tabNote.isPreBend = true;
    if (bendCurve[bendCurve.length - 1].cents < peakCents) tabNote.isRelease = true;
  }
  return tabNote;
}

interface Strike {
  tick: number;
  /** How long the longest string of the strike rings, in ticks. */
  heldTicks: number;
  notes: TablatureNote[];
  chordName?: string;
}

const ticksToQuarters = (ticks: number): number => ticks / TICKS_PER_QUARTER;

/** One bar's beats: each strike runs to the next, with rests where nothing rings. */
function barBeats(strikes: readonly Strike[], startTick: number, lengthTicks: number): TablatureBeat[] {
  const beats: TablatureBeat[] = [];
  const endTick = startTick + lengthTicks;
  const rest = (ticks: number) => { if (ticks > 0) beats.push({ notes: [], duration: ticksToQuarters(ticks) }); };

  rest((strikes[0]?.tick ?? endTick) - startTick);
  strikes.forEach((strike, i) => {
    const gap = (strikes[i + 1]?.tick ?? endTick) - strike.tick;
    const wanted = strike.heldTicks > 0 ? strike.heldTicks : PICKED_NOTE_TICKS;
    const held = wanted <= gap - REST_AFTER_TICKS ? Math.max(1, wanted) : gap;
    beats.push({
      notes: strike.notes,
      duration: ticksToQuarters(held),
      ...(strike.chordName ? { chordName: strike.chordName } : {}),
    });
    rest(gap - held);
  });
  return beats;
}

/**
 * Lays an imported song package out as a tab, and says where that tab's bars
 * fall in the package's recording.
 */
export function packToTab(pack: SongPackTab): PackTab {
  const grid = pack.parts[0]?.beats ?? [];
  const { bars, endSec } = barsOf(grid);
  const tempo = nominalTempo(grid);
  const offsetMs = bars[0].startSec * 1000;
  const tempoAnchors = anchorsOf(bars, endSec);
  const map = createRecordingTempoMap({ anchors: tempoAnchors, offsetMs, sourceBpm: tempo });

  const lastBar = bars[bars.length - 1];
  const totalTicks = (lastBar.startBeat + lastBar.quarters) * TICKS_PER_QUARTER;
  const tickAt = (sec: number): number =>
    Math.min(totalTicks - 1, Math.max(0, Math.round(map.beatForSec(sec) * TICKS_PER_QUARTER)));
  const barIndexAt = (tick: number): number => {
    let lo = 0;
    let hi = bars.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (bars[mid].startBeat * TICKS_PER_QUARTER <= tick) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };

  // Tempo the tab states itself, so it plays right with the recording switched
  // off too. Aligned, the session stamps the recording's curve over it — the
  // same numbers, since both come from the one map.
  const tempoFields: Pick<TablatureMeasure, "tempoChange">[] = [];
  let runningRatio = Number.NaN;
  for (const bar of bars) {
    const ratio = map.ratioAtBeat(bar.startBeat);
    const changed = !(Math.abs(ratio - runningRatio) <= RATIO_EPSILON);
    tempoFields.push(changed ? { tempoChange: ratio } : {});
    if (changed) runningRatio = ratio;
  }

  const tracks = pack.parts.map((part): ParsedGp["tracks"][number] => {
    const standard = STANDARD_OPEN_MIDI[part.kind];
    const openMidi = Array.from({ length: part.stringCount }, (_, string) => (standard[string] ?? 0) + (part.tuning[string] ?? 0));

    const byBar: Strike[][] = bars.map(() => []);
    const strikeAt = new Map<number, Strike>();
    const notes = [...part.notes].sort((a, b) => a.time - b.time);
    for (const note of notes) {
      if (note.string < 0 || note.string >= part.stringCount || !Number.isFinite(note.time)) continue;
      const tick = tickAt(note.time);
      let strike = strikeAt.get(tick);
      if (!strike) {
        strike = { tick, heldTicks: 0, notes: [] };
        strikeAt.set(tick, strike);
        byBar[barIndexAt(tick)].push(strike);
      }
      const string = part.stringCount - note.string;
      // Two notes on one string in one tick is one note the grid could not tell apart.
      if (strike.notes.some((existing) => existing.string === string)) continue;
      strike.notes.push(tabNoteOf(note, part, openMidi));
      if (note.chord && !strike.chordName) strike.chordName = note.chord;
      if (note.sustain > 0) {
        strike.heldTicks = Math.max(strike.heldTicks, tickAt(note.time + note.sustain) - tick);
      }
    }

    const sectionAtBar = new Map<number, string>();
    for (const section of part.sections) {
      const title = sectionTitle(section.name);
      if (title) sectionAtBar.set(barIndexAt(tickAt(section.time)), title);
    }

    const measures = bars.map((bar, i): TablatureMeasure => {
      const strikes = byBar[i].sort((a, b) => a.tick - b.tick);
      const section = sectionAtBar.get(i);
      return {
        beats: barBeats(strikes, bar.startBeat * TICKS_PER_QUARTER, bar.quarters * TICKS_PER_QUARTER),
        timeSignature: [bar.quarters, 4],
        ...tempoFields[i],
        ...(section ? { section } : {}),
      };
    });

    return {
      name: part.name,
      measures,
      trackType: part.kind,
      pan: 0,
      stringCount: part.stringCount,
      // String 1 — the highest — first, as the rest of the app lists a tuning.
      openStringMidi: [...openMidi].reverse(),
    };
  });

  return { parsed: { tempo, tracks }, alignment: { offsetMs, sourceBpm: tempo, tempoAnchors } };
}
