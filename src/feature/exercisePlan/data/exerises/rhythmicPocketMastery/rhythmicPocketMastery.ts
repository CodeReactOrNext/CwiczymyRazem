import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const rhythmicPocketMasteryExercise: Exercise = {
  id: "rhythmic_pocket_mastery",
  title: "Subdivision Control",
  description: "Transition smoothly between different rhythmic subdivisions at a constant tempo.",
  whyItMatters: "Rhythmic flexibility allows you to vary the speed of your solos and rhythm parts without changing the song's BPM. Mastering subdivision control keeps you locked in 'the pocket' during complex rhythm shifts.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Switch between quarter, eighth, and sixteenth notes without changing your speed.",
    "Keep your hand relaxed during rapid subdivision shifts."
  ],
  tips: [
    "Count the subdivisions out loud before attempting to play them.",
    "Ensure the first note of each new subdivision lands precisely on the downbeat."
  ],
  metronomeSpeed: { min: 50, max: 90, recommended: 60 },
  relatedSkills: ["rhythm"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
      ],
    },
  ]
};
