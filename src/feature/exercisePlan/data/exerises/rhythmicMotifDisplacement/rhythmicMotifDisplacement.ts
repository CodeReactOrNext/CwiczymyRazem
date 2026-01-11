import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const rhythmicMotifDisplacementExercise: Exercise = {
  id: "rhythmic_motif_displacement",
  title: "Rhythmic Motif Displacement",
  description: "Advanced rhythmic exercise: shift a fixed melodic/rhythmic motif by one subdivision each bar.",
  difficulty: "hard",
  category: "theory",
  timeInMinutes: 8,
  instructions: [
    "Choose a 3-note or 4-note motif with a clear rhythm (e.g. 1 eighth and 2 sixteenths).",
    "Play it starting on the 1st beat of the first bar.",
    "In the next bar, shift the entire motif forward by one sixteenth note.",
    "Continue shifting the start point by one subdivision in each subsequent bar.",
    "The goal is to feel the motif against the pulse in all possible rhythmic positions."
  ],
  tips: [
    "Use a backing track or loud metronome to stay anchored to beat 1.",
    "Start very slow — this is mentally taxing.",
    "Record yourself to check if you are accidentally returning to the 'standard' downbeat start."
  ],
  metronomeSpeed: {
    min: 40,
    max: 80,
    recommended: 60,
  },
  relatedSkills: ["rhythm", "phrasing"],
};
