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
    "Listen carefully to the reference sequence before reproducing it on the fretboard.",
    "Sing or hum the pitches aloud to reinforce the brain-to-fretboard connection.",
    "Transcribe the melody purely by ear, relying on relative interval recognition."
  ],
  tips: [
    "Focus on the distance between notes rather than trying to guess absolute fret positions.",
    "Practice without looking at your fretboard to build pure auditory-motor memory.",
    "Start with simple three-note phrases before moving to complex arrangements."
  ],
  metronomeSpeed: null,
  relatedSkills: ["ear_training"],
}; 