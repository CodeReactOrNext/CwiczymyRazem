import { getChordTones } from "feature/exercisePlan/chords/chordTones";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

/**
 * Degrees a round can ask for. The root is deliberately absent — naming the note
 * a chord is already called is not a question.
 */
export type ChordDegree = "3" | "5" | "6" | "7" | "9" | "11" | "13";

const ORDINALS: Record<ChordDegree, string> = {
  "3": "3rd",
  "5": "5th",
  "6": "6th",
  "7": "7th",
  "9": "9th",
  "11": "11th",
  "13": "13th",
};

/** Semitones above the root. The tensions sit in the same place in every quality. */
const TENSION_SEMITONES: Record<"9" | "11" | "13", number> = { "9": 2, "11": 5, "13": 9 };

const isTension = (degree: ChordDegree): degree is "9" | "11" | "13" => degree in TENSION_SEMITONES;

/**
 * Chromatic function shorthand, keyed by semitones above the root — the language
 * a player thinks in on the neck ("the ♭7 of this chord"), rather than the note
 * name it happens to land on.
 */
const FUNCTIONS: Record<number, string> = {
  1: "♭2",
  2: "2",
  3: "♭3",
  4: "3",
  5: "4",
  6: "♭5",
  7: "5",
  8: "♯5",
  9: "6",
  10: "♭7",
  11: "7",
};

/**
 * How the prompt names the degree it's asking for. The two are different drills
 * wearing the same mechanics:
 *   - "ordinal" ("3rd", "7th") hides the quality, so the chord symbol has to be
 *     read before the answer can be worked out — the theory test.
 *   - "function" ("♭3", "♭7") states it, the way Solo and most players talk about
 *     the neck. The thinking moves from "is this chord minor?" to "where does the
 *     ♭3 sit from here?", which is the more useful question once the quality is
 *     already understood.
 */
export type DegreeLabelStyle = "ordinal" | "function";

export interface ChordDegreeRound {
  /** Chord name as the prompt shows it, e.g. "Am7". */
  chord: string;
  degree: ChordDegree;
  /** Semitones above the chord root — what the function label is derived from. */
  semitones: number;
  /** The note that degree lands on — the answer, hidden until it's played. */
  target: string;
}

/** The prompt's degree label in the requested language. */
export function degreeLabel(round: ChordDegreeRound, style: DegreeLabelStyle): string {
  if (style === "ordinal") return ORDINALS[round.degree];
  // Tensions are already named by their function; only the chord tones need the
  // ordinal ("3rd") swapping for the chromatic shorthand ("♭3").
  return isTension(round.degree) ? round.degree : FUNCTIONS[round.semitones] ?? ORDINALS[round.degree];
}

/**
 * Every round a chord can be asked: the degrees its own formula spells, plus the
 * tensions that don't collide with them. Chords with a major 3rd take the 9th and
 * the 13th — their natural 11th sits a semitone above that 3rd, the classic avoid
 * note — while minor chords take the 9th and the 11th. A degree the chord doesn't
 * have (a 7th on a triad) simply produces no round, so the pools below can list
 * degrees freely and let each chord take what applies to it.
 */
export function chordDegreeRounds(
  chords: readonly string[],
  degrees: readonly ChordDegree[],
): ChordDegreeRound[] {
  return chords.flatMap((chord) => {
    const { root, tones, labels } = getChordTones(chord);
    const thirdIndex = labels.indexOf("3");
    const thirdSemitones = thirdIndex >= 0 ? (tones[thirdIndex] - root + 12) % 12 : null;
    const allowedTensions: ChordDegree[] =
      thirdSemitones === 3 ? ["9", "11"] : thirdSemitones === 4 ? ["9", "13"] : [];

    return degrees.flatMap<ChordDegreeRound>((degree) => {
      if (isTension(degree)) {
        if (!allowedTensions.includes(degree)) return [];
        const semitones = TENSION_SEMITONES[degree];
        return [{ chord, degree, semitones, target: NOTES[(root + semitones) % 12] }];
      }
      const index = labels.indexOf(degree);
      if (index < 0) return [];
      return [{ chord, degree, semitones: (tones[index] - root + 12) % 12, target: NOTES[tones[index]] }];
    });
  });
}

export interface ChordDegreeHuntConfig {
  id: string;
  title: string;
  description: string;
  addedAt: string;
  difficulty: Exercise["difficulty"];
  timeInMinutes: number;
  /** Chord names, spelled the way the prompt should read them: "Am7", "Cmaj7". */
  chords: string[];
  /** Degrees in play; each chord takes the ones that apply to it. */
  degrees: ChordDegree[];
  /** How the prompt names the degree. Defaults to "ordinal". */
  degreeLabels?: DegreeLabelStyle;
  /** Seconds per round, or 0 for a drill that waits for the answer instead. */
  rotateSeconds: number;
  /** "solved" holds each chord until it's played right. Defaults to "timer". */
  advanceOn?: "timer" | "solved";
  instructions: string[];
  tips: string[];
  whyItMatters: string;
}

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

function rollRound(rounds: readonly ChordDegreeRound[], exclude?: string): ChordDegreeRound {
  let next: ChordDegreeRound;
  do {
    next = pick(rounds);
  } while (rounds.length > 1 && `${next.chord}-${next.degree}` === exclude);
  return next;
}

/**
 * Builds one "here's a chord, play its Nth" drill. The prompt names the chord and
 * a degree; the note that degree lands on stays hidden in `customGoal` until the
 * mic hears it.
 *
 * `degreeLabels` decides how hard the deduction is. Under "ordinal" the quality
 * has to be read off the chord symbol — the 3rd of Am7 is C, the 3rd of A7 is C#,
 * and the prompt looks identical either way. Under "function" the label spells it
 * out ("♭3"), leaving the neck work but not the theory.
 *
 * Every variant is the same game with a different chord pool and degree set, so
 * they share this factory rather than copying the config around. Rides the
 * existing "interval" hunt mode: same prompt card, same detection, no new UI.
 */
export function createChordDegreeHuntExercise(config: ChordDegreeHuntConfig): Exercise {
  const rounds = chordDegreeRounds(config.chords, config.degrees);

  // Module-level per exercise: the round has to survive re-renders and stay put
  // between rotations, exactly like the other rotating hunts.
  let current = rollRound(rounds);

  const labelStyle = config.degreeLabels ?? "ordinal";
  const promptFor = (round: ChordDegreeRound) => ({
    title: round.chord,
    subtitle: degreeLabel(round, labelStyle),
  });

  return {
    id: config.id,
    addedAt: config.addedAt,
    isHiddenFromLanding: true,
    title: config.title,
    description: config.description,
    difficulty: config.difficulty,
    category: "theory",
    timeInMinutes: config.timeInMinutes,
    instructions: config.instructions,
    tips: config.tips,
    whyItMatters: config.whyItMatters,
    metronomeSpeed: null,
    relatedSkills: ["chords", "harmony", "music_theory"],
    disableBackingTrack: true,
    customGoal: current.target,
    customGoalPrompt: promptFor(current),
    customGoalDescription: "Play that degree of the chord (any octave)",
    rollHuntTarget: () => {
      current = rollRound(rounds, `${current.chord}-${current.degree}`);
      return { goal: current.target, prompt: promptFor(current) };
    },
    noteHuntConfig: {
      rotateSeconds: config.rotateSeconds,
      mode: "interval",
      advanceOn: config.advanceOn ?? "timer",
    },
  };
}
