import { Exercise } from "feature/exercisePlan/types/exercise.types";

export const earTrainingEasy: Exercise = {
  id: "earTrainingEasy",
  title: "Ear Training Level 1",
  description: "Listen to 2 notes and repeat them correctly.",
  difficulty: "easy",
  category: "hearing",
  timeInMinutes: 5,
  instructions: [
    "Press PLAY to hear a sequence of 2 notes.",
    "Try to find them on your guitar by ear.",
    "When you think you have it, play them.",
    "If you are stuck, click REVEAL to see the answer."
  ],
  tips: [
    "Listen to the interval distance.",
    "Is the second note higher or lower?"
  ],
  metronomeSpeed: {
    min: 60,
    max: 120,
    recommended: 80
  },
  relatedSkills: [],
  riddleConfig: {
    mode: "sequenceRepeat",
    difficulty: "easy",
    noteCount: 2,
    range: { minFret: 0, maxFret: 5, strings: [1, 2] } // Limit to top 2 strings
  }
};

export const earTrainingMedium: Exercise = {
  id: "earTrainingMedium",
  title: "Ear Training Level 2",
  description: "Listen to a short melody and repeat it.",
  difficulty: "medium",
  category: "hearing",
  timeInMinutes: 5,
  instructions: [
    "Listen to the 4-note melody.",
    "Replicate the melody on your guitar."
  ],
  tips: ["Focus on the starting note first."],
  metronomeSpeed: {
    min: 60,
    max: 120,
    recommended: 90
  },
  relatedSkills: [],
  riddleConfig: {
    mode: "sequenceRepeat",
    difficulty: "medium",
    noteCount: 4,
    range: { minFret: 0, maxFret: 12, strings: [1, 2, 3] }
  }
};

export const earTrainingHard: Exercise = {
  id: "earTrainingHard",
  title: "Ear Training Level 3",
  description: "Complex intervals and wider range.",
  difficulty: "hard",
  category: "hearing",
  timeInMinutes: 10,
  instructions: [
    "A complex 6-note sequence will play.",
    "Good luck!"
  ],
  tips: ["Write down the intervals if it helps."],
  metronomeSpeed: {
    min: 60,
    max: 140,
    recommended: 100
  },
  relatedSkills: [],
  riddleConfig: {
    mode: "sequenceRepeat",
    difficulty: "hard",
    noteCount: 6
    // No range limit means full fretboard
  }
};
