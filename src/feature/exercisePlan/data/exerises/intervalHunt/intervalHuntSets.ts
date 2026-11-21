import type { IntervalDefinition } from "feature/exercisePlan/intervals/intervalDefinitions";
import { INTERVALS, intervalsByIds, noteAtInterval } from "feature/exercisePlan/intervals/intervalDefinitions";
import type { FretWindow } from "feature/exercisePlan/intervals/intervalWindows";
import { pickIntervalWindow } from "feature/exercisePlan/intervals/intervalWindows";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

// The played half of the Interval Mastery learning path: the same game as
// Note Hunt — Intervals (a root and an interval on screen, the answer played on
// the guitar), narrowed to the intervals one stage of the path has just taught.

const NATURAL_ROOTS = ["C", "D", "E", "F", "G", "A", "B"];

/**
 * Every round is confined to a fresh four-fret window holding both the root and
 * the answer. The mic can't tell strings apart, only octaves, so what the window
 * enforces is the register: the answer has to be played in an octave that sits
 * inside it, not the easiest one anywhere on the neck.
 */
const WINDOW_FRETS = 4;

interface IntervalHuntConfig {
  id: string;
  title: string;
  description: string;
  difficulty: Exercise["difficulty"];
  timeInMinutes: number;
  intervalIds: string[];
  roots?: string[];
  instructions: string[];
  tips: string[];
  whyItMatters: string;
}

interface IntervalRound {
  root: string;
  interval: IntervalDefinition;
  target: string;
  /** The frets this round has to be played in. */
  region: FretWindow;
}

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

function rollRound(
  roots: readonly string[],
  intervals: readonly IntervalDefinition[],
  previous?: IntervalRound,
): IntervalRound {
  let root: string;
  let interval: IntervalDefinition;
  do {
    root = pick(roots);
    interval = pick(intervals);
  } while (roots.length * intervals.length > 1 && `${root}-${interval.id}` === `${previous?.root}-${previous?.interval.id}`);
  const target = noteAtInterval(root, interval.semitones);
  return { root, interval, target, region: pickIntervalWindow(root, target, WINDOW_FRETS, undefined, previous?.region) };
}

function createIntervalHuntExercise(config: IntervalHuntConfig): Exercise {
  const intervals = intervalsByIds(config.intervalIds);
  const roots = config.roots ?? NATURAL_ROOTS;

  // Module-level per exercise: the round has to survive re-renders and stay put
  // between rotations, exactly like the other rotating hunts.
  let current = rollRound(roots, intervals);

  const promptFor = (round: IntervalRound) => ({
    title: round.root,
    subtitle: `${round.interval.name} ↑`,
  });

  return {
    id: config.id,
    addedAt: "2026-11-19",
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
    relatedSkills: ["music_theory", "ear_training"],
    disableBackingTrack: true,
    customGoal: current.target,
    customGoalPrompt: promptFor(current),
    customGoalDescription: "Play the target note inside the highlighted frets",
    customGoalRegion: current.region,
    rollHuntTarget: () => {
      current = rollRound(roots, intervals, current);
      return { goal: current.target, prompt: promptFor(current), region: current.region };
    },
    noteHuntConfig: { rotateSeconds: 12, mode: "interval" },
  };
}

const SHARED_INSTRUCTIONS = [
  "Every round lights up a different four-fret window on the neck. Find the root inside it, then the answer, and play both there.",
  "The mic can't see strings, but it hears octaves: only an octave of the answer that sits inside the window counts. The next round comes up as soon as it hears it.",
  "Each round stays up for 12 seconds. A round that runs out counts as missed.",
];

export const intervalHuntSecondsThirdsExercise = createIntervalHuntExercise({
  id: "interval_hunt_seconds_thirds",
  title: "Interval Hunt — Seconds & Thirds",
  description: "A root and a small interval on screen: minor or major 2nd, minor or major 3rd. Find the answer and play it.",
  difficulty: "medium",
  timeInMinutes: 2,
  intervalIds: ["m2", "M2", "m3", "M3"],
  instructions: [
    "A root and an interval appear, e.g. 'D · Minor 3rd ↑'. Only the four smallest intervals are in play.",
    ...SHARED_INSTRUCTIONS,
  ],
  tips: [
    "Stay on one string: 1, 2, 3 or 4 frets up from the root.",
    "Say the answer's name before you play it. The neck checks your hand, your voice checks your head.",
    "Minor is always the smaller of the two: minor 2nd one fret, major 2nd two; minor 3rd three, major 3rd four.",
  ],
  whyItMatters:
    "These four distances are what scales and melodies are mostly made of. Playing them on demand, from any root, is the step between recognising a shape on a diagram and owning it on the guitar.",
});

export const intervalHuntPillarsExercise = createIntervalHuntExercise({
  id: "interval_hunt_pillars",
  title: "Interval Hunt — 4th, Tritone, 5th",
  description: "The three intervals in the middle of the octave. A root and an interval appear; play the note it lands on.",
  difficulty: "medium",
  timeInMinutes: 2,
  intervalIds: ["P4", "TT", "P5"],
  instructions: [
    "A root and an interval appear: a perfect 4th, a tritone or a perfect 5th.",
    ...SHARED_INSTRUCTIONS,
  ],
  tips: [
    "From a root on the low E, A or D string: the 4th is the next string at the same fret, the tritone one fret up, the 5th two frets up.",
    "The 5th is the top note of the power chord you already play.",
    "The tritone is whatever sits between the other two.",
  ],
  whyItMatters:
    "The 4th and the 5th hold up every chord and every bass line, and the tritone is the tension between them. These three shapes sit side by side on the neck, which makes them the easiest to learn together and the easiest to mix up.",
});

export const intervalHuntSixthsSeventhsExercise = createIntervalHuntExercise({
  id: "interval_hunt_sixths_sevenths",
  title: "Interval Hunt — Sixths & Sevenths",
  description: "The wide ones: minor and major 6th, minor and major 7th. Work out the note and play it.",
  difficulty: "hard",
  timeInMinutes: 2,
  intervalIds: ["m6", "M6", "m7", "M7"],
  instructions: [
    "A root and a wide interval appear: a 6th or a 7th, minor or major.",
    ...SHARED_INSTRUCTIONS,
  ],
  tips: [
    "Count down from the octave instead of up from the root: major 7th one fret below it, minor 7th two, major 6th three, minor 6th four.",
    "Two strings up from the root: the minor 7th is the same fret, the major 6th one fret back.",
    "Inside the window the answer can sit below the root as well as above it. Either one counts.",
  ],
  whyItMatters:
    "Sixths and sevenths are the notes that turn a triad into a real chord and a scale run into a melody with reach. Nobody counts nine frets in the middle of a solo; this is where you swap counting for shapes.",
});

export const intervalHuntAllElevenExercise = createIntervalHuntExercise({
  id: "interval_hunt_all_eleven",
  title: "Interval Hunt — All Eleven",
  description: "Every interval inside the octave, from every root, sharps included. Read it, find it, play it.",
  difficulty: "hard",
  timeInMinutes: 3,
  intervalIds: INTERVALS.map((interval) => interval.id),
  roots: [...NOTES],
  instructions: [
    "A root and an interval appear. All eleven intervals and all twelve roots are in play.",
    ...SHARED_INSTRUCTIONS,
  ],
  tips: [
    "Small intervals: count up from the root. Wide ones: count down from the octave.",
    "For a root with a sharp, picture the natural note and shift the whole shape one fret up.",
    "Don't freeze on a hard one. A missed round costs less than the time you lose staring at it.",
  ],
  whyItMatters:
    "This is the whole skill in one drill: any root, any interval, straight to the note. It is what lets you build a chord you were never shown, harmonise a line on the spot and follow a melody you only heard once.",
});

export const intervalHuntSetExercises: Exercise[] = [
  intervalHuntSecondsThirdsExercise,
  intervalHuntPillarsExercise,
  intervalHuntSixthsSeventhsExercise,
  intervalHuntAllElevenExercise,
];
