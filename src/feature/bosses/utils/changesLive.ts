import type { NoteRole } from "./changesHarmony";
import type { ChangesEvent, NoteVerdict } from "./changesJudge";

/** A note the player played, as the board shows it. */
export interface PlayedNote {
  pc: number;
  /** Its pitch as a MIDI note, in the names of the shapes (a detuned guitar shifted back). */
  midi: number;
  role: NoteRole;
  /** Its degree in the chord it was played on ("b3"); empty for a passing or a wrong note. */
  degree: string;
  /** The fight counted it — a hit or a miss, not a free one. */
  counted: boolean;
  /** What the fight made of it: a note of the scale is a hit between the strong beats and a miss on one. */
  verdict: NoteVerdict;
  /** Bumped with every note, so the same note twice still flashes. */
  tick: number;
}

/**
 * Why the fight bit: a note outside the scale, a note other than one of the
 * chord's first on a strong beat, or a chord let go by without one of its tones.
 */
export type MissReason = "outside" | "strongBeat" | "silent";

/** A bite, as the board explains it. */
export interface ChangesMiss {
  reason: MissReason;
  /** The chord it was against, by its index in the pass. */
  unit: number;
  /** The note played; null for a chord let go by. */
  pc: number | null;
  /** The strong beat it was played on, in beats into the chord; null off one. */
  beat: number | null;
  /** Bumped with every bite, so the same one twice still shows anew. */
  tick: number;
}

/** What the changeling's board shows between calls. */
export interface ChangesLive {
  /** The chord being played, by its index in the pass; null before the first. */
  unit: number | null;
  /** Whole beats until the next change (or, in the count-in, the first chord). */
  beatsLeft: number;
  /** Bumped on every change of chord — the mask turns over. */
  changeTick: number;
  /** Chords a tone of has been heard in, not yet called — the one being played, or the next one, played early. */
  landed: Readonly<Record<number, true>>;
  /** Chords this pass has called: landed (true) or let go by (false). */
  results: Readonly<Record<number, boolean>>;
  /** Strong beats played on this pass, by strongBeatKey: a chord tone (true) or another note (false). */
  strongBeats: Readonly<Record<string, boolean>>;
  /** The next chord's first strong beat, played just ahead of the change — kept when the chord comes in. */
  earlyStrongBeat: string | null;
  /** The last note heard. */
  lastNote: PlayedNote | null;
  /** The last few notes, newest last. */
  trail: readonly PlayedNote[];
  /** The last bite and why. */
  lastMiss: ChangesMiss | null;
}

export const IDLE_CHANGES: ChangesLive = {
  unit: null,
  beatsLeft: 0,
  changeTick: 0,
  landed: {},
  results: {},
  strongBeats: {},
  earlyStrongBeat: null,
  lastNote: null,
  trail: [],
  lastMiss: null,
};

/** Notes the board keeps in its trail. */
export const TRAIL_LENGTH = 6;

/** A strong beat's key in ChangesLive.strongBeats: the chord's index in the pass and the beat in it. */
export const strongBeatKey = (unit: number, beat: number) => `${unit}:${beat}`;

const without = <T,>(record: Readonly<Record<number, T>>, key: number) => {
  if (!(key in record)) return record;
  const { [key]: _gone, ...rest } = record;
  return rest;
};

const missTick = (live: ChangesLive) => (live.lastMiss?.tick ?? 0) + 1;

/** The strong beats with a chord's own let go — it is being played again. */
const withoutChord = (strongBeats: Readonly<Record<string, boolean>>, unit: number) => {
  const prefix = `${unit}:`;
  const keys = Object.keys(strongBeats);
  if (!keys.some((key) => key.startsWith(prefix))) return strongBeats;
  return Object.fromEntries(keys.filter((key) => !key.startsWith(prefix)).map((key) => [key, strongBeats[key]]));
};

/**
 * The board's state after one event of the judge: where the run is, which
 * chords were sounded and which were called, the strong beats played on and
 * the notes heard. Entering a chord forgets its calls from the pass before —
 * what was played early into it stays.
 */
export const nextChangesLive = (live: ChangesLive, event: ChangesEvent): ChangesLive => {
  switch (event.type) {
    case "clock": {
      const entered = event.unit !== null && event.unit !== live.unit;
      let { strongBeats } = live;
      if (entered && event.unit !== null) {
        strongBeats = withoutChord(strongBeats, event.unit);
        const early = live.earlyStrongBeat;
        if (early !== null && early in live.strongBeats) {
          strongBeats = { ...strongBeats, [early]: live.strongBeats[early] };
        }
      }
      return {
        ...live,
        unit: event.unit,
        beatsLeft: event.beatsLeft,
        changeTick: live.changeTick + (entered ? 1 : 0),
        results: entered && event.unit !== null ? without(live.results, event.unit) : live.results,
        strongBeats,
        earlyStrongBeat: entered ? null : live.earlyStrongBeat,
      };
    }
    case "note": {
      const played: PlayedNote = {
        pc: event.pc,
        midi: event.midi,
        role: event.role,
        degree: event.degree,
        counted: event.verdict !== "free",
        verdict: event.verdict,
        tick: (live.lastNote?.tick ?? 0) + 1,
      };
      const strong = event.strongBeat;
      const key = strong && strongBeatKey(strong.unit, strong.beat);
      // A miss is a note outside the scale, or else a wrong one on a strong beat.
      const miss: ChangesMiss | null =
        event.verdict !== "miss"
          ? null
          : event.role === "outside" || !strong
            ? { reason: "outside", unit: event.unit, pc: event.pc, beat: null, tick: missTick(live) }
            : { reason: "strongBeat", unit: strong.unit, pc: event.pc, beat: strong.beat, tick: missTick(live) };
      return {
        ...live,
        lastMiss: miss ?? live.lastMiss,
        lastNote: played,
        trail: [...live.trail, played].slice(-TRAIL_LENGTH),
        landed: event.lands ? { ...live.landed, [event.unit]: true } : live.landed,
        strongBeats: strong && key ? { ...live.strongBeats, [key]: strong.hit } : live.strongBeats,
        // Played into the next chord, ahead of the change.
        earlyStrongBeat: strong && key && strong.unit !== live.unit ? key : live.earlyStrongBeat,
      };
    }
    case "settle":
      return {
        ...live,
        lastMiss: event.landed
          ? live.lastMiss
          : { reason: "silent", unit: event.unit, pc: null, beat: null, tick: missTick(live) },
        results: { ...live.results, [event.unit]: event.landed },
        landed: without(live.landed, event.unit),
      };
  }
  return live;
};
