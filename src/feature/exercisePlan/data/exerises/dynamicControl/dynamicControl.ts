import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const dynamicControlExercise: Exercise = {
  id: "dynamic_control",
  title: "Dynamic Control",
  description:
    "Beginner-friendly exercise focused on conscious control of playing volume, developing awareness of soft and loud dynamics without changing rhythm or notes.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 3,
  instructions: [
    "Choose a simple sound to repeat: a single chord or a single note on one string.",
    "Set a steady rhythm with a metronome (e.g. quarter notes at around 60 BPM).",
    "Keep the rhythm and notes exactly the same for the entire exercise — only change volume.",
    "Start playing as quietly as possible (pianissimo), keeping each note clear and controlled.",
    "Gradually increase volume with each note until you reach a strong but controlled forte.",
    "After reaching forte, gradually decrease volume back down to very soft playing.",
    "Finish the exercise with a few very quiet notes, maintaining full control and steady timing."
  ],
  tips: [
    "Focus only on volume — do not speed up or slow down as dynamics change.",
    "Avoid changing tone color or hand position; let volume be the only variable.",
    "Aim for smooth, gradual changes rather than sudden jumps in loudness.",
    "If notes disappear when playing quietly, slightly increase attack while staying soft.",
    "Recording yourself can help you hear whether dynamic changes are clear and intentional."
  ],
  metronomeSpeed: {
    min: 60,
    max: 100,
    recommended: 60,
  },
  relatedSkills: [
    "articulation",
    "technique",
    "rhythm",
    "phrasing"
  ],
};
