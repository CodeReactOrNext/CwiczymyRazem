import type { FreePlayFrame } from "feature/exercisePlan/views/PracticeSession/utils/freePlay";

import type { ChangesVariation } from "../types/boss.types";
import type { NoteRole } from "./changesHarmony";
import { chordScale, degreeLabel, isGuideTone, midiOf, toneRole } from "./changesHarmony";
import { unitSpans } from "./changesTab";

/**
 * A tone of the next chord played this close before the change lands it
 * early — anticipating the change is good soloing, and an attack that comes
 * out of a rest is heard a little early anyway (the detector's onset after
 * silence).
 */
export const ANTICIPATE_BEATS = 0.5;
/** A tone of the chord before, this soon after the change, is still ringing over — not a wrong note. */
const HELD_OVER_BEATS = 0.25;
/** Landing on the change: a chord's first tone this close to it is dead on. */
export const LANDING_BEATS = 0.5;
/** Notes a beat that charge the sword — a sweep up and down doesn't fill it in a second. */
export const HITS_PER_BEAT = 2;
/** The same pitch this many times in a row is a phrase; once more is just hammering it. */
export const REPEATS_ALLOWED = 2;
/** Wrong notes that bite per chord — a slip, not a pile-up of misheard ones. */
const MISSES_PER_CHORD = 2;
/** The strong beats — 1 and 3 of the bar — come every this many beats, from the run's first. */
export const STRONG_BEAT_EVERY = 2;
/**
 * A note this close to a strong beat is played on it — a little before (an
 * attack out of a rest is heard early), more after. A 16th before it is an
 * approach, not the beat.
 */
export const STRONG_EARLY_BEATS = 0.2;
export const STRONG_LATE_BEATS = 0.3;
/**
 * How long past a chord's end it waits before calling it: a note's pitch
 * resolves up to ~180 ms after its attack (guitarBufferProcessor).
 */
const SETTLE_GRACE_MS = 300;
/** A frame further on than this from the last one: the run skipped ahead, don't call the chords in between. */
const GAP_BEATS = 2;
/** Stepping into a chord: its first tone at most this many semitones from the note before — a step, or a tone held over. */
export const SMOOTH_SEMITONES = 2;
/** …played at most this long before it: a line, not two notes either side of a rest. */
const SMOOTH_REACH_BEATS = 2;

export type NoteVerdict = "hit" | "miss" | "free";

/**
 * What a chord's first tone can make of the change: land on it ("onTheOne",
 * within LANDING_BEATS) and step into it from the note before ("smooth",
 * within SMOOTH_SEMITONES) — the changeling's tricks, strung into a combo.
 */
export type ChangeTrick = "onTheOne" | "smooth";

export type ChangesEvent =
  /** Where the run is: the chord being played (null in the count-in) and whole beats until the next. */
  | { type: "clock"; unit: number | null; beatsLeft: number }
  /** A note heard, what it was against the chord, and whether the fight counts it. */
  | {
      type: "note";
      unit: number;
      pc: number;
      /** Its pitch, in the names of the shapes played (a detuned guitar shifted back). */
      midi: number;
      role: NoteRole;
      /** Its degree in the chord it was played on ("b3"); empty for a note not in it. */
      degree: string;
      /** It sounded its chord — a tone of it, in time to count. */
      lands: boolean;
      verdict: NoteVerdict;
      /** A third or a seventh — the changeling's weak spot. */
      weak: boolean;
      /** The chord's first tone, right on the change. */
      perfect: boolean;
      /** The chord's first tone — what lands it. */
      landing: boolean;
      /** What the landing made of the change; empty for any other note, or a chord that didn't change. */
      tricks: ChangeTrick[];
      /**
       * The strong beat the note was played on, if it was the first there — by
       * the chord's index in the pass and the beat in the chord — and whether
       * it hit it: a tone of the chord does, any other note misses it.
       */
      strongBeat: { unit: number; beat: number; hit: boolean } | null;
    }
  /** A chord over: did any of its tones sound in it? */
  | { type: "settle"; unit: number; landed: boolean };

interface ChordTally {
  landed: boolean;
  hits: number;
  misses: number;
  /** The last notes played in it, newest last — what a repeat is told by. */
  recent: number[];
}

interface Place {
  /** Chords since the run's first, counting every pass — negative in the count-in. */
  abs: number;
  /** Its index in the pass. */
  unit: number;
  start: number;
  end: number;
}

const scaleCache = new WeakMap<ChangesVariation, Map<string, ReturnType<typeof chordScale>>>();

/**
 * The notes of the scale over each chord of the pass — the key's, altered by
 * a chord from outside it. Cached per drill: the judge reads it every frame.
 */
const passScales = (variation: ChangesVariation) => {
  let scales = scaleCache.get(variation);
  if (!scales) {
    scales = new Map(variation.units.map((unit) => [unit.chord, chordScale(unit.chord, variation.key)]));
    scaleCache.set(variation, scales);
  }
  return scales;
};

/**
 * Judges a solo over the changeling's pass, frame by frame (useFreePlayFeed):
 * each note against the chord under it — a tone of it charges the sword, a
 * note of the scale between the strong beats charges it a little, a note
 * from outside the key bites, and so does any note but a chord tone first on
 * a strong beat (1 and 3 of the bar) — and each chord once it is over: let
 * go by without one of its tones, it bites too. A chord's first tone also
 * says how the change was played (its tricks). One judge per fight; it
 * starts over when the run does.
 */
export const createChangesJudge = () => {
  let tallies = new Map<number, ChordTally>();
  let settledThrough = -1;
  let lastBeat: number | null = null;
  let lastClock = "";
  /** The note heard last, whatever it was — what a chord is stepped into from. */
  let lastNote: { midi: number; beat: number } | null = null;
  /** The last strong beat a note was played on — only the first note there is held to it. */
  let lastStrong = Number.NEGATIVE_INFINITY;

  const reset = () => {
    tallies = new Map();
    settledThrough = -1;
    lastBeat = null;
    lastClock = "";
    lastNote = null;
    lastStrong = Number.NEGATIVE_INFINITY;
  };

  const tallyOf = (abs: number) => {
    let tally = tallies.get(abs);
    if (!tally) {
      tally = { landed: false, hits: 0, misses: 0, recent: [] };
      tallies.set(abs, tally);
    }
    return tally;
  };

  const feed = (frame: FreePlayFrame, variation: ChangesVariation): ChangesEvent[] => {
    const { units } = variation;
    const spans = unitSpans(variation);
    const passBeats = spans[spans.length - 1]?.end ?? 0;
    if (!units.length || passBeats <= 0) return [];

    const placeOf = (abs: number): Place => {
      const pass = Math.floor(abs / units.length);
      const unit = abs - pass * units.length;
      const offset = pass * passBeats;
      return { abs, unit, start: offset + spans[unit].start, end: offset + spans[unit].end };
    };
    const locate = (beat: number): Place => {
      const pass = Math.floor(beat / passBeats);
      const at = beat - pass * passBeats;
      const unit = Math.max(0, spans.findIndex((span) => at < span.end));
      return placeOf(pass * units.length + unit);
    };

    // The run started over (a restart, the next phase), or skipped ahead
    // (the mic came on, the tab was away): no chord before here is called.
    const restarted = lastBeat !== null && frame.beat < lastBeat - 0.5;
    if (restarted) reset();
    if (lastBeat === null || frame.beat - lastBeat > GAP_BEATS) {
      settledThrough = Math.max(settledThrough, locate(frame.beat).abs - 1);
    }
    lastBeat = frame.beat;

    const scales = passScales(variation);
    const events: ChangesEvent[] = [];

    for (const attack of frame.attacks) {
      const midi = midiOf(attack.pitchHz) - frame.tuningShift;
      const pc = ((midi % 12) + 12) % 12;
      const before = lastNote;
      lastNote = { midi, beat: attack.beat };
      const here = locate(attack.beat);
      const next = placeOf(here.abs + 1);
      const chord = units[here.unit].chord;
      const nextChord = units[next.unit].chord;

      let place = here;
      let role: NoteRole | null = toneRole(chord, pc);
      if (!role && here.end - attack.beat <= ANTICIPATE_BEATS && nextChord !== chord) {
        const early = toneRole(nextChord, pc);
        if (early) {
          place = next;
          role = early;
        }
      }
      // Before the first chord, only its anticipation counts.
      if (place.abs < 0) continue;

      let heldOver = false;
      if (!role) {
        const previous = units[placeOf(here.abs - 1).unit].chord;
        heldOver = attack.beat - here.start <= HELD_OVER_BEATS && toneRole(previous, pc) !== null;
        role = heldOver || scales.get(chord)?.has(pc) ? "passing" : "outside";
      }
      const tone = role !== "passing" && role !== "outside";

      // Too late to count — its chord has been called already.
      const tally = place.abs > settledThrough ? tallyOf(place.abs) : null;

      // The first note on a strong beat has to be a tone of the chord there.
      const strong = Math.round(attack.beat / STRONG_BEAT_EVERY) * STRONG_BEAT_EVERY;
      const target = locate(strong);
      const onStrong =
        tally !== null &&
        strong > lastStrong &&
        attack.beat - strong >= -STRONG_EARLY_BEATS &&
        attack.beat - strong <= STRONG_LATE_BEATS &&
        !heldOver &&
        // A tone of the chord before, just ahead of the change, isn't the new chord's beat.
        (!tone || place.abs === target.abs);
      if (onStrong) lastStrong = strong;
      const strongBeat = onStrong
        ? { unit: target.unit, beat: strong - target.start, hit: tone }
        : null;

      let verdict: NoteVerdict = "free";
      let perfect = false;
      let landing = false;
      if (tally) {
        const repeat = tally.recent.length >= REPEATS_ALLOWED && tally.recent.every((p) => p === pc);
        tally.recent = [...tally.recent, pc].slice(-REPEATS_ALLOWED);
        const capped = tally.hits >= Math.ceil(units[place.unit].beats * HITS_PER_BEAT);
        if (role === "outside" || (strongBeat && !tone)) {
          if (tally.misses < MISSES_PER_CHORD) {
            tally.misses += 1;
            verdict = "miss";
          }
        } else if (tone) {
          landing = !tally.landed;
          perfect = landing && attack.beat - place.start <= LANDING_BEATS;
          tally.landed = true;
          // A strong beat is one note at most: a run up the scale before it doesn't use it up.
          if (!repeat && (!capped || strongBeat)) {
            tally.hits += 1;
            verdict = "hit";
          }
        } else if (!heldOver && !repeat && !capped) {
          // A note of the scale between the strong beats.
          tally.hits += 1;
          verdict = "hit";
        }
      }

      const tricks: ChangeTrick[] = [];
      const changed = units[placeOf(place.abs - 1).unit].chord !== units[place.unit].chord;
      if (landing && verdict === "hit" && changed) {
        if (perfect) tricks.push("onTheOne");
        if (
          before &&
          attack.beat - before.beat <= SMOOTH_REACH_BEATS &&
          Math.abs(midi - before.midi) <= SMOOTH_SEMITONES
        ) {
          tricks.push("smooth");
        }
      }
      events.push({
        type: "note",
        unit: place.unit,
        pc,
        midi,
        role,
        degree: tone ? degreeLabel(units[place.unit].chord, pc) : "",
        lands: tally !== null && tone,
        verdict,
        weak: verdict === "hit" && isGuideTone(role),
        perfect: verdict === "hit" && perfect,
        landing: landing && verdict === "hit",
        tricks,
        strongBeat,
      });
    }

    const graceBeats = SETTLE_GRACE_MS / frame.msPerBeat;
    for (;;) {
      const place = placeOf(settledThrough + 1);
      if (frame.beat < place.end + graceBeats) break;
      events.push({ type: "settle", unit: place.unit, landed: tallies.get(place.abs)?.landed ?? false });
      tallies.delete(place.abs);
      settledThrough = place.abs;
    }

    const now = locate(frame.beat);
    const clock =
      now.abs < 0
        ? { type: "clock" as const, unit: null, beatsLeft: Math.ceil(-frame.beat) }
        : { type: "clock" as const, unit: now.unit, beatsLeft: Math.max(1, Math.ceil(now.end - frame.beat)) };
    const clockKey = `${clock.unit}|${clock.beatsLeft}`;
    if (clockKey !== lastClock) {
      lastClock = clockKey;
      events.push(clock);
    }
    return events;
  };

  return { feed, reset };
};

export type ChangesJudge = ReturnType<typeof createChangesJudge>;
