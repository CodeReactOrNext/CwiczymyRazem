import type { Exercise, TablatureNote } from "feature/exercisePlan/types/exercise.types";

const n = (isAccented?: boolean) => ({
  notes: [{ string: 6, fret: 0, ...(isAccented ? { isAccented: true } : {}) }],
});
const rest = { notes: [] as TablatureNote[] };

export const rhythmTrainingEasy: Exercise = {
  id: "rhythm_training_easy",
  title: "Rhythm Training — Easy",
  description: "Execute fundamental quarter and half-note rhythms on a muted string to establish a solid internal pulse.",
  whyItMatters: "This exercise strips away all melodic and harmonic distractions, forcing you to focus entirely on rhythmic precision. Developing a strong quarter-note pulse is the foundational prerequisite for all complex strumming and lead playing.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Mute a single string with your fretting hand to produce a percussive click.",
    "Strike the string strictly in time with the indicated rhythmic values.",
    "Ensure rests are completely silent by stopping the pick motion or resting it on the string.",
  ],
  tips: [
    "Tap your foot consistently on every downbeat to physically anchor your internal clock.",
    "Count the quarter notes aloud ('1 2 3 4') as you play.",
    "Maintain a relaxed grip on the pick to prevent timing fluctuations caused by physical tension.",
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
  description: "Perform eighth-note subdivisions and basic syncopated patterns on a muted string.",
  whyItMatters: "This exercise develops your ability to accurately divide the beat and execute off-beat rhythms. Mastering eighth-note syncopation provides the rhythmic vocabulary necessary for standard pop, rock, and funk guitar parts.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Mute a single string with your fretting hand.",
    "Maintain a continuous down-up motion with your picking hand for all eighth notes.",
    "Accent the syncopated off-beats by striking the string slightly harder on the upstrokes.",
  ],
  tips: [
    "Count aloud using '1 & 2 & 3 & 4 &' to lock the subdivisions into the metronome pulse.",
    "Keep your foot tapping strictly on the quarter-note downbeats, even during heavily syncopated phrases.",
    "Treat rests as active musical elements—your hand should still swing silently through the air.",
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
  description: "Execute complex sixteenth-note subdivisions, triplets, and polyrhythmic groupings on a muted string.",
  whyItMatters: "This exercise challenges your fine motor control and deep rhythmic grid. Navigating rapid sixteenths, shifting to triplet feels, and executing 3-over-4 polyrhythms trains ultimate rhythmic independence and strict metronomic alignment.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Mute a single string and execute precise rapid subdivisions using strict alternate picking.",
    "For sixteenth notes, maintain an uninterrupted down-up-down-up sequence.",
    "For the polyrhythmic measure, accent every third sixteenth note while maintaining the steady 4/4 grid.",
  ],
  tips: [
    "Count sixteenth notes aloud using '1 e & a, 2 e & a'.",
    "For triplets, mentally divide the beat into three equal parts ('1 & a, 2 & a').",
    "If you drift off the grid during the polyrhythm, stop, reset your internal pulse with the metronome, and start the measure over.",
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
