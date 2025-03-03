import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderBasicExercise: Exercise = {
  id: "spider_basic",
  title: {
    pl: "Pajączki",
    en: "Spider Exercise",
  },
  description: {
    pl: "Ćwiczenie rozwijające precyzję lewej ręki oraz synchronizację z prawą ręką.",
    en: "Exercise developing left hand precision and synchronization with right hand.",
  },
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    {
      pl: "Wykonaj ćwiczenie 'pajączki' na gitarze, grając 4 dźwięki na jednym bicie (czyli szesnastki). Utrzymaj schemat pokazany na tabulaturze, przesuwając go co próg po wykonanym powtórzeniu.",
      en: "Perform the 'spider' exercise on the guitar, playing 4 notes per beat (i.e. sixteenths). Maintain the pattern shown on the tablature, shifting it every fret after completing a repetition.",
    },
   
  ],
  tips: [
    {
      pl: "Skup się na równomiernym nacisku i płynnych ruchach.",
      en: "Focus on even pressure and smooth movements.",
    },
    {
      pl: "Staraj się nie odrywać palców bez potrzeby, aby zachować stabilność i ekonomię ruchów.",
      en: "Try not to lift fingers unnecessarily to maintain stability and economy of movement.",
    },
    {
      pl: "Ćwicz intonację, upewniając się, że każdy dźwięk brzmi czysto i wyraźnie.",
      en: "Practice intonation, ensuring each note sounds clean and clear.",
    },
    {
      pl: "Kontroluj napięcie w dłoni, nie ściskaj gryfu zbyt mocno, ale utrzymuj stabilność.",
      en: "Control hand tension, don't squeeze the neck too hard but maintain stability.",
    },
    {
      pl: "Dostosuj tempo do własnych możliwości, stopniowo je zwiększając.",
      en: "Adjust tempo to your abilities, gradually increasing it.",
    },
    {
      pl: "Możesz dowolnie zmieniać pozycję na gryfie, aby ćwiczyć różne układy dłoni.",
      en: "You can freely change position on the fretboard to practice different hand arrangements.",
    },
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80,
  },
  relatedSkills: ["alternate_picking", "picking"],
  image: spiderBasicImage,
};