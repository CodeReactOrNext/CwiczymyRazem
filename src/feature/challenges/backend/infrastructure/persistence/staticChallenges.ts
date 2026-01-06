import { Challenge } from "../../domain/models/Challenge";

export const challengesList: Challenge[] = [
  // TECHNIQUE - Alternate Picking
  {
    id: "technique_5_days",
    title: "Picking Consistency",
    description: "Build dynamic control and absolute hand synchronization over 5 days.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "alternate_picking",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Alternate Picking",
    shortGoal: "5 days / 5 min daily",
    rewardDescription: "500",
    accentColor: "main",
    rewardSkillId: "alternate_picking",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_ap_ex_1",
        title: "Metronome Training",
        description: "Maintain perfect precision with sixteenth-note passages.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Start at a slower tempo to ensure that up and down strokes are perfectly even."
        ],
        metronomeSpeed: { min: 80, max: 120, recommended: 100 },
        relatedSkills: ["alternate_picking"]
      }
    ]
  },

  // TECHNIQUE - Legato
  {
    id: "legato_5_days",
    title: "Legato Fluidity and Strength",
    description: "Develop finger independence and clarity of hammer-ons and pull-offs.",
    streakDays: 5,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "legato",
    requiredLevel: 0,
    unlockDescription: "Lvl 5 Legato",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "500",
    accentColor: "main",
    rewardSkillId: "legato",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_legato_ex_1",
        title: "Masterful Finger Fluidity",
        description: "Continuous trills and scale fragments without using the pick.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Keep your thumb on the back of the neck so the fingers have more reach and pressing power."
        ],
        metronomeSpeed: null,
        relatedSkills: ["legato"]
      }
    ]
  },

  // TECHNIQUE - Bending
  {
    id: "bending_5_days",
    title: "Precise Bending Intonation",
    description: "Focus on microtonal precision and singing sustain.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "bending",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Bending",
    shortGoal: "5 days / 5 min daily",
    rewardDescription: "400",
    accentColor: "main",
    rewardSkillId: "bending",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_bend_ex_1",
        title: "Pitch Targeting Drill",
        description: "Tune bends by half and whole steps to reference pitches.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Use adjacent fingers for support when bending strings."
        ],
        metronomeSpeed: null,
        relatedSkills: ["bending"]
      }
    ]
  },

  // TECHNIQUE - Tapping
  {
    id: "tapping_3_days",
    title: "Tapping Articulation",
    description: "Master attack and muting in two-handed tapping technique.",
    streakDays: 3,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "tapping",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Tapping",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "400",
    accentColor: "main",
    rewardSkillId: "tapping",
    rewardLevel: 12,
    exercises: [
      {
        id: "streak_tap_ex_1",
        title: "Triadic Cascades",
        description: "Clean tapping triads with an emphasis on controlling unwanted noise.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Mute unused strings with the palm of your right hand to avoid noise."
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 80 },
        relatedSkills: ["tapping"]
      }
    ]
  },

  // TECHNIQUE - Economy Picking / Sweeping
  {
    id: "sweeping_5_days",
    title: "Sweep Picking Synchronization",
    description: "Clean up your arpeggios thanks to near-surgical hand coordination.",
    streakDays: 5,
    intensity: "extreme",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "sweep_picking",
    requiredLevel: 0,
    unlockDescription: "Lvl 7 Economy Picking",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "700",
    accentColor: "main",
    rewardSkillId: "sweep_picking",
    rewardLevel: 15,
    exercises: [
      {
        id: "streak_sweep_ex_1",
        title: "Rolling Coordination",
        description: "Focus on clean string separation and the finger rolling technique.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "The pick should flow through the strings in one motion, not a series of hits."
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 70 },
        relatedSkills: ["sweep_picking"]
      }
    ]
  },


  // THEORY - Scales
  {
    id: "theory_3_days",
    title: "Interval Map Discovery",
    description: "Go beyond patterns – internalize the sound and positions of intervals.",
    streakDays: 3,
    intensity: "low",
    difficulty: "easy",
    category: "theory",
    requiredSkillId: "scales",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Scales",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "300",
    accentColor: "main",
    rewardSkillId: "scales",
    rewardLevel: 8,
    exercises: [
      {
        id: "streak_theory_ex_1",
        title: "Scale Fingering",
        description: "Visualization of scale patterns across the entire fretboard.",
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Say the notes out loud while playing to better memorize the fretboard map."
        ],
        metronomeSpeed: null,
        relatedSkills: ["scales"]
      }
    ]
  },
  {
    id: "theory_5_days",
    title: "Modal Proficiency",
    description: "Connect theory with technical execution of modal patterns.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "theory",
    requiredSkillId: "scales",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Scales",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "800",
    rewardSkillId: "scales",
    rewardLevel: 12,
    accentColor: "main",
    dependsOn: "pentatonic_5_days",
    exercises: [
      {
        id: "streak_circle_ex_1",
        title: "Harmonic Connections",
        description: "Leading scales through the circle of fifths within one position.",
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Pay attention to the characteristic sound (flavor) of each mode."
        ],
        metronomeSpeed: null,
        relatedSkills: ["scales"]
      }
    ]
  },

  // HEARING - Ear Training
  {
    id: "ear_5_days",
    title: "Relative Ear Development",
    description: "Shorten the distance between hearing a melody and instantly playing it.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "hearing",
    requiredSkillId: "ear_training",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Ear Training",
    shortGoal: "5 days / 5 min daily",
    rewardDescription: "500",
    accentColor: "main",
    rewardSkillId: "ear_training",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_ear_ex_1",
        title: "Interval Recognition",
        description: "Identification and transcription of intervals in real-time.",
        difficulty: "medium",
        category: "hearing",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Associate intervals with known songs (e.g., perfect fourth is the beginning of 'Star Wars')."
        ],
        metronomeSpeed: null,
        relatedSkills: ["ear_training"]
      }
    ]
  },

  // CREATIVITY - Improvisation
  {
    id: "improv_5_days",
    title: "Melodic Phrasing",
    description: "Develop your own voice through improvisation with specific limitations.",
    streakDays: 5,
    intensity: "high",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "improvisation",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Improvisation",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600",
    accentColor: "main",
    rewardSkillId: "improvisation",
    rewardLevel: 12,
    exercises: [
      {
        id: "streak_improv_ex_1",
        title: "Theme and Variation",
        description: "Create motifs and develop them based on professional backing tracks.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Limit yourself to 3 notes per string or one position to force creativity."
        ],
        metronomeSpeed: null,
        relatedSkills: ["improvisation"]
      }
    ]
  },

  // CREATIVITY - Theory Application (Arpeggios)
  {
    id: "arpeggios_5_days",
    title: "Targeting Chord Tones",
    description: "Learn to creatively play over chord changes using arpeggios.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "hard",
    category: "creativity",
    requiredSkillId: "chord_theory",
    requiredLevel: 0,
    unlockDescription: "Lvl 5 Arpeggios",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600",
    accentColor: "main",
    rewardSkillId: "chord_theory",
    rewardLevel: 12,
    exercises: [
      {
        id: "streak_arp_ex_1",
        title: "Harmonic Outlines",
        description: "Visualization of chord components within solo patterns.",
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Visualizing chord shapes under your fingers makes it easier to quickly find arpeggios."
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
    title: "Efficient Chord Transitions",
    description: "Minimize movements for faster and smoother harmonic changes.",
    streakDays: 3,
    intensity: "medium",
    difficulty: "easy",
    category: "technique",
    requiredSkillId: "chord_theory",
    requiredLevel: 0,
    unlockDescription: "Lvl 2 Chords",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "350",
    accentColor: "main",
    rewardSkillId: "chord_theory",
    rewardLevel: 8,
    exercises: [
      {
        id: "streak_chord_ex_1",
        title: "Guide Finger Precision",
        description: "Master common pivot points between standard chord shapes.",
        difficulty: "easy",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Always look for the finger that doesn't have to lift off the fretboard during a change."
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 70 },
        relatedSkills: ["chord_theory", "rhythm"]
      }
    ]
  },

  // RHYTHM - Precision
  {
    id: "rhythm_precision_7_days",
    title: "Rhythmic Pocket Mastery",
    description: "Develop your internal clock and synchronize perfectly with the metronome.",
    streakDays: 7,
    intensity: "high",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "rhythm",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Rhythm",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "1000",
    accentColor: "main",
    rewardSkillId: "rhythm",
    rewardLevel: 15,
    exercises: [
      {
        id: "streak_rhythm_ex_1",
        title: "Subdivision Control",
        description: "Switch between triplets, eighths, and sixteenths without delays.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Clap or tap your foot along with the metronome to feel the pulse with your whole body."
        ],
        metronomeSpeed: { min: 50, max: 90, recommended: 60 },
        relatedSkills: ["rhythm"]
      }
    ]
  },

  // TECHNIQUE - Speed Burst
  {
    id: "speed_burst_3_days",
    title: "Explosive Technical Series",
    description: "Train your nervous system for short bursts of extreme speed.",
    streakDays: 3,
    intensity: "extreme",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "alternate_picking",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Speed",
    dependsOn: "technique_5_days",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "600",
    accentColor: "main",
    rewardSkillId: "alternate_picking",
    rewardLevel: 12,
    exercises: [
      {
        id: "streak_speed_ex_1",
        title: "Note Group Sprints",
        description: "Accelerate short fragments to push your upper speed limit.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Relax your picking hand – tension is the greatest enemy of speed."
        ],
        metronomeSpeed: { min: 120, max: 180, recommended: 140 },
        relatedSkills: ["alternate_picking"]
      }
    ]
  },

  // TECHNIQUE - Dynamic Phrasing
  {
    id: "dynamics_3_days",
    title: "Dynamics and Articulation Control",
    description: "Make your guitar speak – master the difference between piano and forte.",
    streakDays: 3,
    intensity: "medium",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "improvisation",
    requiredLevel: 4,
    unlockDescription: "Lvl 4 Improv",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "400",
    accentColor: "main",
    rewardSkillId: "improvisation",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_dynamics_ex_1",
        title: "Dynamic Dialogue",
        description: "Play the same motif with different pick attack strengths.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Dynamics control starts in the head – hear the difference before you hit the string."
        ],
        metronomeSpeed: null,
        relatedSkills: ["improvisation"]
      }
    ]
  },

  // RHYTHM - Odd Meters
  {
    id: "odd_meter_5_days",
    title: "Odd Meter Exploration",
    description: "Break the 4/4 pattern – feel the pulse in 5/4, 7/8, and other non-standard meters.",
    streakDays: 5,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "rhythm",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 Rhythm",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "750",
    accentColor: "main",
    rewardSkillId: "rhythm",
    rewardLevel: 12,
    exercises: [
      {
        id: "streak_odd_meter_ex_1",
        title: "Pulse in 7/8",
        description: "Play riffs and scales in seven-eighths meter.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Accent the 'one' – it will help you not get lost in the odd structure."
        ],
        metronomeSpeed: { min: 60, max: 120, recommended: 80 },
        relatedSkills: ["rhythm"]
      }
    ]
  },

  // THEORY - Pentatonic Extensions
  {
    id: "pentatonic_5_days",
    title: "Extended Pentatonic Shapes",
    description: "Combine pentatonic positions to move freely across the whole fretboard.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "theory",
    requiredSkillId: "scales",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Scales",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600",
    rewardSkillId: "scales",
    rewardLevel: 10,
    accentColor: "main",
    exercises: [
      {
        id: "streak_penta_ex_1",
        title: "Diagonal Pentatonics",
        description: "Play scales along the neck, connecting at least 3 positions.",
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Focus on common notes between positions – these are your landmarks."
        ],
        metronomeSpeed: null,
        relatedSkills: ["scales"]
      }
    ]
  },

  // TECHNIQUE - Vibrato
  {
    id: "vibrato_3_days",
    title: "Singing Vibrato",
    description: "Add emotion to every note – master the control of vibrato width and speed.",
    streakDays: 3,
    intensity: "low",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "bending",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Bending",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "350",
    rewardSkillId: "bending",
    rewardLevel: 10,
    accentColor: "main",
    exercises: [
      {
        id: "streak_vibrato_ex_1",
        title: "Oscillation Control",
        description: "Practice regular, wide, and narrow vibrato on long notes.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Movement should come from the wrist, not just the fingers."
        ],
        metronomeSpeed: { min: 60, max: 90, recommended: 70 },
        relatedSkills: ["bending"]
      }
    ]
  },

  // TECHNIQUE - Hybrid Picking
  {
    id: "hybrid_5_days",
    title: "Hybrid Picking Independence",
    description: "Combine pick precision with the delicacy of right-hand fingers.",
    streakDays: 5,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "hybrid_picking",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Hybrid Picking",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "700",
    rewardSkillId: "hybrid_picking",
    rewardLevel: 10,
    accentColor: "main",
    exercises: [
      {
        id: "streak_hybrid_ex_1",
        title: "String Skipping",
        description: "Use the pick on bass strings and fingers (m, a) on treble strings.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Try to balance the volume between the pick stroke and the finger pluck."
        ],
        metronomeSpeed: { min: 70, max: 110, recommended: 85 },
        relatedSkills: ["alternate_picking"]
      }
    ]
  },

  // THEORY - Triad Mastery
  {
    id: "triads_7_days",
    title: "Triad Inversions on the Fretboard",
    description: "Build guitar parts like a pro – master 3-note chords in every position.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "medium",
    category: "theory",
    requiredSkillId: "chord_theory",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Chords",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "900",
    rewardSkillId: "chord_theory",
    rewardLevel: 12,
    accentColor: "main",
    exercises: [
      {
        id: "streak_triads_ex_1",
        title: "Voice Leading",
        description: "Connect chords so that as few notes as possible change.",
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Triads are the fastest way to understand harmony in solos."
        ],
        metronomeSpeed: null,
        relatedSkills: ["chord_theory"]
      }
    ]
  },

  // TECHNIQUE - Muting & Cleanliness
  {
    id: "muting_3_days",
    title: "Clinical Playing Cleanliness",
    description: "Eliminate unwanted noises and string hum.",
    streakDays: 3,
    intensity: "high",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "alternate_picking",
    requiredLevel: 4,
    unlockDescription: "Lvl 4 Picking",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "300",
    accentColor: "main",
    rewardSkillId: "alternate_picking",
    rewardLevel: 8,
    dependsOn: "picking_basics_3_days",
    exercises: [
      {
        id: "streak_muting_ex_1",
        title: "Palm Muting & Left Hand Mute",
        description: "Play with high gain, ensuring absolute silence between notes.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "The more gain, the more you must rely on the edge of your right hand at the bridge."
        ],
        metronomeSpeed: { min: 80, max: 140, recommended: 110 },
        relatedSkills: ["alternate_picking"]
      }
    ]
  },

  // TECHNIQUE - Fingerpicking
  {
    id: "fingerstyle_5_days",
    title: "Fingerstyle Evolution",
    description: "Discover the independence of thumb and fingers in playing without a pick.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "fingerpicking",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Fingerpicking",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "550",
    rewardSkillId: "fingerpicking",
    rewardLevel: 8,
    accentColor: "main",
    exercises: [
      {
        id: "streak_finger_ex_1",
        title: "Travis Picking Basics",
        description: "Maintain a steady thumb pulse while playing a melody simultaneously.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Keep your hand relaxed and fingers close to the strings to minimize movement."
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 80 },
        relatedSkills: ["fingerpicking"]
      }
    ]
  },

  // THEORY - Sight Reading
  {
    id: "sight_reading_3_days",
    title: "Sight Reading Proficiency",
    description: "Increase the speed of note recognition on the staff and their location on the fretboard.",
    streakDays: 3,
    intensity: "medium",
    difficulty: "medium",
    category: "theory",
    requiredSkillId: "sight_reading",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Sight Reading",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "300",
    rewardSkillId: "sight_reading",
    rewardLevel: 5,
    accentColor: "main",
    exercises: [
      {
        id: "streak_reading_ex_1",
        title: "First Look",
        description: "Play simple melodies from sheet music without prior preparation.",
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Always look one measure ahead to prepare your hand for a position change."
        ],
        metronomeSpeed: { min: 40, max: 70, recommended: 50 },
        relatedSkills: ["sight_reading"]
      }
    ]
  },

  // CREATIVITY - Composition
  {
    id: "composition_5_days",
    title: "Composition Lab",
    description: "Create your own musical motif and develop it into a short etude.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "composition",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Composition",
    shortGoal: "5 days / 15 min daily",
    rewardDescription: "650",
    accentColor: "main",
    rewardSkillId: "composition",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_comp_ex_1",
        title: "Building a Motif",
        description: "Write down or record a 4-measure idea and add variations to it.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 15,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Don't judge your ideas immediately – give yourself space for experiments."
        ],
        metronomeSpeed: null,
        relatedSkills: ["composition", "music_theory"]
      }
    ]
  },

  // HEARING - Pitch Recognition
  {
    id: "pitch_recognition_5_days",
    title: "Sound Detective",
    description: "Learn to recognize specific pitches without an instrument.",
    streakDays: 5,
    intensity: "high",
    difficulty: "hard",
    category: "hearing",
    requiredSkillId: "pitch_recognition",
    requiredLevel: 0,
    unlockDescription: "Lvl 0 Pitch Recognition",
    shortGoal: "5 days / 5 min daily",
    rewardDescription: "500",
    accentColor: "main",
    rewardSkillId: "pitch_recognition",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_pitch_ex_1",
        title: "Note Identification",
        description: "Recognize notes played randomly by an application or teacher.",
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Associate specific notes with the first sound of your favorite songs."
        ],
        metronomeSpeed: null,
        relatedSkills: ["pitch_recognition", "ear_training"]
      }
    ]
  },

  // TECHNIQUE - Slide Guitar
  {
    id: "slide_guitar_3_days",
    title: "Delta Slide Magic",
    description: "Master pressure control and intonation when playing with a slide.",
    streakDays: 3,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "slide_guitar",
    requiredLevel: 0,
    unlockDescription: "Lvl 3 Slide",
    shortGoal: "3 days / 10 min daily",
    rewardDescription: "400",
    accentColor: "main",
    rewardSkillId: "slide_guitar",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_slide_ex_1",
        title: "Sliding Over Frets",
        description: "Play scales and simple licks, ensuring the slide is perfectly over the fret.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Don't press the slide onto the strings so hard that they touch the frets."
        ],
        metronomeSpeed: null,
        relatedSkills: ["slide_guitar"]
      }
    ]
  },

  // THEORY - Harmony
  {
    id: "harmony_7_days",
    title: "Harmony Architecture",
    description: "Understand how advanced chords and their connections are built.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "hard",
    category: "theory",
    requiredSkillId: "harmony",
    requiredLevel: 0,
    unlockDescription: "Lvl 5 Harmony",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "800",
    accentColor: "main",
    rewardSkillId: "harmony",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_harmony_ex_1",
        title: "Building Extended Chords",
        description: "Find and play 9th, 11th, and 13th chords in various positions.",
        difficulty: "hard",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Focus on the sound of the added intervals – feel their color."
        ],
        metronomeSpeed: null,
        relatedSkills: ["harmony", "chord_theory"]
      }
    ]
  },

  // CREATIVITY - Blues Soloing
  {
    id: "blues_soloing_5_days",
    title: "Soul of the Blues",
    description: "Combine technique with emotion using the blues scale and 'blue notes'.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "improvisation",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Improv",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600",
    accentColor: "main",
    rewardSkillId: "improvisation",
    rewardLevel: 12,
    exercises: [
      {
        id: "streak_blues_ex_1",
        title: "Call and Response",
        description: "Improvisise short phrases that 'answer' each other.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "A pause is just as important as a sound – let the music breathe."
        ],
        metronomeSpeed: null,
        relatedSkills: ["improvisation", "bending"]
      }
    ]
  },

  // HEARING - Transcription
  {
    id: "transcription_5_days",
    title: "Transcription Master",
    description: "Decipher and write down a solo or riff by ear with surgical precision.",
    streakDays: 5,
    intensity: "high",
    difficulty: "hard",
    category: "hearing",
    requiredSkillId: "transcription",
    requiredLevel: 0,
    unlockDescription: "Lvl 7 transcription",
    shortGoal: "5 days / 15 min daily",
    rewardDescription: "900",
    accentColor: "main",
    rewardSkillId: "transcription",
    rewardLevel: 12,
    exercises: [
      {
        id: "streak_trans_ex_1",
        title: "Solo Decoding",
        description: "Choose a 4-measure fragment of your favorite solo and transfer it to the fretboard.",
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 15,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Start by finding the first note and the key of the song."
        ],
        metronomeSpeed: null,
        relatedSkills: ["transcription", "ear_training"]
      }
    ]
  },

  // TECHNIQUE - Funk Rhythm
  {
    id: "funk_rhythm_3_days",
    title: "Funk Pulse",
    description: "Master 'scratching' and the sixteenth-note feel in funk rhythms.",
    streakDays: 3,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "rhythm",
    requiredLevel: 4,
    unlockDescription: "Lvl 4 Rhythm",
    shortGoal: "3 days / 10 min daily",
    rewardDescription: "450",
    accentColor: "main",
    rewardSkillId: "rhythm",
    rewardLevel: 8,
    exercises: [
      {
        id: "streak_funk_ex_1",
        title: "Constant Motion",
        description: "Keep the picking hand moving in sixteenth notes while muting most hits.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Movement should be loose and come mainly from the wrist."
        ],
        metronomeSpeed: { min: 80, max: 110, recommended: 95 },
        relatedSkills: ["rhythm"]
      }
    ]
  },

  // TECHNIQUE - Harmonics
  {
    id: "harmonics_3_days",
    title: "Crystal Sounds",
    description: "Discover the world of natural, artificial, and pinch harmonics.",
    streakDays: 3,
    intensity: "low",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "technique",
    requiredLevel: 0,
    unlockDescription: "Lvl 5 Tech",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "350",
    accentColor: "main",
    rewardSkillId: "technique",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_harmonics_ex_1",
        title: "Harmonics Map",
        description: "Find natural harmonics at the 5th, 7th, and 12th frets of all strings.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Using the bridge pickup and higher gain makes it easier to produce harmonics."
        ],
        metronomeSpeed: null,
        relatedSkills: ["technique"]
      }
    ]
  },

  // TECHNIQUE - String Skipping
  {
    id: "string_skipping_5_days",
    title: "String Acrobatics",
    description: "Increase right-hand precision with large jumps between strings.",
    streakDays: 5,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "string_skipping",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Skipping",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600",
    accentColor: "main",
    rewardSkillId: "string_skipping",
    rewardLevel: 12,
    exercises: [
      {
        id: "streak_skip_ex_1",
        title: "Penta-Skips",
        description: "Play the pentatonic scale, skipping every other string.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Perform a slightly larger arc with the pick to 'skip' over the unwanted string."
        ],
        metronomeSpeed: { min: 60, max: 100, recommended: 75 },
        relatedSkills: ["string_skipping", "alternate_picking"]
      }
    ]
  },

  // TECHNIQUE - Finger Independence
  {
    id: "finger_independence_7_days",
    title: "Finger Independence",
    description: "Strengthen the condition and coordination of all left-hand fingers.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "finger_independence",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Independence",
    shortGoal: "7 days / 5 min daily",
    rewardDescription: "800",
    accentColor: "main",
    rewardSkillId: "finger_independence",
    rewardLevel: 15,
    exercises: [
      {
        id: "streak_indep_ex_1",
        title: "Chromatic Spider Walk",
        description: "Play 1-3-2-4 patterns on various strings and positions.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Maintain the thumb steadily in the middle of the back of the neck."
        ],
        metronomeSpeed: { min: 60, max: 120, recommended: 90 },
        relatedSkills: ["finger_independence"]
      }
    ]
  },

  // THEORY - Music Theory
  {
    id: "music_theory_5_days",
    title: "Theory Fundamentals",
    description: "Explore knowledge about intervals and scale construction.",
    streakDays: 5,
    intensity: "low",
    difficulty: "easy",
    category: "theory",
    requiredSkillId: "music_theory",
    requiredLevel: 0,
    unlockDescription: "Lvl 3 Theory",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "500",
    accentColor: "main",
    rewardSkillId: "music_theory",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_theory_basics_ex_1",
        title: "Interval Construction",
        description: "Name and play intervals from a given pitch on a single string.",
        difficulty: "easy",
        category: "theory",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Remember the number of semitones for each interval."
        ],
        metronomeSpeed: null,
        relatedSkills: ["music_theory"]
      }
    ]
  },

  // HEARING - Rhythm Recognition
  {
    id: "rhythm_recog_5_days",
    title: "Rhythm Detector",
    description: "Learn to hear and transcribe complex rhythmic figures.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "hearing",
    requiredSkillId: "rythm_recognition",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Rhythm Rec",
    shortGoal: "5 days / 5 min daily",
    rewardDescription: "500",
    accentColor: "main",
    rewardSkillId: "rythm_recognition",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_rhythm_rec_ex_1",
        title: "Rhythmic Dictation",
        description: "Listen to a phrase and tap out its rhythm.",
        difficulty: "medium",
        category: "hearing",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
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
    title: "Picking Fundamentals",
    description: "Focus on attack clarity and pick slant angle.",
    streakDays: 3,
    intensity: "low",
    difficulty: "easy",
    category: "technique",
    requiredSkillId: "picking",
    requiredLevel: 0,
    unlockDescription: "Lvl 2 Picking",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "300",
    accentColor: "main",
    rewardSkillId: "picking",
    rewardLevel: 8,
    exercises: [
      {
        id: "streak_picking_base_ex_1",
        title: "Clean Attack",
        description: "Play open strings, ensuring consistent sound.",
        difficulty: "easy",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Hold the pick firmly, but without excessive squeezing."
        ],
        metronomeSpeed: { min: 60, max: 90, recommended: 70 },
        relatedSkills: ["picking"]
      }
    ]
  },

  // CREATIVITY - Phrasing
  {
    id: "phrasing_5_days",
    title: "The Art of Phrasing",
    description: "Learn to 'tell stories' with your solos.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "phrasing",
    requiredLevel: 0,
    unlockDescription: "Lvl 5 Phrasing",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600",
    accentColor: "main",
    rewardSkillId: "phrasing",
    rewardLevel: 12,
    exercises: [
      {
        id: "streak_phrasing_ex_1",
        title: "Rhythmic Limitation",
        description: "Improvise using only one chosen rhythm for all phrases.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Less is more – a good phrase needs space to breathe."
        ],
        metronomeSpeed: null,
        relatedSkills: ["phrasing", "improvisation"]
      }
    ]
  },

  // TECHNIQUE - Articulation
  {
    id: "articulation_3_days",
    title: "Articulation Master",
    description: "Add character to your playing through accents and varied attack.",
    streakDays: 3,
    intensity: "medium",
    difficulty: "medium",
    category: "technique",
    requiredSkillId: "articulation",
    requiredLevel: 0,
    unlockDescription: "Lvl 4 Articulation",
    shortGoal: "3 days / 5 min daily",
    rewardDescription: "400",
    accentColor: "main",
    rewardSkillId: "articulation",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_artic_ex_1",
        title: "Subdivision Accenting",
        description: "Play eighth notes, accenting every third note.",
        difficulty: "medium",
        category: "technique",
        timeInMinutes: 5,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Use different pick immersion depths to change the tone color."
        ],
        metronomeSpeed: { min: 70, max: 110, recommended: 90 },
        relatedSkills: ["articulation"]
      }
    ]
  },

  // CREATIVITY - Songwriting
  {
    id: "songwriting_7_days",
    title: "Songwriting Marathon",
    description: "Go through the entire process of creating a song – from riff to structure.",
    streakDays: 7,
    intensity: "high",
    difficulty: "hard",
    category: "creativity",
    requiredSkillId: "composition",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 Composition",
    shortGoal: "7 days / 15 min daily",
    rewardDescription: "1000",
    accentColor: "main",
    rewardSkillId: "composition",
    rewardLevel: 15,
    exercises: [
      {
        id: "streak_songwrite_ex_1",
        title: "Song Structure",
        description: "Combine a riff, verse, and chorus into a coherent whole.",
        difficulty: "hard",
        category: "creativity",
        timeInMinutes: 15,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "A good chorus should be easy to remember and contrast with the verse."
        ],
        metronomeSpeed: null,
        relatedSkills: ["composition", "harmony"]
      }
    ]
  },

  // CREATIVITY - Audio Production / Tone
  {
    id: "audio_tone_3_days",
    title: "Tone Engineering",
    description: "Understand the impact of effects, EQ, and amp settings on your sound.",
    streakDays: 3,
    intensity: "low",
    difficulty: "medium",
    category: "creativity",
    requiredSkillId: "audio_production",
    requiredLevel: 0,
    unlockDescription: "Lvl 3 Audio",
    shortGoal: "3 days / 10 min daily",
    rewardDescription: "400",
    accentColor: "main",
    rewardSkillId: "audio_production",
    rewardLevel: 10,
    exercises: [
      {
        id: "streak_audio_ex_1",
        title: "Tone Chasing",
        description: "Try to recreate the guitar sound from a famous song.",
        difficulty: "medium",
        category: "creativity",
        timeInMinutes: 10,
        instructions: [
          "Choose exercises or songs that fit the given topic."
        ],
        tips: [
          "Less gain often means more clarity and better tone in a recording."
        ],
        metronomeSpeed: null,
        relatedSkills: ["audio_production"]
      }
    ]
  },
  {
    id: "legato_speed_7_days",
    title: "Legato Sprints",
    description: "Increase the speed and endurance of hammer-ons.",
    streakDays: 7,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "legato",
    requiredLevel: 8,
    unlockDescription: "Lvl 8 Legato",
    dependsOn: "legato_5_days",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "800",
    accentColor: "main",
    rewardSkillId: "legato",
    rewardLevel: 12,
    exercises: [
      {
        id: "l_speed_1",
        title: "Fast Triplets",
        description: "Legato triplets at a fast tempo.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Choose exercises or songs that fit the given topic."],
        tips: ["Keep your fingers close to the strings."],
        metronomeSpeed: null,
        relatedSkills: ["legato"]
      }
    ]
  },
  {
    id: "legato_marathon_10_days",
    title: "Legato Endurance Marathon",
    description: "An extreme challenge for your left hand.",
    streakDays: 10,
    intensity: "extreme",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "legato",
    requiredLevel: 12,
    unlockDescription: "Lvl 12 Legato",
    dependsOn: "legato_speed_7_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1500",
    accentColor: "main",
    rewardSkillId: "legato",
    rewardLevel: 20,
    exercises: [
      {
        id: "l_mara_1",
        title: "Constant Flow",
        description: "15 minutes of non-stop legato playing.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Choose exercises or songs that fit the given topic."],
        tips: ["If you feel pain, stop immediately."],
        metronomeSpeed: null,
        relatedSkills: ["legato"]
      }
    ]
  },
  {
    id: "sweep_5_string_10_days",
    title: "5-String Sweep Cascades",
    description: "Extended arpeggios for advanced players.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "sweep_picking",
    requiredLevel: 9,
    unlockDescription: "Lvl 9 Sweep",
    dependsOn: "sweeping_5_days",
    shortGoal: "10 days / 10 min daily",
    rewardDescription: "1000",
    accentColor: "main",
    rewardSkillId: "sweep_picking",
    rewardLevel: 20,
    exercises: [
      {
        id: "s_5_1",
        title: "Full Arpeggios",
        description: "Play 5-string arpeggio shapes.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 10,
        instructions: ["Choose exercises or songs that fit the given topic."],
        tips: ["Use palm muting with your right hand."],
        metronomeSpeed: null,
        relatedSkills: ["sweep_picking"]
      }
    ]
  },
  {
    id: "sweep_neoclassical_14_days",
    title: "Neoclassical Sweep Master",
    description: "Most complex sweep picking figures.",
    streakDays: 14,
    intensity: "extreme",
    difficulty: "hard",
    category: "technique",
    requiredSkillId: "sweep_picking",
    requiredLevel: 12,
    unlockDescription: "Lvl 12 Sweep",
    dependsOn: "sweep_5_string_10_days",
    shortGoal: "14 days / 15 min daily",
    rewardDescription: "2000",
    accentColor: "main",
    rewardSkillId: "sweep_picking",
    rewardLevel: 25,
    exercises: [
      {
        id: "s_neo_1",
        title: "Symphonic Sweeps",
        description: "Quick shape and position changes.",
        difficulty: "hard",
        category: "technique",
        timeInMinutes: 15,
        instructions: ["Choose exercises or songs that fit the given topic."],
        tips: ["Hand synchronization is key."],
        metronomeSpeed: null,
        relatedSkills: ["sweep_picking", "legato"]
      }
    ]
  },
  {
    id: "ear_chords_7_days",
    title: "Chord Color Recognition",
    description: "Distinguish complex chords by ear.",
    streakDays: 7,
    intensity: "medium",
    difficulty: "medium",
    category: "hearing",
    requiredSkillId: "ear_training",
    requiredLevel: 6,
    unlockDescription: "Lvl 6 Ear Training",
    dependsOn: "ear_5_days",
    shortGoal: "7 days / 10 min daily",
    rewardDescription: "700",
    accentColor: "main",
    rewardSkillId: "ear_training",
    rewardLevel: 12,
    exercises: [
      {
        id: "e_c_1",
        title: "Maj vs Min vs Dom",
        description: "Identify types of seventh chords.",
        difficulty: "medium",
        category: "hearing",
        timeInMinutes: 10,
        instructions: ["Choose exercises or songs that fit the given topic."],
        tips: ["Focus on the sound of the third and seventh."],
        metronomeSpeed: null,
        relatedSkills: ["ear_training"]
      }
    ]
  },
  {
    id: "ear_melodic_10_days",
    title: "Melodic Dictation",
    description: "Write down melodies heard on the radio.",
    streakDays: 10,
    intensity: "high",
    difficulty: "hard",
    category: "hearing",
    requiredSkillId: "ear_training",
    requiredLevel: 9,
    unlockDescription: "Lvl 9 Ear Training",
    dependsOn: "ear_chords_7_days",
    shortGoal: "10 days / 15 min daily",
    rewardDescription: "1200",
    accentColor: "main",
    rewardSkillId: "ear_training",
    rewardLevel: 15,
    exercises: [
      {
        id: "e_m_1",
        title: "From Head to Fretboard",
        description: "Play melodies you hear in your imagination.",
        difficulty: "hard",
        category: "hearing",
        timeInMinutes: 15,
        instructions: ["Choose exercises or songs that fit the given topic."],
        tips: ["Start at a very slow tempo."],
        metronomeSpeed: null,
        relatedSkills: ["ear_training"]
      }
    ]
  },
  {
    id: "sight_reading_pos_5_days",
    title: "Reading in Positions",
    description: "Read notes while changing positions on the fretboard.",
    streakDays: 5,
    intensity: "medium",
    difficulty: "medium",
    category: "theory",
    requiredSkillId: "sight_reading",
    requiredLevel: 5,
    unlockDescription: "Lvl 5 Sight Reading",
    dependsOn: "sight_reading_3_days",
    shortGoal: "5 days / 10 min daily",
    rewardDescription: "600",
    rewardSkillId: "sight_reading",
    rewardLevel: 10,
    accentColor: "main",
    exercises: [
      {
        id: "s_r_p_1",
        title: "Fifth Position",
        description: "Read sheet music focusing only on the 5th position.",
        difficulty: "medium",
        category: "theory",
        timeInMinutes: 10,
        instructions: ["Choose exercises or songs that fit the given topic."],
        tips: ["Dont look at your hands."],
        metronomeSpeed: null,
        relatedSkills: ["sight_reading"]
      }
    ]
  }
];
