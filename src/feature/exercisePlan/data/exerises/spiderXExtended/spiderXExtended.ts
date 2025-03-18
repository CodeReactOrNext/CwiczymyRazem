import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderXExtendedExercise: Exercise = {
  id: "spider_x_extended",
  title: {
    pl: "Rozszerzony pająk X",
    en: "Extended Spider X Exercise",
  },
  description: {
    pl: "Zaawansowana wersja ćwiczenia X z większymi rozpiętościami i złożonymi wzorami.",
    en: "Advanced version of X exercise with wider stretches and complex patterns.",
  },
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 15,
  instructions: [
    {
      pl: "Rozpocznij od podstawowego wzoru X, następnie rozszerz układ o dodatkowy próg.",
      en: "Start with basic X pattern, then extend the layout by an additional fret.",
    },
    {
      pl: "Wykonuj sekwencję na trzech sąsiednich strunach.",
      en: "Perform the sequence on three adjacent strings.",
    },
    {
      pl: "Dodaj zmiany kierunku w ramach wzoru.",
      en: "Add direction changes within the pattern.",
    },
    {
      pl: "Połącz różne warianty rozszerzonego wzoru X.",
      en: "Combine different variants of the extended X pattern.",
    }
  ],
  tips: [
    {
      pl: "Zachowaj szczególną uwagę na ergonomię przy większych rozpiętościach.",
      en: "Pay special attention to ergonomics with wider stretches.",
    },
    {
      pl: "Dostosuj pozycję nadgarstka do rozszerzonego układu.",
      en: "Adjust wrist position for the extended layout.",
    },
    {
      pl: "Rób przerwy przy pierwszych oznakach zmęczenia.",
      en: "Take breaks at first signs of fatigue.",
    },
    {
      pl: "Stopniowo zwiększaj złożoność wzorów.",
      en: "Gradually increase pattern complexity.",
    },
    {
      pl: "Regularnie wracaj do podstawowej wersji dla porównania.",
      en: "Regularly return to basic version for comparison.",
    }
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 90,
  },
  relatedSkills: ["alternate_picking", "picking", "finger_independence"],
  image: spiderBasicImage,
};