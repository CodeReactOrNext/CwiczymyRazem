import type { IntervalDefinition } from "feature/exercisePlan/intervals/intervalDefinitions";
import { intervalsByIds, noteAtInterval } from "feature/exercisePlan/intervals/intervalDefinitions";
import type { FretWindow } from "feature/exercisePlan/intervals/intervalWindows";
import { pickIntervalWindow } from "feature/exercisePlan/intervals/intervalWindows";
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
  /**
   * Confines every round to a fresh window this many frets wide, drawn inside
   * `region` so it holds both the root and the answer within a hand's reach.
   * Omitted = the whole of `region` every round.
   */
  windowFrets?: number;
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
  /** The frets this round is played in. */
  region: FretWindow;
}

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** The whole configured region, or a fresh narrow window inside it that fits the round. */
function rollRegion(
  { region, windowFrets, strings }: Pick<IntervalClickConfig, "region" | "windowFrets" | "strings">,
  root: string,
  target: string,
  previous?: FretWindow,
): FretWindow {
  if (!windowFrets) return region;
  const window = pickIntervalWindow(root, target, windowFrets, strings, previous);
  // Windows are drawn across frets 0–12; keep only ones inside the drill's own region.
  return window.startFret >= region.startFret && window.endFret <= region.endFret ? window : region;
}

function rollPrompt(
  config: Pick<IntervalClickConfig, "region" | "windowFrets" | "strings">,
  roots: string[],
  intervals: IntervalDefinition[],
  previous?: IntervalPrompt,
): IntervalPrompt {
  let root: string;
  let interval: IntervalDefinition;
  do {
    root = pick(roots);
    interval = pick(intervals);
  } while (roots.length * intervals.length > 1 && `${root}-${interval.id}` === `${previous?.root}-${previous?.interval.id}`);
  const target = noteAtInterval(root, interval.semitones);
  return { root, interval, target, region: rollRegion(config, root, target, previous?.region) };
}

/**
 * Builds one "place the root, then click the interval from it" drill — two clicks
 * a round. Every variant is the same game — only the fret window, the string scope
 * and the interval pool change — so they all share this factory instead of copying
 * the config around.
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
  let current = rollPrompt(config, roots, intervals);

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
    customGoalDescription: "Click one root, then the interval measured from that spot",
    customGoalRegion: current.region,
    customGoalStrings: config.strings,
    rollHuntTarget: () => {
      current = rollPrompt(config, roots, intervals, current);
      return { goal: current.target, prompt: promptFor(current), region: current.region };
    },
    noteHuntConfig: { rotateSeconds: config.rotateSeconds, mode: "intervalClick", roundVerdict: true },
  };
}
