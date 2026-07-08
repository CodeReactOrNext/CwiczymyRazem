import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Em7 arpeggio on strings 5-4-3, position 7
//   str5 fret  7 → E  (root)
//   str4 fret  9 → B  (5th)
//   str3 fret  9 → E  (octave root)
//   str3 fret 12 → G  (minor 3rd — hammer-on)
//   str3 fret  9 → E  (pull-off)
//   str4 fret  9 → B  (up sweep)
//   str5 fret  7 → E  (up sweep)
//   [eighth rest]

export const miniArpeggioExercise: Exercise = {
  id: "mini_arpeggio",
  title: "Mini Arpeggio – Em7",
  description:
    "Practice clean sweeping and rolling mechanics across three-string shapes.",
  whyItMatters: "Mini arpeggios are the building blocks of sweep picking. Learning to roll your fretting fingers across the same fret on adjacent strings prevents notes from bleeding together, ensuring a clean, articulated arpeggio line.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Use a single, continuous downward pick stroke to sweep across the strings.",
    "Roll your fretting fingers across the frets to prevent notes from ringing together."
  ],
  tips: [
    "Lift each fretting finger slightly as soon as the pick leaves the corresponding string.",
    "Coordinate the sweep speed perfectly with your fretting finger movements."
  ],
  metronomeSpeed: { min: 30, max: 200, recommended: 45 },
  relatedSkills: ["sweep_picking"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        // Down sweep: A → D → G
        { duration: 0.5, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9 }] },
        // Legato at the top: hammer-on then pull-off
        { duration: 0.5, notes: [{ string: 3, fret: 12, isHammerOn: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9, isPullOff: true }] },
        // Up sweep: G → D → A
        { duration: 0.5, notes: [{ string: 4, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7 }] },
        // Rest — breathe before the next cycle
        { duration: 0.5, notes: [] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 12, isHammerOn: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.5, notes: [] },
      ],
    },
  ],
};
