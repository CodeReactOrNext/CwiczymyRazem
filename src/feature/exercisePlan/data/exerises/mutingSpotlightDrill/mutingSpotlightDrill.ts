import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const mutingSpotlightDrillExercise: Exercise = {
  id: "muting_spotlight_drill",
  title: "Muting Spotlight — Pick One, Kill the Rest",
  description:
    "A 3-note motif (G → A → B on the G string) played clean once as a reference, then repeated four times — each time with a different single note ringing out and the other two killed as dead (X) muted hits. The exercise sounds deceptively simple but demands precise, deliberate muting control: you must strike dead notes with full confidence while surgically letting only the target note sustain.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Measure 1 (reference): G(0) → A(2) → B(4) → rest. All three notes fully ringing, clean tone. This is what the motif sounds like when nothing is muted. Listen carefully.",
    "Measure 2 (spotlight: B): X → X → B(4) → rest. Kill the first two notes stone dead — left hand lays flat on the strings immediately after striking. Only B rings out.",
    "Measure 3 (spotlight: A): X → A(2) → X → rest. A rings, G and B are dead. The second X requires your fretting hand to mute right after picking A.",
    "Measure 4 (spotlight: G): G(0) → X → X → rest. G is open — you mute it with your picking hand palm the moment you hit the next dead X.",
    "Measure 5 (spotlight: G + B): G(0) → X → B(4) → rest. Now two notes ring, one is killed. The gap creates a rhythmic and melodic effect.",
    "Measure 6 (resolve): G(0) → A(2) → B(4) → rest. Full clean motif again. After all the muting, this should feel and sound like a release.",
  ],
  tips: [
    "Dead notes (X) must sound like a confident percussive thud — not a weak, accidental buzz. Hit them with the same pick attack as the ringing notes.",
    "Two ways to kill a note: (1) left hand — flatten a fretting finger across the string immediately after the note sounds; (2) right hand — palm mute by touching the string edge with your picking-hand palm.",
    "The hardest kill is the open G in M4. You can't use your left hand (it's fretted ahead), so use your picking-hand palm to stop it dead the instant you move to the next note.",
    "Do not slow down before a dead note. The tempo is the same for X as it is for a ringing note. Same attack, same timing — only the sustain is different.",
    "Start very slow (50 BPM). The transitions between dead and alive need to be intentional, not accidental.",
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 55 },
  relatedSkills: ["articulation"],
  tablature: [
    // M1: G(0) A(2) B(4) rest — reference, all ringing
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 0 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 4 }] },
        { duration: 1, notes: [] },
      ],
    },
    // M2: X X B(4) rest — only B rings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 0, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 4 }] },
        { duration: 1, notes: [] },
      ],
    },
    // M3: X A(2) X rest — only A rings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 0, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 4, isDead: true }] },
        { duration: 1, notes: [] },
      ],
    },
    // M4: G(0) X X rest — only G rings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 0 }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 4, isDead: true }] },
        { duration: 1, notes: [] },
      ],
    },
    // M5: G(0) X B(4) rest — two notes ring, A is killed
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 0 }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 4 }] },
        { duration: 1, notes: [] },
      ],
    },
    // M6: G(0) A(2) B(4) rest — resolve, full clean motif
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 0 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 4 }] },
        { duration: 1, notes: [] },
      ],
    },
  ],
};
