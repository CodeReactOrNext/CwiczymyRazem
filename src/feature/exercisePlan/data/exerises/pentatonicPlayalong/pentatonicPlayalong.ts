import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const pentatonicPlayalongExercise: Exercise = {
  id: "pentatonic_playalong_best_of",
  title: "Pentatonic Best Of - Guitar Playalongs",
  description: "Practice pentatonic scales along with the video. The best pentatonic exercises in one place.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 13,
  instructions: [
    "Play the video and follow along with the instructor",
    "Pay attention to fingering and clarity of sound",
    "Try to keep up with the tempo in the video"
  ],
  tips: [],
  metronomeSpeed: null,
  relatedSkills: [],
  youtubeVideoId: "nMV64UCrtFw",
  isPlayalong: true,
  videoUrl: "https://www.youtube.com/watch?v=nMV64UCrtFw",
  links: [
    { label: "Patreon", url: "https://patreon.com/guitar_playalongs" },
    { label: "Instagram", url: "https://instagram.com/toni_watzinger" },
    { label: "Facebook", url: "https://facebook.com/profile.php?id=61568130584535" },
    { label: "Website", url: "https://music-passion.ch" },
    { label: "Fashion for Guitarists", url: "https://tinyurl.com/da8237wp" }
  ]
};
