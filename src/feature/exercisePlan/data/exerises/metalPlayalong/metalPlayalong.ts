import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const metalPlayalongExercise: Exercise = {
  id: "metal_playalong_basic",
  title: {
    pl: "Metal Guitar Playalong",
    en: "Metal Guitar Playalong"
  },
  description: {
    pl: "Ćwicz razem z filmem - metal guitar exercises. Graj synchronicznie z instruktorem i rozwijaj swoją technikę.",
    en: "Practice along with video - metal guitar exercises. Play synchronously with the instructor and develop your technique."
  },
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    {
      pl: "Włącz film i graj razem z instruktorem",
      en: "Play the video and follow along with the instructor"
    },
    {
      pl: "Synchronizuj swoje tempo z filmem",
      en: "Synchronize your tempo with the video"
    },
    {
      pl: "Skup się na czystości dźwięku i precyzji",
      en: "Focus on clean sound and precision"
    },
    {
      pl: "Powtarzaj trudniejsze fragmenty używając pauzy",
      en: "Repeat harder sections using pause"
    }
  ],
  tips: [
    {
      pl: "Możesz pauzować film w dowolnym momencie, aby przećwiczyć trudniejsze fragmenty",
      en: "You can pause the video at any time to practice harder sections"
    },
    {
      pl: "Zacznij od wolniejszego tempa, jeśli film jest zbyt szybki",
      en: "Start with slower tempo if the video is too fast"
    },
    {
      pl: "Zwróć uwagę na technikę prawej i lewej ręki instruktora",
      en: "Pay attention to the instructor's right and left hand technique"
    }
  ],
  metronomeSpeed: null,
  relatedSkills: ["technique", "alternate_picking"],
  youtubeVideoId: "aHaPgeCbEMQ",
  isPlayalong: true,
  videoUrl: "https://www.youtube.com/watch?v=aHaPgeCbEMQ",
  links: [
    { label: "TAB + Backing Track", url: "https://www.patreon.com/bazok" },
    { label: "Facebook", url: "https://www.facebook.com/bazokguitar" },
    { label: "Instagram", url: "https://www.instagram.com/bazokguitar" },
    { label: "Twitter", url: "https://www.twitter.com/bazokguitar" }
  ]
};
