import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const pullOffPentatonicRunExercise: Exercise = {
  id: "pull_off_pentatonic_run",
  title: "Pull-off Pentatonic Run – 3 Strings",
  description:
    "Legato pull-off exercise using the A minor pentatonic scale across 3 strings (e→B→G→B). One bar of 8th notes: pick the higher fret on each string, pull-off to the lower — the descending mirror of the Hammer-on Pentatonic Run.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Hold both fingers down before picking — the pull-off finger must already be in place.",
    "Follow the string order: e (8→5), B (8→5), G (7→5), then back to B (8→5).",
    "Pull the fretting finger sideways (toward the floor) to sound the lower note clearly.",
    "Keep both notes equal in volume — the pulled note should ring as loud as the picked one.",
    "Repeat the pattern continuously without stopping between cycles."
  ],
  tips: [
    "Pre-plant both fingers before picking — don't place the pull-off finger after the pick.",
    "Pull sideways, not straight off the string — this gives the lower note its volume.",
    "Keep fingers close to the fretboard to minimise movement between strings.",
    "The direction change at the bottom (G→B) is the trickiest part — isolate it if needed.",
    "Once comfortable, combine with the Hammer-on Pentatonic Run for a full legato loop."
  ],
  metronomeSpeed: { min: 60, max: 160, recommended: 50 },
  relatedSkills: ["legato"],
  tablature: [
    {
      "timeSignature": [4, 4],
      "beats": [
        {
          "duration": 0.5,
          "notes": [{ "string": 1, "fret": 8 }]
        },
        {
          "duration": 0.5,
          "notes": [{ "string": 1, "fret": 5, "isPullOff": true }]
        },
        {
          "duration": 0.5,
          "notes": [{ "string": 2, "fret": 8 }]
        },
        {
          "duration": 0.5,
          "notes": [{ "string": 2, "fret": 5, "isPullOff": true }]
        },
        {
          "duration": 0.5,
          "notes": [{ "string": 3, "fret": 7 }]
        },
        {
          "duration": 0.5,
          "notes": [{ "string": 3, "fret": 5, "isPullOff": true }]
        },
        {
          "duration": 0.5,
          "notes": [{ "string": 2, "fret": 8 }]
        },
        {
          "duration": 0.5,
          "notes": [{ "string": 2, "fret": 5, "isPullOff": true }]
        }
      ]
    }
  ],
};
