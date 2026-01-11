import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const callAndResponsePhrasingExercise: Exercise = {
  id: "call_and_response_phrasing",
  title: "Call and Response Phrasing",
  description:
    "Exercise developing musical phrasing through a call-and-response approach, teaching how to create tension and resolution by treating phrases as questions and answers.",
  difficulty: "medium",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    "Choose a key or scale and stay within it for the entire exercise to reduce cognitive load.",
    "Play pairs of short phrases: the first phrase acts as a musical question, the second as an answer.",
    "Keep phrases short and clear (start with 1–2 bars per phrase).",
    "Insert a brief pause between the question and the answer to clearly separate musical ideas.",
    "End the question phrase on a note that creates tension or feels unresolved.",
    "Play the answer phrase as a resolution, ideally ending on a chord tone or consonant note.",
    "Make sure the answer relates to the question in some way (rhythm, contour, or motif).",
    "Use a metronome at a moderate tempo and maintain a clear sense of pulse throughout."
  ],
  tips: [
    "Think of each phrase as a spoken sentence with a beginning and an end.",
    "Avoid filling every moment with notes — silence is part of the dialogue.",
    "Experiment with contrast between question and answer using rhythm, dynamics, or articulation.",
    "If phrases start blending together, exaggerate the pauses between them.",
    "Listen critically: you should feel anticipation after the question and closure after the answer."
  ],
  metronomeSpeed: null,
  relatedSkills: [
    "phrasing",
    "improvisation",
    "articulation",
    "rhythm",
    "ear_training"
  ],
};
