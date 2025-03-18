import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const triadImprovisationExercise: Exercise = {
  id: "triad_improvisation",
  title: {
    pl: "Improwizacja trójdźwiękami",
    en: "Triad Improvisation",
  },
  description: {
    pl: "Ćwiczenie rozwijające umiejętność improwizacji z użyciem trójdźwięków akordowych, wzmacniające świadomość harmonii i płynność melodii.",
    en: "Exercise developing improvisation skills using chord triads, strengthening harmonic awareness and melodic fluency.",
  },
  difficulty: "medium",
  category: "creativity",
  timeInMinutes: 12,
  instructions: [
    {
      pl: "Wybierz podkład muzyczny z wyraźną progresją akordów (np. blues, standard jazzowy, piosenka pop).",
      en: "Choose a backing track with a clear chord progression (e.g., blues, jazz standard, pop song).",
    },
    {
      pl: "Zidentyfikuj sekwencję akordów w podkładzie i wypisz odpowiadające im trójdźwięki.",
      en: "Identify the chord sequence in the backing track and list their corresponding triads.",
    },
    {
      pl: "Podczas grania, używaj wyłącznie nut z trójdźwięku aktualnie brzmiącego akordu (pryma, tercja, kwinta).",
      en: "While playing, use only notes from the triad of the currently sounding chord (root, third, fifth).",
    },
    {
      pl: "Zmieniaj trójdźwięki wraz ze zmianą akordów w podkładzie, budując melodie z tych trzech dźwięków.",
      en: "Change triads as the chords change in the backing track, building melodies from these three notes.",
    },
    {
      pl: "Eksperymentuj z różnymi inwersjami trójdźwięków, aby uzyskać płynniejsze przejścia melodyczne.",
      en: "Experiment with different triad inversions to achieve smoother melodic transitions.",
    }
  ],
  tips: [
    {
      pl: "Poznaj kształty trójdźwięków we wszystkich inwersja na różnych zestawach strun.",
      en: "Know the shapes of triads in all inversions on different string sets.",
    },
    {
      pl: "Mniej znaczy więcej - zamiast grać dużo nut, skup się na melodyczności i rytmicznej różnorodności.",
      en: "Less is more - instead of playing many notes, focus on melodiousness and rhythmic variety.",
    },
    {
      pl: "Spróbuj łączyć trójdźwięki z najbliższych pozycji - szukaj wspólnych dźwięków między akordami.",
      en: "Try connecting triads from the closest positions - look for common tones between chords.",
    },
    {
      pl: "Używaj arpeggios (rozłożonych akordów) oraz pionowych trójdźwięków w różnych kombinacjach.",
      en: "Use arpeggios (broken chords) and vertical triads in various combinations.",
    },
    {
      pl: "Zwróć uwagę na charakter tonalny każdego trójdźwięku - durowy, molowy, zmniejszony czy zwiększony.",
      en: "Pay attention to the tonal character of each triad - major, minor, diminished or augmented.",
    }
  ],
  metronomeSpeed: null,
  relatedSkills: ["harmony", "improvisation", "chord_theory", ],
}; 