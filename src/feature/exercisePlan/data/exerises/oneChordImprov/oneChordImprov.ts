import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const oneChordImprovExercise: Exercise = {
  id: "one_chord_improv",
  title: {
    pl: "Improwizacja do jednego akordu",
    en: "Single Chord Improvisation",
  },
  description: {
    pl: "Ćwiczenie rozwijające kreatywność i zrozumienie harmonii poprzez improwizację nad jednym, niezmieniającym się akordem.",
    en: "Exercise developing creativity and harmonic understanding through improvisation over a single, unchanging chord.",
  },
  difficulty: "medium",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    {
      pl: "Wybierz jeden akord (np. Dmaj7, G7, Am9) lub nagraj prosty loop akordowy. Możesz użyć również użyć dowolnego podkładu.",
      en: "Choose one chord (e.g., Dmaj7, G7, Am9) or record a simple chord loop. You can also use any backing track.",
    },
    {
      pl: "Zidentyfikuj skalę lub skale, które pasują do wybranego akordu.",
      en: "Identify scale or scales that match your chosen chord.",
    },
    {
      pl: "Przez pierwsze 2 minuty improwizuj używając tylko dźwięków akordowych (pryma, tercja, kwinta, septyma).",
      en: "For the first 2 minutes, improvise using only chord tones (root, third, fifth, seventh).",
    },
    {
      pl: "Przez kolejne 4 minuty dodaj dźwięki skalowe (sekunda, kwarta, seksta, nona).",
      en: "For the next 4 minutes, add scale tones (second, fourth, sixth, ninth).",
    },
    {
      pl: "W ostatnich minutach eksperymentuj z dźwiękami spoza skali jako przejścia i dźwięki napięciowe.",
      en: "In the final minutes, experiment with outside notes as passing tones and tension builders.",
    }
  ],
  tips: [
    {
      pl: "Nie staraj się grać za dużo nut - czasem jedna, dobrze wybrana nuta ma większą siłę wyrazu.",
      en: "Don't try to play too many notes - sometimes one well-chosen note has more expressive power.",
    },
    {
      pl: "Zwróć uwagę na to, jak różne dźwięki skali tworzą różne napięcia nad akordem.",
      en: "Notice how different scale tones create different tensions over the chord.",
    },
    {
      pl: "Eksperymentuj z różnymi rejestrami gitary - te same nuty mają inny charakter w różnych oktawach.",
      en: "Experiment with different guitar registers - the same notes have different character in different octaves.",
    },
    {
      pl: "Myśl o swojej improwizacji jako o historii - z początkiem, rozwinięciem i zakończeniem.",
      en: "Think of your improvisation as a story - with beginning, development and ending.",
    },
    {
      pl: "Eksperymentuj z rytmem - nawet na jednym akordzie, zmiana rytmu może stworzyć poczucie rozwoju.",
      en: "Experiment with rhythm - even on one chord, changing rhythm can create a sense of development.",
    }
  ],
  metronomeSpeed: null,
  relatedSkills: ["improvisation", "harmony"
    , "chord_theory"],
}; 