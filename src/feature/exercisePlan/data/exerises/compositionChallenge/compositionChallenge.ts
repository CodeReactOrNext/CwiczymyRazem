import type { Exercise, ImprovPromptRiddleConfig } from "feature/exercisePlan/types/exercise.types";

const compositionChallengeConfig: ImprovPromptRiddleConfig = {
  mode: 'improvPrompt',
  difficulty: 'hard',
  promptIntervalSeconds: 2400,
  simultaneousPrompts: 5,
  prompts: [
    // Style (10)
    { text: "Blues", category: "style" },
    { text: "Fingerstyle acoustic", category: "style" },
    { text: "Bossa nova", category: "style" },
    { text: "Rock riff", category: "style" },
    { text: "Folk fingerpicking", category: "style" },
    { text: "Funk rhythm guitar", category: "style" },
    { text: "Classical guitar", category: "style" },
    { text: "Clean tone ambient", category: "style" },
    { text: "Country chicken pickin'", category: "style" },
    { text: "Jazz comping", category: "style" },

    // Form (10)
    { text: "AABA", category: "form" },
    { text: "Theme and variations", category: "form" },
    { text: "Rondo (A B A C A)", category: "form" },
    { text: "12-bar blues", category: "form" },
    { text: "No repeated sections", category: "form" },
    { text: "Keep it under 16 bars", category: "form" },
    { text: "Verse — Chorus — Verse", category: "form" },
    { text: "Two contrasting sections (A B)", category: "form" },
    { text: "One section only", category: "form" },
    { text: "Intro — Build — Climax — Outro", category: "form" },

    // Harmony (10)
    { text: "Only 3 chords", category: "harmony" },
    { text: "Use open strings as drones", category: "harmony" },
    { text: "Power chords only", category: "harmony" },
    { text: "Only minor chords", category: "harmony" },
    { text: "Only barre chords", category: "harmony" },
    { text: "Use chord inversions up the neck", category: "harmony" },
    { text: "Only 2 chords", category: "harmony" },
    { text: "Mix clean chords with distorted parts", category: "harmony" },
    { text: "Stay in one position on the neck", category: "harmony" },
    { text: "Descending chord progression", category: "harmony" },

    // Melody (10)
    { text: "Based on a 3-note motif", category: "melody" },
    { text: "Play on one string only", category: "melody" },
    { text: "No big jumps — stepwise only", category: "melody" },
    { text: "Pentatonic only", category: "melody" },
    { text: "Must be singable", category: "melody" },
    { text: "Use bends and slides", category: "melody" },
    { text: "Write a catchy riff", category: "melody" },
    { text: "Call and response", category: "melody" },
    { text: "Use harmonics", category: "melody" },
    { text: "Use lots of space and silence", category: "melody" },

    // Rhythm (10)
    { text: "Shuffle feel", category: "rhythm" },
    { text: "3/4 waltz", category: "rhythm" },
    { text: "Syncopated strumming", category: "rhythm" },
    { text: "Free tempo", category: "rhythm" },
    { text: "Slow tempo", category: "rhythm" },
    { text: "Palm-muted chugging", category: "rhythm" },
    { text: "Arpeggiated chords only", category: "rhythm" },
    { text: "Lots of rests", category: "rhythm" },
    { text: "Odd meter (5/4 or 7/8)", category: "rhythm" },
    { text: "One repeating picking pattern", category: "rhythm" },
  ]
};

export const compositionChallengeExercise: Exercise = {
  id: "composition_challenge",
  title: "Composition Challenge",
  description: "Compose a piece in 40 minutes guided by 5 random constraints — style, form, harmony, melody, and rhythm. Every session generates a unique creative brief.",
  difficulty: "hard",
  category: "creativity",
  timeInMinutes: 40,
  instructions: [
    "Press play to generate 5 random composition rules.",
    "You'll get one constraint for each area: style, form, harmony, melody, and rhythm.",
    "Compose a short piece that follows ALL 5 rules simultaneously.",
    "Use notation, a DAW, or just your instrument — any method works.",
    "The rules stay fixed for the entire 40-minute session."
  ],
  tips: [
    "Start with the form constraint — it gives you structure to fill in.",
    "Don't aim for perfection. A rough sketch that follows all 5 rules is a win.",
    "If two rules seem to clash, find a creative compromise — that's where originality lives.",
    "Record your result! Comparing sessions over time shows real growth.",
    "Restart the exercise for a completely new set of constraints."
  ],
  metronomeSpeed: null,
  relatedSkills: ["composition"],
  riddleConfig: compositionChallengeConfig
};
