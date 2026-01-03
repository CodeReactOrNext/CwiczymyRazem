import { Challenge } from "../challenges.types";

export const challengesList: Challenge[] = [
  // TECHNIQUE - Alternate Picking
  {
    id: "technique_5_days",
    title: { pl: "Konsystencja Kostkowania", en: "Alternate Picking Consistency" },
    description: {
      pl: "Buduj kontrolę dynamiki i absolutną synchronizację rąk przez 5 dni.",
      en: "Build dynamic control and absolute synchronization for 5 days."
    },
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
        title: { pl: "Trening z Metronomem", en: "The Metronome Grind" },
        description: { pl: "Utrzymaj perfekcyjną precyzję przy pasażach szesnastkowych.", en: "Maintain perfect accuracy on 16th note scale runs." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Zacznij od wolniejszego tempa, aby upewnić się, że góra-dół są idealnie równe.", en: "Start at a slower tempo to ensure up-down strokes are perfectly even." }
        ],
        metronomeSpeed: { min: 80, max: 120, recommended: 100 },
        relatedSkills: ["alternate_picking"]
      }
    ]
  },

  // TECHNIQUE - Legato
  {
    id: "legato_5_days",
    title: { pl: "Płynność i Siła Legato", en: "Legato Flow & Strength" },
    description: {
      pl: "Rozwijaj niezależność palców i klarowność hammer-onów oraz pull-offów.",
      en: "Develop finger independence and hammer-on/pull-off clarity."
    },
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
        title: { pl: "Mistrzowska Płynność Palców", en: "Fluid Finger Mastery" },
        description: { pl: "Ciągłe tryle i fragmenty skal bez udziału kostki.", en: "Continuous trills and scale fragments without picking." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Utrzymuj kciuk z tyłu gryfu, aby palce miały większy zasięg i siłę nacisku.", en: "Keep your thumb behind the neck to give your fingers more range and pressure." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["legato"]
      }
    ]
  },

  // TECHNIQUE - Bending
  {
    id: "bending_5_days",
    title: { pl: "Precyzyjna Intonacja Podciągnięć", en: "Perfect Pitch Bends" },
    description: {
      pl: "Skup się na precyzji mikrotonalnej i śpiewnym wybrzmiewaniu.",
      en: "Focus on micro-tonal accuracy and vocal-like sustain."
    },
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
        title: { pl: "Trening Celowania w Dźwięk", en: "Target Note Accuracy" },
        description: { pl: "Dostrajaj podciągnięcia o pół i cały ton do dźwięków wzorcowych.", en: "Match target pitches with 1/2 and full step bends." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Używaj sąsiednich palców jako wsparcia przy podciąganiu struny.", en: "Use adjacent fingers for support when bending the string." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["bending"]
      }
    ]
  },

  // TECHNIQUE - Tapping
  {
    id: "tapping_3_days",
    title: { pl: "Artykulacja Tappingu", en: "Tapping Articulation" },
    description: {
      pl: "Opanuj atak i tłumienie w technice tappingu oburęcznego.",
      en: "Master the attack and muting of two-handed tapping techniques."
    },
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
        title: { pl: "Triadyczne Kaskady", en: "Triadic Burst" },
        description: { pl: "Czyste triady tappingowe z naciskiem na kontrolę niechcianych dźwięków.", en: "Clean tapped triads with focus on string noise control." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Tłumij nieużywane struny wnętrzem prawej dłoni, aby uniknąć przydźwięków.", en: "Mute unused strings with your right palm to avoid unwanted noise." }
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 80 },
        relatedSkills: ["tapping"]
      }
    ]
  },

  // TECHNIQUE - Economy Picking / Sweeping
  {
    id: "sweeping_5_days",
    title: { pl: "Synchronizacja Sweep Picking", en: "Sweep Picking Synchronization" },
    description: {
      pl: "Wyczyść swoje arpeggia dzięki niemal chirurgicznej koordynacji rąk.",
      en: "Clean up your arpeggios with surgical hand coordination."
    },
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
        title: { pl: "Koordynacja Przetaczania", en: "Rolling Coordination" },
        description: { pl: "Skup się na czystej separacji strun i technice 'przetaczania' palców.", en: "Focus on clean string separation and 'rolling' fingers." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Kostka powinna 'przepływać' przez struny jednym ruchem, a nie serią uderzeń.", en: "The pick should 'flow' through the strings in one motion, not a series of strokes." }
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 70 },
        relatedSkills: ["sweep_picking"]
      }
    ]
  },


  // THEORY - Scales
  {
    id: "theory_3_days",
    title: { pl: "Odkrywanie Mapy Interwałów", en: "Interval Map Discovery" },
    description: {
      pl: "Wyjdź poza schematy – zinternalizuj brzmienie i pozycje interwałów.",
      en: "Go beyond shapes – internalize the sound and positions of intervals."
    },
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
        title: { pl: "Opalcowanie Skal", en: "Scale Fingerings" },
        description: { pl: "Wizualizacja wzorców skal na całej szerokości gryfu.", en: "Visualizing scale patterns across the entire fretboard." },
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Nazywaj dźwięki na głos podczas grania, aby lepiej zapamiętać mapę gryfu.", en: "Say the notes out loud while playing to better memorize the fretboard map." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["scales"]
      }
    ]
  },
  {
    id: "theory_5_days",
    title: { pl: "Biegłość Modalna", en: "Modal Fluency" },
    description: {
      pl: "Połącz teorię z technicznym wykonaniem wzorców modalnych.",
      en: "Connect theory to your clinical execution of modal shapes."
    },
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
        title: { pl: "Połączenia Harmoniczne", en: "Harmonic Connections" },
        description: { pl: "Prowadzenie skal przez koło kwintowe w obrębie jednej pozycji.", en: "Running scales through the Circle of Fifths in one position." },
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Zwracaj uwagę na charakterystyczny dźwięk (charakter) każdego modu.", en: "Pay attention to the characteristic sound (flavor) of each mode." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["scales"]
      }
    ]
  },

  // HEARING - Ear Training
  {
    id: "ear_5_days",
    title: { pl: "Rozwój Słuchu Relatywnego", en: "Aural Development" },
    description: {
      pl: "Zmniejsz dystans między usłyszeniem melodii a jej natychmiastowym zagraniem.",
      en: "Bridge the gap between hearing a melody and playing it instantly."
    },
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
        title: { pl: "Rozpoznawanie Interwałów", en: "Intervalic Recognition" },
        description: { pl: "Identyfikacja i transkrypcja interwałów w czasie rzeczywistym.", en: "Identifying and transcribing intervals on the fly." },
        difficulty: "medium",
        category: "hearing",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Skojarz interwały ze znanymi piosenkami (np. kwarta czysta to początek 'Gwiezdnych Wojen').", en: "Associate intervals with well-known songs (e.g., a perfect fourth is the start of 'Star Wars')." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["ear_training"]
      }
    ]
  },

  // CREATIVITY - Improvisation
  {
    id: "improv_5_days",
    title: { pl: "Frazowanie Melodyczne", en: "Melodic Phrasing" },
    description: {
      pl: "Rozwijaj własny głos poprzez improwizację z określonymi ograniczeniami.",
      en: "Develop your voice through structured improvisation constraints."
    },
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
        title: { pl: "Temat i Wariacja", en: "Theme & Variation" },
        description: { pl: "Twórz motywy i rozwijaj je w oparciu o profesjonalne ścieżki podkładowe.", en: "Create motifs and develop them over professional backing tracks." },
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Ogranicz się do 3 dźwięków na strunie lub jednej pozycji, aby wymusić kreatywność.", en: "Limit yourself to 3 notes per string or one position to force creativity." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["improvisation"]
      }
    ]
  },

  // CREATIVITY - Theory Application (Arpeggios)
  {
    id: "arpeggios_5_days",
    title: { pl: "Celowanie w Składniki Akordów", en: "Targeting Chord Tones" },
    description: {
      pl: "Naucz się kreatywnego ogrywania zmian akordów za pomocą arpeggio.",
      en: "Learn to outline chord changes creatively using arpeggios."
    },
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
        title: { pl: "Zarysy Harmoniczne", en: "Harmonic Outlining" },
        description: { pl: "Wizualizacja składników akordów wewnątrz wzorców solowych.", en: "Visualizing chord tones within your soloing patterns." },
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Wizualizacja kształtów akordów pod palcami ułatwia szybkie odnalezienie arpeggio.", en: "Visualizing chord shapes under your fingers makes it easier to find the arpeggio." }
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
    title: { pl: "Efektywne Przejścia Akordowe", en: "Efficient Chord Transitions" },
    description: {
      pl: "Minimalizuj ruchy dla szybszych i płynniejszych zmian harmonicznych.",
      en: "Minimize movement for faster, smoother harmonic shifts."
    },
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
        title: { pl: "Precyzja Palca Przewodniego", en: "Pivot Finger Precision" },
        description: { pl: "Opanuj wspólne punkty podparcia między standardowymi kształtami akordów.", en: "Master common finger pivots between standard chord shapes." },
        difficulty: "easy",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Zawsze szukaj palca, który nie musi się odrywać od podstrunnicy podczas zmiany.", en: "Always look for a finger that doesn't need to leave the fretboard during a change." }
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 70 },
        relatedSkills: ["chord_theory", "rhythm"]
      }
    ]
  },

  // RHYTHM - Precision
  {
    id: "rhythm_precision_7_days",
    title: { pl: "Mistrzostwo Rytmicznego 'Pocketu'", en: "Rhythmic Pocket Mastery" },
    description: {
      pl: "Rozwijaj swój wewnętrzny zegar i zgraj się idealnie z metronomem.",
      en: "Develop an internal clock and lock in with the metronome."
    },
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
        title: { pl: "Kontrola Podziałów", en: "Subdivision Control" },
        description: { pl: "Przełączaj się między triolami, ósemkami i szesnastkami bez opóźnień.", en: "Switch between triplets, 8ths, and 16ths with zero lag." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Klaszcz lub tupać nogą równo z metronomem, aby poczuć puls całym ciałem.", en: "Clap or tap your foot in sync with the metronome to feel the pulse with your whole body." }
        ],
        metronomeSpeed: { min: 50, max: 90, recommended: 60 },
        relatedSkills: ["rhythm"]
      }
    ]
  },

  // TECHNIQUE - Speed Burst
  {
    id: "speed_burst_3_days",
    title: { pl: "Eksplozywne Serie Techniczne", en: "Explosive Technical Bursts" },
    description: {
      pl: "Trenuj swój układ nerwowy do krótkich serii o ekstremalnej prędkości.",
      en: "Train your nervous system for short, high-speed execution."
    },
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
        title: { pl: "Sprinty Grup Nutowych", en: "Note Grouping Sprints" },
        description: { pl: "Przyspieszaj krótkie fragmenty, by przesuwać swoją górną granicę prędkości.", en: "Accelerate short fragments to push your upper speed limit." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Rozluźnij dłoń kostkującą – napięcie to największy wróg prędkości.", en: "Relax your picking hand – tension is the greatest enemy of speed." }
        ],
        metronomeSpeed: { min: 120, max: 180, recommended: 140 },
        relatedSkills: ["alternate_picking"]
      }
    ]
  },

  // TECHNIQUE - Dynamic Phrasing
  {
    id: "dynamics_3_days",
    title: { pl: "Kontrola Dynamiki i Artykulacji", en: "Dymanics & Articulation Control" },
    description: {
      pl: "Spraw, by Twoja gitara przemówiła – opanuj różnicę między piano a forte.",
      en: "Make your guitar speak – master the difference between piano and forte."
    },
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
        title: { pl: "Dialog Dynamiczny", en: "Dynamic Dialogue" },
        description: { pl: "Graj ten sam motyw z różną siłą ataku kostki.", en: "Play the same motif with varying pick attack strength." },
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Kontrola dynamiki zaczyna się w głowie – usłysz różnicę, zanim uderzysz w strunę.", en: "Dynamic control starts in the head – hear the difference before you hit the string." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["improvisation"]
      }
    ]
  },

  // RHYTHM - Odd Meters
  {
    id: "odd_meter_5_days",
    title: { pl: "Eksploracja Nieparzystych Metrów", en: "Odd Meter Exploration" },
    description: {
      pl: "Przełam schemat 4/4 – poczuj puls w 5/4, 7/8 i innych niestandardowych metrach.",
      en: "Break the 4/4 mold – feel the pulse in 5/4, 7/8, and other odd meters."
    },
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
        title: { pl: "Puls w 7/8", en: "Feeling the 7/8" },
        description: { pl: "Graj riffy i skale w metrum siedem ósmych.", en: "Play riffs and scales in seven-eight time." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Akcentuj 'raz' – to pomoże Ci nie zgubić się w nieparzystej strukturze.", en: "Accent the 'one' – it will help you not get lost in the odd structure." }
        ],
        metronomeSpeed: { min: 60, max: 120, recommended: 80 },
        relatedSkills: ["rhythm"]
      }
    ]
  },

  // THEORY - Pentatonic Extensions
  {
    id: "pentatonic_5_days",
    title: { pl: "Rozszerzone Kształty Pentatoniki", en: "Pentatonic Extensions" },
    description: {
      pl: "Połącz pozycje pentatoniki, by swobodnie poruszać się po całym gryfie.",
      en: "Connect pentatonic positions to move freely across the whole fretboard."
    },
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
        title: { pl: "Diagonalna Pentatonika", en: "Diagonal Pentatonics" },
        description: { pl: "Graj skale wzdłuż gryfu, łącząc co najmniej 3 pozycje.", en: "Play scales along the neck, connecting at least 3 positions." },
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Skup się na dźwiękach wspólnych między pozycjami – to Twoje punkty orientacyjne.", en: "Focus on common notes between positions – these are your landmarks." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["scales"]
      }
    ]
  },

  // TECHNIQUE - Vibrato
  {
    id: "vibrato_3_days",
    title: { pl: "Śpiewny Vibrato", en: "Vocal Vibrato Mastery" },
    description: {
      pl: "Dodaj emocji do każdej nuty – opanuj kontrolę szerokości i tempa vibrato.",
      en: "Add emotion to every note – master the control of vibrato width and speed."
    },
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
        title: { pl: "Kontrola Oscylacji", en: "Oscillation Control" },
        description: { pl: "Ćwicz regularne, szerokie i wąskie vibrato na długich dźwiękach.", en: "Practice regular, wide, and narrow vibrato on sustained notes." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Ruch powinien pochodzić z nadgarstka, a nie z samych palców.", en: "The movement should come from the wrist, not just the fingers." }
        ],
        metronomeSpeed: { min: 60, max: 90, recommended: 70 },
        relatedSkills: ["bending"]
      }
    ]
  },

  // TECHNIQUE - Hybrid Picking
  {
    id: "hybrid_5_days",
    title: { pl: "Niezależność Hybrid Picking", en: "Hybrid Picking Independence" },
    description: {
      pl: "Połącz precyzję kostki z delikatnością palców prawej ręki.",
      en: "Combine the precision of the pick with the delicacy of the right-hand fingers."
    },
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
        title: { pl: "Skoki strun (String Skipping)", en: "Hybrid String Skipping" },
        description: { pl: "Używaj kostki na strunach basowych i palców (m, a) na wiolinowych.", en: "Use the pick on bass strings and fingers (m, a) on treble strings." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Staraj się wyrównać głośność między uderzeniem kostką a szarpnięciem palcem.", en: "Try to balance the volume between the pick stroke and the finger pluck." }
        ],
        metronomeSpeed: { min: 70, max: 110, recommended: 85 },
        relatedSkills: ["alternate_picking"]
      }
    ]
  },

  // THEORY - Triad Mastery
  {
    id: "triads_7_days",
    title: { pl: "Inwersje Triad na Gryfie", en: "Triad Inversions Mastery" },
    description: {
      pl: "Buduj partie gitary jak profesjonalista – opanuj 3-dźwięki w każdej pozycji.",
      en: "Build guitar parts like a pro – master 3-note triads in every position."
    },
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
        title: { pl: "Voice Leading", en: "Voice Leading Triads" },
        description: { pl: "Łącz akordy tak, aby zmieniało się jak najmniej dźwięków.", en: "Connect chords such that the fewest notes possible change." },
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Triady to najszybszy sposób na zrozumienie harmonii w solówkach.", en: "Triads are the fastest way to understand harmony in your soloing." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["chord_theory"]
      }
    ]
  },

  // TECHNIQUE - Muting & Cleanliness
  {
    id: "muting_3_days",
    title: { pl: "Kliniczna Czystość Gry", en: "Clinical Playing Cleanliness" },
    description: {
      pl: "Wyeliminuj niechciane dźwięki i buczenie strun.",
      en: "Eliminate unwanted noises and string hum."
    },
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
        title: { pl: "Palm Muting & Left Hand Mute", en: "Hand Muting Coordination" },
        description: { pl: "Graj z dużym gainem, dbając o absolutną ciszę między dźwiękami.", en: "Play with high gain, ensuring absolute silence between notes." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Im więcej gainu, tym bardziej musisz polegać na krawędzi prawej dłoni przy mostku.", en: "The more gain you use, the more you must rely on the edge of your right hand at the bridge." }
        ],
        metronomeSpeed: { min: 80, max: 140, recommended: 110 },
        relatedSkills: ["alternate_picking"]
      }
    ]
  },

  // TECHNIQUE - Fingerpicking
  {
    id: "fingerstyle_5_days",
    title: { pl: "Ewolucja Fingerstyle", en: "Fingerstyle Evolution" },
    description: {
      pl: "Odkryj niezależność kciuka i palców w grze bez kostki.",
      en: "Discover thumb and finger independence in pick-less playing."
    },
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
        title: { pl: "Travis Picking Basics", en: "Travis Picking Basics" },
        description: { pl: "Utrzymaj stały puls kciuka przy jednoczesnej grze melodii.", en: "Maintain a steady thumb pulse while playing melodies." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Trzymaj dłoń rozluźnioną, a palce blisko strun, aby zminimalizować ruch.", en: "Keep your hand relaxed and fingers close to the strings to minimize movement." }
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 80 },
        relatedSkills: ["fingerpicking"]
      }
    ]
  },

  // THEORY - Sight Reading
  {
    id: "sight_reading_3_days",
    title: { pl: "Biegłość Czytania Nut", en: "Sight Reading Sprint" },
    description: {
      pl: "Zwiększ szybkość rozpoznawania nut na pięciolinii i ich lokalizacji na gryfie.",
      en: "Increase your speed of recognizing notes on the staff and their location on the neck."
    },
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
        title: { pl: "Pierwsze Spojrzenie", en: "First Sight Flow" },
        description: { pl: "Graj proste melodie z nut bez wcześniejszego przygotowania.", en: "Play simple melodies from sheet music without prior preparation." },
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Zawsze patrz jeden takt do przodu, aby przygotować dłoń do zmiany pozycji.", en: "Always look one measure ahead to prepare your hand for position changes." }
        ],
        metronomeSpeed: { min: 40, max: 70, recommended: 50 },
        relatedSkills: ["sight_reading"]
      }
    ]
  },

  // CREATIVITY - Composition
  {
    id: "composition_5_days",
    title: { pl: "Laboratorium Kompozycji", en: "Composition Lab" },
    description: {
      pl: "Stwórz własny motyw muzyczny i rozwiń go w krótką etiudę.",
      en: "Create your own musical motif and develop it into a short etude."
    },
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
        title: { pl: "Budowanie Motywu", en: "Motif Construction" },
        description: { pl: "Zapisz lub nagraj 4-taktowy pomysł i dodaj do niego wariacje.", en: "Write down or record a 4-bar idea and add variations to it." },
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 15,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Nie oceniaj swoich pomysłów od razu – daj sobie przestrzeń na eksperymenty.", en: "Don't judge your ideas immediately – give yourself space to experiment." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["composition", "music_theory"]
      }
    ]
  },

  // HEARING - Pitch Recognition
  {
    id: "pitch_recognition_5_days",
    title: { pl: "Detektyw Dźwięków", en: "Pitch Detective" },
    description: {
      pl: "Naucz się rozpoznawać konkretne wysokości dźwięków bez instrumentu.",
      en: "Learn to recognize specific pitches without an instrument."
    },
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
        title: { pl: "Identyfikacja Nut", en: "Note Identification" },
        description: { pl: "Rozpoznawaj dźwięki puszczane losowo przez aplikację lub nauczyciela.", en: "Identify notes played randomly by an app or a teacher." },
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Skojarz konkretne nuty z pierwszym dźwiękiem Twoich ulubionych piosenek.", en: "Associate specific notes with the first sound of your favorite songs." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["pitch_recognition", "ear_training"]
      }
    ]
  },

  // TECHNIQUE - Slide Guitar
  {
    id: "slide_guitar_3_days",
    title: { pl: "Magia Delta Slide", en: "Delta Slide Magic" },
    description: {
      pl: "Opanuj kontrolę docisku i intonację przy grze rurką (slide).",
      en: "Master pressure control and intonation when playing with a slide."
    },
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
        title: { pl: "Ślizganie po Prożkach", en: "Fret Gliding" },
        description: { pl: "Graj gamy i proste licki, dbając o to, by slide był idealnie nad prożkiem.", en: "Play scales and simple licks, ensuring the slide is perfectly over the fret." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Nie naciskaj slide'em na struny tak mocno, żeby dotykały prożków.", en: "Don't press the slide so hard that the strings touch the frets." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["slide_guitar"]
      }
    ]
  },

  // THEORY - Harmony
  {
    id: "harmony_7_days",
    title: { pl: "Architektura Harmonii", en: "Harmony Architecture" },
    description: {
      pl: "Zrozum jak budowane są zaawansowane akordy i ich połączenia.",
      en: "Understand how advanced chords and their connections are built."
    },
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
        title: { pl: "Budowanie Akordów Rozszerzonych", en: "Extended Chord Voicings" },
        description: { pl: "Znajdź i zagraj akordy 9, 11 i 13 w różnych pozycjach.", en: "Find and play 9th, 11th, and 13th chords in various positions." },
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Skoncentruj się na brzmieniu interwałów dodanych – poczuj ich kolor.", en: "Focus on the sound of added intervals – feel their color." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["harmony", "chord_theory"]
      }
    ]
  },

  // CREATIVITY - Blues Soloing
  {
    id: "blues_soloing_5_days",
    title: { pl: "Dusza Bluesa", en: "Blues Soul & Expression" },
    description: {
      pl: "Połącz technikę z emocjami, używając skali bluesowej i 'blue notes'.",
      en: "Combine technique with emotion using the blues scale and 'blue notes'."
    },
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
        title: { pl: "Call and Response", en: "Call and Response" },
        description: { pl: "Improwizuj krótkie frazy, które 'odpowiadają' sobie nawzajem.", en: "Improvise short phrases that 'answer' each other." },
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Pauza jest tak samo ważna jak dźwięk – daj muzyce oddychać.", en: "Silence is just as important as the notes – let the music breathe." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["improvisation", "bending"]
      }
    ]
  },

  // HEARING - Transcription
  {
    id: "transcription_5_days",
    title: { pl: "Mistrz Transkrypcji", en: "Transcription Master" },
    description: {
      pl: "Rozszyfruj i zapisz solo lub riff ze słuchu z chirurgiczną precyzją.",
      en: "Decipher and write down a solo or riff by ear with surgical precision."
    },
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
        title: { pl: "Dekodowanie Solówki", en: "Solo Decoding" },
        description: { pl: "Wybierz 4-taktowy fragment ulubionego solo i przenieś go na gryf.", en: "Pick a 4-bar fragment of your favorite solo and move it to the fretboard." },
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 15,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Zacznij od znalezienia pierwszej nuty i tonacji utworu.", en: "Start by finding the first note and the key of the song." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["transcription", "ear_training"]
      }
    ]
  },

  // TECHNIQUE - Funk Rhythm
  {
    id: "funk_rhythm_3_days",
    title: { pl: "Funkowy Puls", en: "Funk Groove Mastery" },
    description: {
      pl: "Opanuj 'scratching' i szesnastkowy feeling w rytmice funkowej.",
      en: "Master 'scratching' and the 16th note feeling in funk rhythm."
    },
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
        title: { pl: "Nieustanny Ruch", en: "The Perpetual Motion" },
        description: { pl: "Utrzymuj ruch ręki kostkującej w szesnastkach, tłumiąc większość uderzeń.", en: "Keep your picking hand moving in 16ths, muting most of the strokes." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Ruch powinien być luźny i pochodzić głównie z nadgarstka.", en: "The movement should be loose and come primarily from the wrist." }
        ],
        metronomeSpeed: { min: 80, max: 110, recommended: 95 },
        relatedSkills: ["rhythm"]
      }
    ]
  },

  // TECHNIQUE - Harmonics
  {
    id: "harmonics_3_days",
    title: { pl: "Kryształowe Dźwięki", en: "Harmonics & Chimes" },
    description: {
      pl: "Odkryj świat flażoletów naturalnych, sztucznych i wymuszonych.",
      en: "Discover the world of natural, artificial, and pinch harmonics."
    },
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
        title: { pl: "Mapa Flażoletów", en: "Harmonic Mapping" },
        description: { pl: "Znajdź flażolety naturalne na 5, 7 i 12 progu wszystkich strun.", en: "Find natural harmonics on the 5th, 7th, and 12th frets of all strings." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Użycie przetwornika przy mostku i większego gainu ułatwia wydobycie flażoletów.", en: "Using the bridge pickup and higher gain makes it easier to ring out harmonics." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["technique"]
      }
    ]
  },

  // TECHNIQUE - String Skipping
  {
    id: "string_skipping_5_days",
    title: { pl: "Akrobatyka na Strunach", en: "String Skipping Acrobatics" },
    description: {
      pl: "Zwiększ precyzję prawej ręki przy dużych skokach między strunami.",
      en: "Boost right-hand precision during large jumps between strings."
    },
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
        title: { pl: "Penta-Skoki", en: "Penta-Jumps" },
        description: { pl: "Graj pentatonikę, pomijając co drugą strunę.", en: "Play the pentatonic scale while skipping every other string." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Wykonuj nieco większy łuk kostką, aby 'przeskoczyć' nad niechcianą struną.", en: "Use a slightly larger pick arc to 'jump' over the unwanted string." }
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 75 },
        relatedSkills: ["string_skipping", "alternate_picking"]
      }
    ]
  },

  // TECHNIQUE - Finger Independence
  {
    id: "finger_independence_7_days",
    title: { pl: "Niezależność Palców", en: "Finger Independence Gym" },
    description: {
      pl: "Wzmocnij kondycję i koordynację wszystkich palców lewej ręki.",
      en: "Strengthen the stamina and coordination of all left-hand fingers."
    },
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
        title: { pl: "Pajączek Chromatyczny", en: "Chromatic Spider Walk" },
        description: { pl: "Graj wzory 1-3-2-4 na różnych strunach i pozycjach.", en: "Play 1-3-2-4 patterns across different strings and positions." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Utrzymuj kciuk stabilnie na środku tyłu gryfu.", en: "Keep your thumb stable in the middle of the back of the neck." }
        ],
        metronomeSpeed: { min: 60, max: 120, recommended: 90 },
        relatedSkills: ["finger_independence"]
      }
    ]
  },

  // THEORY - Music Theory
  {
    id: "music_theory_5_days",
    title: { pl: "Fundamenty Teorii", en: "Theory Foundations" },
    description: {
      pl: "Zgłębiaj wiedzę o interwałach i budowie gam.",
      en: "Deepen your knowledge of intervals and scale construction."
    },
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
        title: { pl: "Budowa Interwałów", en: "Interval Construction" },
        description: { pl: "Nazywaj i graj interwały od zadanego dźwięku na jednej strunie.", en: "Name and play intervals from a given note on a single string." },
        difficulty: "easy",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Zapamiętaj liczbę półtonów dla każdego interwału.", en: "Memorize the number of semitones for each interval." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["music_theory"]
      }
    ]
  },

  // HEARING - Rhythm Recognition
  {
    id: "rhythm_recog_5_days",
    title: { pl: "Detektor Rytmu", en: "Rhythm Recognition Pro" },
    description: {
      pl: "Naucz się słyszeć i zapisywać złożone figury rytmiczne.",
      en: "Learn to hear and write down complex rhythmic figures."
    },
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
        title: { pl: "Dyktando Rytmiczne", en: "Rhythmic Dictation" },
        description: { pl: "Wysłuchaj frazy i wystukaj jej rytm.", en: "Listen to a phrase and tap out its rhythm." },
        difficulty: "medium",
        category: "hearing",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Licz głośno: 'raz i dwa i' lub 'raz e i a' dla szesnastek.", en: "Count out loud: 'one and two and' or 'one e and a' for 16ths." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["rythm_recognition", "rhythm"]
      }
    ]
  },

  // TECHNIQUE - Basic Picking
  {
    id: "picking_basics_3_days",
    title: { pl: "Fundamenty Kostkowania", en: "Picking Foundations" },
    description: {
      pl: "Skup się na czystości ataku i kącie nachylenia kostki.",
      en: "Focus on attack cleanliness and pick slant angle."
    },
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
        title: { pl: "Czysty Atak", en: "Clean Attack" },
        description: { pl: "Graj puste struny, dbając o powtarzalność brzmienia.", en: "Play open strings, ensuring consistency of sound." },
        difficulty: "easy",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Trzymaj kostkę pewnie, ale bez nadmiernego ścisku.", en: "Hold the pick firmly but without excessive grip tension." }
        ],
        metronomeSpeed: { min: 60, max: 90, recommended: 70 },
        relatedSkills: ["picking"]
      }
    ]
  },

  // CREATIVITY - Phrasing
  {
    id: "phrasing_5_days",
    title: { pl: "Sztuka Frazowania", en: "Art of Phrasing" },
    description: {
      pl: "Naucz się 'opowiadać historie' swoimi solówkami.",
      en: "Learn to 'tell stories' with your solos."
    },
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
        title: { pl: "Ograniczenie Rytmiczne", en: "Rhythmic Constraints" },
        description: { pl: "Improwizuj, używając tylko jednego wybranego rytmu dla wszystkich fraz.", en: "Improvise using only one chosen rhythm for all phrases." },
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Mniej znaczy więcej – dobra fraza potrzebuje miejsca na wybrzmienie.", en: "Less is more – a good phrase needs space to ring out." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["phrasing", "improvisation"]
      }
    ]
  },

  // TECHNIQUE - Articulation
  {
    id: "articulation_3_days",
    title: { pl: "Mistrz Artykulacji", en: "Articulation Master" },
    description: {
      pl: "Dodaj charakteru swojej grze poprzez akcenty i różnorodny atak.",
      en: "Add character to your playing through accents and varied attack."
    },
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
        title: { pl: "Akcentowanie Podziałów", en: "Subdivision Accenting" },
        description: { pl: "Graj ósemki, akcentując co trzecią nutę.", en: "Play 8ths, accenting every third note." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Używaj różnej głębokości zanurzenia kostki, aby zmieniać barwę dźwięku.", en: "Use different pick depths to change the tone color." }
        ],
        metronomeSpeed: { min: 70, max: 110, recommended: 90 },
        relatedSkills: ["articulation"]
      }
    ]
  },

  // CREATIVITY - Songwriting
  {
    id: "songwriting_7_days",
    title: { pl: "Maraton Pisania Piosenek", en: "Songwriting Marathon" },
    description: {
      pl: "Przejdź przez cały proces tworzenia utworu – od riffu do struktury.",
      en: "Go through the entire process of creating a song – from riff to structure."
    },
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
        title: { pl: "Struktura Utworu", en: "Song Structure" },
        description: { pl: "Połącz riff, zwrotkę i refren w spójną całość.", en: "Connect a riff, verse, and chorus into a cohesive whole." },
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 15,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Dobry refren powinien być łatwy do zapamiętania i kontrastować ze zwrotką.", en: "A good chorus should be memorable and contrast with the verse." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["composition", "harmony"]
      }
    ]
  },

  // CREATIVITY - Audio Production / Tone
  {
    id: "audio_tone_3_days",
    title: { pl: "Inżynieria Brzmienia", en: "Tone Engineering" },
    description: {
      pl: "Zrozum wpływ efektów, EQ i ustawień wzmacniacza na Twój sound.",
      en: "Understand the impact of effects, EQ, and amp settings on your sound."
    },
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
        title: { pl: "Tone Chasing", en: "Tone Chasing" },
        description: { pl: "Spróbuj odtworzyć brzmienie gitary ze słynnego utworu.", en: "Try to replicate the guitar tone from a famous song." },
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          { pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }
        ],
        tips: [
          { pl: "Mniej gainu często oznacza większą selektywność i lepsze brzmienie w nagraniu.", en: "Less gain often means more clarity and a better sound in the recording." }
        ],
        metronomeSpeed: null,
        relatedSkills: ["audio_production"]
      }
    ]
  },
  {
    id: "legato_speed_7_days",
    title: { pl: "Sprinty Legato", en: "Legato Speed Sprints" },
    description: { pl: "Zwiększ szybkość i wytrzymałość hammer-onów.", en: "Boost your legato speed and endurance." },
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
        title: { pl: "Szybkie Trójki", en: "Rapid Triplets" },
        description: { pl: "Triole legato w szybkim tempie.", en: "Fast legato triplets across strings." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Utrzymuj palce blisko strun.", en: "Keep your fingers close to the strings." }],
        metronomeSpeed: null,
        relatedSkills: ["legato"]
      }
    ]
  },
  {
    id: "legato_marathon_10_days",
    title: { pl: "Maraton Wytrzymałości Legato", en: "Legato Endurance Marathon" },
    description: { pl: "Ekstremalne wyzwanie dla Twojej lewej ręki.", en: "An extreme challenge for your fretting hand stamina." },
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
        title: { pl: "Nieustanny Przepływ", en: "Non-stop Flow" },
        description: { pl: "15 minut grania legato bez przerwy.", en: "15 minutes of continuous legato playing." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Jeśli poczujesz ból, natychmiast przestań.", en: "If you feel pain, stop immediately." }],
        metronomeSpeed: null,
        relatedSkills: ["legato"]
      }
    ]
  },
  {
    id: "sweep_5_string_10_days",
    title: { pl: "5-Strunowe Kaskady Sweep", en: "5-String Sweep Cascades" },
    description: { pl: "Rozszerzone arpeggia dla zaawansowanych.", en: "Extended arpeggios for advanced players." },
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
        title: { pl: "Pełne Arpeggia", en: "Full Arpeggios" },
        description: { pl: "Graj 5-strunowe kształty arpeggio.", en: "Practice 5-string arpeggio shapes." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Używaj tłumienia prawą dłonią.", en: "Use right-hand muting." }],
        metronomeSpeed: null,
        relatedSkills: ["sweep_picking"]
      }
    ]
  },
  {
    id: "sweep_neoclassical_14_days",
    title: { pl: "Neoklasyczny Mistrz Sweepu", en: "Neoclassical Sweep Master" },
    description: { pl: "Najbardziej złożone figury sweep pickingowe.", en: "The most complex sweep picking figures." },
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
        title: { pl: "Symfoniczne Sweepy", en: "Symphonic Sweeps" },
        description: { pl: "Szybkie zmiany kształtów i pozycji.", en: "Fast shape and position shifts." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Synchronizacja obu rąk to klucz.", en: "Synchronization of both hands is key." }],
        metronomeSpeed: null,
        relatedSkills: ["sweep_picking", "legato"]
      }
    ]
  },
  {
    id: "ear_chords_7_days",
    title: { pl: "Rozpoznawanie Kolorów Akordów", en: "Chord Quality Recognition" },
    description: { pl: "Rozróżniaj skomplikowane akordy ze słuchu.", en: "Distinguish complex chord qualities by ear." },
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
        title: { pl: "Maj vs Min vs Dom", en: "Maj vs Min vs Dom" },
        description: { pl: "Identyfikuj typy akordów septymowych.", en: "Identify 7th chord types." },
        difficulty: "medium",
        category: "hearing",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Skup się na brzmieniu tercji i septymy.", en: "Focus on the sound of the 3rd and 7th." }],
        metronomeSpeed: null,
        relatedSkills: ["ear_training"]
      }
    ]
  },
  {
    id: "ear_melodic_10_days",
    title: { pl: "Melodyczny Dyktant", en: "Melodic Dictation" },
    description: { pl: "Zapisuj melodie usłyszane w radiu.", en: "Transcribe melodies straight from your head or radio." },
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
        title: { pl: "Z Głowy na Gryf", en: "Ear to Fretboard" },
        description: { pl: "Graj melodie, które słyszysz w wyobraźni.", en: "Play melodies you hear in your imagination." },
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Zacznij od bardzo wolnego tempa.", en: "Start at a very slow tempo." }],
        metronomeSpeed: null,
        relatedSkills: ["ear_training"]
      }
    ]
  },
  {
    id: "sight_reading_pos_5_days",
    title: { pl: "Czytanie w Pozycjach", en: "Position Shifting Reading" },
    description: { pl: "Czytaj nuty, zmieniając pozycje na gryfie.", en: "Read music while shifting positions on the neck." },
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
        title: { pl: "Skoki Pozycyjne", en: "Position Jumps" },
        description: { pl: "Czytanie melodii wymagających zmiany pozycji.", en: "Reading melodies that require position shifts." },
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Szukaj dźwięków wspólnych przy zmianie.", en: "Look for common notes during shifts." }],
        metronomeSpeed: null,
        relatedSkills: ["sight_reading"]
      }
    ]
  },
  {
    id: "sight_reading_poly_10_days",
    title: { pl: "Czytanie Polifoniczne", en: "Polyphonic Reading Sprint" },
    description: { pl: "Czytaj kilka linii melodycznych naraz.", en: "Read multiple melodic lines simultaneously." },
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
        title: { pl: "Dwu-głos", en: "Two-Voice Reading" },
        description: { pl: "Czytaj zapisy z dwiema niezależnymi liniami.", en: "Read scores with two independent lines." },
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Najpierw przeanalizuj rytm obu rąk.", en: "Analyze the rhythm of both hands first." }],
        metronomeSpeed: null,
        relatedSkills: ["sight_reading", "fingerpicking"]
      }
    ]
  },
  {
    id: "composition_motif_7_days",
    title: { pl: "Wariacje Motywiczne", en: "Motif Variations" },
    description: { pl: "Rozwijaj jeden pomysł na nieskończone sposoby.", en: "Develop one idea in infinite ways." },
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
        title: { pl: "Metamorfoza Melodii", en: "Melody Metamorphosis" },
        description: { pl: "Zmieniaj rytm i metrum swojego motywu.", en: "Change the rhythm and meter of your motif." },
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Nie bój się drastycznych zmian.", en: "Don't be afraid of drastic changes." }],
        metronomeSpeed: null,
        relatedSkills: ["composition"]
      }
    ]
  },
  {
    id: "composition_layering_10_days",
    title: { pl: "Warstwy Symfoniczne", en: "Orchestral Layering" },
    description: { pl: "Buduj gęste tekstury instrumentami wirtualnymi lub kilkoma ścieżkami gitary.", en: "Build thick textures with virtual instruments or multiple guitar tracks." },
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
        title: { pl: "Aranżacja Warstwowa", en: "Layered Arrangement" },
        description: { pl: "Stwórz utwór z minimum 4 ścieżek gitary.", en: "Create a track with at least 4 guitar tracks." },
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 20,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Zwracaj uwagę na pasma częstotliwości.", en: "Pay attention to frequency bands." }],
        metronomeSpeed: null,
        relatedSkills: ["composition", "audio_production"]
      }
    ]
  },
  {
    id: "harmony_modal_7_days",
    title: { pl: "Wymiana Modalna", en: "Modal Interchange Secrets" },
    description: { pl: "Wprowadź kolory z innych tonacji do swoich progresji.", en: "Introduce colors from other keys into your progressions." },
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
        title: { pl: "Pożyczone Akordy", en: "Borrowed Chords" },
        description: { pl: "Używaj akordów z tonacji molowej w durowej (i odwrotnie).", en: "Use chords from minor keys in major (and vice versa)." },
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Akordy molowe w durowej tonacji dodają melancholii.", en: "Minor chords in a major key add melancholy." }],
        metronomeSpeed: null,
        relatedSkills: ["harmony"]
      }
    ]
  },
  {
    id: "harmony_jazz_10_days",
    title: { pl: "Jazzowe Reharmonizacje", en: "Jazz Harmony & Substitutions" },
    description: { pl: "Zmień proste piosenki w jazzowe arcydzieła.", en: "Turn simple songs into jazz masterpieces." },
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
        title: { pl: "Substytucje Tritone", en: "Tritone Substitutions" },
        description: { pl: "Podmieniaj akordy dominantowe na ich trytonowe odpowiedniki.", en: "Replace dominant chords with their tritone counterparts." },
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 20,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Eksperymentuj z prowadzeniem głosów (voice leading).", en: "Experiment with voice leading." }],
        metronomeSpeed: null,
        relatedSkills: ["harmony", "chord_theory"]
      }
    ]
  },
  {
    id: "vibrato_basics_3_days",
    title: { pl: "Fundamenty Vibrato", en: "Vibrato Basics" },
    description: { pl: "Naucz się kontrolować oscylację dźwięku.", en: "Learn to control sound oscillation." },
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
        title: { pl: "Równy Puls", en: "Steady Pulse" },
        description: { pl: "Utrzymuj równe tempo vibrato.", en: "Maintain steady vibrato speed." },
        difficulty: "easy",
        category: "technique",
        timeInMinutes: 5,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Ruch powinien być inicjowany z nadgarstka.", en: "The movement should be initiated from the wrist." }],
        metronomeSpeed: null,
        relatedSkills: ["vibrato"]
      }
    ]
  },
  {
    id: "vibrato_rock_5_days",
    title: { pl: "Szerokie Rockowe Vibrato", en: "Wide Rock Vibrato" },
    description: { pl: "Energiczne i szerokie vibrato w stylu legend rocka.", en: "Energetic and wide vibrato in the style of rock legends." },
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
        title: { pl: "Agresywna Oscylacja", en: "Aggressive Oscillation" },
        description: { pl: "Szerokie vibrato na dźwiękach podciągniętych.", en: "Wide vibrato on bent notes." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Używaj kilku palców do wsparcia sily.", en: "Use multiple fingers for power support." }],
        metronomeSpeed: null,
        relatedSkills: ["vibrato", "bending"]
      }
    ]
  },
  {
    id: "vibrato_classical_7_days",
    title: { pl: "Klasyczne Vibrato Palcowe", en: "Classical Finger Vibrato" },
    description: { pl: "Delikatne vibrato wzdłuż struny, bez podciągania.", en: "Subtle vibrato along the string, without bending." },
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
        title: { pl: "Mikrotonalna Płynność", en: "Microtonal Fluidity" },
        description: { pl: "Vibrato poziome w stylu skrzypcowym.", en: "Horizontal violin-style vibrato." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "To vibrato najlepiej brzmi na gitarach akustycznych i klasycznych.", en: "This vibrato sounds best on acoustic and classical guitars." }],
        metronomeSpeed: null,
        relatedSkills: ["vibrato"]
      }
    ]
  },
  {
    id: "theory_adv_chords_7_days",
    title: { pl: "Zaawansowana Budowa Akordów", en: "Advanced Chord Construction" },
    description: { pl: "Buduj akordy polichordalne i hybrydowe.", en: "Build polychords and hybrid voicings." },
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
        title: { pl: "Slash Chords", en: "Slash Chords Mastery" },
        description: { pl: "Zrozumienie funkcji basu w akordach hybrydowych.", en: "Understanding bass function in hybrid chords." },
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Slash chords tworzą piękne, nowoczesne brzmienia.", en: "Slash chords create beautiful, modern sounds." }],
        metronomeSpeed: null,
        relatedSkills: ["music_theory", "chord_theory"]
      }
    ]
  },
  {
    id: "theory_counterpoint_10_days",
    title: { pl: "Podstawy Kontrapunktu", en: "Counterpoint Basics" },
    description: { pl: "Naucz się pisać dwie niezależne linie melodyczne.", en: "Learn to write two independent melodic lines." },
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
        title: { pl: "Głosy Niezależne", en: "Independent Voices" },
        description: { pl: "Zasady ruchu równoległego i przeciwstawnego.", en: "Principles of parallel and contrary motion." },
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 20,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Unikaj równoległych oktaw i kwint.", en: "Avoid parallel octaves and fifths." }],
        metronomeSpeed: null,
        relatedSkills: ["music_theory", "composition"]
      }
    ]
  },
  {
    id: "slide_open_tuning_5_days",
    title: { pl: "Eksploracja Open Tunings", en: "Open Tuning Exploration" },
    description: { pl: "Otwórz się na nowe brzmienia ze slide'em.", en: "Open up to new sounds with a slide." },
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
        title: { pl: "Open G / Open D", en: "Open G / Open D" },
        description: { pl: "Graj akordy i licki w otwartych strojach.", en: "Play chords and licks in open tunings." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Open tunings to naturalne środowisko dla slide'u.", en: "Open tunings are the natural environment for slide guitar." }],
        metronomeSpeed: null,
        relatedSkills: ["slide_guitar"]
      }
    ]
  },
  {
    id: "slide_intonation_7_days",
    title: { pl: "Intonacja i Precyzja Slide", en: "Slide Intonation & Precision" },
    description: { pl: "Perfekcyjne trafianie w dźwięki bez prożków.", en: "Perfectly hitting notes without frets." },
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
        title: { pl: "Chirurgiczna Precyzja", en: "Surgical Precision" },
        description: { pl: "Trafianie w konkretne interwały ze słuchu.", en: "Hitting specific intervals by ear." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Sugeruj się prożkami, ale wierz swoim uszom.", en: "Use frets as guides, but trust your ears." }],
        metronomeSpeed: null,
        relatedSkills: ["slide_guitar", "ear_training"]
      }
    ]
  },
  {
    id: "audio_signal_chain_5_days",
    title: { pl: "Cyfrowy Łańcuch Sygnału", en: "Digital Signal Chain" },
    description: { pl: "Opanuj modelowanie brzmienia wewnątrz DAW.", en: "Master tone modeling inside a DAW." },
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
        title: { pl: "Symulacje Kolumn", en: "IR Modeling" },
        description: { pl: "Używanie Impulse Responses do kształtowania brzmienia.", en: "Using Impulse Responses to shape your tone." },
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Kolumna ma ogromny wpływ na końcowy sound.", en: "The cabinet has a huge impact on the final sound." }],
        metronomeSpeed: null,
        relatedSkills: ["audio_production"]
      }
    ]
  },
  {
    id: "audio_mixing_10_days",
    title: { pl: "Gitara w Miksie", en: "Mixing Guitar in a Track" },
    description: { pl: "Profesjonalne osadzenie instrumentu w utworze.", en: "Professional placement of the instrument in a track." },
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
        title: { pl: "Korektor i Kompresja", en: "EQ & Compression" },
        description: { pl: "Czyszczenie pasma i kontrola dynamiki nagrania.", en: "Frequency cleaning and dynamic control of the recording." },
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Nie bój się wycinać niepotrzebnego dołu.", en: "Don't be afraid to cut unnecessary low end." }],
        metronomeSpeed: null,
        relatedSkills: ["audio_production"]
      }
    ]
  },
  {
    id: "bending_unison_5_days",
    title: { pl: "Bendy Unisono", en: "Unison Bends Mastery" },
    description: { pl: "Idealna intonacja dwóch współbrzmiących dźwięków.", en: "Perfect intonation of two resonating notes." },
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
        title: { pl: "Zgranie Pitchu", en: "Pitch Sync" },
        description: { pl: "Dociąganie dźwięku do nuty trzymanej na sąsiedniej strunie.", en: "Bending a note to match another held on an adjacent string." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [{ pl: "Graj unisono bendy na strunach E i B, dbając o zanik interferencji dźwięku.", en: "Play unison bends on E and B strings, focusing on the elimination of sound interference (beats)." }],
        tips: [{ pl: "Słuchaj 'dudnienia' – im wolniejsze, tym bliżej jesteś celu.", en: "Listen for 'beats' – the slower they are, the closer you are to the target pitch." }],
        metronomeSpeed: null,
        relatedSkills: ["bending", "ear_training"]
      }
    ]
  },
  {
    id: "hybrid_chicken_7_days",
    title: { pl: "Chicken Picking Vibes", en: "Chicken Picking Vibes" },
    description: { pl: "Opanuj perkusyjny atak w stylu country.", en: "Master the percussive country-style attack." },
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
        title: { pl: "Tłumione Skoki", en: "Muted Jumps" },
        description: { pl: "Szybkie skoki między strunami z tłumieniem dłonią.", en: "Fast string jumps with palm muting." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Atakuj struny palcami z lekkim szarpnięciem.", en: "Pluck the strings with a slight snap of your fingers." }],
        metronomeSpeed: null,
        relatedSkills: ["hybrid_picking"]
      }
    ]
  },
  {
    id: "hybrid_virtuoso_10_days",
    title: { pl: "Wirtuoz Hybrid Picking", en: "Hybrid Picking Virtuoso" },
    description: { pl: "Złożone polifoniczne licki na całej szerokości gryfu.", en: "Complex polyphonic licks across the entire fretboard." },
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
        title: { pl: "Polifoniczne Kaskady", en: "Polyphonic Cascades" },
        description: { pl: "Szybkie arpeggia i linie melodyczne.", en: "Fast arpeggios and melodic lines." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Dopasuj barwę ataku kostki i palców.", en: "Match the tone of pick and finger attacks." }],
        metronomeSpeed: null,
        relatedSkills: ["hybrid_picking", "sweep_picking"]
      }
    ]
  },
  {
    id: "transcription_riff_7_days",
    title: { pl: "Detektyw Riffów", en: "Riff Detective" },
    description: { pl: "Transkrybuj 3 złożone riffy ze słuchu.", en: "Transcribe 3 complex riffs by ear." },
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
        title: { pl: "Analiza Rytmiczna Riffu", en: "Rhythmic Riff Analysis" },
        description: { pl: "Zrozumienie podziałów w trudnych riffach.", en: "Understanding subdivisions in tough riffs." },
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Zwracaj uwagę na syncopy.", en: "Watch out for syncopations." }],
        metronomeSpeed: null,
        relatedSkills: ["transcription", "rythm_recognition"]
      }
    ]
  },
  {
    id: "transcription_pro_14_days",
    title: { pl: "Maraton Pełnej Transkrypcji", en: "Full Song Transcription" },
    description: { pl: "Zapisz cały utwór od początku do końca.", en: "Transcribe a full song from start to finish." },
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
        title: { pl: "Kompletny Zapis", en: "Complete Score" },
        description: { pl: "Zapis nutowy lub tabulatura całego utworu.", en: "Write down sheet music or tabs for a whole song." },
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 20,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Podziel pracę na sekcje: intro, zwrotka, chorus.", en: "Divide the work into sections: intro, verse, chorus." }],
        metronomeSpeed: null,
        relatedSkills: ["transcription", "music_theory"]
      }
    ]
  },
  {
    id: "rhythm_poly_7_days",
    title: { pl: "Polirytmiczny Labirynt", en: "Polyrhythmic Maze" },
    description: { pl: "Naucz się grać dwa rytmy jednocześnie.", en: "Learn to play two rhythms at once." },
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
        title: { pl: "3 przeciw 2", en: "3 against 2" },
        description: { pl: "Podstawowe polirytmie na gitarze.", en: "Basic polyrhythms on guitar." },
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Użyj metronomu z różnymi akcentami.", en: "Use a metronome with different accents." }],
        metronomeSpeed: null,
        relatedSkills: ["rythm_recognition", "rhythm"]
      }
    ]
  },
  {
    id: "rhythm_sync_10_days",
    title: { pl: "Ekstremalna Synchronizacja", en: "Extreme Synchronization" },
    description: { pl: "Bezbłędne rozpoznawanie i granie złożonych pauz.", en: "Flawless recognition and playing of complex rests." },
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
        title: { pl: "Cisza w Rytmie", en: "Silence in Rhythm" },
        description: { pl: "Graj riffy z nagłymi pauzami.", en: "Play riffs with sudden rests." },
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Wewnętrzny puls musi być niezachwiany.", en: "Your internal pulse must be unshakable." }],
        metronomeSpeed: null,
        relatedSkills: ["rythm_recognition", "rhythm"]
      }
    ]
  },
  {
    id: "picking_cross_5_days",
    title: { pl: "Crosspicking Mastery", en: "Crosspicking Mastery" },
    description: { pl: "Płynne kostkowanie przez 3-4 struny.", en: "Fluid picking across 3-4 strings." },
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
        title: { pl: "Ruch Wahadłowy", en: "Pendulum Motion" },
        description: { pl: "Kostkowanie naprzemienne na skaczących strunach.", en: "Alternate picking on skipping strings." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Małe, ekonomiczne ruchy to klucz.", en: "Small, economical movements are key." }],
        metronomeSpeed: null,
        relatedSkills: ["picking", "alternate_picking"]
      }
    ]
  },
  {
    id: "picking_endurance_10_days",
    title: { pl: "Maraton Wytrzymałości Kostki", en: "Picking Endurance Marathon" },
    description: { pl: "Utrzymaj stały atak przez długi czas.", en: "Maintain a steady attack for an extended period." },
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
        title: { pl: "Stałe Downstrokes", en: "Constant Downstrokes" },
        description: { pl: "15 minut grania agresywnych downstroków.", en: "15 minutes of aggressive downstrokes." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Uderzaj prosto z łokcia/nadgarstka zależnie od tempa.", en: "Hit from the elbow/wrist depending on tempo." }],
        metronomeSpeed: null,
        relatedSkills: ["picking", "rhythm"]
      }
    ]
  },
  {
    id: "finger_independence_adv_10_days",
    title: { pl: "Zaawansowana Gimnastyka Palców", en: "Advanced Finger Gym" },
    description: { pl: "Niezależność każdego palca w ekstremalnych rozciągnięciach.", en: "Each finger's independence in extreme stretches." },
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
        title: { pl: "Pająk z Rozciągnięciem", en: "Stretched Spider" },
        description: { pl: "Ćwiczenia chromatyczne z pustym progiem między palcami.", en: "Chromatic exercises with an empty fret between fingers." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Nie forsuj rozciągnięcia zbyt mocno.", en: "Don't force the stretch too hard." }],
        metronomeSpeed: null,
        relatedSkills: ["finger_independence"]
      }
    ]
  },
  {
    id: "finger_independence_master_14_days",
    title: { pl: "Mistrz Niezależności Palców", en: "Finger Independence Master" },
    description: { pl: "Najtrudniejsze kombinacje ruchowe dla Twojej lewej ręki.", en: "The toughest movement combinations for your fretting hand." },
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
        title: { pl: "Statyczne Trzymanie", en: "Static Holds" },
        description: { pl: "Trzymaj 3 palce nieruchomo, poruszając tylko jednym.", en: "Keep 3 fingers still while moving only one." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Skup się na rozluźnieniu nieużywanych palców.", en: "Focus on relaxing the unused fingers." }],
        metronomeSpeed: null,
        relatedSkills: ["finger_independence"]
      }
    ]
  },
  {
    id: "string_skipping_triads_7_days",
    title: { pl: "Triady ze Skakaniem Strun", en: "String Skipping Triads" },
    description: { pl: "Graj triady z pomijaniem strun dla unikalnego brzmienia.", en: "Play triads with string skipping for a unique sound." },
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
        title: { pl: "Arpeggia z Pominięciem", en: "Skipped Arpeggios" },
        description: { pl: "Triady durowe i molowe na strunach 1, 3 i 5.", en: "Major and minor triads on strings 1, 3, and 5." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Używaj kostkowania naprzemiennego.", en: "Use alternate picking." }],
        metronomeSpeed: null,
        relatedSkills: ["string_skipping", "chord_theory"]
      }
    ]
  },
  {
    id: "string_skipping_intervallic_10_days",
    title: { pl: "Interwałowe Skoki", en: "Intervallic String Jumps" },
    description: { pl: "Szerokie skoki interwałowe w stylu nowoczesnym.", en: "Wide melodic jumps in a modern style." },
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
        title: { pl: "Skoki przez 2 struny", en: "2-String Jumps" },
        description: { pl: "Graj linie melodyczne omijając dwie sąsiednie struny.", en: "Play melodic lines skipping two adjacent strings." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 12,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Kontroluj niechciane wybrzmiewanie strun.", en: "Control unwanted string noise." }],
        metronomeSpeed: null,
        relatedSkills: ["string_skipping"]
      }
    ]
  },
  {
    id: "harmonics_art_5_days",
    title: { pl: "Harmoniki Sztuczne", en: "Artificial Harmonics" },
    description: { pl: "Wydobądź krystaliczne dźwięki z dowolnego progu.", en: "Extract crystalline sounds from any fret." },
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
        title: { pl: "Pinch Harmonics", en: "Pinch Harmonics" },
        description: { pl: "Zdobądź charakterystyczny 'pisk' gitary.", en: "Get that signature guitar 'squeal'." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Szukaj 'sweet spotów' między przetwornikami.", en: "Find 'sweet spots' between the pickups." }],
        metronomeSpeed: null,
        relatedSkills: ["technique"]
      }
    ]
  },
  {
    id: "technique_hybrid_shred_10_days",
    title: { pl: "Hybrydowy Shred", en: "Hybrid Shred Technique" },
    description: { pl: "Połączenie technik dla maksymalnej prędkości.", en: "Combining techniques for maximum speed." },
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
        title: { pl: "Fast Flow", en: "Fast Flow" },
        description: { pl: "Łączenie legato, tappingu i kostkowania.", en: "Merging legato, tapping, and picking." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Płynność zmiany techniki to Twój cel.", en: "Smooth transitions between techniques is your goal." }],
        metronomeSpeed: null,
        relatedSkills: ["technique", "legato", "tapping"]
      }
    ]
  },
  {
    id: "tapping_multi_7_days",
    title: { pl: "Tapping Wielopalcowy", en: "Multi-Finger Tapping" },
    description: { pl: "Używaj więcej niż jednego palca prawej ręki do tappingu.", en: "Use more than one finger of your right hand for tapping." },
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
        title: { pl: "Tapowane Akordy", en: "Tapped Chords" },
        description: { pl: "Budowanie akordów obiema rękami na gryfie.", en: "Building chords with both hands on the fretboard." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Dbaj o to, by każda nuta wybrzmiewała czysto.", en: "Ensure each note rings out clearly." }],
        metronomeSpeed: null,
        relatedSkills: ["tapping", "chord_theory"]
      }
    ]
  },
  {
    id: "tapping_orchestral_12_days",
    title: { pl: "Tapping Orkiestrowy", en: "Orchestral Tapping Mastery" },
    description: { pl: "Złożone polifoniczne struktury obiema rękami.", en: "Complex polyphonic structures with both hands." },
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
        title: { pl: "Symfonia na Gryfie", en: "Fretboard Symphony" },
        description: { pl: "Niezależność rąk w tappingu dwuręcznym.", en: "Hand independence in two-handed tapping." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Wykorzystaj tłumik (fretwrap), aby wyciszyć struny.", en: "Use a fretwrap to mute open strings." }],
        metronomeSpeed: null,
        relatedSkills: ["tapping", "composition"]
      }
    ]
  },
  {
    id: "songwriting_structure_7_days",
    title: { pl: "Architektura Utworu", en: "Song Structure Architecture" },
    description: { pl: "Opanuj formy piosenek i przejścia między sekcjami.", en: "Master song forms and transitions between sections." },
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
        title: { pl: "Mosty i Łączniki", en: "Bridges and Links" },
        description: { pl: "Tworzenie płynnych przejść między zwrotką a refrenem.", en: "Creating smooth transitions between verse and chorus." },
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Użyj zmiany dynamiki lub tonacji.", en: "Use changes in dynamics or key." }],
        metronomeSpeed: null,
        relatedSkills: ["composition"]
      }
    ]
  },
  {
    id: "songwriting_extended_10_days",
    title: { pl: "Rozszerzona Kompozycja", en: "Extended Songwriting" },
    description: { pl: "Twórz epickie, wieloczęściowe kompozycje.", en: "Create epic, multi-part compositions." },
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
        title: { pl: "Epicka Suita", en: "Epic Suite" },
        description: { pl: "Utwór trwający powyżej 7 minut.", en: "A track lasting over 7 minutes." },
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 20,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Powracaj do głównych tematów w nowych aranżacjach.", en: "Return to main themes in new arrangements." }],
        metronomeSpeed: null,
        relatedSkills: ["composition", "harmony"]
      }
    ]
  },
  {
    id: "pitch_perfect_7_days",
    title: { pl: "Idealna Intonacja", en: "Perfect Pitch Precision" },
    description: { pl: "Rozpoznawaj dźwięki bez instrumentu pod ręką.", en: "Recognize notes without having an instrument handy." },
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
        title: { pl: "Relatywny Pitch", en: "Relative Pitch" },
        description: { pl: "Identyfikuj dźwięki w relacji do dźwięku bazowego.", en: "Identify notes in relation to a reference note." },
        difficulty: "medium",
        category: "hearing",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Śpiewanie nazw dźwięków pomaga w zapamiętywaniu ich barwy.", en: "Singing note names helps in remembering their timbre." }],
        metronomeSpeed: null,
        relatedSkills: ["pitch_recognition"]
      }
    ]
  },
  {
    id: "pitch_absolute_master_14_days",
    title: { pl: "Mistrz Słuchu Absolutnego", en: "Absolute Pitch Master" },
    description: { pl: "Najwyższy poziom rozpoznawania wysokości dźwięku.", en: "The highest level of pitch recognition." },
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
        title: { pl: "Ślepy Test", en: "Blind Test" },
        description: { pl: "Nazywaj losowe dźwięki bez żadnego punktu odniesienia.", en: "Name random notes without any reference point." },
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "To wymaga lat praktyki, nie zniechęcaj się.", en: "This takes years of practice, don't get discouraged." }],
        metronomeSpeed: null,
        relatedSkills: ["pitch_recognition"]
      }
    ]
  },
  {
    id: "fingerpicking_poly_7_days",
    title: { pl: "Polifonia Palcowa", en: "Fingerstyle Polyphony" },
    description: { pl: "Niezależność kciuka i palców w stylu Travis Picking.", en: "Thumb and finger independence in Travis Picking style." },
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
        title: { pl: "Spacerującego Basisty", en: "Walking Bassline" },
        description: { pl: "Utrzymuj stały bas kciukiem, grając melodię palcami.", en: "Maintain a steady bass with thumb while playing melody with fingers." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 12,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Kciuk musi działać jak automat.", en: "The thumb must act like an automaton." }],
        metronomeSpeed: null,
        relatedSkills: ["fingerpicking", "rhythm"]
      }
    ]
  },
  {
    id: "fingerpicking_percussive_10_days",
    title: { pl: "Nowoczesny Fingerstyle Perkusyjny", en: "Modern Percussive Fingerstyle" },
    description: { pl: "Dodaj elementy perkusyjne do swojej gry palcowej.", en: "Add percussive elements to your fingerstyle playing." },
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
        title: { pl: "Slap & Pop", en: "Slap & Pop" },
        description: { pl: "Uderzanie w struny i korpus gitary.", en: "Hitting strings and guitar body." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Dbaj o kondycję swoich paznokci.", en: "Take care of your fingernails." }],
        metronomeSpeed: null,
        relatedSkills: ["fingerpicking", "technique"]
      }
    ]
  },
  {
    id: "phrasing_blues_7_days",
    title: { pl: "Bluesowy Smak", en: "Bluesy Feel" },
    description: { pl: "Opanuj technikę 'pytanie i odpowiedź'.", en: "Master the 'call and response' technique." },
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
        title: { pl: "Dialog z Gitarą", en: "Guitar Dialogue" },
        description: { pl: "Twórz frazy, które brzmią jak ludzki głos.", en: "Create phrases that sound like a human voice." },
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Wykorzystuj pauzy – cisza też jest muzyką.", en: "Use pauses – silence is also music." }],
        metronomeSpeed: null,
        relatedSkills: ["phrasing", "improvisation"]
      }
    ]
  },
  {
    id: "phrasing_fusion_10_days",
    title: { pl: "Frakcjonowanie Fusion", en: "Fusion Phrasing" },
    description: { pl: "Łącz skomplikowane skale z nietypowym rytmem.", en: "Merge complex scales with unusual rhythms." },
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
        title: { pl: "Chromatyczne Łączniki", en: "Chromatic Connectors" },
        description: { pl: "Używanie dźwięków spoza skali do łączenia fraz.", en: "Using out-of-scale notes to connect phrases." },
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 20,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Zwracaj uwagę na dźwięki docelowe (target notes).", en: "Pay attention to target notes." }],
        metronomeSpeed: null,
        relatedSkills: ["phrasing", "scales"]
      }
    ]
  },
  {
    id: "articulation_dynamics_7_days",
    title: { pl: "Dynamika Wyrazu", en: "Expressive Dynamics" },
    description: { pl: "Kontroluj głośność każdego dźwięku dla większej ekspresji.", en: "Control the volume of each note for greater expression." },
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
        title: { pl: "Od Piano do Forte", en: "Piano to Forte" },
        description: { pl: "Graj tę samą frazę coraz głośniej i ciszej.", en: "Play the same phrase louder and softer." },
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Zmiana kąta kostki zmienia barwę dźwięku.", en: "Changing pick angle changes the tone color." }],
        metronomeSpeed: null,
        relatedSkills: ["articulation"]
      }
    ]
  },
  {
    id: "articulation_staccato_10_days",
    title: { pl: "Precyzja Staccato", en: "Staccato Precision" },
    description: { pl: "Krótkie, urywane dźwięki z absolutną kontrolą.", en: "Short, detached notes with absolute control." },
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
        title: { pl: "Tłumienie Lewą Ręką", en: "Left-Hand Muting" },
        description: { pl: "Urywanie dźwięku poprzez poluzowanie nacisku palca.", en: "Cutting the sound by loosening finger pressure." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Synchronizacja puszczenia palca i uderzenia kostką jest kluczowa.", en: "Synchronization of finger release and pick stroke is key." }],
        metronomeSpeed: null,
        relatedSkills: ["articulation", "rythm_recognition"]
      }
    ]
  },
  {
    id: "bending_virtuoso_10_days",
    title: { pl: "Wirtuoz Podciągnięć", en: "Bending Virtuoso" },
    description: { pl: "Ekstremalna kontrola nad bendingiem i mikrointerwałami.", en: "Extreme control over bending and micro-intervals." },
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
        title: { pl: "Bendy o 1.5 i 2 Tony", en: "1.5 and 2 Step Bends" },
        description: { pl: "Bardzo szerokie podciągnięcia z idealną intonacją.", en: "Very wide bends with perfect intonation." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Uważaj na kondycję strun.", en: "Watch out for your strings' condition." }],
        metronomeSpeed: null,
        relatedSkills: ["bending"]
      }
    ]
  },
  {
    id: "improv_outside_10_days",
    title: { pl: "Gra Outside", en: "Playing Outside" },
    description: { pl: "Naucz się świadomie wychodzić poza skalę.", en: "Learn to consciously play outside the scale." },
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
        title: { pl: "Side-Slipping", en: "Side-Slipping" },
        description: { pl: "Przesuwanie frazy o pół tonu w górę/dół.", en: "Shifting a phrase up/down by a half-step." },
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Najważniejszy jest powrót – 'resolving'.", en: "The most important part is the resolution." }],
        metronomeSpeed: null,
        relatedSkills: ["improvisation", "scales"]
      }
    ]
  },
  {
    id: "rhythm_funk_10_days",
    title: { pl: "Funkowa Precyzja", en: "Funk Precision" },
    description: { pl: "Szesnastkowy groove z absolutną kontrolą.", en: "16th note groove with absolute control." },
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
        title: { pl: "The Scratch", en: "The Scratch" },
        description: { pl: "Perkusyjne tłumienie w rytmie szesnastkowym.", en: "Percussive muting in 16th note rhythm." },
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: [{ pl: "Wybierz ćwiczenia lub utwory odpowiadające zadanemu tematowi.", en: "Select exercises or songs corresponding to the given topic." }],
        tips: [{ pl: "Luźny nadgarstek to jedyna droga do dobrego funku.", en: "A loose wrist is the only way to good funk." }],
        metronomeSpeed: { min: 90, max: 130, recommended: 110 },
        relatedSkills: ["rhythm", "articulation"]
      }
    ]
  }
];
