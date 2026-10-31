import type {
  TablatureBeat,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";
import type { Instrument } from "utils/audio/tunings";
import { z } from "zod";

import {
  TAB_LIMITS,
  type TabIssue,
  type TabValidation,
  TUPLET_DENOMINATORS,
  validateTablature,
} from "./validateTablature";

/**
 * The tab format AI clients read and write — written the way a musician
 * names things ("eighth", "dotted", "hammer-on", "4/4"), not the way the app
 * stores them (durations in quarter notes, `isHammerOn` flags, numeric codes).
 * tabToMeasures / measuresToTab map it onto the app's TablatureMeasure and
 * back; everything the app can play has exactly one spelling here.
 */

export const NOTE_VALUES = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  "thirty-second": 0.125,
  "sixty-fourth": 0.0625,
} as const;
type NoteValue = keyof typeof NOTE_VALUES;
const NOTE_VALUE_NAMES = Object.keys(NOTE_VALUES) as [
  NoteValue,
  ...NoteValue[],
];

const DOT_FACTORS = { 0: 1, 1: 1.5, 2: 1.75 } as const;

/** Note techniques that are a plain on/off flag in the app. */
const TECHNIQUE_FLAGS = {
  "hammer-on": "isHammerOn",
  "pull-off": "isPullOff",
  tap: "isTap",
  vibrato: "isVibrato",
  "palm-mute": "isPalmMute",
  "let-ring": "isLetRing",
  staccato: "isStaccato",
  accent: "isAccented",
  ghost: "isGhost",
  "dead-note": "isDead",
} as const satisfies Record<string, keyof TablatureNote>;
type Technique = keyof typeof TECHNIQUE_FLAGS;
const TECHNIQUES = Object.keys(TECHNIQUE_FLAGS) as [Technique, ...Technique[]];

const HARMONICS = ["natural", "artificial", "tapped", "pinch", "semi"] as const;
const SLIDES_IN = ["from-below", "from-above"] as const;
// slideOut 3 ("slide to") has no notation of its own and plays as a legato slide.
const SLIDES_OUT = ["shift", "legato"] as const;

const timeSignature = z
  .string()
  .regex(/^\d{1,2}\/\d{1,2}$/, 'Write it like "4/4" or "6/8"');

const noteSchema = z
  .object({
    string: z.number().describe("1 = high e … 6 = low E; bass: 1 = G … 4 = E"),
    fret: z.number().describe("0 = open"),
    techniques: z.array(z.enum(TECHNIQUES)).max(6).optional(),
    bend: z
      .object({
        semitones: z
          .number()
          .min(0.5)
          .max(3)
          .describe("1 = half, 2 = whole step"),
        prebent: z.boolean().optional(),
        release: z.boolean().optional(),
      })
      .strict()
      .optional(),
    slideIn: z.enum(SLIDES_IN).optional(),
    slideOut: z.enum(SLIDES_OUT).optional(),
    harmonic: z.enum(HARMONICS).optional(),
  })
  .strict();

const beatSchema = z
  .object({
    duration: z.enum(NOTE_VALUE_NAMES),
    dots: z.number().int().min(1).max(2).optional().describe("1 = dotted"),
    tuplet: z
      .number()
      .int()
      .min(3)
      .max(12)
      .optional()
      .describe("3 = triplet, on every note of the group"),
    notes: z
      .array(noteSchema)
      .min(1)
      .max(TAB_LIMITS.maxNotesPerBeat)
      .optional()
      .describe("One note, or a chord: one per string"),
    rest: z.literal(true).optional(),
    pick: z.enum(["down", "up"]).optional(),
    chord: z.string().max(20).optional(),
  })
  .strict();

const measureSchema = z
  .object({
    timeSignature: timeSignature.optional().describe("Only where it changes"),
    beats: z.array(beatSchema).min(1).max(TAB_LIMITS.maxBeatsPerMeasure),
  })
  .strict();

export const tabSchema = z
  .object({
    timeSignature: timeSignature.optional().describe('Default "4/4"'),
    measures: z.array(measureSchema).min(1).max(TAB_LIMITS.maxMeasures),
  })
  .strict();

export type TabJson = z.infer<typeof tabSchema>;
type BeatJson = z.infer<typeof beatSchema>;
type NoteJson = z.infer<typeof noteSchema>;

const parseTimeSignature = (value: string): [number, number] => {
  const [beats, unit] = value.split("/").map(Number);
  return [beats, unit];
};

function noteToStored(note: NoteJson): TablatureNote {
  const stored: TablatureNote = { string: note.string, fret: note.fret };
  for (const technique of note.techniques ?? []) {
    stored[TECHNIQUE_FLAGS[technique]] = true;
  }
  if (note.bend) {
    stored.isBend = true;
    stored.bendSemitones = note.bend.semitones;
    if (note.bend.prebent) stored.isPreBend = true;
    if (note.bend.release) stored.isRelease = true;
  }
  if (note.slideIn) stored.slideIn = SLIDES_IN.indexOf(note.slideIn) + 1;
  if (note.slideOut) stored.slideOut = SLIDES_OUT.indexOf(note.slideOut) + 1;
  if (note.harmonic) stored.harmonicType = HARMONICS.indexOf(note.harmonic) + 1;
  return stored;
}

/**
 * The tab as the app stores it, plus the problems only this format can have
 * (a beat that is both a rest and notes, a tuplet the notation can't draw).
 */
export function tabToMeasures(tab: TabJson): {
  measures: TablatureMeasure[];
  issues: TabIssue[];
} {
  const issues: TabIssue[] = [];
  let current = parseTimeSignature(tab.timeSignature ?? "4/4");
  const measures = tab.measures.map((measure, measureIndex) => {
    if (measure.timeSignature)
      current = parseTimeSignature(measure.timeSignature);
    return {
      timeSignature: current,
      beats: measure.beats.map((beat, beatIndex): TablatureBeat => {
        const at = { measure: measureIndex + 1, beat: beatIndex + 1 };
        if (beat.rest && beat.notes) {
          issues.push({
            ...at,
            message: "a beat is either a rest or notes, not both",
          });
        } else if (!beat.rest && !beat.notes) {
          issues.push({
            ...at,
            message: 'a beat needs notes, or "rest": true',
          });
        }
        const tupletOf = beat.tuplet ? TUPLET_DENOMINATORS[beat.tuplet] : 1;
        if (!tupletOf) {
          issues.push({
            ...at,
            message: `tuplet ${beat.tuplet} isn't supported — use one of ${Object.keys(TUPLET_DENOMINATORS).join(", ")}`,
          });
        }
        const written =
          NOTE_VALUES[beat.duration] *
          DOT_FACTORS[(beat.dots ?? 0) as 0 | 1 | 2];
        const stored: TablatureBeat = {
          duration:
            beat.tuplet && tupletOf
              ? (written * tupletOf) / beat.tuplet
              : written,
          notes: beat.rest ? [] : (beat.notes ?? []).map(noteToStored),
        };
        if (beat.tuplet && tupletOf) stored.tuplet = beat.tuplet;
        if (beat.pick) stored.pickStroke = beat.pick;
        if (beat.chord) stored.chordName = beat.chord;
        return stored;
      }),
    };
  });
  return { measures, issues };
}

/** Maps the tab and runs every check, issues of the format first. */
export function checkTab(
  tab: TabJson,
  instrument: Instrument = "guitar",
): { measures: TablatureMeasure[]; validation: TabValidation } {
  const { measures, issues } = tabToMeasures(tab);
  const validation = validateTablature(measures, instrument);
  return {
    measures,
    validation: {
      ...validation,
      ok: validation.ok && issues.length === 0,
      errors: [...issues, ...validation.errors],
    },
  };
}

/** The closest written note value to a sounding duration inside `tuplet`. */
function closestValue(duration: number, tuplet: number | undefined) {
  const tupletOf = tuplet ? TUPLET_DENOMINATORS[tuplet] : undefined;
  const written =
    tuplet && tupletOf ? (duration * tuplet) / tupletOf : duration;
  let best = { duration: "quarter" as NoteValue, dots: 0, error: Infinity };
  for (const name of NOTE_VALUE_NAMES) {
    for (const dots of [0, 1, 2] as const) {
      const error = Math.abs(NOTE_VALUES[name] * DOT_FACTORS[dots] - written);
      if (error < best.error) best = { duration: name, dots, error };
    }
  }
  return { ...best, tuplet: tuplet && tupletOf ? tuplet : undefined };
}

/**
 * The written note value behind a stored, sounding duration. Older tabs store
 * triplets as their length alone (1/3, 1/6) without `tuplet` — those come out
 * as the triplets they are.
 */
function writtenValue(beat: TablatureBeat) {
  let best = closestValue(beat.duration, beat.tuplet);
  if (!beat.tuplet && best.error > 1e-3) {
    const triplet = closestValue(beat.duration, 3);
    if (triplet.error < best.error) best = triplet;
  }
  return {
    duration: best.duration,
    ...(best.dots ? { dots: best.dots } : {}),
    ...(best.tuplet ? { tuplet: best.tuplet } : {}),
  };
}

function noteToJson(note: TablatureNote): NoteJson {
  const techniques = TECHNIQUES.filter(
    (technique) => note[TECHNIQUE_FLAGS[technique]],
  );
  const bent = note.isBend || note.isPreBend || note.isRelease;
  return {
    string: note.string,
    fret: note.fret,
    ...(techniques.length ? { techniques } : {}),
    ...(bent
      ? {
          bend: {
            semitones: Math.min(3, Math.max(0.5, note.bendSemitones ?? 1)),
            ...(note.isPreBend ? { prebent: true } : {}),
            ...(note.isRelease ? { release: true } : {}),
          },
        }
      : {}),
    ...(note.slideIn && SLIDES_IN[note.slideIn - 1]
      ? { slideIn: SLIDES_IN[note.slideIn - 1] }
      : {}),
    ...(note.slideOut
      ? { slideOut: SLIDES_OUT[Math.min(note.slideOut, 2) - 1] }
      : {}),
    ...(note.harmonicType && HARMONICS[note.harmonicType - 1]
      ? { harmonic: HARMONICS[note.harmonicType - 1] }
      : {}),
  };
}

/**
 * A stored tab in this format. What the format has no words for — the app's
 * own playback data (midiNote, bend curves, loop-only measures) — is left out.
 */
export function measuresToTab(measures: TablatureMeasure[]): TabJson {
  const signature = (measure: TablatureMeasure) =>
    `${measure.timeSignature[0]}/${measure.timeSignature[1]}`;
  const first = measures[0] ? signature(measures[0]) : "4/4";
  let current = first;
  return {
    timeSignature: first,
    measures: measures.map((measure) => {
      const own = signature(measure);
      const changed = own !== current;
      current = own;
      return {
        ...(changed ? { timeSignature: own } : {}),
        beats: measure.beats.map(
          (beat): BeatJson => ({
            ...writtenValue(beat),
            ...(beat.notes?.length
              ? { notes: beat.notes.map(noteToJson) }
              : { rest: true as const }),
            ...(beat.pickStroke ? { pick: beat.pickStroke } : {}),
            ...(beat.chordName ? { chord: beat.chordName } : {}),
          }),
        ),
      };
    }),
  };
}

/** The symbols a plain-text tab uses, in the order the legend lists them. */
const SYMBOLS = {
  hammer: "h hammer-on",
  pull: "p pull-off",
  tap: "t tap",
  bend: "b bend",
  prebend: "pb pre-bend",
  release: "r release",
  vibrato: "~ vibrato",
  slide: "/ \\ slide",
  dead: "x dead note",
  ghost: "( ) ghost note",
  harmonic: "< > harmonic",
} as const;
type Symbol = keyof typeof SYMBOLS;

/** One note as it's written in a plain-text tab, and the symbols it used. */
function noteText(note: TablatureNote, used: Set<Symbol>) {
  let text = note.isDead ? "x" : String(note.fret);
  if (note.isDead) used.add("dead");
  if (note.harmonicType) {
    text = `<${text}>`;
    used.add("harmonic");
  }
  if (note.isGhost) {
    text = `(${text})`;
    used.add("ghost");
  }
  if (note.isHammerOn) {
    text = `h${text}`;
    used.add("hammer");
  }
  if (note.isPullOff) {
    text = `p${text}`;
    used.add("pull");
  }
  if (note.isTap) {
    text = `t${text}`;
    used.add("tap");
  }
  if (note.slideIn) {
    text = `${note.slideIn === 2 ? "\\" : "/"}${text}`;
    used.add("slide");
  }
  if (note.isPreBend) {
    text += "pb";
    used.add("prebend");
  } else if (note.isBend) {
    text += "b";
    used.add("bend");
  }
  if (note.isRelease) {
    text += "r";
    used.add("release");
  }
  if (note.slideOut) {
    text += "/";
    used.add("slide");
  }
  if (note.isVibrato) {
    text += "~";
    used.add("vibrato");
  }
  return text;
}

const STRING_NAMES: Record<Instrument, string[]> = {
  guitar: ["e", "B", "G", "D", "A", "E"],
  bass: ["G", "D", "A", "E"],
};

const MEASURES_PER_LINE = 4;

/**
 * The tab as plain text, the way guitarists write tabs — what a client shows
 * the player instead of the JSON, with a legend of the symbols it uses.
 * Rhythm isn't in it (a text tab can't hold it); the app shows the notation.
 */
export function renderAsciiTab(
  measures: TablatureMeasure[],
  instrument: Instrument = "guitar",
): string {
  const names = STRING_NAMES[instrument];
  const used = new Set<Symbol>();
  const systems: string[] = [];
  for (let start = 0; start < measures.length; start += MEASURES_PER_LINE) {
    const rows = names.map((name) => `${name}|`);
    let chords = "  ";
    for (const measure of measures.slice(start, start + MEASURES_PER_LINE)) {
      for (const beat of measure.beats) {
        const cells = names.map((_, index) => {
          const note = beat.notes?.find((n) => n.string === index + 1);
          return note ? noteText(note, used) : "";
        });
        const width = Math.max(1, ...cells.map((cell) => cell.length));
        cells.forEach((cell, index) => {
          rows[index] += `-${cell.padEnd(width, "-")}`;
        });
        chords += ` ${(beat.chordName ?? "").padEnd(width)}`;
      }
      rows.forEach((_, index) => (rows[index] += "-|"));
      chords += "  ";
    }
    systems.push(
      (chords.trim() ? [chords.trimEnd(), ...rows] : rows).join("\n"),
    );
  }
  const legend = (Object.keys(SYMBOLS) as Symbol[])
    .filter((symbol) => used.has(symbol))
    .map((symbol) => SYMBOLS[symbol]);
  const text = systems.join("\n\n");
  return legend.length ? `${text}\n\n${legend.join(" · ")}` : text;
}
