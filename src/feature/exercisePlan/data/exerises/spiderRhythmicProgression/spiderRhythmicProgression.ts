import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const spiderRhythmicProgressionExercise: Exercise = {
  id: "spider_rhythmic_progression",
  title: {
    pl: "Pajączek - Progresja Rytmiczna",
    en: "Spider Exercise - Rhythmic Progression",
  },
  description: {
    pl: "Ćwiczenie łączące technikę pajączka ze stopniową zmianą wartości rytmicznych, od całej nuty do szesnastek i z powrotem.",
    en: "Exercise combining spider technique with gradual change of rhythmic values, from whole notes to sixteenth notes and back.",
  },
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    {
      pl: "Umieść palce lewej ręki na czterech kolejnych progach jednej struny.",
      en: "Place your left hand fingers on four consecutive frets of one string.",
    },
    {
      pl: "Rozpocznij od podstawowego wzoru 1-2-3-4 granego całymi nutami (jedna nuta na takt).",
      en: "Start with the basic 1-2-3-4 pattern played as whole notes (one note per bar).",
    },
    {
      pl: "W kolejnym powtórzeniu graj półnutami (dwie nuty na takt).",
      en: "In the next repetition, play half notes (two notes per bar).",
    },
    {
      pl: "Następnie ćwierćnutami (cztery nuty na takt).",
      en: "Then quarter notes (four notes per bar).",
    },
    {
      pl: "Kontynuuj ósemkami (osiem nut na takt).",
      en: "Continue with eighth notes (eight notes per bar).",
    },
    {
      pl: "Zakończ szesnastkami (szesnaście nut na takt).",
      en: "Finish with sixteenth notes (sixteen notes per bar).",
    },
    {
      pl: "Następnie wróć przez te same wartości rytmiczne do całych nut.",
      en: "Then return through the same rhythmic values back to whole notes.",
    }
  ],

  tips: [
    {pl: 'Ile trwa potórzenie dostosuj do swojego poziomu', en: 'How long should the hold be adjusted to your level'},
    {
      pl: "Używaj metronomu, aby utrzymać stałe tempo podczas zmiany wartości rytmicznych.",
      en: "Use a metronome to maintain steady tempo while changing rhythmic values.",
    },
    {
      pl: "Każda wartość rytmiczna powinna być grana przez co najmniej 4 takty przed zmianą.",
      en: "Each rhythmic value should be played for at least 4 bars before changing.",
    },
    {
      pl: "Zwróć uwagę na precyzję rytmiczną, szczególnie przy przejściach między wartościami.",
      en: "Pay attention to rhythmic precision, especially during transitions between values.",
    },
    {
      pl: "Utrzymuj równomierną głośność i czystość dźwięku niezależnie od tempa.",
      en: "Maintain even volume and clean sound regardless of tempo.",
    },
    {
      pl: "Jeśli masz trudności, możesz zatrzymać się na danej wartości rytmicznej i poćwiczyć ją dłużej.",
      en: "If you have difficulties, you can stay on a particular rhythmic value and practice it longer.",
    }
  ],
  metronomeSpeed: {
    min: 40,
    max: 120,
    recommended: 60
  },
  relatedSkills: ["finger_independence", "technique", "rhythm"],
}; 