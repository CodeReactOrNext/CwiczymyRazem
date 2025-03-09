import type { Exercise } from "feature/exercisePlan/types/exercise.types";


export const playByEarExercise: Exercise = {
  id: "play_by_ear",
  title: {
    pl: "Granie ze słuchu",
    en: "Playing By Ear",
  },
  description: {
    pl: "Ćwiczenie rozwijające umiejętność słuchania i odtwarzania muzyki.",
    en: "Exercise developing the ability to listen and reproduce music without sheet music.",
  },
  difficulty: "medium",
  category: "hearing",
  timeInMinutes: 15,
  instructions: [
    {
      pl: "Wybierz prosty riff lub fragment piosenki, najlepiej z gatunku, który znasz.",
      en: "Choose a simple riff or song fragment, preferably from a genre you're familiar with.",
    },
    {
      pl: "Posłuchaj fragmentu kilkukrotnie, skupiając się najpierw na rytmie i strukturze.",
      en: "Listen to the fragment several times, focusing first on rhythm and structure.",
    },
    {
      pl: "Powoli odtwarzaj fragment na gitarze, poprawiając błędy i dostosowując grę.",
      en: "Slowly reproduce the fragment on guitar, correcting mistakes and adjusting your playing.",
    },
    {
      pl: "Powtarzaj do momentu, gdy będziesz zadowolony z rezultatu, lub do końca czasu ćwiczenia.",
      en: "Repeat until you're satisfied with the result or until the end of the exercise time.",
    }
  ],
  tips: [
    {
      pl: "Zacznij od prostych, jednoliniowych riffów - unikaj na początku skomplikowanych utworów.",
      en: "Start with simple, single-line riffs - avoid complicated pieces at the beginning.",
    },
    {
      pl: "Wykorzystaj technologię - aplikacje pozwalające na spowolnienie utworu lub wyizolowanie fragmentów mogą być pomocne.",
      en: "Use technology - apps allowing song slowdown or isolating fragments can be helpful.",
    },
    {
      pl: "Śpiewaj dźwięki, które słyszysz, zanim zagrasz je na gitarze - to pomaga w internalizacji dźwięków.",
      en: "Sing the notes you hear before playing them on guitar - this helps internalize the sounds.",
    },
    {
      pl: "Nie bój się eksperymentować na różnych strunach i pozycjach, aby znaleźć właściwe dźwięki.",
      en: "Don't be afraid to experiment on different strings and positions to find the right notes.",
    },
  
  ],
  metronomeSpeed: null,
  relatedSkills: ["ear_training", "transcription"],
}; 