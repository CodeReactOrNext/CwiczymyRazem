import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const callAndResponsePhrasingExercise: Exercise = {
  id: "call_and_response_phrasing",
  title: "Call and Response Phrasing",
  description: "Improvise contrasting pairs of musical phrases to structure guitar solos into clear questions and answers.",
  whyItMatters: "This exercise develops structural phrasing and melodic storytelling during improvisation. By forcing you to separate solos into distinct pairs of 'questions' (tense/unresolved) and 'responses' (resolved), you learn to use pauses effectively, build and release tension logically, and keep your listeners engaged.",
  difficulty: "medium",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    "Play a short, 1-2 measure 'question' phrase that ends on an unresolved interval (such as a 2nd or 5th).",
    "Leave a clear, silent pause to let the musical tension hang in the air.",
    "Play an 'answer' phrase that resolves cleanly back to a chord tone (such as the root or 3rd).",
  ],
  tips: [
    "Do not try to play constantly — silence is what defines the separation between your musical ideas.",
    "Vary the rhythm or length of the response to create immediate contrast with the question.",
    "Stay within a single scale shape initially to focus entirely on rhythmic phrasing and structural contour.",
  ],
  metronomeSpeed: null,
  relatedSkills: [
    "phrasing",
    "improvisation",
  ],
  requiresBackingTrack: true,
};
