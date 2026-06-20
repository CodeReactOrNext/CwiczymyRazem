import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const earTrainingEasy: Exercise = {
  id: "earTrainingEasy",
  isHiddenFromLanding: true,
  title: "Ear Training Level 1",
  description: "Recognize intervals and simple melodic movements to bridge ear-to-fretboard connection.",
  whyItMatters: "A well-trained ear allows you to translate the melodies in your head directly onto the guitar, transcribe songs quickly, and react dynamically to other musicians during a performance.",
  difficulty: "easy",
  category: "hearing",
  timeInMinutes: 5,
  instructions: [
    "Listen closely to the reference pitches and sing or hum them internally before playing.",
    "Focus on recognizing the spatial distance between the two notes."
  ],
  tips: [
    "Relate common intervals to the opening notes of familiar songs to memorize their sounds.",
    "Practice daily in short, focused bursts rather than long, fatiguing sessions."
  ],
  metronomeSpeed: {
    min: 40,
    max: 120,
    recommended: 80
  },
  relatedSkills: ['ear_training'],
  riddleConfig: {
    mode: "sequenceRepeat",
    difficulty: "easy",
    noteCount: 2,
    range: { minFret: 0, maxFret: 5, strings: [1, 2] } // Limit to top 2 strings
  }
};

export const earTrainingMedium: Exercise = {
  id: "earTrainingMedium",
  isHiddenFromLanding: true,
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
    min: 40,
    max: 120,
    recommended: 90
  },
  relatedSkills: ['ear_training'],
  riddleConfig: {
    mode: "sequenceRepeat",
    difficulty: "medium",
    noteCount: 4,
    range: { minFret: 0, maxFret: 12, strings: [1, 2, 3] }
  }
};

export const earTrainingHard: Exercise = {
  id: "earTrainingHard",
  isHiddenFromLanding: true,
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
    min: 40,
    max: 140,
    recommended: 100
  },
  relatedSkills: ['ear_training'],
  riddleConfig: {
    mode: "sequenceRepeat",
    difficulty: "hard",
    noteCount: 6
    // No range limit means full fretboard
  }
};
