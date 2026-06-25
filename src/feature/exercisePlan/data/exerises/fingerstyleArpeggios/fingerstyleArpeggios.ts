import type { Exercise, TablatureBeat, TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

// A gentle fingerstyle pattern: a descending bass line on the A/E strings under
// ringing open G/B/e strings. Each measure is four quarter notes in 4/4; every
// note lets ring for a warm, connected sound. Stored compactly as [string, fret]
// pairs and expanded below.
const PATTERN: [number, number][][] = [
  [[5, 7], [3, 0], [2, 0], [1, 0]],
  [[2, 0], [3, 0], [5, 7], [3, 0]],
  [[5, 5], [3, 0], [2, 0], [1, 0]],
  [[2, 0], [3, 0], [5, 5], [3, 0]],
  [[5, 4], [3, 0], [2, 0], [1, 0]],
  [[2, 0], [3, 0], [5, 4], [3, 0]],
  [[5, 3], [3, 0], [2, 0], [1, 0]],
  [[2, 0], [3, 0], [5, 3], [3, 0]],
  [[5, 2], [3, 0], [2, 0], [1, 0]],
  [[2, 0], [3, 0], [5, 2], [3, 0]],
  [[6, 0], [3, 0], [2, 0], [1, 0]],
  [[2, 0], [3, 0], [6, 0], [3, 0]],
  [[6, 0], [3, 0], [2, 0], [1, 0]],
  [[2, 0], [3, 0], [6, 0], [3, 0]],
];

const makeBeat = ([string, fret]: [number, number]): TablatureBeat => ({
  notes: [{ string, fret, isLetRing: true, dynamics: 0.8 }],
  duration: 1,
});

const fingerstyleTablature: TablatureMeasure[] = PATTERN.map((measure) => ({
  beats: measure.map(makeBeat),
  timeSignature: [4, 4],
}));

export const fingerstyleArpeggiosExercise: Exercise = {
  id: "fingerstyle_descending_arpeggios",
  title: "Fingerstyle: Descending Arpeggios",
  description: "A relaxed fingerpicking pattern with a descending bass line under ringing open strings — a perfect first step into fingerstyle.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 2.5,
  instructions: [
    "Assign your picking hand: thumb (p) plays the bass note on the A/E string, fingers (i, m, a) play the G, B and high-e strings.",
    "Play one note per beat, in time with the metronome, letting every note ring into the next.",
    "Follow the descending bass line down the A string, then resolve onto the open low E and repeat.",
  ],
  tips: [
    "Keep the thumb steady and even — it anchors the whole pattern.",
    "Let the open strings ring; don't mute them when you move to the next note.",
    "Start slow enough that every note sounds clean, then raise the tempo gradually.",
    "Keep your fretting hand relaxed; only the bass notes are fretted.",
  ],
  whyItMatters: "This pattern builds the core fingerstyle skill of independent thumb-and-finger motion while training a smooth, connected (let-ring) sound. The simple moving bass line also gently introduces how a melody can live in the lowest voice.",
  metronomeSpeed: { min: 50, max: 180, recommended: 70 },
  relatedSkills: ["finger_independence", "chords"],
  tablature: fingerstyleTablature,
};
