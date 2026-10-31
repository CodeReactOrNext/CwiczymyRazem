import type {
  TablatureBeat,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";
import { tablatureToAlphaTex } from "feature/exercisePlan/views/PracticeSession/components/AlphaTabScoreViewer/tablatureToAlphaTex";
import type { Instrument } from "utils/audio/tunings";

/**
 * Checks a tab written by an AI client before it is saved as an exercise.
 *
 * The rules mirror what the app can actually play: tablatureToAlphaTex turns
 * every measure into one alphaTex bar, so a measure whose beats don't add up
 * to its time signature desyncs the notation (#741), and a duration that is
 * not a plain, dotted or tupleted note value silently snaps to the nearest one.
 * Errors block the save; warnings are passed back so the model can decide.
 *
 * Every message says where it is (`measure 3, beat 2`) — the model fixes its
 * own tab from these, so they have to point at the exact spot.
 */

export const TAB_LIMITS = {
  maxMeasures: 64,
  maxBeatsPerMeasure: 64,
  maxNotesPerBeat: 6,
  minString: 1,
  maxString: 6,
  maxFret: 24,
} as const;

// Kept in step with tablatureToAlphaTex: the note values alphaTex has a code for,
// and the tuplets it knows a default denominator for.
const DURATION_CODES = [1, 2, 4, 8, 16, 32, 64];
const TUPLET_DENOMINATORS: Record<number, number> = {
  3: 2,
  5: 4,
  6: 4,
  7: 4,
  9: 8,
  10: 8,
  11: 8,
  12: 8,
};
const DENOMINATORS = [1, 2, 4, 8, 16, 32];
const CAPACITY_EPS = 1e-2;
const DURATION_EPS = 1e-3;

export interface TabIssue {
  /** 1-based, absent for issues about the whole tab. */
  measure?: number;
  beat?: number;
  message: string;
}

export interface TabValidation {
  ok: boolean;
  errors: TabIssue[];
  warnings: TabIssue[];
  stats: { measures: number; beats: number; notes: number };
}

/** A measure's length in quarter notes, as its time signature declares it. */
export const measureCapacity = ([numerator, denominator]: [number, number]) =>
  numerator * (4 / denominator);

const measureLength = (beats: TablatureBeat[]) =>
  beats.reduce((sum, beat) => sum + beat.duration, 0);

/** Whether a sounding duration is a plain, dotted or double-dotted note value. */
export const isPlayableDuration = (duration: number, tuplet?: number) => {
  if (!(duration > 0)) return false;
  const tupletDenominator = tuplet ? TUPLET_DENOMINATORS[tuplet] : undefined;
  if (tuplet && !tupletDenominator) return false;
  const notated = tupletDenominator
    ? duration * (tuplet! / tupletDenominator)
    : duration;
  return DURATION_CODES.some((code) => {
    const base = 4 / code;
    return [1, 1.5, 1.75].some(
      (dot) => Math.abs(notated - base * dot) < DURATION_EPS,
    );
  });
};

const isInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

const round = (value: number) => Math.round(value * 1000) / 1000;

/** Strings per instrument, and how the error names the outer ones. */
const STRINGS: Record<Instrument, { count: number; range: string }> = {
  guitar: { count: 6, range: "1–6 (1 = high e, 6 = low E)" },
  bass: { count: 4, range: "1–4 on bass (1 = G, 4 = low E)" },
};

function checkNote(
  note: TablatureNote,
  at: { measure: number; beat: number },
  errors: TabIssue[],
  warnings: TabIssue[],
  instrument: Instrument,
) {
  const where = `string ${note.string}, fret ${note.fret}`;
  const strings = STRINGS[instrument];
  if (
    !isInt(note.string) ||
    note.string < TAB_LIMITS.minString ||
    note.string > strings.count
  ) {
    errors.push({
      ...at,
      message: `string must be a whole number ${strings.range}, got ${note.string}`,
    });
  }
  if (!isInt(note.fret) || note.fret < 0 || note.fret > TAB_LIMITS.maxFret) {
    errors.push({
      ...at,
      message: `fret must be a whole number 0–${TAB_LIMITS.maxFret}, got ${note.fret}`,
    });
  }
  if (note.isHammerOn && note.isPullOff) {
    errors.push({
      ...at,
      message: `${where}: a note can't be both a hammer-on and a pull-off`,
    });
  }
  if (
    note.bendSemitones !== undefined &&
    !(note.isBend || note.isPreBend || note.isRelease)
  ) {
    errors.push({
      ...at,
      message: `${where}: bendSemitones needs isBend, isPreBend or isRelease`,
    });
  }
  if (
    note.bendSemitones !== undefined &&
    !(note.bendSemitones > 0 && note.bendSemitones <= 3)
  ) {
    errors.push({
      ...at,
      message: `${where}: bendSemitones must be above 0 and at most 3`,
    });
  }
  if (
    note.dynamics !== undefined &&
    !(note.dynamics >= 0 && note.dynamics <= 1)
  ) {
    errors.push({
      ...at,
      message: `${where}: dynamics must be between 0 and 1`,
    });
  }
  if (
    note.harmonicType !== undefined &&
    !(
      isInt(note.harmonicType) &&
      note.harmonicType >= 0 &&
      note.harmonicType <= 5
    )
  ) {
    errors.push({ ...at, message: `${where}: harmonicType must be 0–5` });
  }
  if (
    note.slideIn !== undefined &&
    !(isInt(note.slideIn) && note.slideIn >= 0 && note.slideIn <= 2)
  ) {
    errors.push({ ...at, message: `${where}: slideIn must be 0–2` });
  }
  if (
    note.slideOut !== undefined &&
    !(isInt(note.slideOut) && note.slideOut >= 0 && note.slideOut <= 3)
  ) {
    errors.push({ ...at, message: `${where}: slideOut must be 0–3` });
  }
  if (note.isDead && note.fret > 0 && (note.isBend || note.isVibrato)) {
    warnings.push({
      ...at,
      message: `${where}: a dead note has no pitch to bend or vibrate`,
    });
  }
}

export function validateTablature(
  measures: TablatureMeasure[],
  instrument: Instrument = "guitar",
): TabValidation {
  const stringCount = STRINGS[instrument].count;
  const errors: TabIssue[] = [];
  const warnings: TabIssue[] = [];
  const stats = { measures: measures.length, beats: 0, notes: 0 };

  if (measures.length === 0) {
    errors.push({ message: "the tab has no measures" });
  }
  if (measures.length > TAB_LIMITS.maxMeasures) {
    errors.push({
      message: `at most ${TAB_LIMITS.maxMeasures} measures — loop a short phrase instead of writing it out`,
    });
  }

  // The previous note on each string, to tell whether a hammer-on or pull-off
  // has a note to start from — the app flags the note you arrive at.
  const lastFretOnString = new Map<number, number>();

  measures.forEach((measure, measureIndex) => {
    const m = measureIndex + 1;
    const beats = measure.beats ?? [];
    const timeSignature = measure.timeSignature;

    if (
      !Array.isArray(timeSignature) ||
      !isInt(timeSignature[0]) ||
      timeSignature[0] < 1 ||
      timeSignature[0] > 32 ||
      !DENOMINATORS.includes(timeSignature[1])
    ) {
      errors.push({
        measure: m,
        message: `timeSignature must be [beats, noteValue] like [4, 4] or [6, 8], got ${JSON.stringify(timeSignature)}`,
      });
    }
    if (beats.length === 0) {
      errors.push({
        measure: m,
        message:
          "the measure has no beats — use a beat with notes: [] for a rest",
      });
    }
    if (beats.length > TAB_LIMITS.maxBeatsPerMeasure) {
      errors.push({
        measure: m,
        message: `at most ${TAB_LIMITS.maxBeatsPerMeasure} beats per measure`,
      });
    }

    beats.forEach((beat, beatIndex) => {
      const at = { measure: m, beat: beatIndex + 1 };
      const notes = beat.notes ?? [];
      stats.beats += 1;
      stats.notes += notes.length;

      if (beat.tuplet !== undefined && !TUPLET_DENOMINATORS[beat.tuplet]) {
        errors.push({
          ...at,
          message: `tuplet ${beat.tuplet} isn't supported — use one of ${Object.keys(TUPLET_DENOMINATORS).join(", ")}`,
        });
      } else if (
        !beat.tuplet &&
        !isPlayableDuration(beat.duration) &&
        isPlayableDuration(beat.duration, 3)
      ) {
        // Plenty of the library writes triplets this way and plays fine — the
        // notation just loses its bracket, so it's worth saying, not refusing.
        warnings.push({
          ...at,
          message: `duration ${round(beat.duration)} is a triplet — add tuplet: 3 so it's notated as one`,
        });
      } else if (!isPlayableDuration(beat.duration, beat.tuplet)) {
        errors.push({
          ...at,
          message: beat.tuplet
            ? `duration ${beat.duration} isn't a ${beat.tuplet}-tuplet note — a triplet eighth is 1/3 (0.333), a triplet sixteenth 1/6 (0.167)`
            : `duration ${beat.duration} isn't a note value — use 4, 2, 1, 0.5, 0.25, 0.125 (quarter = 1) or their dotted versions (1.5, 0.75, …)`,
        });
      }

      if (notes.length > stringCount) {
        errors.push({ ...at, message: `at most ${stringCount} notes in one beat` });
      }
      const strings = notes.map((note) => note.string);
      if (new Set(strings).size !== strings.length) {
        errors.push({
          ...at,
          message:
            "two notes on the same string in one beat — a chord has one note per string",
        });
      }

      notes.forEach((note) => {
        checkNote(note, at, errors, warnings, instrument);
        if ((note.isHammerOn || note.isPullOff) && isInt(note.fret)) {
          const previous = lastFretOnString.get(note.string);
          const kind = note.isHammerOn ? "hammer-on" : "pull-off";
          if (previous === undefined) {
            warnings.push({
              ...at,
              message: `${kind} on string ${note.string} has no earlier note on that string to start from — flag the note you arrive at, not the picked one`,
            });
          } else if (note.isHammerOn && note.fret <= previous) {
            warnings.push({
              ...at,
              message: `hammer-on to fret ${note.fret} from fret ${previous} goes down — that is a pull-off`,
            });
          } else if (note.isPullOff && note.fret >= previous) {
            warnings.push({
              ...at,
              message: `pull-off to fret ${note.fret} from fret ${previous} goes up — that is a hammer-on`,
            });
          }
        }
        if (isInt(note.fret)) lastFretOnString.set(note.string, note.fret);
      });
    });

    if (
      Array.isArray(timeSignature) &&
      DENOMINATORS.includes(timeSignature[1]) &&
      beats.length > 0
    ) {
      const capacity = measureCapacity(timeSignature);
      const total = measureLength(beats);
      if (Math.abs(total - capacity) > CAPACITY_EPS) {
        errors.push({
          measure: m,
          message: `beats add up to ${round(total)} quarter notes but ${timeSignature[0]}/${timeSignature[1]} holds ${capacity} — ${
            total > capacity
              ? "remove notes or change the time signature"
              : "add a rest or change the time signature"
          }`,
        });
      }
    }
  });

  const hasNotes = stats.notes > 0;
  if (measures.length > 0 && !hasNotes) {
    errors.push({
      message: "the tab is all rests — the mic has nothing to score",
    });
  }

  if (errors.length === 0) {
    try {
      tablatureToAlphaTex(measures);
    } catch (error) {
      errors.push({
        message: `the tab can't be rendered: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  return { ok: errors.length === 0, errors, warnings, stats };
}

/** One line per issue, for a tool's text answer. */
export const formatTabIssues = (issues: TabIssue[]): string[] =>
  issues.map((issue) => {
    const place = [
      issue.measure ? `measure ${issue.measure}` : null,
      issue.beat ? `beat ${issue.beat}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    return place ? `${place}: ${issue.message}` : issue.message;
  });
