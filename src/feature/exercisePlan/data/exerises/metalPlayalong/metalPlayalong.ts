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

export const musicianFitnessLvl1S1Exercise: Exercise = {
  id: "musician_fitness_lvl1_s1",
  title: {
    pl: "Level #1 Session #1 - Spider Crawls, Strumming, Chords",
    en: "Level #1 Session #1 - Spider Crawls, Strumming, Chords"
  },
  description: {
    pl: "Sesja treningowa dla początkujących: Spider Crawls, bicie, Power chordy i riffy. Graj razem z instruktorem.",
    en: "Beginner practice session: Spider Crawls, strumming, Power chords, and riffs. Play along with the instructor."
  },
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 12,
  instructions: [
    {
      pl: "Podążaj za instruktorem na ekranie",
      en: "Follow the instructor on screen"
    },
    {
      pl: "Zwróć uwagę na technikę Spider Crawls",
      en: "Focus on Spider Crawl technique"
    },
    {
      pl: "Utrzymuj równe bicie przy Power Chordach",
      en: "Keep steady strumming during Power Chords"
    }
  ],
  tips: [
    {
      pl: "Nie spiesz się, ważniejsza jest czystość dźwięku",
      en: "Don't rush, sound clarity is more important"
    },
    {
      pl: "Upewnij się, że kciuk jest poprawnie ustawiony z tyłu gryfu",
      en: "Make sure your thumb is correctly positioned behind the neck"
    }
  ],
  metronomeSpeed: null,
  relatedSkills: ["technique", "picking"],
  youtubeVideoId: "PiY1uDAGhVM",
  isPlayalong: true,
  videoUrl: "https://www.youtube.com/watch?v=PiY1uDAGhVM",
  links: [
    { label: "YouTube", url: "https://www.youtube.com/@MusicianFitness" },
    { label: "Support Author", url: "https://coff.ee/musicianfitness" }
  ]
};

export const musicianFitnessLvl1S2Exercise: Exercise = {
  id: "musician_fitness_lvl1_s2",
  title: {
    pl: "Level #1 Session #2 - Speeding Up & Changing Chords",
    en: "Level #1 Session #2 - Speeding Up & Changing Chords"
  },
  description: {
    pl: "Druga sesja poziomu 1: Przyspieszanie tempa i płynne zmiany akordów.",
    en: "Level 1 Session 2: Increasing speed and smooth chord transitions."
  },
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 14,
  instructions: [
    {
      pl: "Skup się na płynnej zmianie między akordami",
      en: "Focus on smooth transitions between chords"
    },
    {
      pl: "Staraj się nadążyć za rosnącym tempem",
      en: "Try to keep up with the increasing tempo"
    }
  ],
  tips: [
    {
      pl: "Jeśli tempo jest za szybkie, wróć do momentu w którym czułeś się pewnie",
      en: "If the tempo is too fast, go back to the point where you felt confident"
    },
    {
      pl: "Wykorzystuj technikę 'pivot fingers' przy zmianie akordów",
      en: "Use 'pivot fingers' technique during chord changes"
    }
  ],
  metronomeSpeed: null,
  relatedSkills: ["technique", "rhythm"],
  youtubeVideoId: "QWSfpBlzj20",
  isPlayalong: true,
  videoUrl: "https://youtu.be/QWSfpBlzj20",
  links: [
    { label: "YouTube", url: "https://www.youtube.com/@MusicianFitness" },
    { label: "Support Author", url: "https://coff.ee/musicianfitness" }
  ]
};

export const musicianFitnessLvl1S3Exercise: Exercise = {
  id: "musician_fitness_lvl1_s3",
  title: {
    pl: "Level #1 Session #3 - Open Chords, Powerchords, Strumming",
    en: "Level #1 Session #3 - Open Chords, Powerchords, Strumming"
  },
  description: {
    pl: "Trzecia sesja poziomu 1: Akordy otwarte, Power chordy, bicie i cały utwór. Graj razem z instruktorem.",
    en: "Level 1 Session 3: Open Chords, Powerchords, strumming, and a full song. Play along with the instructor."
  },
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 15,
  instructions: [
    {
      pl: "Skup się na czystości akordów otwartych",
      en: "Focus on the clarity of open chords"
    },
    {
      pl: "Utrzymuj rytm przez cały utwór",
      en: "Maintain the rhythm throughout the full song"
    }
  ],
  tips: [
    {
      pl: "Pamiętaj o rozluźnieniu lewej ręki",
      en: "Remember to keep your left hand relaxed"
    },
    {
      pl: "Zwracaj uwagę na dynamikę bicia",
      en: "Pay attention to the dynamics of your strumming"
    }
  ],
  metronomeSpeed: null,
  relatedSkills: ["technique", "rhythm"],
  youtubeVideoId: "4e9RvY0ko08",
  isPlayalong: true,
  videoUrl: "https://youtu.be/4e9RvY0ko08",
  links: [
    { label: "YouTube", url: "https://www.youtube.com/@MusicianFitness" },
    { label: "Support Author", url: "https://coff.ee/musicianfitness" }
  ]
};

export const musicianFitnessLvl1S4Exercise: Exercise = {
  id: "musician_fitness_lvl1_s4",
  title: {
    pl: "Level #1 Session #4 - Pinky Control, Smooth Chord Changes",
    en: "Level #1 Session #4 - Pinky Control, Smooth Chord Changes"
  },
  description: {
    pl: "Czwarta sesja poziomu 1: Kontrola małego palca i płynne zmiany akordów. Graj razem z instruktorem.",
    en: "Level 1 Session 4: Pinky control and smooth chord changes. Play along with the instructor."
  },
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 15,
  instructions: [
    {
      pl: "Skup się na precyzyjnym użyciu małego palca",
      en: "Focus on precise pinky finger usage"
    },
    {
      pl: "Staraj się zmieniać akordy bez przrywania rytmu",
      en: "Try to change chords without breaking the rhythm"
    }
  ],
  tips: [
    {
      pl: "Utrzymuj mały palec blisko gryfu, nawet gdy go nie używasz",
      en: "Keep your pinky close to the fretboard even when not in use"
    },
    {
      pl: "Ćwicz zmiany akordów powoli, dbając o czystość każdego dźwięku",
      en: "Practice chord changes slowly, ensuring every note is clean"
    }
  ],
  metronomeSpeed: null,
  relatedSkills: ["technique", "picking"],
  youtubeVideoId: "l3TKHRUlK9U",
  isPlayalong: true,
  videoUrl: "https://youtu.be/l3TKHRUlK9U",
  links: [
    { label: "YouTube", url: "https://www.youtube.com/@MusicianFitness" },
    { label: "Support Author", url: "https://coff.ee/musicianfitness" }
  ]
};

export const musicianFitnessLvl1S5Exercise: Exercise = {
  id: "musician_fitness_lvl1_s5",
  title: {
    pl: "Level #1 Session #5 - Smoke on the Water",
    en: "Level #1 Session #5 - Smoke on the Water"
  },
  description: {
    pl: "Piąta sesja poziomu 1: Naucz się Smoke on the Water! Graj razem z instruktorem.",
    en: "Level 1 Session 5: Learn Smoke on the Water! Play along with the instructor."
  },
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 12,
  instructions: [
    {
      pl: "Opanuj riff Smoke on the Water używając power chordów lub palców",
      en: "Master the Smoke on the Water riff using power chords or fingers"
    },
    {
      pl: "Zwróć uwagę na timing i rytm utworu",
      en: "Pay attention to the timing and rhythm of the song"
    }
  ],
  tips: [
    {
      pl: "Używaj techniki 'double stops' (dwóch strun naraz) dla autentycznego brzmienia",
      en: "Use 'double stops' technique for an authentic sound"
    },
    {
      pl: "Skup się na czystości dźwięku przy przechodzeniu między pozycjami",
      en: "Focus on clean notes when shifting between positions"
    }
  ],
  metronomeSpeed: null,
  relatedSkills: ["technique", "picking"],
  youtubeVideoId: "YnNdHcxiJTY",
  isPlayalong: true,
  videoUrl: "https://youtu.be/YnNdHcxiJTY",
  links: [
    { label: "YouTube", url: "https://www.youtube.com/@MusicianFitness" },
    { label: "Support Author", url: "https://coff.ee/musicianfitness" }
  ]
};

export const musicianFitnessLvl1S6Exercise: Exercise = {
  id: "musician_fitness_lvl1_s6",
  title: {
    pl: "Level #1 Session #6 - Riffs, Chords, Spider Crawls",
    en: "Level #1 Session #6 - Riffs, Chords, Spider Crawls"
  },
  description: {
    pl: "Szósta sesja poziomu 1: Riffy, zmiany akordów, Spider Crawls i więcej. Graj razem z instruktorem.",
    en: "Level 1 Session 6: Riffs, chord changes, Spider Crawls, and more. Play along with the instructor."
  },
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 16,
  instructions: [
    {
      pl: "Połącz wszystkie dotychczasowe techniki w jednej sesji",
      en: "Combine all previous techniques in one session"
    },
    {
      pl: "Skup się na płynności przejść między ćwiczeniami",
      en: "Focus on the flow between different exercises"
    }
  ],
  tips: [
    {
      pl: "Utrzymuj stałe tempo, nawet gdy technika staje się wyzwaniem",
      en: "Maintain a steady tempo even as the technique gets challenging"
    },
    {
      pl: "Skoncentruj się na synchronizacji rąk przy riffach",
      en: "Concentrate on hand synchronization during riffs"
    }
  ],
  metronomeSpeed: null,
  relatedSkills: ["technique", "picking"],
  youtubeVideoId: "d1Vtdtx_Xwo",
  isPlayalong: true,
  videoUrl: "https://youtu.be/d1Vtdtx_Xwo",
  links: [
    { label: "YouTube", url: "https://www.youtube.com/@MusicianFitness" },
    { label: "Support Author", url: "https://coff.ee/musicianfitness" }
  ]
};

export const musicianFitnessLvl1S7Exercise: Exercise = {
  id: "musician_fitness_lvl1_s7",
  title: {
    pl: "Level #1 Session #7 - Spider Crawls, Common Chords, Songs",
    en: "Level #1 Session #7 - Spider Crawls, Common Chords, Songs"
  },
  description: {
    pl: "Siódma sesja poziomu 1: Spider Crawls, popularne zmiany akordów i proste piosenki. Graj razem z instruktorem.",
    en: "Level 1 Session 7: Spider Crawls, common chord changes, and easy songs. Play along with the instructor."
  },
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 16,
  instructions: [
    {
      pl: "Utrzymuj precyzję przy Spider Crawls",
      en: "Maintain precision during Spider Crawls"
    },
    {
      pl: "Zwróć uwagę na płynność zmian między najpopularniejszymi akordami",
      en: "Focus on the smoothness of common chord transitions"
    }
  ],
  tips: [
    {
      pl: "Staraj się przewidywać kolejny akord przed jego zagraniem",
      en: "Try to anticipate the next chord before playing it"
    },
    {
      pl: "Używaj minimalnego nacisku potrzebnego do wydobycia czystego dźwięku",
      en: "Use the minimum pressure needed to get a clean sound"
    }
  ],
  metronomeSpeed: null,
  relatedSkills: ["technique", "picking"],
  youtubeVideoId: "GqorA0S2bj4",
  isPlayalong: true,
  videoUrl: "https://youtu.be/GqorA0S2bj4",
  links: [
    { label: "YouTube", url: "https://www.youtube.com/@MusicianFitness" },
    { label: "Support Author", url: "https://coff.ee/musicianfitness" }
  ]
};

export const musicianFitnessLvl1S8Exercise: Exercise = {
  id: "musician_fitness_lvl1_s8",
  title: {
    pl: "Level #1 Session #8 - Practice Session",
    en: "Level #1 Session #8 - Practice Session"
  },
  description: {
    pl: "Ósma sesja poziomu 1: Kompleksowa sesja treningowa dla początkujących. Graj razem z instruktorem.",
    en: "Level 1 Session 8: Comprehensive practice session for beginners. Play along with the instructor."
  },
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 16,
  instructions: [
    {
      pl: "Podążaj za instruktorem przez wszystkie ćwiczenia",
      en: "Follow the instructor through all exercises"
    },
    {
      pl: "Zadbaj o poprawną postawę i technikę rąk",
      en: "Ensure proper posture and hand technique"
    }
  ],
  tips: [
    {
      pl: "Rób krótkie przerwy, jeśli czujesz napięcie w dłoniach",
      en: "Take short breaks if you feel tension in your hands"
    },
    {
      pl: "Skup się na czystości każdego uderzenia kostką",
      en: "Focus on the clarity of every pick stroke"
    }
  ],
  metronomeSpeed: null,
  relatedSkills: ["technique", "picking"],
  youtubeVideoId: "DoVmZ1XNBj4",
  isPlayalong: true,
  videoUrl: "https://youtu.be/DoVmZ1XNBj4",
  links: [
    { label: "YouTube", url: "https://www.youtube.com/@MusicianFitness" },
    { label: "Support Author", url: "https://coff.ee/musicianfitness" }
  ]
};








