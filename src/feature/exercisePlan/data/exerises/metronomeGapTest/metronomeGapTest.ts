import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const metronomeGapTestExercise: Exercise = {
  id: "metronome_gap_test",
  title: "Metronome Gap Test",
  description: "Maintain a steady rhythmic pulse while the metronome is muted for several measures.",
  whyItMatters: "This exercise exposes whether you are genuinely internalizing the tempo or just blindly following an external click. By forcing you to maintain the grid during silence, it develops the deep internal timing required to lead a band, lock in with a drummer, and prevent rushing or dragging.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 5,
  instructions: [
    "Select a basic strumming pattern or scale sequence.",
    "Configure a metronome to mute itself for specific intervals (e.g., 2 measures audible, 2 measures silent).",
    "Play continuously through both sections without altering your physical motion.",
    "Assess your timing accuracy at the exact moment the metronome click returns.",
  ],
  tips: [
    "Mentally subdivide the beat (e.g., counting '1 & 2 & 3 & 4 &') during the silent gaps to prevent tempo drift.",
    "Close your eyes or look away from the metronome so you do not rely on visual flashing cues.",
    "If you fail to align with the returning click, actively note whether you arrived early (rushing) or late (dragging) to correct your natural tendency.",
  ],
  metronomeSpeed: {
    min: 40,
    max: 120,
    recommended: 80,
  },
  relatedSkills: ["rhythm"],
};
