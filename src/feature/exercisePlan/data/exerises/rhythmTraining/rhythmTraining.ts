import type { Exercise, TablatureNote } from "feature/exercisePlan/types/exercise.types";

const n = (isAccented?: boolean) => ({
  notes: [{ string: 6, fret: 0, ...(isAccented ? { isAccented: true } : {}) }],
});
const rest = { notes: [] as TablatureNote[] };

export const rhythmTrainingEasy: Exercise = {
  id: "rhythm_training_easy",
  title: "Rhythm Training — Easy",
  description:
    "Build a solid sense of pulse with simple note values. Play on a muted string along with the metronome.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Mute a string with your fretting hand and pick along with the metronome.",
    "Follow the rhythm pattern shown on screen — each dot is a pick stroke.",
    "Focus on locking in with the click. No pitch or melody needed.",
    "Repeat each measure until it feels effortless, then move on.",
  ],
  tips: [
    "Tap your foot on every beat to anchor the pulse.",
    "Count out loud: '1 2 3 4' for quarter notes.",
    "If you rush, slow the metronome down — accuracy first.",
    "Use a relaxed grip; tension kills timing.",
  ],
  metronomeSpeed: { min: 50, max: 85, recommended: 65 },
  relatedSkills: ["rhythm"],
  tablature: [
    // Measure 1: Quarter notes (4×1.0)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, ...n(true) },
        { duration: 1, ...n() },
        { duration: 1, ...n() },
        { duration: 1, ...n() },
      ],
    },
    // Measure 2: Half notes (2×2.0) — play on beats 1 and 3
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, ...n(true) },
        { duration: 2, ...n() },
      ],
    },
    // Measure 3: Dotted half + quarter (3.0 + 1.0)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 3, ...n(true) },
        { duration: 1, ...n() },
      ],
    },
    // Measure 4: Quarter-quarter-half (1+1+2)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, ...n(true) },
        { duration: 1, ...n() },
        { duration: 2, ...n() },
      ],
    },
    // Measure 5: Quarter with rests — play-rest-play-rest
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, ...n(true) },
        { duration: 1, ...rest },
        { duration: 1, ...n() },
        { duration: 1, ...rest },
      ],
    },
  ],
};

export const rhythmTrainingMedium: Exercise = {
  id: "rhythm_training_medium",
  title: "Rhythm Training — Medium",
  description:
    "Eighth-note subdivisions and syncopation. Develop an internal clock that holds up under rhythmic variety.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Mute a string and pick the rhythm patterns shown on screen.",
    "Pay close attention to off-beat and syncopated patterns.",
    "Keep your picking hand moving in a steady down-up motion for eighth notes.",
    "Rests are just as important as notes — silence is part of the rhythm.",
  ],
  tips: [
    "Count '1-and-2-and-3-and-4-and' for eighth notes.",
    "For syncopation, accent the 'and' beats — feel the push.",
    "Keep your foot tap steady even when the rhythm shifts.",
    "Record yourself and compare against the metronome.",
  ],
  metronomeSpeed: { min: 65, max: 115, recommended: 85 },
  relatedSkills: ["rhythm"],
  tablature: [
    // Measure 1: Straight eighth notes (8×0.5)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, ...n(true) },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...n() },
      ],
    },
    // Measure 2: Syncopated 8ths — rest-note-rest-note (off-beat emphasis)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, ...rest },
        { duration: 0.5, ...n(true) },
        { duration: 0.5, ...rest },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...rest },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...rest },
        { duration: 0.5, ...n() },
      ],
    },
    // Measure 3: Quarter + two eighths + quarter + two eighths
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, ...n(true) },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...n() },
        { duration: 1, ...n() },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...n() },
      ],
    },
    // Measure 4: Dotted quarter + eighth pattern (1.5+0.5+1.5+0.5)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1.5, ...n(true) },
        { duration: 0.5, ...n() },
        { duration: 1.5, ...n() },
        { duration: 0.5, ...n() },
      ],
    },
    // Measure 5: Eighth notes with rests — play-play-rest-play per beat
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, ...n(true) },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...rest },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...n() },
        { duration: 0.5, ...rest },
        { duration: 0.5, ...n() },
      ],
    },
  ],
};

export const rhythmTrainingHard: Exercise = {
  id: "rhythm_training_hard",
  title: "Rhythm Training — Hard",
  description:
    "Sixteenth-note subdivisions, triplets, and polyrhythmic patterns. Push your internal clock to its limits.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Mute a string and execute precise subdivisions at speed.",
    "Sixteenth notes require constant down-up-down-up motion.",
    "For triplets, feel groups of three evenly spaced within each beat.",
    "The polyrhythmic measure accents every 3rd sixteenth — feel the 3-over-4 tension.",
  ],
  tips: [
    "Count '1-e-and-a' for sixteenth notes.",
    "For triplets, say 'tri-po-let' on each beat.",
    "Accent marks show where to dig in — ghost the other notes.",
    "If you lose the grid, stop and restart from the top of the measure.",
  ],
  metronomeSpeed: { min: 75, max: 135, recommended: 95 },
  relatedSkills: ["rhythm"],
  tablature: [
    // Measure 1: Straight 16th notes (16×0.25)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, ...n(true) },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
      ],
    },
    // Measure 2: 16th syncopation — rest on downbeats, play off-beats
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, ...rest },
        { duration: 0.25, ...n(true) },
        { duration: 0.25, ...rest },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...rest },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...rest },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...rest },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...rest },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...rest },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...rest },
        { duration: 0.25, ...n() },
      ],
    },
    // Measure 3: Gallop — 8th + two 16ths, repeated (0.5 + 0.25 + 0.25) × 4
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, ...n(true) },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.5, ...n(true) },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.5, ...n(true) },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
        { duration: 0.5, ...n(true) },
        { duration: 0.25, ...n() },
        { duration: 0.25, ...n() },
      ],
    },
    // Measure 4: Triplet feel (12×0.333)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.333, ...n(true) },
        { duration: 0.333, ...n() },
        { duration: 0.333, ...n() },
        { duration: 0.333, ...n(true) },
        { duration: 0.333, ...n() },
        { duration: 0.333, ...n() },
        { duration: 0.333, ...n(true) },
        { duration: 0.333, ...n() },
        { duration: 0.333, ...n() },
        { duration: 0.333, ...n(true) },
        { duration: 0.333, ...n() },
        { duration: 0.333, ...n() },
      ],
    },
    // Measure 5: Polyrhythmic — 16th groupings of 3 across 4/4 (accent every 3rd 16th)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, ...n(true) },  // 1 — accent
        { duration: 0.25, ...n() },       // 2
        { duration: 0.25, ...n() },       // 3
        { duration: 0.25, ...n(true) },   // 4 — accent
        { duration: 0.25, ...n() },       // 5
        { duration: 0.25, ...n() },       // 6
        { duration: 0.25, ...n(true) },   // 7 — accent
        { duration: 0.25, ...n() },       // 8
        { duration: 0.25, ...n() },       // 9
        { duration: 0.25, ...n(true) },   // 10 — accent
        { duration: 0.25, ...n() },       // 11
        { duration: 0.25, ...n() },       // 12
        { duration: 0.25, ...n(true) },   // 13 — accent
        { duration: 0.25, ...n() },       // 14
        { duration: 0.25, ...n() },       // 15
        { duration: 0.25, ...n() },       // 16
      ],
    },
  ],
};
