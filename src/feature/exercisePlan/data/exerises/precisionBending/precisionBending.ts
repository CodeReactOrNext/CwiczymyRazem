import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const precisionBendingExercise: Exercise = {
  id: "precision_bending",
  title: {
    pl: "Precyzyjne podciągnięcia",
    en: "Precision Bending",
  },
  description: {
    pl: "Ćwiczenie rozwijające precyzję i kontrolę podczas bendowania strun, skupiające się na dokładnym trafianiu w docelową wysokość dźwięku.",
    en: "Exercise developing precision and control when bending strings, focusing on accurately hitting target pitch.",
  },
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    {
      pl: "Zagraj dźwięk docelowy (np. nuta na 7. progu struny B), posłuchaj go uważnie.",
      en: "Play your target note (e.g., note on 7th fret of B string), listen to it carefully.",
    },
    {
      pl: "Następnie zagraj dźwięk wyjściowy (np. dźwięk na 5. progu tej samej struny).",
      en: "Then play your starting note (e.g., note on 5th fret of the same string).",
    },
    {
      pl: "Podciągnij strunę, próbując dokładnie trafić w wysokość usłyszanego wcześniej dźwięku docelowego.",
      en: "Bend the string, trying to hit exactly the pitch of the target note you heard earlier.",
    },
    {
      pl: "Sprawdź dokładność, grając ponownie dźwięk docelowy i porównując z twoim bendem.",
      en: "Check your accuracy by playing the target note again and comparing with your bend.",
    },
    {
      pl: "Powtórz proces dla różnych interwałów: półton (1 progi), cały ton (2 progi), półtora tonu (3 progi).",
      en: "Repeat the process for different intervals: half-step (1 fret), whole-step (2 frets), step-and-a-half (3 frets).",
    }
  ],
  tips: [
    {
      pl: "Używaj głównie mięśni przedramienia, nie tylko siły palców.",
      en: "Use mostly your forearm muscles, not just finger strength.",
    },
    {
      pl: "Utrzymuj stabilną pozycję nadgarstka podczas bendowania.",
      en: "Maintain a stable wrist position while bending.",
    },
    {
      pl: "Dla większych interwałów (cały ton i więcej) używaj wsparcia kilku palców dla większej kontroli.",
      en: "For larger intervals (whole tone and more), use multiple fingers to support the bend for better control.",
    },
    {
      pl: "Zwróć uwagę, aby nie dodawać vibrato - celem jest czyste, stabilne utrzymanie jednej wysokości.",
      en: "Be careful not to add vibrato - the goal is a clean, stable maintenance of a single pitch.",
    },
    {
      pl: "Regularnie sprawdzaj dokładność, porównując bend z dźwiękiem docelowym.",
      en: "Regularly check your accuracy by comparing your bend with the target note.",
    }
  ],
  metronomeSpeed: null,
  relatedSkills: ["bending",   "technique"],
}; 