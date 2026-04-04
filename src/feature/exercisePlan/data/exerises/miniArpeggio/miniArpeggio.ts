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
    "A compact three-string Em7 arpeggio sweep: down from the A string through D and G, hammer-on at the top, pull-off, then sweep back up. One clean cycle per bar — the foundation of sweep picking phrasing.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Sweep down through strings 5→4→3 in one continuous pick motion — not three separate strokes.",
    "At the G string (fret 9) immediately hammer onto fret 12, then pull-off back to fret 9.",
    "Reverse the pick direction and sweep up through strings 3→4→5 to complete the cycle.",
    "Lift each fretting finger right after it sounds so notes do not bleed into each other.",
    "Start slow — the aim is one smooth, even-volume cycle before adding speed."
  ],
  tips: [
    "The pick should feel like it's falling through the strings on the way down, not hitting each one individually.",
    "Pre-plant the hammer-on finger before you reach the G string so there's no hesitation at the top.",
    "The up sweep is usually weaker than the down — give it extra attention at slow tempos.",
    "If any note is noticeably louder, adjust pick angle or depth on that string.",
    "Once the cycle is clean, try chaining it: two cycles per bar at half the BPM."
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
