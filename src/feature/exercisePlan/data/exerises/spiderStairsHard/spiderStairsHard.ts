import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderStairsHardExercise: Exercise = {
  id: "spider_stairs_hard",
  title: {
    pl: "Pająki schodkowe - zaawansowane",
    en: "Advanced Spider Stairs Exercise",
  },
  description: {
    pl: "Zaawansowana wersja ćwiczenia schodkowego z większymi odstępami między dźwiękami i szybszym tempem.",
    en: "Advanced version of the stairs exercise with wider note intervals and faster tempo.",
  },
  difficulty: "intermediate",
  category: "technique",
  timeInMinutes: 15,
  instructions: [
    {
      pl: "Zacznij od pierwszego progu na strunie E, używając układu palców 1-2-4.",
      en: "Start from the first fret on the E string, using fingers 1-2-4.",
    },
    {
      pl: "Przejdź na następną strunę przesuwając się o dwa progi wyżej.",
      en: "Move to the next string shifting two frets higher.",
    },
    {
      pl: "Kontynuuj wzór aż do najwyższej struny, zwiększając rozpiętość między palcami.",
      en: "Continue the pattern until the highest string, increasing finger stretch.",
    },
    {
      pl: "Wróć tą samą drogą w dół, zachowując precyzję ruchów.",
      en: "Return the same way down, maintaining movement precision.",
    }
  ],
  tips: [
    {
      pl: "Zachowaj szczególną uwagę na precyzję przy większych rozpiętościach.",
      en: "Pay special attention to precision with wider stretches.",
    },
    {
      pl: "Utrzymuj nadgarstek w prawidłowej pozycji mimo większych odległości.",
      en: "Maintain proper wrist position despite larger distances.",
    },
    {
      pl: "Kontroluj siłę nacisku - przy większych rozpiętościach łatwo o nadmierny nacisk.",
      en: "Control pressure - it's easy to press too hard with wider stretches.",
    },
    {
      pl: "Jeśli czujesz dyskomfort, zmniejsz tempo lub wróć do podstawowej wersji.",
      en: "If you feel discomfort, reduce tempo or return to the basic version.",
    },
    {
      pl: "Ćwicz naprzemiennie wersję podstawową i zaawansowaną.",
      en: "Practice alternating between basic and advanced versions.",
    }
  ],
  metronomeSpeed: {
    min: 60,
    max: 200,
    recommended: 90,
  },
  relatedSkills: ["alternate_picking", "picking", "legato"],
  image: spiderBasicImage,
};