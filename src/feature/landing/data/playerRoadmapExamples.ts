/**
 * Real Player Roadmaps, read from Firestore (public ones only, no names) on
 * 2026-10-29 and frozen here so the landing never queries Firestore.
 * Goals are the players' own words; phases and steps are what the generator
 * wrote. Regenerate by hand when the board has moved on — the numbers in
 * ROADMAP_FACTS are rounded down, so they never overstate what exists.
 */

export interface RoadmapExampleStep {
  title: string;
  /** The step comes with an exercise from the library. */
  exercise?: boolean;
  /** The library song the step is about. */
  song?: string;
  /** How many video lessons were picked for it. */
  lessons?: number;
}

export interface RoadmapExample {
  id: string;
  title: string;
  goal: string;
  level: string;
  phases: { title: string; steps: RoadmapExampleStep[] }[];
}

export interface RoadmapStepExample {
  roadmapId: string;
  phaseIndex: number;
  phaseTitle: string;
  stepIndex: number;
  title: string;
  sections: { heading: string; body: string }[];
  successCriteria: string;
  sessionsRequired: number;
  exerciseId: string;
  /** The library song the step is about. */
  song?: { title: string; artist: string };
  lessons: { title: string; channelName: string; duration: number }[];
}

export const ROADMAP_EXAMPLES: RoadmapExample[] = [
  {
    id: "2d0d161c-216c-4fc4-831c-736daa8eee68",
    title: "Metallica / James Hetfield",
    goal: "Metal rhythm guitar like James Hetfield: relentless alternate and downpicking, palm-muted gallops, tight power-chord riffs and syncopated accents, working through Enter Sandman, Master of Puppets, Seek & Destroy and One.",
    level: "Intermediate",
    phases: [
      {
        title: "The Hetfield Pulse",
        steps: [
          {
            title: "Downpicked eighth-note engine",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Alternate-picked low-E sixteenths",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Down-up gallop rotation",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Muted notes and open accents",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Pick depth near the bridge",
            exercise: true,
            lessons: 2,
          },
          {
            title: "Enter Sandman main-riff rests",
            exercise: true,
            song: "Enter Sandman",
            lessons: 1,
          },
          {
            title: "Pedal rhythms by ear",
          },
        ],
      },
      {
        title: "Riff Language",
        steps: [
          {
            title: "Master of Puppets opening shifts",
            exercise: true,
            song: "Master of Puppets",
            lessons: 3,
          },
          {
            title: "Seek & Destroy opening articulation",
            song: "Seek & Destroy",
            lessons: 3,
          },
          {
            title: "Minor-second and tritone targets",
            exercise: true,
            lessons: 2,
          },
          {
            title: "Chord punches and rests by ear",
            lessons: 2,
          },
        ],
      },
      {
        title: "Accents and Meter",
        steps: [
          {
            title: "Moving sixteenth-note accents",
            exercise: true,
            lessons: 3,
          },
          {
            title: "One machine-gun grouping",
            exercise: true,
            song: "One",
            lessons: 3,
          },
          {
            title: "Master of Puppets shortened bars",
            exercise: true,
            song: "Master of Puppets",
            lessons: 3,
          },
          {
            title: "Straight and triplet gears",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Silent-click riff test",
            exercise: true,
          },
        ],
      },
      {
        title: "The Sound",
        steps: [
          {
            title: "High-gain reference matching",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Clean reference matching",
            exercise: true,
            lessons: 3,
          },
          {
            title: "E standard against album pitch",
            exercise: true,
          },
          {
            title: "Double-tracked rhythm takes",
            lessons: 3,
          },
        ],
      },
      {
        title: "Enter Sandman",
        steps: [
          {
            title: "Dry-tone section accuracy",
            song: "Enter Sandman",
            lessons: 3,
          },
          {
            title: "Reduced-tempo arrangement",
            song: "Enter Sandman",
            lessons: 3,
          },
          {
            title: "Album-tempo riff and chorus",
            exercise: true,
            song: "Enter Sandman",
            lessons: 3,
          },
          {
            title: "Recorded full rhythm take",
            song: "Enter Sandman",
            lessons: 3,
          },
        ],
      },
      {
        title: "Seek & Destroy",
        steps: [
          {
            title: "Dry-tone section accuracy",
            song: "Seek & Destroy",
            lessons: 3,
          },
          {
            title: "Reduced-tempo arrangement",
            song: "Seek & Destroy",
            lessons: 3,
          },
          {
            title: "Album-tempo verse and chorus",
            exercise: true,
            song: "Seek & Destroy",
            lessons: 3,
          },
          {
            title: "Recorded full rhythm take",
            song: "Seek & Destroy",
            lessons: 3,
          },
        ],
      },
      {
        title: "One",
        steps: [
          {
            title: "Clean arpeggio accuracy",
            song: "One",
            lessons: 3,
          },
          {
            title: "Reduced-tempo clean-to-heavy changes",
            song: "One",
            lessons: 3,
          },
          {
            title: "Album-tempo machine-gun section",
            exercise: true,
            song: "One",
            lessons: 3,
          },
          {
            title: "Recorded full rhythm take",
            song: "One",
            lessons: 3,
          },
        ],
      },
      {
        title: "Master of Puppets",
        steps: [
          {
            title: "Dry-tone riff accuracy",
            exercise: true,
            song: "Master of Puppets",
            lessons: 3,
          },
          {
            title: "Reduced-tempo full arrangement",
            song: "Master of Puppets",
          },
          {
            title: "Album-tempo downpicked sections",
            exercise: true,
            song: "Master of Puppets",
            lessons: 3,
          },
          {
            title: "Interlude-to-heavy transition",
            song: "Master of Puppets",
            lessons: 3,
          },
          {
            title: "Recorded full rhythm take",
            song: "Master of Puppets",
            lessons: 3,
          },
          {
            title: "Four-song Metallica set",
            lessons: 3,
          },
        ],
      },
    ],
  },
  {
    id: "fddf5e08-9dfc-47eb-a3db-89a5eec5adb8",
    title: "Mark Knopfler",
    goal: "I want to play fingerstyle like Mark Knopfler: pick-less right hand with thumb and two fingers, snapped and plucked notes, hybrid rhythm-and-lead patterns, and his lyrical bends and double stops, working towards Sultans of Swing, Romeo and Juliet, Brothers in Arms and Going Home.",
    level: "Intermediate",
    phases: [
      {
        title: "The Pickless Hand",
        steps: [
          {
            title: "Thumb and 2-finger coordination",
            lessons: 3,
          },
          {
            title: "Alternating bass and treble replies",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Snapped treble-string accents",
            lessons: 1,
          },
          {
            title: "Note length and string separation",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Sultans 2-note reply by ear",
            song: "Sultans of Swing",
            lessons: 2,
          },
        ],
      },
      {
        title: "Rhythm and Lead",
        steps: [
          {
            title: "Bass with simultaneous chord stabs",
            lessons: 3,
          },
          {
            title: "16th-note thumb-finger syncopation",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Partial-triad chord fills",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Chord-to-lick handoffs",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Romeo vocal reply by ear",
          },
          {
            title: "Brothers 2-note answer by ear",
            lessons: 3,
          },
        ],
      },
      {
        title: "The Lead Voice",
        steps: [
          {
            title: "Pickless rakes into target notes",
            lessons: 3,
          },
          {
            title: "Bends against reference pitches",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Timed bend releases",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Narrow vibrato after bends",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Sliding and bent double stops",
            lessons: 3,
          },
          {
            title: "Sung call-and-response lines",
            exercise: true,
            lessons: 2,
          },
          {
            title: "Going Home pickup by ear",
          },
        ],
      },
      {
        title: "Song Harmonic Maps",
        steps: [
          {
            title: "Triads through Dm–C–Bb–A",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Open-G capo-3 shape navigation",
            exercise: true,
            lessons: 1,
          },
          {
            title: "G# minor chord-tone space",
            exercise: true,
            lessons: 3,
          },
          {
            title: "D major melody positions",
            exercise: true,
            lessons: 3,
          },
        ],
      },
      {
        title: "Ballads and Theme",
        steps: [
          {
            title: "Romeo intro articulation",
            lessons: 2,
          },
          {
            title: "Romeo verse bass and replies",
            lessons: 3,
          },
          {
            title: "Brothers opening rests and swells",
            exercise: true,
            lessons: 1,
          },
          {
            title: "Brothers bends and sustain",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Going Home main theme",
            exercise: true,
            lessons: 2,
          },
          {
            title: "Going Home melodic variations",
            exercise: true,
            lessons: 2,
          },
        ],
      },
      {
        title: "Sultans of Swing",
        steps: [
          {
            title: "Sultans fingerstyle chord pulse",
            song: "Sultans of Swing",
            lessons: 3,
          },
          {
            title: "Sultans verse-fill answers",
            exercise: true,
            song: "Sultans of Swing",
            lessons: 3,
          },
          {
            title: "Descending pickless speed loops",
            song: "Sultans of Swing",
            lessons: 2,
          },
          {
            title: "Sultans first solo phrasing",
            song: "Sultans of Swing",
            lessons: 1,
          },
          {
            title: "Sultans section joins",
            exercise: true,
            song: "Sultans of Swing",
            lessons: 3,
          },
          {
            title: "Sultans final solo run",
            song: "Sultans of Swing",
            lessons: 1,
          },
        ],
      },
      {
        title: "The Four-Song Set",
        steps: [
          {
            title: "4-record tone matching",
            exercise: true,
          },
          {
            title: "Blind tempos, count-ins and starts",
            exercise: true,
            lessons: 2,
          },
          {
            title: "Vocal-space fill restraint",
            exercise: true,
            lessons: 3,
          },
          {
            title: "4-song one-take set",
          },
        ],
      },
    ],
  },
  {
    id: "a1eece78-bb34-48fe-ad1f-10dd4fd6500f",
    title: "Getting back in shape",
    goal: "I'm an intermediate guitarist coming back after a few months off. I want to rebuild my playing step by step: get calluses, finger strength and stamina back without injury, restore clean chord changes, picking accuracy and timing with a metronome, bring my speed back to where it was, and relearn a few songs I used to play so practice feels rewarding again from week one.",
    level: "Intermediate",
    phases: [
      {
        title: "Weeks 1–2: Low-Dose Return",
        steps: [
          {
            title: "Pressure and skin tolerance",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Least-motion chord loops",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Cross-string accuracy ladder",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Quarter-note click lock",
            lessons: 2,
          },
          {
            title: "Old-song fragment at 60%",
            lessons: 5,
          },
          {
            title: "Recall 2 bars by ear",
            exercise: true,
            lessons: 4,
          },
          {
            title: "Weekly recorded benchmark",
            lessons: 5,
          },
        ],
      },
      {
        title: "Weeks 3–4: Chords and Pulse",
        steps: [
          {
            title: "Eighth-note chord pulse",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Silent-click downbeats",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Major, minor, 7, sus4",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Old-song chords at 70%",
            lessons: 5,
          },
        ],
      },
      {
        title: "Weeks 5–6: Picking and Articulation",
        steps: [
          {
            title: "Moving pick accents",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Triplets against the click",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Both-hand noise gates",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Sing the old-song melody",
            exercise: true,
            lessons: 3,
          },
        ],
      },
      {
        title: "Weeks 7–8: Strength and Stamina",
        steps: [
          {
            title: "Relaxed hammer-on widening",
            lessons: 5,
          },
          {
            title: "Equal-volume pull-offs",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Pinky-led fretting",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Fatigue signals and clean stops",
            lessons: 5,
          },
          {
            title: "Subdivision stamina",
            exercise: true,
            lessons: 3,
          },
          {
            title: "Longest old-song section at 80%",
            lessons: 5,
          },
        ],
      },
      {
        title: "Weeks 9–10: Speed Return",
        steps: [
          {
            title: "Clean-tempo scale ladder",
            exercise: true,
            lessons: 5,
          },
          {
            title: "4-note speed bursts",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Skipped-string accuracy",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Old-song hard passage at 90%",
            lessons: 4,
          },
        ],
      },
      {
        title: "Weeks 11–12: 3-Song Repertoire",
        steps: [
          {
            title: "Easiest song at target tempo",
            lessons: 5,
          },
          {
            title: "Second song section joins",
            lessons: 5,
          },
          {
            title: "Third song hard passages",
            lessons: 5,
          },
          {
            title: "Recorded phrasing details",
            lessons: 5,
          },
          {
            title: "Memory starts from each section",
            lessons: 5,
          },
        ],
      },
      {
        title: "Weeks 13–14: Return Set",
        steps: [
          {
            title: "3-song running order",
            lessons: 5,
          },
          {
            title: "Count-ins and final chords",
            lessons: 5,
          },
          {
            title: "No-stop mistake recovery",
          },
          {
            title: "One-take set recording",
          },
        ],
      },
    ],
  },
  {
    id: "13028c14-b218-480e-bed3-91a5f39e75f9",
    title: "Strumming",
    goal: "I want to master strumming and rhythm guitar: a steady down-up motion, 8th and 16th-note patterns, accents and ghost strums, syncopation and muting, and keeping time with a metronome — learned through well-known songs in pop, rock, folk and reggae, from simple patterns to funk-style 16ths.",
    level: "Beginner",
    phases: [
      {
        title: "The 8th-Note Engine",
        steps: [
          {
            title: "Down-up over quarter-note clicks",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Sound every eighth note",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Air strums keep moving",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Chord changes without stopping",
            exercise: true,
            lessons: 5,
          },
          {
            title: "A Horse with No Name: 2-chord groove",
            lessons: 5,
          },
          {
            title: "Record drift and missed strokes",
            lessons: 5,
          },
        ],
      },
      {
        title: "The Accent Map",
        steps: [
          {
            title: "Backbeat accents on 2 and 4",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Quiet eighths around backbeats",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Low-string downs, high-string ups",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Transcribe 1-bar accent maps",
          },
          {
            title: "Backbeat-only metronome clicks",
            lessons: 5,
          },
          {
            title: "Bad Moon Rising: brisk backbeat",
            song: "Bad Moon Rising",
            lessons: 5,
          },
          {
            title: "Record accent balance",
            lessons: 2,
          },
        ],
      },
      {
        title: "Syncopated Eighths",
        steps: [
          {
            title: "Count beats and offbeats",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Consecutive syncopated upstrokes",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Chord ties across downbeats",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Clap syncopation before strumming",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Beat-1-only metronome click",
            lessons: 5,
          },
          {
            title: "Knockin' on Heaven's Door: syncopated arrangement",
            lessons: 5,
          },
          {
            title: "Record errors and recovery",
            lessons: 5,
          },
        ],
      },
      {
        title: "Stops and Muting",
        steps: [
          {
            title: "Fretting-hand full-chord stops",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Right-hand chord chokes",
            lessons: 5,
          },
          {
            title: "Palm-muted verse pulses",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Hear muted and ringing chords",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Single clicks through stopped bars",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Ho Hey: stops and entries",
            song: "Ho Hey",
            lessons: 5,
          },
          {
            title: "Boulevard of Broken Dreams: muted contrast",
            song: "Boulevard of Broken Dreams",
            lessons: 5,
          },
        ],
      },
      {
        title: "The Reggae Skank",
        steps: [
          {
            title: "Offbeat upstrokes only",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Top-string chord targeting",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Transcribe 2-bar skank rhythms",
            lessons: 5,
          },
          {
            title: "Downbeat clicks, offbeat guitar",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Three Little Birds: offbeat skank",
            song: "Three Little Birds",
            lessons: 5,
          },
          {
            title: "Record skank placement",
            lessons: 5,
          },
        ],
      },
      {
        title: "The 16th-Note Grid",
        steps: [
          {
            title: "Count 1-e-and-a",
            exercise: true,
            lessons: 1,
          },
          {
            title: "Continuous 16ths over half-bar clicks",
            lessons: 5,
          },
          {
            title: "Sounded and omitted 16ths",
            lessons: 5,
          },
          {
            title: "Downbeat and backbeat accents",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Audible ghost scratches",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Displaced accents with scratches",
            exercise: true,
            lessons: 5,
          },
          {
            title: "I'm Yours: muted 16ths",
            song: "I'm Yours",
            lessons: 5,
          },
        ],
      },
      {
        title: "The Mixed-Style Set",
        steps: [
          {
            title: "One-chord funk at 80 BPM",
            exercise: true,
            lessons: 5,
          },
          {
            title: "Get Lucky: clipped chord stabs",
            lessons: 5,
          },
          {
            title: "Gap clicks between style grooves",
            exercise: true,
            lessons: 5,
          },
          {
            title: "No-pause style changes",
            lessons: 5,
          },
          {
            title: "Count-ins and final cuts",
          },
          {
            title: "Weekly 4-song set recordings",
            lessons: 5,
          },
        ],
      },
    ],
  },
];

export const ROADMAP_STEP_EXAMPLE: RoadmapStepExample = {
  roadmapId: "2d0d161c-216c-4fc4-831c-736daa8eee68",
  phaseIndex: 1,
  phaseTitle: "Riff Language",
  stepIndex: 0,
  title: "Master of Puppets opening shifts",
  sections: [
    {
      heading: "What it is",
      body: 'Chromatic palm-muted single-note runs that snap into open power-chord hits and accented held chords in the first bars of "Master of Puppets."',
    },
    {
      heading: "Why it matters",
      body: "You must move cleanly from fast alternate-picked, palm-muted sixteenths into fretted power chords without string noise or timing drift.",
    },
    {
      heading: "How to practice",
      body: "Play Riff Vault — Master of Puppets and listen for the exact moment the palm-muted run ends and the power chord sounds. Practice the excerpt in two parts: 8 bars of only palm-muted chromatic picking, then 8 bars of only the power-chord accents. Then link them and play the full excerpt, watching that each shift lands on the beat and each power chord rings cleanly.",
    },
  ],
  successCriteria:
    "Play the Riff Vault — Master of Puppets excerpt looped at 140 BPM with palm-muted notes on the low strings clean and even, snap into each power chord with full ringing notes and no audible fret buzz, and change from muted run to chord within one 16th-note window for 12 consecutive repeats.",
  sessionsRequired: 8,
  exerciseId: "master_of_puppets_riff_preview",
  song: {
    title: "Master of Puppets",
    artist: "Metallica",
  },
  lessons: [
    {
      title: "Mastering Palm Muting On Guitar: A Comprehensive Guide",
      channelName: "Tim Holman",
      duration: 954,
    },
    {
      title:
        "Advanced Palm Muting Concepts - Modern Metal Rhythm Guitar, Lesson 4",
      channelName: "Kevin Goetz",
      duration: 342,
    },
    {
      title:
        "Mastering Galloping Metal Rhythms – Play Tight, Aggressive Guitar Riffs",
      channelName: "Jason Stallworth",
      duration: 1103,
    },
  ],
};

export const ROADMAP_FACTS = {
  countedAt: "2026-10-29",
  roadmaps: 8,
  phasesMin: 6,
  phasesMax: 8,
  stepsMin: 29,
  stepsMax: 46,
  stepsWithLessonsPct: 92,
  stepsWithExercisePct: 59,
} as const;
