import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import type { ChordDegree, ChordDegreeRound, DegreeLabelStyle } from "./createChordDegreeHuntExercise";
import { chordDegreeRounds, degreeLabel } from "./createChordDegreeHuntExercise";

export interface ChordProgression {
  /** Player-facing name of the loop, e.g. "ii–V–I in C". */
  name: string;
  /** Chord symbols in playing order. Repeats are allowed (blues turnarounds). */
  chords: string[];
}

/** One trip through a progression asking for a single degree of every chord. */
interface PreparedPass {
  degree: ChordDegree;
  /** One round per chord, in playing order. */
  rounds: ChordDegreeRound[];
}

interface PreparedProgression {
  chords: string[];
  passes: PreparedPass[];
}

/**
 * Precomputes every pass a progression can support. A degree is only kept when
 * EVERY chord in the loop can answer it — asking for the 7th of a plain triad
 * halfway through a lap would leave a round with no answer, and since the walk is
 * deterministic that would strand the player rather than just look odd.
 */
function prepareProgression(
  progression: ChordProgression,
  degrees: readonly ChordDegree[],
): PreparedProgression {
  const passes = degrees.flatMap<PreparedPass>((degree) => {
    const rounds = progression.chords.map((chord) => chordDegreeRounds([chord], [degree])[0]);
    if (rounds.some((round) => !round)) return [];
    return [{ degree, rounds }];
  });
  return { chords: progression.chords, passes };
}

export interface ChordChangesConfig {
  id: string;
  title: string;
  description: string;
  addedAt: string;
  difficulty: Exercise["difficulty"];
  timeInMinutes: number;
  progressions: ChordProgression[];
  /** Candidate degrees, in the order the passes should run. Guide tones first. */
  degrees: ChordDegree[];
  degreeLabels?: DegreeLabelStyle;
  /** Bars each chord lasts. The changes land on the bar line of the click. */
  barsPerChord: number;
  /** Tempo ladder for the click the changes ride on. */
  metronomeSpeed: NonNullable<Exercise["metronomeSpeed"]>;
  /** Fallback length of a chord for a player practising with the click stopped —
   *  there are no bars to land on then, so the drill falls back to a stopwatch. */
  fallbackSecondsPerChord: number;
  instructions: string[];
  tips: string[];
  whyItMatters: string;
}

/**
 * Builds the "play that degree over every chord as the changes go by" drill.
 *
 * Unlike the single-chord hunts this one does not roll at random — it walks:
 * chord by chord through a progression, then again for the next degree, then on
 * to another progression. That ordering is the exercise. Targeting the 3rd of a
 * chord you have all the time in the world to think about is a different (and far
 * easier) skill from landing it at the moment the chord actually arrives, which
 * is why the clock here never waits for an answer.
 *
 * The changes ride the metronome rather than a stopwatch: each chord lasts
 * `barsPerChord` bars of the running click, so the loop is something the player
 * plays in time with instead of a prompt that happens to swap while they are
 * mid-phrase. With the click stopped there are no bars to land on and the drill
 * falls back to `fallbackSecondsPerChord`.
 *
 * Rides the existing "interval" hunt mode — the prompt carries the chord, the
 * degree label and the loop strip, and the answer stays hidden in `customGoal`.
 */
export function createChordChangesExercise(config: ChordChangesConfig): Exercise {
  const labelStyle = config.degreeLabels ?? "ordinal";
  const progressions = config.progressions
    .map((progression) => prepareProgression(progression, config.degrees))
    .filter((prepared) => prepared.passes.length > 0);

  if (progressions.length === 0) {
    throw new Error(`${config.id}: no progression can answer any of the requested degrees`);
  }

  // Module-level per exercise, like the other hunts: the walk has to survive
  // re-renders and stay where it was between rotations.
  let progressionIndex = Math.floor(Math.random() * progressions.length);
  let passIndex = 0;
  let chordIndex = 0;

  const currentRound = (): ChordDegreeRound =>
    progressions[progressionIndex].passes[passIndex].rounds[chordIndex];

  const promptFor = (round: ChordDegreeRound) => ({
    title: round.chord,
    subtitle: degreeLabel(round, labelStyle),
    steps: { labels: progressions[progressionIndex].chords, activeIndex: chordIndex },
  });

  /** Chord → chord, wrapping into the next degree, then into another loop. */
  const step = () => {
    const progression = progressions[progressionIndex];
    chordIndex += 1;
    if (chordIndex < progression.chords.length) return;

    chordIndex = 0;
    passIndex += 1;
    if (passIndex < progression.passes.length) return;

    passIndex = 0;
    // A different loop next, so a long session doesn't sit on one cadence. With
    // a single progression configured there is nothing to move to.
    if (progressions.length > 1) {
      progressionIndex = (progressionIndex + 1) % progressions.length;
    }
  };

  const first = currentRound();

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
    metronomeSpeed: config.metronomeSpeed,
    relatedSkills: ["chords", "harmony", "music_theory", "improvisation"],
    disableBackingTrack: true,
    customGoal: first.target,
    customGoalPrompt: promptFor(first),
    customGoalDescription: "Play that degree before the chord changes",
    rollHuntTarget: () => {
      step();
      const round = currentRound();
      return { goal: round.target, prompt: promptFor(round) };
    },
    // Locked to the click: the chord changes on the bar line, in time, whether or
    // not the note was found. That pressure — and being in time with something —
    // is the skill being trained, so it is never "solved" pacing.
    noteHuntConfig: {
      rotateSeconds: config.fallbackSecondsPerChord,
      mode: "interval",
      advanceOn: "bar",
      advanceEveryBars: config.barsPerChord,
    },
  };
}
