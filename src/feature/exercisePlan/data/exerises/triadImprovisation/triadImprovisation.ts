import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const triadImprovisationExercise: Exercise = {
  id: "triad_improvisation",
  title: "Triad Improvisation",
  description: "Improvise solos purely using three-note triad shapes over a backing track.",
  whyItMatters: "Limiting yourself to triads forces you to learn chord shapes inside out and connect them melodically across the neck. It prevents you from playing mindless scale runs and makes your solos sound highly structured.",
  requiresBackingTrack: true,
  difficulty: "hard",
  category: "creativity",
  timeInMinutes: 12,
  instructions: [
    "Start a backing track and improvise freely over it using only triad shapes.",
    "Construct melodic phrases using only the notes of the active triad shapes.",
    "Connect adjacent triad shapes smoothly as you improvise."
  ],
  tips: [
    "Focus on rhythmic phrasing and dynamics to make the limited note selection interesting.",
    "Use slides and bends to connect triad shapes across the neck."
  ],
  metronomeSpeed: null,
  relatedSkills: ["harmony", "improvisation", "chords"],
  additionalText: `Most guitarists learn scales and never escape them — pentatonic boxes become autopilot highways that produce technically clean but harmonically vague solos. Triad improvisation is the antidote. A triad is just three notes — root, third, fifth — but those three notes define the chord more precisely than any scale run. Every note you play is directly tied to the harmony, so your solos stop being "in the key" and start being "on the chord."

The constraint forces real phrasing skills: where you start a phrase, where you land, how long you hold a note, when you leave silence. These decisions separate melodic players from fast ones.

Start with a drone or looped single chord. Find one triad shape, build a short four-to-eight note phrase, then move to the next inversion one position higher. Make each shape sound musical before moving on. As you improve, add a second chord and practice landing on a strong triad tone on beat one of each change — that target-note thinking is the foundation of vocabulary that works across rock, blues, jazz, and fusion.`,
}; 