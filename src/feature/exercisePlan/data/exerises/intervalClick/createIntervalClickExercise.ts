import type { IntervalDefinition } from "feature/exercisePlan/intervals/intervalDefinitions";
import { intervalsByIds, noteAtInterval } from "feature/exercisePlan/intervals/intervalDefinitions";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

/** Natural notes only — the roots beginners can name without translating a sharp first. */
export const NATURAL_ROOTS = ["C", "D", "E", "F", "G", "A", "B"];
/** Every pitch class, sharps included — for the drills that stop holding hands. */
export const ALL_ROOTS = [...NOTES];

export interface IntervalClickConfig {
  id: string;
  title: string;
  description: string;
  addedAt: string;
  difficulty: Exercise["difficulty"];
  timeInMinutes: number;
  region: { startFret: number; endFret: number };
  /** Strings in play (1 = high e … 6 = low E). Omitted = all six. */
  strings?: number[];
  /** Interval ids from intervalDefinitions, e.g. ["m3", "M3", "P5"]. */
  intervalIds: string[];
  roots?: string[];
  rotateSeconds: number;
  instructions: string[];
  tips: string[];
  whyItMatters: string;
}

interface IntervalPrompt {
  root: string;
  interval: IntervalDefinition;
  /** The note the interval lands on — the answer, never shown until it's found. */
  target: string;
}

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

function rollPrompt(roots: string[], intervals: IntervalDefinition[], exclude?: string): IntervalPrompt {
  let next: IntervalPrompt;
  do {
    const root = pick(roots);
    const interval = pick(intervals);
    next = { root, interval, target: noteAtInterval(root, interval.semitones) };
  } while (roots.length * intervals.length > 1 && `${next.root}-${next.interval.id}` === exclude);
  return next;
}

/**
 * Builds one "click the root, then click the interval" drill. Every variant is
 * the same game — only the fret window, the string scope and the interval pool
 * change — so they all share this factory instead of copying the config around.
 *
 * The prompt (root + interval name) lives in `customGoalPrompt`; the note the
 * interval actually lands on is the hidden `customGoal`, which is what the click
 * tracking scores step 2 against. See useIntervalClickHunt / IntervalClickPanel.
 */
export function createIntervalClickExercise(config: IntervalClickConfig): Exercise {
  const intervals = intervalsByIds(config.intervalIds);
  const roots = config.roots ?? NATURAL_ROOTS;

  // Module-level per exercise: the prompt has to survive re-renders and stay put
  // between rotations, exactly like the other rotating hunts.
  let current = rollPrompt(roots, intervals);

  const promptFor = (prompt: IntervalPrompt) => ({
    title: prompt.root,
    subtitle: `${prompt.interval.name} ↑`,
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
    relatedSkills: ["music_theory"],
    disableBackingTrack: true,
    disableMic: true,
    customGoal: current.target,
    customGoalPrompt: promptFor(current),
    customGoalDescription: "Click the root first, then the note the interval lands on",
    customGoalRegion: config.region,
    customGoalStrings: config.strings,
    rollHuntTarget: () => {
      current = rollPrompt(roots, intervals, `${current.root}-${current.interval.id}`);
      return { goal: current.target, prompt: promptFor(current), region: config.region };
    },
    noteHuntConfig: { rotateSeconds: config.rotateSeconds, mode: "intervalClick" },
  };
}
