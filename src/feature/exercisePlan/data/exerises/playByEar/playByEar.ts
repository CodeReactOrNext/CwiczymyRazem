import type { Exercise } from "feature/exercisePlan/types/exercise.types";


export const playByEarExercise: Exercise = {
  id: "play_by_ear",
  title: "Playing By Ear",
  description: "Listen to an external audio fragment and reproduce it on the guitar without visual aids or tabs.",
  whyItMatters: "Transcribing audio directly to the fretboard connects your auditory processing to your physical playing. This eliminates reliance on sheet music and tabs, developing the crucial ability to play the melodies you hear in your head or in a live band setting.",
  difficulty: "medium",
  category: "hearing",
  timeInMinutes: 15,
  instructions: [
    "Select a short, simple riff or melody from a recording.",
    "Listen to the fragment multiple times, internalizing the rhythm and pitch contour before touching the guitar.",
    "Identify the root note or key center by trial and error on the fretboard.",
    "Reconstruct the phrase note-by-note on the guitar, making corrections until it matches the recording exactly.",
  ],
  tips: [
    "Sing the pitches out loud before attempting to find them on the fretboard.",
    "If you get stuck, use software to isolate the fragment or slow down the playback speed without changing the pitch.",
    "Test different fretboard positions for the same notes to find the most efficient fingering for the phrase.",
  ],
  metronomeSpeed: null,
  relatedSkills: ["ear_training"],
}; 