import { Challenge } from "../challenges.types";

export const challengesList: Challenge[] = [
  // TECHNIQUE - Alternate Picking
  {
    id: "technique_5_days",
    title: "Konsystencja Kostkowania",
    description: "Buduj kontrolę dynamiki i absolutną synchronizację rąk przez 5 dni.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "alternate_picking",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Alternate Picking",
    shortGoal: "5 days / 5 min daily",
    rewardDescription: "500 XP",
    accentColor: "main",
    rewardSkillId: "alternate_picking",
    rewardLevel: 10,
    dependsOn: "muting_3_days",
    exercises: [
      {
        id: "streak_ap_ex_1",
        title: "Trening z Metronomem",
        description: "Utrzymaj perfekcyjną precyzję przy pasażach szesnastkowych.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Zacznij od wolniejszego tempa, aby upewnić się, że góra-dół są idealnie równe."
        ],
        metronomeSpeed: { min: 80, max: 120, recommended: 100 },
        relatedSkills: ["alternate_picking"]
      }
    ]
  },

  // TECHNIQUE - Legato
  {
    id: "legato_5_days",
    title: "Płynność i Siła Legato",
    description: "Rozwijaj niezależność palców i klarowność hammer-onów oraz pull-offów.",
    streakDays: 5,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "legato",
    requiredLevel: 0,
    unlockDescription: "Lvl 5 Legato",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_legato_ex_1",
        title: "Mistrzowska Płynność Palców",
        description: "Ciągłe tryle i fragmenty skal bez udziału kostki.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Utrzymuj kciuk z tyłu gryfu, aby palce miały większy zasięg i siłę nacisku."
        ],
        metronomeSpeed: null,
        relatedSkills: ["legato"]
      }
    ]
  },

  // TECHNIQUE - Bending
  {
    id: "bending_5_days",
    title: "Precyzyjna Intonacja Podciągnięć",
    description: "Skup się na precyzji mikrotonalnej i śpiewnym wybrzmiewaniu.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "bending",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Bending",
    shortGoal: "5 days / 5 min daily",
    rewardDescription: "400 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_bend_ex_1",
        title: "Trening Celowania w Dźwięk",
        description: "Dostrajaj podciągnięcia o pół i cały ton do dźwięków wzorcowych.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Używaj sąsiednich palców jako wsparcia przy podciąganiu struny."
        ],
        metronomeSpeed: null,
        relatedSkills: ["bending"]
      }
    ]
  },

  // TECHNIQUE - Tapping
  {
    id: "tapping_3_days",
    title: "Artykulacja Tappingu",
    description: "Opanuj atak i tłumienie w technice tappingu oburęcznego.",
    streakDays: 3,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "tapping",
    requiredLevel: 0,
    unlockDescription: "Lvl 6 Tapping",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "400 XP",
    accentColor: "main",
    rewardSkillId: "tapping",
    rewardLevel: 12,
    dependsOn: "legato_5_days",
    exercises: [
      {
        id: "streak_tap_ex_1",
        title: "Triadyczne Kaskady",
        description: "Czyste triady tappingowe z naciskiem na kontrolę niechcianych dźwięków.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Tłumij nieużywane struny wnętrzem prawej dłoni, aby uniknąć przydźwięków."
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 80 },
        relatedSkills: ["tapping"]
      }
    ]
  },

  // TECHNIQUE - Economy Picking / Sweeping
  {
    id: "sweeping_5_days",
    title: "Synchronizacja Sweep Picking",
    description: "Wyczyść swoje arpeggia dzięki niemal chirurgicznej koordynacji rąk.",
    streakDays: 5,
    intensity: "extreme",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "sweep_picking",
    requiredLevel: 0,
    unlockDescription: "Lvl 7 Economy Picking",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "700 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_sweep_ex_1",
        title: "Koordynacja Przetaczania",
        description: "Skup się na czystej separacji strun i technice 'przetaczania' palców.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Kostka powinna 'przepływać' przez struny jednym ruchem, a nie serią uderzeń."
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 70 },
        relatedSkills: ["sweep_picking"]
      }
    ]
  },


  // THEORY - Scales
  {
    id: "theory_3_days",
    title: "Odkrywanie Mapy Interwałów",
    description: "Wyjdź poza schematy – zinternalizuj brzmienie i pozycje interwałów.",
    streakDays: 3,
    intensity: "low",
    difficulty: "easy",
    category: "theory",
    requiredSkillId: "scales",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Scales",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "300 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_theory_ex_1",
        title: "Opalcowanie Skal",
        description: "Wizualizacja wzorców skal na całej szerokości gryfu.",
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Nazywaj dźwięki na głos podczas grania, aby lepiej zapamiętać mapę gryfu."
        ],
        metronomeSpeed: null,
        relatedSkills: ["scales"]
      }
    ]
  },
  {
    id: "theory_5_days",
    title: "Biegłość Modalna",
    description: "Połącz teorię z technicznym wykonaniem wzorców modalnych.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "theory",
    requiredSkillId: "scales",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Scales",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "800 XP",
    rewardSkillId: "scales",
    rewardLevel: 12,
    accentColor: "main",
    dependsOn: "pentatonic_5_days",
    exercises: [
      {
        id: "streak_circle_ex_1",
        title: "Połączenia Harmoniczne",
        description: "Prowadzenie skal przez koło kwintowe w obrębie jednej pozycji.",
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Zwracaj uwagę na charakterystyczny dźwięk (charakter) każdego modu."
        ],
        metronomeSpeed: null,
        relatedSkills: ["scales"]
      }
    ]
  },

  // HEARING - Ear Training
  {
    id: "ear_5_days",
    title: "Rozwój Słuchu Relatywnego",
    description: "Zmniejsz dystans między usłyszeniem melodii a jej natychmiastowym zagraniem.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "hearing",
    requiredSkillId: "ear_training",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Ear Training",
    shortGoal: "5 days / 5 min daily",
    rewardDescription: "500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_ear_ex_1",
        title: "Rozpoznawanie Interwałów",
        description: "Identyfikacja i transkrypcja interwałów w czasie rzeczywistym.",
        difficulty: "medium",
        category: "hearing",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Skojarz interwały ze znanymi piosenkami (np. kwarta czysta to początek 'Gwiezdnych Wojen')."
        ],
        metronomeSpeed: null,
        relatedSkills: ["ear_training"]
      }
    ]
  },

  // CREATIVITY - Improvisation
  {
    id: "improv_5_days",
    title: "Frazowanie Melodyczne",
    description: "Rozwijaj własny głos poprzez improwizację z określonymi ograniczeniami.",
    streakDays: 5,
    intensity: "high",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "improvisation",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Improvisation",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_improv_ex_1",
        title: "Temat i Wariacja",
        description: "Twórz motywy i rozwijaj je w oparciu o profesjonalne ścieżki podkładowe.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Ogranicz się do 3 dźwięków na strunie lub jednej pozycji, aby wymusić kreatywność."
        ],
        metronomeSpeed: null,
        relatedSkills: ["improvisation"]
      }
    ]
  },

  // CREATIVITY - Theory Application (Arpeggios)
  {
    id: "arpeggios_5_days",
    title: "Celowanie w Składniki Akordów",
    description: "Naucz się kreatywnego ogrywania zmian akordów za pomocą arpeggio.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "hard",
    category: "creativity",
    requiredSkillId: "chord_theory",
    requiredLevel: 0,
    unlockDescription: "Lvl 5 Arpeggios",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_arp_ex_1",
        title: "Zarysy Harmoniczne",
        description: "Wizualizacja składników akordów wewnątrz wzorców solowych.",
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Wizualizacja kształtów akordów pod palcami ułatwia szybkie odnalezienie arpeggio."
        ],
        metronomeSpeed: null,
        relatedSkills: ["chord_theory"]
      }
    ]
  },

  // NEW CHALLENGES

  // TECHNIQUE - Chord Transitions
  {
    id: "chord_transitions_3_days",
    title: "Efektywne Przejścia Akordowe",
    description: "Minimalizuj ruchy dla szybszych i płynniejszych zmian harmonicznych.",
    streakDays: 3,
    intensity: "medium",
    difficulty: "easy",
    category: "technique",
    requiredSkillId: "chord_theory",
    requiredLevel: 0,
    unlockDescription: "Lvl 2 Chords",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "350 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_chord_ex_1",
        title: "Precyzja Palca Przewodniego",
        description: "Opanuj wspólne punkty podparcia między standardowymi kształtami akordów.",
        difficulty: "easy",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Zawsze szukaj palca, który nie musi się odrywać od podstrunnicy podczas zmiany."
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 70 },
        relatedSkills: ["chord_theory", "rhythm"]
      }
    ]
  },

  // RHYTHM - Precision
  {
    id: "rhythm_precision_7_days",
    title: "Mistrzostwo Rytmicznego 'Pocketu'",
    description: "Rozwijaj swój wewnętrzny zegar i zgraj się idealnie z metronomem.",
    streakDays: 7,
    intensity: "high",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "rhythm",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Rhythm",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "1000 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_rhythm_ex_1",
        title: "Kontrola Podziałów",
        description: "Przełączaj się między triolami, ósemkami i szesnastkami bez opóźnień.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Klaszcz lub tupać nogą równo z metronomem, aby poczuć puls całym ciałem."
        ],
        metronomeSpeed: { min: 50, max: 90, recommended: 60 },
        relatedSkills: ["rhythm"]
      }
    ]
  },

  // TECHNIQUE - Speed Burst
  {
    id: "speed_burst_3_days",
    title: "Eksplozywne Serie Techniczne",
    description: "Trenuj swój układ nerwowy do krótkich serii o ekstremalnej prędkości.",
    streakDays: 3,
    intensity: "extreme",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "alternate_picking",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Speed",
    dependsOn: "technique_5_days",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "600 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_speed_ex_1",
        title: "Sprinty Grup Nutowych",
        description: "Przyspieszaj krótkie fragmenty, by przesuwać swoją górną granicę prędkości.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Rozluźnij dłoń kostkującą – napięcie to największy wróg prędkości."
        ],
        metronomeSpeed: { min: 120, max: 180, recommended: 140 },
        relatedSkills: ["alternate_picking"]
      }
    ]
  },

  // TECHNIQUE - Dynamic Phrasing
  {
    id: "dynamics_3_days",
    title: "Kontrola Dynamiki i Artykulacji",
    description: "Spraw, by Twoja gitara przemówiła – opanuj różnicę między piano a forte.",
    streakDays: 3,
    intensity: "medium",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "improvisation",
    requiredLevel: 4,
    unlockDescription: "Lvl 4 Improv",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "400 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_dynamics_ex_1",
        title: "Dialog Dynamiczny",
        description: "Graj ten sam motyw z różną siłą ataku kostki.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Kontrola dynamiki zaczyna się w głowie – usłysz różnicę, zanim uderzysz w strunę."
        ],
        metronomeSpeed: null,
        relatedSkills: ["improvisation"]
      }
    ]
  },

  // RHYTHM - Odd Meters
  {
    id: "odd_meter_5_days",
    title: "Eksploracja Nieparzystych Metrów",
    description: "Przełam schemat 4/4 – poczuj puls w 5/4, 7/8 i innych niestandardowych metrach.",
    streakDays: 5,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "rhythm",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 Rhythm",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "750 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_odd_meter_ex_1",
        title: "Puls w 7/8",
        description: "Graj riffy i skale w metrum siedem ósmych.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Akcentuj 'raz' – to pomoże Ci nie zgubić się w nieparzystej strukturze."
        ],
        metronomeSpeed: { min: 60, max: 120, recommended: 80 },
        relatedSkills: ["rhythm"]
      }
    ]
  },

  // THEORY - Pentatonic Extensions
  {
    id: "pentatonic_5_days",
    title: "Rozszerzone Kształty Pentatoniki",
    description: "Połącz pozycje pentatoniki, by swobodnie poruszać się po całym gryfie.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "theory",
    requiredSkillId: "scales",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Scales",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600 XP",
    rewardSkillId: "scales",
    rewardLevel: 10,
    accentColor: "main",
    exercises: [
      {
        id: "streak_penta_ex_1",
        title: "Diagonalna Pentatonika",
        description: "Graj skale wzdłuż gryfu, łącząc co najmniej 3 pozycje.",
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Skup się na dźwiękach wspólnych między pozycjami – to Twoje punkty orientacyjne."
        ],
        metronomeSpeed: null,
        relatedSkills: ["scales"]
      }
    ]
  },

  // TECHNIQUE - Vibrato
  {
    id: "vibrato_3_days",
    title: "Śpiewny Vibrato",
    description: "Dodaj emocji do każdej nuty – opanuj kontrolę szerokości i tempa vibrato.",
    streakDays: 3,
    intensity: "low",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "bending",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Bending",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "350 XP",
    rewardSkillId: "bending",
    rewardLevel: 10,
    accentColor: "main",
    exercises: [
      {
        id: "streak_vibrato_ex_1",
        title: "Kontrola Oscylacji",
        description: "Ćwicz regularne, szerokie i wąskie vibrato na długich dźwiękach.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Ruch powinien pochodzić z nadgarstka, a nie z samych palców."
        ],
        metronomeSpeed: { min: 60, max: 90, recommended: 70 },
        relatedSkills: ["bending"]
      }
    ]
  },

  // TECHNIQUE - Hybrid Picking
  {
    id: "hybrid_5_days",
    title: "Niezależność Hybrid Picking",
    description: "Połącz precyzję kostki z delikatnością palców prawej ręki.",
    streakDays: 5,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "hybrid_picking",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 Speed",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "700 XP",
    rewardSkillId: "hybrid_picking",
    rewardLevel: 10,
    accentColor: "main",
    exercises: [
      {
        id: "streak_hybrid_ex_1",
        title: "Skoki strun (String Skipping)",
        description: "Używaj kostki na strunach basowych i palców (m, a) na wiolinowych.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Staraj się wyrównać głośność między uderzeniem kostką a szarpnięciem palcem."
        ],
        metronomeSpeed: { min: 70, max: 110, recommended: 85 },
        relatedSkills: ["alternate_picking"]
      }
    ]
  },

  // THEORY - Triad Mastery
  {
    id: "triads_7_days",
    title: "Inwersje Triad na Gryfie",
    description: "Buduj partie gitary jak profesjonalista – opanuj 3-dźwięki w każdej pozycji.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "medium",
    category: "theory",
    requiredSkillId: "chord_theory",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 Chords",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "900 XP",
    rewardSkillId: "chord_theory",
    rewardLevel: 12,
    accentColor: "main",
    exercises: [
      {
        id: "streak_triads_ex_1",
        title: "Voice Leading",
        description: "Łącz akordy tak, aby zmieniało się jak najmniej dźwięków.",
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Triady to najszybszy sposób na zrozumienie harmonii w solówkach."
        ],
        metronomeSpeed: null,
        relatedSkills: ["chord_theory"]
      }
    ]
  },

  // TECHNIQUE - Muting & Cleanliness
  {
    id: "muting_3_days",
    title: "Kliniczna Czystość Gry",
    description: "Wyeliminuj niechciane dźwięki i buczenie strun.",
    streakDays: 3,
    intensity: "high",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "alternate_picking",
    requiredLevel: 4,
    unlockDescription: "Lvl 4 Picking",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "300 XP",
    rewardSkillId: "picking",
    rewardLevel: 8,
    accentColor: "main",
    dependsOn: "picking_basics_3_days",
    exercises: [
      {
        id: "streak_muting_ex_1",
        title: "Palm Muting & Left Hand Mute",
        description: "Graj z dużym gainem, dbając o absolutną ciszę między dźwiękami.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Im więcej gainu, tym bardziej musisz polegać na krawędzi prawej dłoni przy mostku."
        ],
        metronomeSpeed: { min: 80, max: 140, recommended: 110 },
        relatedSkills: ["alternate_picking"]
      }
    ]
  },

  // TECHNIQUE - Fingerpicking
  {
    id: "fingerstyle_5_days",
    title: "Ewolucja Fingerstyle",
    description: "Odkryj niezależność kciuka i palców w grze bez kostki.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "fingerpicking",
    requiredLevel: 3,
    unlockDescription: "Lvl 3 Fingerpicking",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "550 XP",
    rewardSkillId: "fingerpicking",
    rewardLevel: 8,
    accentColor: "main",
    exercises: [
      {
        id: "streak_finger_ex_1",
        title: "Travis Picking Basics",
        description: "Utrzymaj stały puls kciuka przy jednoczesnej grze melodii.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Trzymaj dłoń rozluźnioną, a palce blisko strun, aby zminimalizować ruch."
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 80 },
        relatedSkills: ["fingerpicking"]
      }
    ]
  },

  // THEORY - Sight Reading
  {
    id: "sight_reading_3_days",
    title: "Biegłość Czytania Nut",
    description: "Zwiększ szybkość rozpoznawania nut na pięciolinii i ich lokalizacji na gryfie.",
    streakDays: 3,
    intensity: "medium",
    difficulty: "medium",
    category: "theory",
    requiredSkillId: "sight_reading",
    requiredLevel: 2,
    unlockDescription: "Lvl 2 Reading",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "300 XP",
    rewardSkillId: "sight_reading",
    rewardLevel: 5,
    accentColor: "main",
    exercises: [
      {
        id: "streak_reading_ex_1",
        title: "Pierwsze Spojrzenie",
        description: "Graj proste melodie z nut bez wcześniejszego przygotowania.",
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Zawsze patrz jeden takt do przodu, aby przygotować dłoń do zmiany pozycji."
        ],
        metronomeSpeed: { min: 40, max: 70, recommended: 50 },
        relatedSkills: ["sight_reading"]
      }
    ]
  },

  // CREATIVITY - Composition
  {
    id: "composition_5_days",
    title: "Laboratorium Kompozycji",
    description: "Stwórz własny motyw muzyczny i rozwiń go w krótką etiudę.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "composition",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Composition",
    shortGoal: "5 days / 15 min daily",
    rewardDescription: "650 XP",
    rewardSkillId: "composition",
    rewardLevel: 10,
    accentColor: "main",
    exercises: [
      {
        id: "streak_comp_ex_1",
        title: "Budowanie Motywu",
        description: "Zapisz lub nagraj 4-taktowy pomysł i dodaj do niego wariacje.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 15,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Nie oceniaj swoich pomysłów od razu – daj sobie przestrzeń na eksperymenty."
        ],
        metronomeSpeed: null,
        relatedSkills: ["composition", "music_theory"]
      }
    ]
  },

  // HEARING - Pitch Recognition
  {
    id: "pitch_recognition_5_days",
    title: "Detektyw Dźwięków",
    description: "Naucz się rozpoznawać konkretne wysokości dźwięków bez instrumentu.",
    streakDays: 5,
    intensity: "high",
    difficulty: "hard",
    category: "hearing",
    requiredSkillId: "pitch_recognition",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 Pitch",
    shortGoal: "5 days / 5 min daily",
    rewardDescription: "500 XP",
    rewardSkillId: "pitch_recognition",
    rewardLevel: 10,
    accentColor: "main",
    exercises: [
      {
        id: "streak_pitch_ex_1",
        title: "Identyfikacja Nut",
        description: "Rozpoznawaj dźwięki puszczane losowo przez aplikację lub nauczyciela.",
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Skojarz konkretne nuty z pierwszym dźwiękiem Twoich ulubionych piosenek."
        ],
        metronomeSpeed: null,
        relatedSkills: ["pitch_recognition", "ear_training"]
      }
    ]
  },

  // TECHNIQUE - Slide Guitar
  {
    id: "slide_guitar_3_days",
    title: "Magia Delta Slide",
    description: "Opanuj kontrolę docisku i intonację przy grze rurką (slide).",
    streakDays: 3,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "slide_guitar",
    requiredLevel: 0,
    unlockDescription: "Lvl 3 Slide",
    shortGoal: "3 days / 10 min daily",
    rewardDescription: "400 XP",
    rewardSkillId: "slide_guitar",
    rewardLevel: 10,
    accentColor: "main",
    exercises: [
      {
        id: "streak_slide_ex_1",
        title: "Ślizganie po Prożkach",
        description: "Graj gamy i proste licki, dbając o to, by slide był idealnie nad prożkiem.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Nie naciskaj slide'em na struny tak mocno, żeby dotykały prożków."
        ],
        metronomeSpeed: null,
        relatedSkills: ["slide_guitar"]
      }
    ]
  },

  // THEORY - Harmony
  {
    id: "harmony_7_days",
    title: "Architektura Harmonii",
    description: "Zrozum jak budowane są zaawansowane akordy i ich połączenia.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "hard",
    category: "theory",
    requiredSkillId: "harmony",
    requiredLevel: 0,
    unlockDescription: "Lvl 5 Harmony",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "800 XP",
    rewardSkillId: "harmony",
    rewardLevel: 10,
    accentColor: "main",
    exercises: [
      {
        id: "streak_harmony_ex_1",
        title: "Budowanie Akordów Rozszerzonych",
        description: "Znajdź i zagraj akordy 9, 11 i 13 w różnych pozycjach.",
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Skoncentruj się na brzmieniu interwałów dodanych – poczuj ich kolor."
        ],
        metronomeSpeed: null,
        relatedSkills: ["harmony", "chord_theory"]
      }
    ]
  },

  // CREATIVITY - Blues Soloing
  {
    id: "blues_soloing_5_days",
    title: "Dusza Bluesa",
    description: "Połącz technikę z emocjami, używając skali bluesowej i 'blue notes'.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "improvisation",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Improv",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600 XP",
    rewardSkillId: "improvisation",
    rewardLevel: 12,
    accentColor: "main",
    exercises: [
      {
        id: "streak_blues_ex_1",
        title: "Call and Response",
        description: "Improwizuj krótkie frazy, które 'odpowiadają' sobie nawzajem.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Pauza jest tak samo ważna jak dźwięk – daj muzyce oddychać."
        ],
        metronomeSpeed: null,
        relatedSkills: ["improvisation", "bending"]
      }
    ]
  },

  // HEARING - Transcription
  {
    id: "transcription_5_days",
    title: "Mistrz Transkrypcji",
    description: "Rozszyfruj i zapisz solo lub riff ze słuchu z chirurgiczną precyzją.",
    streakDays: 5,
    intensity: "high",
    difficulty: "hard",
    category: "hearing",
    requiredSkillId: "transcription",
    requiredLevel: 0,
    unlockDescription: "Lvl 7 transcription",
    shortGoal: "5 days / 15 min daily",
    rewardDescription: "900 XP",
    rewardSkillId: "transcription",
    rewardLevel: 12,
    accentColor: "main",
    exercises: [
      {
        id: "streak_trans_ex_1",
        title: "Dekodowanie Solówki",
        description: "Wybierz 4-taktowy fragment ulubionego solo i przenieś go na gryf.",
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 15,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Zacznij od znalezienia pierwszej nuty i tonacji utworu."
        ],
        metronomeSpeed: null,
        relatedSkills: ["transcription", "ear_training"]
      }
    ]
  },

  // TECHNIQUE - Funk Rhythm
  {
    id: "funk_rhythm_3_days",
    title: "Funkowy Puls",
    description: "Opanuj 'scratching' i szesnastkowy feeling w rytmice funkowej.",
    streakDays: 3,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "rhythm",
    requiredLevel: 4,
    unlockDescription: "Lvl 4 Rhythm",
    shortGoal: "3 days / 10 min daily",
    rewardDescription: "450 XP",
    rewardSkillId: "rhythm",
    rewardLevel: 8,
    accentColor: "main",
    exercises: [
      {
        id: "streak_funk_ex_1",
        title: "Nieustanny Ruch",
        description: "Utrzymuj ruch ręki kostkującej w szesnastkach, tłumiąc większość uderzeń.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Ruch powinien być luźny i pochodzić głównie z nadgarstka."
        ],
        metronomeSpeed: { min: 80, max: 110, recommended: 95 },
        relatedSkills: ["rhythm"]
      }
    ]
  },

  // TECHNIQUE - Harmonics
  {
    id: "harmonics_3_days",
    title: "Kryształowe Dźwięki",
    description: "Odkryj świat flażoletów naturalnych, sztucznych i wymuszonych.",
    streakDays: 3,
    intensity: "low",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "technique",
    requiredLevel: 0,
    unlockDescription: "Lvl 5 Tech",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "350 XP",
    rewardSkillId: "technique",
    rewardLevel: 10,
    accentColor: "main",
    exercises: [
      {
        id: "streak_harmonics_ex_1",
        title: "Mapa Flażoletów",
        description: "Znajdź flażolety naturalne na 5, 7 i 12 progu wszystkich strun.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Użycie przetwornika przy mostku i większego gainu ułatwia wydobycie flażoletów."
        ],
        metronomeSpeed: null,
        relatedSkills: ["technique"]
      }
    ]
  },

  // TECHNIQUE - String Skipping
  {
    id: "string_skipping_5_days",
    title: "Akrobatyka na Strunach",
    description: "Zwiększ precyzję prawej ręki przy dużych skokach między strunami.",
    streakDays: 5,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "string_skipping",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Skipping",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_skip_ex_1",
        title: "Penta-Skoki",
        description: "Graj pentatonikę, pomijając co drugą strunę.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Wykonuj nieco większy łuk kostką, aby 'przeskoczyć' nad niechcianą struną."
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 75 },
        relatedSkills: ["string_skipping", "alternate_picking"]
      }
    ]
  },

  // TECHNIQUE - Finger Independence
  {
    id: "finger_independence_7_days",
    title: "Niezależność Palców",
    description: "Wzmocnij kondycję i koordynację wszystkich palców lewej ręki.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "finger_independence",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Independence",
    shortGoal: "7 days / 5 min daily",
    rewardDescription: "800 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_indep_ex_1",
        title: "Pajączek Chromatyczny",
        description: "Graj wzory 1-3-2-4 na różnych strunach i pozycjach.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Utrzymuj kciuk stabilnie na środku tyłu gryfu."
        ],
        metronomeSpeed: { min: 60, max: 120, recommended: 90 },
        relatedSkills: ["finger_independence"]
      }
    ]
  },

  // THEORY - Music Theory
  {
    id: "music_theory_5_days",
    title: "Fundamenty Teorii",
    description: "Zgłębiaj wiedzę o interwałach i budowie gam.",
    streakDays: 5,
    intensity: "low",
    difficulty: "easy",
    category: "theory",
    requiredSkillId: "music_theory",
    requiredLevel: 0,
    unlockDescription: "Lvl 3 Theory",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_theory_basics_ex_1",
        title: "Budowa Interwałów",
        description: "Nazywaj i graj interwały od zadanego dźwięku na jednej strunie.",
        difficulty: "easy",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Zapamiętaj liczbę półtonów dla każdego interwału."
        ],
        metronomeSpeed: null,
        relatedSkills: ["music_theory"]
      }
    ]
  },

  // HEARING - Rhythm Recognition
  {
    id: "rhythm_recog_5_days",
    title: "Detektor Rytmu",
    description: "Naucz się słyszeć i zapisywać złożone figury rytmiczne.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "hearing",
    requiredSkillId: "rythm_recognition",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Rhythm Rec",
    shortGoal: "5 days / 5 min daily",
    rewardDescription: "500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_rhythm_rec_ex_1",
        title: "Dyktando Rytmiczne",
        description: "Wysłuchaj frazy i wystukaj jej rytm.",
        difficulty: "medium",
        category: "hearing",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Licz głośno: 'raz i dwa i' lub 'raz e i a' dla szesnastek."
        ],
        metronomeSpeed: null,
        relatedSkills: ["rythm_recognition", "rhythm"]
      }
    ]
  },

  // TECHNIQUE - Basic Picking
  {
    id: "picking_basics_3_days",
    title: "Fundamenty Kostkowania",
    description: "Skup się na czystości ataku i kącie nachylenia kostki.",
    streakDays: 3,
    intensity: "low",
    difficulty: "easy",
    category: "technique",
    requiredSkillId: "picking",
    requiredLevel: 0,
    unlockDescription: "Lvl 2 Picking",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "300 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_picking_base_ex_1",
        title: "Czysty Atak",
        description: "Graj puste struny, dbając o powtarzalność brzmienia.",
        difficulty: "easy",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Trzymaj kostkę pewnie, ale bez nadmiernego ścisku."
        ],
        metronomeSpeed: { min: 60, max: 90, recommended: 70 },
        relatedSkills: ["picking"]
      }
    ]
  },

  // CREATIVITY - Phrasing
  {
    id: "phrasing_5_days",
    title: "Sztuka Frazowania",
    description: "Naucz się 'opowiadać historie' swoimi solówkami.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "phrasing",
    requiredLevel: 0,
    unlockDescription: "Lvl 5 Phrasing",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_phrasing_ex_1",
        title: "Ograniczenie Rytmiczne",
        description: "Improwizuj, używając tylko jednego wybranego rytmu dla wszystkich fraz.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Mniej znaczy więcej – dobra fraza potrzebuje miejsca na wybrzmienie."
        ],
        metronomeSpeed: null,
        relatedSkills: ["phrasing", "improvisation"]
      }
    ]
  },

  // TECHNIQUE - Articulation
  {
    id: "articulation_3_days",
    title: "Mistrz Artykulacji",
    description: "Dodaj charakteru swojej grze poprzez akcenty i różnorodny atak.",
    streakDays: 3,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "articulation",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Articulation",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "400 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_artic_ex_1",
        title: "Akcentowanie Podziałów",
        description: "Graj ósemki, akcentując co trzecią nutę.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Używaj różnej głębokości zanurzenia kostki, aby zmieniać barwę dźwięku."
        ],
        metronomeSpeed: { min: 70, max: 110, recommended: 90 },
        relatedSkills: ["articulation"]
      }
    ]
  },

  // CREATIVITY - Songwriting
  {
    id: "songwriting_7_days",
    title: "Maraton Pisania Piosenek",
    description: "Przejdź przez cały proces tworzenia utworu – od riffu do struktury.",
    streakDays: 7,
    intensity: "high",
    difficulty: "hard",
    category: "creativity",
    requiredSkillId: "composition",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 Composition",
    shortGoal: "7 days / 15 min daily",
    rewardDescription: "1000 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_songwrite_ex_1",
        title: "Struktura Utworu",
        description: "Połącz riff, zwrotkę i refren w spójną całość.",
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 15,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Dobry refren powinien być łatwy do zapamiętania i kontrastować ze zwrotką."
        ],
        metronomeSpeed: null,
        relatedSkills: ["composition", "harmony"]
      }
    ]
  },

  // CREATIVITY - Audio Production / Tone
  {
    id: "audio_tone_3_days",
    title: "Inżynieria Brzmienia",
    description: "Zrozum wpływ efektów, EQ i ustawień wzmacniacza na Twój sound.",
    streakDays: 3,
    intensity: "low",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "audio_production",
    requiredLevel: 0,
    unlockDescription: "Lvl 3 Audio",
    shortGoal: "3 days / 10 min daily",
    rewardDescription: "400 XP",
    accentColor: "main",
    exercises: [
      {
        id: "streak_audio_ex_1",
        title: "Tone Chasing",
        description: "Spróbuj odtworzyć brzmienie gitary ze słynnego utworu.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."
        ],
        tips: [
          "Mniej gainu często oznacza większą selektywność i lepsze brzmienie w nagraniu."
        ],
        metronomeSpeed: null,
        relatedSkills: ["audio_production"]
      }
    ]
  },
  {
    id: "legato_speed_7_days",
    title: "Sprinty Legato",
    description: "Zwiększ szybkość i wytrzymałość hammer-onów.",
    streakDays: 7,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "legato",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Legato",
    dependsOn: "legato_5_days",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "800 XP",
    accentColor: "main",
    exercises: [
      {
        id: "l_speed_1",
        title: "Szybkie Trójki",
        description: "Triole legato w szybkim tempie.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Utrzymuj palce blisko strun."],
        metronomeSpeed: null,
        relatedSkills: ["legato"]
      }
    ]
  },
  {
    id: "legato_marathon_10_days",
    title: "Maraton Wytrzymałości Legato",
    description: "Ekstremalne wyzwanie dla Twojej lewej ręki.",
    streakDays: 10,
    intensity: "extreme",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "legato",
    requiredLevel: 12,
    unlockDescription: "Lvl 12 Legato",
    dependsOn: "legato_speed_7_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "l_mara_1",
        title: "Nieustanny Przepływ",
        description: "15 minut grania legato bez przerwy.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Jeśli poczujesz ból, natychmiast przestań."],
        metronomeSpeed: null,
        relatedSkills: ["legato"]
      }
    ]
  },
  {
    id: "sweep_5_string_10_days",
    title: "5-Strunowe Kaskady Sweep",
    description: "Rozszerzone arpeggia dla zaawansowanych.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "sweep_picking",
    requiredLevel: 9,
    unlockDescription: "Lvl 9 Sweep",
    dependsOn: "sweeping_5_days",
    shortGoal: "10 days / 10 min daily",
    rewardDescription: "1000 XP",
    accentColor: "main",
    exercises: [
      {
        id: "s_5_1",
        title: "Pełne Arpeggia",
        description: "Graj 5-strunowe kształty arpeggio.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Używaj tłumienia prawą dłonią."],
        metronomeSpeed: null,
        relatedSkills: ["sweep_picking"]
      }
    ]
  },
  {
    id: "sweep_neoclassical_14_days",
    title: "Neoklasyczny Mistrz Sweepu",
    description: "Najbardziej złożone figury sweep pickingowe.",
    streakDays: 14,
    intensity: "extreme",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "sweep_picking",
    requiredLevel: 12,
    unlockDescription: "Lvl 12 Sweep",
    dependsOn: "sweep_5_string_10_days",
    shortGoal: "14 days / 15 min daily",
    rewardDescription: "2000 XP",
    accentColor: "main",
    exercises: [
      {
        id: "s_neo_1",
        title: "Symfoniczne Sweepy",
        description: "Szybkie zmiany kształtów i pozycji.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Synchronizacja obu rąk to klucz."],
        metronomeSpeed: null,
        relatedSkills: ["sweep_picking", "legato"]
      }
    ]
  },
  {
    id: "ear_chords_7_days",
    title: "Rozpoznawanie Kolorów Akordów",
    description: "Rozróżniaj skomplikowane akordy ze słuchu.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "medium",
    category: "hearing",
    requiredSkillId: "ear_training",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 Ear Training",
    dependsOn: "ear_5_days",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "700 XP",
    accentColor: "main",
    exercises: [
      {
        id: "e_c_1",
        title: "Maj vs Min vs Dom",
        description: "Identyfikuj typy akordów septymowych.",
        difficulty: "medium",
        category: "hearing",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Skup się na brzmieniu tercji i septymy."],
        metronomeSpeed: null,
        relatedSkills: ["ear_training"]
      }
    ]
  },
  {
    id: "ear_melodic_10_days",
    title: "Melodyczny Dyktant",
    description: "Zapisuj melodie usłyszane w radiu.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "hearing",
    requiredSkillId: "ear_training",
    requiredLevel: 9,
    unlockDescription: "Lvl 9 Ear Training",
    dependsOn: "ear_chords_7_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1200 XP",
    accentColor: "main",
    exercises: [
      {
        id: "e_m_1",
        title: "Z Głowy na Gryf",
        description: "Graj melodie, które słyszysz w wyobraźni.",
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Zacznij od bardzo wolnego tempa."],
        metronomeSpeed: null,
        relatedSkills: ["ear_training"]
      }
    ]
  },
  {
    id: "sight_reading_pos_5_days",
    title: "Czytanie w Pozycjach",
    description: "Czytaj nuty, zmieniając pozycje na gryfie.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "theory",
    requiredSkillId: "sight_reading",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Sight Reading",
    dependsOn: "sight_reading_3_days",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600 XP",
    accentColor: "main",
    exercises: [
      {
        id: "sr_p_1",
        title: "Skoki Pozycyjne",
        description: "Czytanie melodii wymagających zmiany pozycji.",
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Szukaj dźwięków wspólnych przy zmianie."],
        metronomeSpeed: null,
        relatedSkills: ["sight_reading"]
      }
    ]
  },
  {
    id: "sight_reading_poly_10_days",
    title: "Czytanie Polifoniczne",
    description: "Czytaj kilka linii melodycznych naraz.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "theory",
    requiredSkillId: "sight_reading",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Sight Reading",
    dependsOn: "sight_reading_pos_5_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1300 XP",
    accentColor: "main",
    exercises: [
      {
        id: "sr_poly_1",
        title: "Dwu-głos",
        description: "Czytaj zapisy z dwiema niezależnymi liniami.",
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Najpierw przeanalizuj rytm obu rąk."],
        metronomeSpeed: null,
        relatedSkills: ["sight_reading", "fingerpicking"]
      }
    ]
  },
  {
    id: "composition_motif_7_days",
    title: "Wariacje Motywiczne",
    description: "Rozwijaj jeden pomysł na nieskończone sposoby.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "composition",
    requiredLevel: 7,
    unlockDescription: "Lvl 7 Composition",
    dependsOn: "composition_5_days",
    shortGoal: "7 days / 15 min daily",
    rewardDescription: "850 XP",
    accentColor: "main",
    exercises: [
      {
        id: "c_mot_1",
        title: "Metamorfoza Melodii",
        description: "Zmieniaj rytm i metrum swojego motywu.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Nie bój się drastycznych zmian."],
        metronomeSpeed: null,
        relatedSkills: ["composition"]
      }
    ]
  },
  {
    id: "composition_layering_10_days",
    title: "Warstwy Symfoniczne",
    description: "Buduj gęste tekstury instrumentami wirtualnymi lub kilkoma ścieżkami gitary.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "creativity",
    requiredSkillId: "composition",
    requiredLevel: 10,
    unlockDescription: "Lvl 10 Composition",
    dependsOn: "composition_motif_7_days",
    shortGoal: "10 days / 20 min daily",
    rewardDescription: "1500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "c_lay_1",
        title: "Aranżacja Warstwowa",
        description: "Stwórz utwór z minimum 4 ścieżek gitary.",
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 20,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Zwracaj uwagę na pasma częstotliwości."],
        metronomeSpeed: null,
        relatedSkills: ["composition", "audio_production"]
      }
    ]
  },
  {
    id: "harmony_modal_7_days",
    title: "Wymiana Modalna",
    description: "Wprowadź kolory z innych tonacji do swoich progresji.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "hard",
    category: "theory",
    requiredSkillId: "harmony",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Harmony",
    dependsOn: "harmony_7_days",
    shortGoal: "7 days / 15 min daily",
    rewardDescription: "900 XP",
    accentColor: "main",
    exercises: [
      {
        id: "h_mod_1",
        title: "Pożyczone Akordy",
        description: "Używaj akordów z tonacji molowej w durowej (i odwrotnie).",
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Akordy molowe w durowej tonacji dodają melancholii."],
        metronomeSpeed: null,
        relatedSkills: ["harmony"]
      }
    ]
  },
  {
    id: "harmony_jazz_10_days",
    title: "Jazzowe Reharmonizacje",
    description: "Zmień proste piosenki w jazzowe arcydzieła.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "theory",
    requiredSkillId: "harmony",
    requiredLevel: 12,
    unlockDescription: "Lvl 12 Harmony",
    dependsOn: "harmony_modal_7_days",
    shortGoal: "10 days / 20 min daily",
    rewardDescription: "1800 XP",
    accentColor: "main",
    exercises: [
      {
        id: "h_jazz_1",
        title: "Substytucje Tritone",
        description: "Podmieniaj akordy dominantowe na ich trytonowe odpowiedniki.",
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 20,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Eksperymentuj z prowadzeniem głosów (voice leading)."],
        metronomeSpeed: null,
        relatedSkills: ["harmony", "chord_theory"]
      }
    ]
  },
  {
    id: "vibrato_basics_3_days",
    title: "Fundamenty Vibrato",
    description: "Naucz się kontrolować oscylację dźwięku.",
    streakDays: 3,
    intensity: "low",
    difficulty: "easy",
    category: "technique",
    requiredSkillId: "vibrato",
    requiredLevel: 0,
    unlockDescription: "Lvl 3 Vibrato",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "300 XP",
    accentColor: "main",
    exercises: [
      {
        id: "v_bas_1",
        title: "Równy Puls",
        description: "Utrzymuj równe tempo vibrato.",
        difficulty: "easy",
        category: "technique",
        timeInMinutes: 5,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Ruch powinien być inicjowany z nadgarstka."],
        metronomeSpeed: null,
        relatedSkills: ["vibrato"]
      }
    ]
  },
  {
    id: "vibrato_rock_5_days",
    title: "Szerokie Rockowe Vibrato",
    description: "Energiczne i szerokie vibrato w stylu legend rocka.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "vibrato",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 Vibrato",
    dependsOn: "vibrato_basics_3_days",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "v_rock_1",
        title: "Agresywna Oscylacja",
        description: "Szerokie vibrato na dźwiękach podciągniętych.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Używaj kilku palców do wsparcia sily."],
        metronomeSpeed: null,
        relatedSkills: ["vibrato", "bending"]
      }
    ]
  },
  {
    id: "vibrato_classical_7_days",
    title: "Klasyczne Vibrato Palcowe",
    description: "Delikatne vibrato wzdłuż struny, bez podciągania.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "vibrato",
    requiredLevel: 9,
    unlockDescription: "Lvl 9 Vibrato",
    dependsOn: "vibrato_rock_5_days",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "900 XP",
    accentColor: "main",
    exercises: [
      {
        id: "v_class_1",
        title: "Mikrotonalna Płynność",
        description: "Vibrato poziome w stylu skrzypcowym.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["To vibrato najlepiej brzmi na gitarach akustycznych i klasycznych."],
        metronomeSpeed: null,
        relatedSkills: ["vibrato"]
      }
    ]
  },
  {
    id: "theory_adv_chords_7_days",
    title: "Zaawansowana Budowa Akordów",
    description: "Buduj akordy polichordalne i hybrydowe.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "hard",
    category: "theory",
    requiredSkillId: "music_theory",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 Theory",
    dependsOn: "music_theory_5_days",
    shortGoal: "7 days / 15 min daily",
    rewardDescription: "900 XP",
    accentColor: "main",
    exercises: [
      {
        id: "t_adv_1",
        title: "Slash Chords",
        description: "Zrozumienie funkcji basu w akordach hybrydowych.",
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Slash chords tworzą piękne, nowoczesne brzmienia."],
        metronomeSpeed: null,
        relatedSkills: ["music_theory", "chord_theory"]
      }
    ]
  },
  {
    id: "theory_counterpoint_10_days",
    title: "Podstawy Kontrapunktu",
    description: "Naucz się pisać dwie niezależne linie melodyczne.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "theory",
    requiredSkillId: "music_theory",
    requiredLevel: 10,
    unlockDescription: "Lvl 10 Theory",
    dependsOn: "theory_adv_chords_7_days",
    shortGoal: "10 days / 20 min daily",
    rewardDescription: "1500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "t_count_1",
        title: "Głosy Niezależne",
        description: "Zasady ruchu równoległego i przeciwstawnego.",
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 20,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Unikaj równoległych oktaw i kwint."],
        metronomeSpeed: null,
        relatedSkills: ["music_theory", "composition"]
      }
    ]
  },
  {
    id: "slide_open_tuning_5_days",
    title: "Eksploracja Open Tunings",
    description: "Otwórz się na nowe brzmienia ze slide'em.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "slide_guitar",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Slide",
    dependsOn: "slide_guitar_3_days",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600 XP",
    accentColor: "main",
    exercises: [
      {
        id: "sl_ot_1",
        title: "Open G / Open D",
        description: "Graj akordy i licki w otwartych strojach.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Open tunings to naturalne środowisko dla slide'u."],
        metronomeSpeed: null,
        relatedSkills: ["slide_guitar"]
      }
    ]
  },
  {
    id: "slide_intonation_7_days",
    title: "Intonacja i Precyzja Slide",
    description: "Perfekcyjne trafianie w dźwięki bez prożków.",
    streakDays: 7,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "slide_guitar",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Slide",
    dependsOn: "slide_open_tuning_5_days",
    shortGoal: "7 days / 15 min daily",
    rewardDescription: "900 XP",
    accentColor: "main",
    exercises: [
      {
        id: "sl_int_1",
        title: "Chirurgiczna Precyzja",
        description: "Trafianie w konkretne interwały ze słuchu.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Sugeruj się prożkami, ale wierz swoim uszom."],
        metronomeSpeed: null,
        relatedSkills: ["slide_guitar", "ear_training"]
      }
    ]
  },
  {
    id: "audio_signal_chain_5_days",
    title: "Cyfrowy Łańcuch Sygnału",
    description: "Opanuj modelowanie brzmienia wewnątrz DAW.",
    streakDays: 5,
    intensity: "low",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "audio_production",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Audio",
    dependsOn: "audio_tone_3_days",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600 XP",
    accentColor: "main",
    exercises: [
      {
        id: "a_sc_1",
        title: "Symulacje Kolumn",
        description: "Używanie Impulse Responses do kształtowania brzmienia.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Kolumna ma ogromny wpływ na końcowy sound."],
        metronomeSpeed: null,
        relatedSkills: ["audio_production"]
      }
    ]
  },
  {
    id: "audio_mixing_10_days",
    title: "Gitara w Miksie",
    description: "Profesjonalne osadzenie instrumentu w utworze.",
    streakDays: 10,
    intensity: "medium",
    difficulty: "hard",
    category: "creativity",
    requiredSkillId: "audio_production",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Audio",
    dependsOn: "audio_signal_chain_5_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1200 XP",
    accentColor: "main",
    exercises: [
      {
        id: "a_mix_1",
        title: "Korektor i Kompresja",
        description: "Czyszczenie pasma i kontrola dynamiki nagrania.",
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Nie bój się wycinać niepotrzebnego dołu."],
        metronomeSpeed: null,
        relatedSkills: ["audio_production"]
      }
    ]
  },
  {
    id: "bending_unison_5_days",
    title: "Bendy Unisono",
    description: "Idealna intonacja dwóch współbrzmiących dźwięków.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "bending",
    requiredLevel: 7,
    unlockDescription: "Lvl 7 Bending",
    dependsOn: "bending_5_days",
    shortGoal: "5 days / 5 min daily",
    rewardDescription: "600 XP",
    accentColor: "main",
    exercises: [
      {
        id: "b_uni_1",
        title: "Zgranie Pitchu",
        description: "Dociąganie dźwięku do nuty trzymanej na sąsiedniej strunie.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: ["Graj unisono bendy na strunach E i B, dbając o zanik interferencji dźwięku."],
        tips: ["Słuchaj 'dudnienia' – im wolniejsze, tym bliżej jesteś celu."],
        metronomeSpeed: null,
        relatedSkills: ["bending", "ear_training"]
      }
    ]
  },
  {
    id: "hybrid_chicken_7_days",
    title: "Chicken Picking Vibes",
    description: "Opanuj perkusyjny atak w stylu country.",
    streakDays: 7,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "hybrid_picking",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Hybrid Picking",
    dependsOn: "hybrid_5_days",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "800 XP",
    accentColor: "main",
    exercises: [
      {
        id: "h_cp_1",
        title: "Tłumione Skoki",
        description: "Szybkie skoki między strunami z tłumieniem dłonią.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Atakuj struny palcami z lekkim szarpnięciem."],
        metronomeSpeed: null,
        relatedSkills: ["hybrid_picking"]
      }
    ]
  },
  {
    id: "hybrid_virtuoso_10_days",
    title: "Wirtuoz Hybrid Picking",
    description: "Złożone polifoniczne licki na całej szerokości gryfu.",
    streakDays: 10,
    intensity: "extreme",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "hybrid_picking",
    requiredLevel: 12,
    unlockDescription: "Lvl 12 Hybrid Picking",
    dependsOn: "hybrid_chicken_7_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "h_v_1",
        title: "Polifoniczne Kaskady",
        description: "Szybkie arpeggia i linie melodyczne.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Dopasuj barwę ataku kostki i palców."],
        metronomeSpeed: null,
        relatedSkills: ["hybrid_picking", "sweep_picking"]
      }
    ]
  },
  {
    id: "transcription_riff_7_days",
    title: "Detektyw Riffów",
    description: "Transkrybuj 3 złożone riffy ze słuchu.",
    streakDays: 7,
    intensity: "high",
    difficulty: "hard",
    category: "hearing",
    requiredSkillId: "transcription",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Transcription",
    dependsOn: "transcription_5_days",
    shortGoal: "7 days / 15 min daily",
    rewardDescription: "800 XP",
    accentColor: "main",
    exercises: [
      {
        id: "tr_r_1",
        title: "Analiza Rytmiczna Riffu",
        description: "Zrozumienie podziałów w trudnych riffach.",
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Zwracaj uwagę na syncopy."],
        metronomeSpeed: null,
        relatedSkills: ["transcription", "rythm_recognition"]
      }
    ]
  },
  {
    id: "transcription_pro_14_days",
    title: "Maraton Pełnej Transkrypcji",
    description: "Zapisz cały utwór od początku do końca.",
    streakDays: 14,
    intensity: "extreme",
    difficulty: "hard",
    category: "hearing",
    requiredSkillId: "transcription",
    requiredLevel: 9,
    unlockDescription: "Lvl 9 Transcription",
    dependsOn: "transcription_riff_7_days",
    shortGoal: "14 days / 20 min daily",
    rewardDescription: "2000 XP",
    accentColor: "main",
    exercises: [
      {
        id: "tr_p_1",
        title: "Kompletny Zapis",
        description: "Zapis nutowy lub tabulatura całego utworu.",
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 20,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Podziel pracę na sekcje: intro, zwrotka, chorus."],
        metronomeSpeed: null,
        relatedSkills: ["transcription", "music_theory"]
      }
    ]
  },
  {
    id: "rhythm_poly_7_days",
    title: "Polirytmiczny Labirynt",
    description: "Naucz się grać dwa rytmy jednocześnie.",
    streakDays: 7,
    intensity: "high",
    difficulty: "hard",
    category: "hearing",
    requiredSkillId: "rythm_recognition",
    requiredLevel: 7,
    unlockDescription: "Lvl 7 Rhythm Recognition",
    dependsOn: "rhythm_recog_5_days",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "900 XP",
    accentColor: "main",
    exercises: [
      {
        id: "rr_p_1",
        title: "3 przeciw 2",
        description: "Podstawowe polirytmie na gitarze.",
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Użyj metronomu z różnymi akcentami."],
        metronomeSpeed: null,
        relatedSkills: ["rythm_recognition", "rhythm"]
      }
    ]
  },
  {
    id: "rhythm_sync_10_days",
    title: "Ekstremalna Synchronizacja",
    description: "Bezbłędne rozpoznawanie i granie złożonych pauz.",
    streakDays: 10,
    intensity: "extreme",
    difficulty: "hard",
    category: "hearing",
    requiredSkillId: "rythm_recognition",
    requiredLevel: 10,
    unlockDescription: "Lvl 10 Rhythm Recognition",
    dependsOn: "rhythm_poly_7_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "rr_s_1",
        title: "Cisza w Rytmie",
        description: "Graj riffy z nagłymi pauzami.",
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Wewnętrzny puls musi być niezachwiany."],
        metronomeSpeed: null,
        relatedSkills: ["rythm_recognition", "rhythm"]
      }
    ]
  },
  {
    id: "picking_cross_5_days",
    title: "Crosspicking Mastery",
    description: "Płynne kostkowanie przez 3-4 struny.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "picking",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Picking",
    dependsOn: "picking_basics_3_days",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600 XP",
    accentColor: "main",
    exercises: [
      {
        id: "p_c_1",
        title: "Ruch Wahadłowy",
        description: "Kostkowanie naprzemienne na skaczących strunach.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Małe, ekonomiczne ruchy to klucz."],
        metronomeSpeed: null,
        relatedSkills: ["picking", "alternate_picking"]
      }
    ]
  },
  {
    id: "picking_endurance_10_days",
    title: "Maraton Wytrzymałości Kostki",
    description: "Utrzymaj stały atak przez długi czas.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "picking",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Picking",
    dependsOn: "picking_cross_5_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1200 XP",
    accentColor: "main",
    exercises: [
      {
        id: "p_e_1",
        title: "Stałe Downstrokes",
        description: "15 minut grania agresywnych downstroków.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Uderzaj prosto z łokcia/nadgarstka zależnie od tempa."],
        metronomeSpeed: null,
        relatedSkills: ["picking", "rhythm"]
      }
    ]
  },
  {
    id: "finger_independence_adv_10_days",
    title: "Zaawansowana Gimnastyka Palców",
    description: "Niezależność każdego palca w ekstremalnych rozciągnięciach.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "finger_independence",
    requiredLevel: 7,
    unlockDescription: "Lvl 7 Independence",
    dependsOn: "finger_independence_7_days",
    shortGoal: "10 days / 10 min daily",
    rewardDescription: "1000 XP",
    accentColor: "main",
    exercises: [
      {
        id: "fi_a_1",
        title: "Pająk z Rozciągnięciem",
        description: "Ćwiczenia chromatyczne z pustym progiem między palcami.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Nie forsuj rozciągnięcia zbyt mocno."],
        metronomeSpeed: null,
        relatedSkills: ["finger_independence"]
      }
    ]
  },
  {
    id: "finger_independence_master_14_days",
    title: "Mistrz Niezależności Palców",
    description: "Najtrudniejsze kombinacje ruchowe dla Twojej lewej ręki.",
    streakDays: 14,
    intensity: "extreme",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "finger_independence",
    requiredLevel: 10,
    unlockDescription: "Lvl 10 Independence",
    dependsOn: "finger_independence_adv_10_days",
    shortGoal: "14 days / 15 min daily",
    rewardDescription: "2000 XP",
    accentColor: "main",
    exercises: [
      {
        id: "fi_m_1",
        title: "Statyczne Trzymanie",
        description: "Trzymaj 3 palce nieruchomo, poruszając tylko jednym.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Skup się na rozluźnieniu nieużywanych palców."],
        metronomeSpeed: null,
        relatedSkills: ["finger_independence"]
      }
    ]
  },
  {
    id: "string_skipping_triads_7_days",
    title: "Triady ze Skakaniem Strun",
    description: "Graj triady z pomijaniem strun dla unikalnego brzmienia.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "string_skipping",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 String Skipping",
    dependsOn: "string_skipping_5_days",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "800 XP",
    accentColor: "main",
    exercises: [
      {
        id: "ss_t_1",
        title: "Arpeggia z Pominięciem",
        description: "Triady durowe i molowe na strunach 1, 3 i 5.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Używaj kostkowania naprzemiennego."],
        metronomeSpeed: null,
        relatedSkills: ["string_skipping", "chord_theory"]
      }
    ]
  },
  {
    id: "string_skipping_intervallic_10_days",
    title: "Interwałowe Skoki",
    description: "Szerokie skoki interwałowe w stylu nowoczesnym.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "string_skipping",
    requiredLevel: 9,
    unlockDescription: "Lvl 9 String Skipping",
    dependsOn: "string_skipping_triads_7_days",
    shortGoal: "10 days / 12 min daily",
    rewardDescription: "1200 XP",
    accentColor: "main",
    exercises: [
      {
        id: "ss_i_1",
        title: "Skoki przez 2 struny",
        description: "Graj linie melodyczne omijając dwie sąsiednie struny.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 12,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Kontroluj niechciane wybrzmiewanie strun."],
        metronomeSpeed: null,
        relatedSkills: ["string_skipping"]
      }
    ]
  },
  {
    id: "harmonics_art_5_days",
    title: "Harmoniki Sztuczne",
    description: "Wydobądź krystaliczne dźwięki z dowolnego progu.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "technique",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 Technique",
    dependsOn: "harmonics_3_days",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600 XP",
    accentColor: "main",
    exercises: [
      {
        id: "tech_ha_1",
        title: "Pinch Harmonics",
        description: "Zdobądź charakterystyczny 'pisk' gitary.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Szukaj 'sweet spotów' między przetwornikami."],
        metronomeSpeed: null,
        relatedSkills: ["technique"]
      }
    ]
  },
  {
    id: "technique_hybrid_shred_10_days",
    title: "Hybrydowy Shred",
    description: "Połączenie technik dla maksymalnej prędkości.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "technique",
    requiredLevel: 9,
    unlockDescription: "Lvl 9 Technique",
    dependsOn: "harmonics_art_5_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "tech_hs_1",
        title: "Fast Flow",
        description: "Łączenie legato, tappingu i kostkowania.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Płynność zmiany techniki to Twój cel."],
        metronomeSpeed: null,
        relatedSkills: ["technique", "legato", "tapping"]
      }
    ]
  },
  {
    id: "tapping_multi_7_days",
    title: "Tapping Wielopalcowy",
    description: "Używaj więcej niż jednego palca prawej ręki do tappingu.",
    streakDays: 7,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "tapping",
    requiredLevel: 7,
    unlockDescription: "Lvl 7 Tapping",
    dependsOn: "tapping_3_days",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "900 XP",
    accentColor: "main",
    exercises: [
      {
        id: "tap_m_1",
        title: "Tapowane Akordy",
        description: "Budowanie akordów obiema rękami na gryfie.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Dbaj o to, by każda nuta wybrzmiewała czysto."],
        metronomeSpeed: null,
        relatedSkills: ["tapping", "chord_theory"]
      }
    ]
  },
  {
    id: "tapping_orchestral_12_days",
    title: "Tapping Orkiestrowy",
    description: "Złożone polifoniczne struktury obiema rękami.",
    streakDays: 12,
    intensity: "extreme",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "tapping",
    requiredLevel: 10,
    unlockDescription: "Lvl 10 Tapping",
    dependsOn: "tapping_multi_7_days",
    shortGoal: "12 days / 15 min daily",
    rewardDescription: "1800 XP",
    accentColor: "main",
    exercises: [
      {
        id: "tap_o_1",
        title: "Symfonia na Gryfie",
        description: "Niezależność rąk w tappingu dwuręcznym.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Wykorzystaj tłumik (fretwrap), aby wyciszyć struny."],
        metronomeSpeed: null,
        relatedSkills: ["tapping", "composition"]
      }
    ]
  },
  {
    id: "songwriting_structure_7_days",
    title: "Architektura Utworu",
    description: "Opanuj formy piosenek i przejścia między sekcjami.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "composition",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Composition",
    dependsOn: "songwriting_7_days",
    shortGoal: "7 days / 15 min daily",
    rewardDescription: "800 XP",
    accentColor: "main",
    exercises: [
      {
        id: "soc_s_1",
        title: "Mosty i Łączniki",
        description: "Tworzenie płynnych przejść między zwrotką a refrenem.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Użyj zmiany dynamiki lub tonacji."],
        metronomeSpeed: null,
        relatedSkills: ["composition"]
      }
    ]
  },
  {
    id: "songwriting_extended_10_days",
    title: "Rozszerzona Kompozycja",
    description: "Twórz epickie, wieloczęściowe kompozycje.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "creativity",
    requiredSkillId: "composition",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Composition",
    dependsOn: "songwriting_structure_7_days",
    shortGoal: "10 days / 20 min daily",
    rewardDescription: "1500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "soc_e_1",
        title: "Epicka Suita",
        description: "Utwór trwający powyżej 7 minut.",
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 20,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Powracaj do głównych tematów w nowych aranżacjach."],
        metronomeSpeed: null,
        relatedSkills: ["composition", "harmony"]
      }
    ]
  },
  {
    id: "pitch_perfect_7_days",
    title: "Idealna Intonacja",
    description: "Rozpoznawaj dźwięki bez instrumentu pod ręką.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "medium",
    category: "hearing",
    requiredSkillId: "pitch_recognition",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 Pitch Recognition",
    dependsOn: "pitch_recognition_5_days",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "800 XP",
    accentColor: "main",
    exercises: [
      {
        id: "pr_p_1",
        title: "Relatywny Pitch",
        description: "Identyfikuj dźwięki w relacji do dźwięku bazowego.",
        difficulty: "medium",
        category: "hearing",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Śpiewanie nazw dźwięków pomaga w zapamiętywaniu ich barwy."],
        metronomeSpeed: null,
        relatedSkills: ["pitch_recognition"]
      }
    ]
  },
  {
    id: "pitch_absolute_master_14_days",
    title: "Mistrz Słuchu Absolutnego",
    description: "Najwyższy poziom rozpoznawania wysokości dźwięku.",
    streakDays: 14,
    intensity: "high",
    difficulty: "hard",
    category: "hearing",
    requiredSkillId: "pitch_recognition",
    requiredLevel: 9,
    unlockDescription: "Lvl 9 Pitch Recognition",
    dependsOn: "pitch_perfect_7_days",
    shortGoal: "14 days / 15 min daily",
    rewardDescription: "2000 XP",
    accentColor: "main",
    exercises: [
      {
        id: "pr_a_1",
        title: "Ślepy Test",
        description: "Nazywaj losowe dźwięki bez żadnego punktu odniesienia.",
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["To wymaga lat praktyki, nie zniechęcaj się."],
        metronomeSpeed: null,
        relatedSkills: ["pitch_recognition"]
      }
    ]
  },
  {
    id: "fingerpicking_poly_7_days",
    title: "Polifonia Palcowa",
    description: "Niezależność kciuka i palców w stylu Travis Picking.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "fingerpicking",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Fingerpicking",
    dependsOn: "fingerstyle_5_days",
    shortGoal: "7 days / 12 min daily",
    rewardDescription: "800 XP",
    accentColor: "main",
    exercises: [
      {
        id: "fp_p_1",
        title: "Spacerującego Basisty",
        description: "Utrzymuj stały bas kciukiem, grając melodię palcami.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 12,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Kciuk musi działać jak automat."],
        metronomeSpeed: null,
        relatedSkills: ["fingerpicking", "rhythm"]
      }
    ]
  },
  {
    id: "fingerpicking_percussive_10_days",
    title: "Nowoczesny Fingerstyle Perkusyjny",
    description: "Dodaj elementy perkusyjne do swojej gry palcowej.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "fingerpicking",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Fingerpicking",
    dependsOn: "fingerpicking_poly_7_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "fp_per_1",
        title: "Slap & Pop",
        description: "Uderzanie w struny i korpus gitary.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Dbaj o kondycję swoich paznokci."],
        metronomeSpeed: null,
        relatedSkills: ["fingerpicking", "technique"]
      }
    ]
  },
  {
    id: "phrasing_blues_7_days",
    title: "Bluesowy Smak",
    description: "Opanuj technikę 'pytanie i odpowiedź'.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "phrasing",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Phrasing",
    dependsOn: "phrasing_5_days",
    shortGoal: "7 days / 15 min daily",
    rewardDescription: "800 XP",
    accentColor: "main",
    exercises: [
      {
        id: "ph_b_1",
        title: "Dialog z Gitarą",
        description: "Twórz frazy, które brzmią jak ludzki głos.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Wykorzystuj pauzy – cisza też jest muzyką."],
        metronomeSpeed: null,
        relatedSkills: ["phrasing", "improvisation"]
      }
    ]
  },
  {
    id: "phrasing_fusion_10_days",
    title: "Frakcjonowanie Fusion",
    description: "Łącz skomplikowane skale z nietypowym rytmem.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "creativity",
    requiredSkillId: "phrasing",
    requiredLevel: 9,
    unlockDescription: "Lvl 9 Phrasing",
    dependsOn: "phrasing_blues_7_days",
    shortGoal: "10 days / 20 min daily",
    rewardDescription: "1500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "ph_f_1",
        title: "Chromatyczne Łączniki",
        description: "Używanie dźwięków spoza skali do łączenia fraz.",
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 20,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Zwracaj uwagę na dźwięki docelowe (target notes)."],
        metronomeSpeed: null,
        relatedSkills: ["phrasing", "scales"]
      }
    ]
  },
  {
    id: "articulation_dynamics_7_days",
    title: "Dynamika Wyrazu",
    description: "Kontroluj głośność każdego dźwięku dla większej ekspresji.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "articulation",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Articulation",
    dependsOn: "articulation_3_days",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "800 XP",
    accentColor: "main",
    exercises: [
      {
        id: "art_d_1",
        title: "Od Piano do Forte",
        description: "Graj tę samą frazę coraz głośniej i ciszej.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Zmiana kąta kostki zmienia barwę dźwięku."],
        metronomeSpeed: null,
        relatedSkills: ["articulation"]
      }
    ]
  },
  {
    id: "articulation_staccato_10_days",
    title: "Precyzja Staccato",
    description: "Krótkie, urywane dźwięki z absolutną kontrolą.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "articulation",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Articulation",
    dependsOn: "articulation_dynamics_7_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1250 XP",
    accentColor: "main",
    exercises: [
      {
        id: "art_s_1",
        title: "Tłumienie Lewą Ręką",
        description: "Urywanie dźwięku poprzez poluzowanie nacisku palca.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Synchronizacja puszczenia palca i uderzenia kostką jest kluczowa."],
        metronomeSpeed: null,
        relatedSkills: ["articulation", "rythm_recognition"]
      }
    ]
  },
  {
    id: "bending_virtuoso_10_days",
    title: "Wirtuoz Podciągnięć",
    description: "Ekstremalna kontrola nad bendingiem i mikrointerwałami.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "bending",
    requiredLevel: 9,
    unlockDescription: "Lvl 9 Bending",
    dependsOn: "bending_unison_5_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1200 XP",
    accentColor: "main",
    exercises: [
      {
        id: "b_virt_1",
        title: "Bendy o 1.5 i 2 Tony",
        description: "Bardzo szerokie podciągnięcia z idealną intonacją.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Uważaj na kondycję strun."],
        metronomeSpeed: null,
        relatedSkills: ["bending"]
      }
    ]
  },
  {
    id: "improv_outside_10_days",
    title: "Gra Outside",
    description: "Naucz się świadomie wychodzić poza skalę.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "creativity",
    requiredSkillId: "improvisation",
    requiredLevel: 9,
    unlockDescription: "Lvl 9 Improvisation",
    dependsOn: "improv_5_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1500 XP",
    accentColor: "main",
    exercises: [
      {
        id: "im_out_1",
        title: "Side-Slipping",
        description: "Przesuwanie frazy o pół tonu w górę/dół.",
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Najważniejszy jest powrót – 'resolving'."],
        metronomeSpeed: null,
        relatedSkills: ["improvisation", "scales"]
      }
    ]
  },
  {
    id: "rhythm_funk_10_days",
    title: "Funkowa Precyzja",
    description: "Szesnastkowy groove z absolutną kontrolą.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "rhythm",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Rhythm",
    dependsOn: "rhythm_precision_7_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1300 XP",
    accentColor: "main",
    exercises: [
      {
        id: "r_funk_1",
        title: "The Scratch",
        description: "Perkusyjne tłumienie w rytmie szesnastkowym.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi."],
        tips: ["Luźny nadgarstek to jedyna droga do dobrego funku."],
        metronomeSpeed: { min: 90, max: 130, recommended: 110 },
        relatedSkills: ["rhythm", "articulation"]
      }
    ]
  }
];
