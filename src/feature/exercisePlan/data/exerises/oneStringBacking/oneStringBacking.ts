import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const oneStringBackingExercise: Exercise = {
  id: "one_string_backing",
  title: {
    pl: "Frazowanie na jednej strunie",
    en: "Single String Phrasing",
  },
  description: {
    pl: "Ćwiczenie rozwijające umiejętność frazowania i ekspresji muzycznej poprzez ograniczenie gry do jednej struny.",
    en: "Exercise developing phrasing skills and musical expression by restricting playing to a single string.",
  },
  difficulty: "medium",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    {
      pl: "Znajdź na YouTube podkład muzyczny (backing track) w stylu, który lubisz.",
      en: "Find a YouTube backing track in a style that you enjoy.",
    },
    {
      pl: "Wybierz jedną strunę na gitarze (np. G lub B) i postanów grać wyłącznie na niej.",
      en: "Choose one string on your guitar (e.g., G or B) and commit to playing only on it.",
    },
    {
      pl: "Określ tonację podkładu i znajdź na wybranej strunie nuty, które pasują do tej tonacji.",
      en: "Determine the key of the backing track and find notes on your chosen string that fit this key.",
    },
    {
      pl: "Improwizuj do podkładu, używając tylko tej jednej struny, skupiając się na frazowaniu i ekspresji.",
      en: "Improvise to the backing track using only this one string, focusing on phrasing and expression.",
    },
    {
      pl: "Eksperymentuj z różnymi technikami ekspresji: podciągnięcia, vibrato, podjazdy, ghost notes.",
      en: "Experiment with various expression techniques: bends, vibrato, slides, ghost notes.",
    }
  ],
  tips: [
    {
      pl: "Gra na jednej strunie zmusza do kreatywnego myślenia - wykorzystaj tę szansę!",
      en: "Playing on one string forces creative thinking - use this opportunity!",
    },
    {
      pl: "Pauzy są równie ważne jak nuty - wykorzystuj przestrzeń muzyczną.",
      en: "Pauses are as important as notes - utilize musical space.",
    },
    {
      pl: "Eksperymentuj z różnymi rejestrami struny, od niskich pozycji po wysokie.",
      en: "Experiment with different registers of the string, from low positions to high ones.",
    },
    {
      pl: "Wykorzystaj dynamikę - zmieniaj siłę uderzenia, aby uzyskać różne odcienie ekspresji.",
      en: "Use dynamics - vary your picking strength to achieve different shades of expression.",
    },
    {
      pl: "Spróbuj naśladować frazowanie wokalne - pomyśl o swojej grze jako o śpiewie.",
      en: "Try to imitate vocal phrasing - think of your playing as singing.",
    }
  ],
  metronomeSpeed: null,
  relatedSkills: ["phrasing", "improvisation",  "ear_training"],
}; 