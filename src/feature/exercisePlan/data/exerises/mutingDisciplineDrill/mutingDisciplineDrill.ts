import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const mutingDisciplineDrillExercise: Exercise = {
  id: "muting_discipline_drill",
  title: "Muting Discipline Drill",
  description: "String-skipping patterns on E minor that force clean muting of unused strings. Progresses from small skips to maximum skips (string 6 to string 1), building right and left hand muting technique.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Play each measure with strict alternate picking. Use high gain or distortion to expose any unwanted string noise.",
    "Measures 1-2: String-skip between strings 6 and 4, then strings 6 and 3. Mute the unused middle strings with your fretting hand fingers and picking hand palm.",
    "Measures 3-4: Palm mute section on low strings. Keep your right hand anchored near the bridge for tight, percussive muting.",
    "Measures 5-6: Wide skips from string 6 to string 2, then string 6 to string 1. These require maximum muting discipline — all middle strings must stay silent.",
  ],
  tips: [
    "Use your fretting hand index finger laid flat to lightly touch and mute strings you're not playing.",
    "Your picking hand palm should rest on lower strings when you play higher strings, and vice versa.",
    "The more gain/distortion you use, the more exposed your muting flaws will be — use that as feedback.",
    "If you hear any sympathetic ringing or buzz, stop and identify which string is the culprit before continuing.",
    "Start very slowly — clean muting at 80 BPM is far more valuable than sloppy playing at 140 BPM.",
  ],
  metronomeSpeed: {
    min: 80,
    max: 140,
    recommended: 110,
  },
  relatedSkills: ["alternate_picking", 'hybrid_picking'],
  tablature: [
    // M1: String-skip between strings 6 and 4 (E minor: E-G-B pattern)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 4, fret: 2 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] }, { duration: 0.5, notes: [{ string: 4, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 4, fret: 2 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 2 }] }, { duration: 0.5, notes: [{ string: 4, fret: 0 }] },
      ],
    },
    // M2: String-skip between strings 6 and 3 (wider skip)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] }, { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 3, fret: 2 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 2 }] }, { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
      ],
    },
    // M3: Palm mute section — low string riff (strings 6-5)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 0, isAccented: true }] }, { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 5, fret: 2, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 2 }] }, { duration: 0.5, notes: [{ string: 6, fret: 0, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] }, { duration: 0.5, notes: [{ string: 6, fret: 2 }] },
      ],
    },
    // M4: Palm mute with open string accents
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 0, isAccented: true }] }, { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] }, { duration: 0.5, notes: [{ string: 5, fret: 2, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 6, fret: 3, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 2 }] }, { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
      ],
    },
    // M5: Wide skip — strings 6 to 2
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 2, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] }, { duration: 0.5, notes: [{ string: 2, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 2, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 2 }] }, { duration: 0.5, notes: [{ string: 2, fret: 0 }] },
      ],
    },
    // M6: Maximum skip — strings 6 to 1
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 1, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] }, { duration: 0.5, notes: [{ string: 1, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 1, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 2 }] }, { duration: 0.5, notes: [{ string: 1, fret: 0 }] },
      ],
    },
  ],
};
