import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Click-to-answer listening drills. They render EarQuizPanel instead of a tab:
// the app plays the question, the player answers on screen, and the panel grades
// it — so there is no metronome, no mic and no backing track in the way.
const EAR_QUIZ_DEFAULTS = {
  category: "hearing",
  metronomeSpeed: null,
  disableMic: true,
  disableBackingTrack: true,
  isHiddenFromLanding: true,
  addedAt: "2026-08-11",
} satisfies Partial<Exercise>;

// ── 1. Chord quality ─────────────────────────────────────────────────────────

export const earChordQualityBasicsExercise: Exercise = {
  ...EAR_QUIZ_DEFAULTS,
  id: "ear_chord_quality_basics",
  title: "Chord Quality — The Big Four",
  description:
    "Hear a chord and name it: major, minor, dominant 7 or sus4. Four colours, no fretboard needed.",
  whyItMatters:
    "Almost every song you will ever learn is built from these four sounds. Once you can name a chord the moment it rings, you stop guessing chord charts and start hearing them.",
  difficulty: "easy",
  timeInMinutes: 2,
  instructions: [
    "Press Play — a chord rings out on a random root.",
    "Pick the quality you hear. The root changes every round, so the colour is the only thing worth listening to.",
    "Stuck? 'One note at a time' spreads the chord into an arpeggio.",
  ],
  tips: [
    "Sing the 3rd of the chord: high and bright is major, a semitone lower is minor.",
    "A dominant 7 is a major chord that refuses to settle — it sounds like it wants to move.",
    "Sus4 has no 3rd at all, so it sounds neither happy nor sad, just suspended.",
  ],
  relatedSkills: ["ear_training", "harmony-ear", "chords"],
  earQuizConfig: {
    mode: "chordType",
    qualities: ["major", "minor", "dom7", "sus4"],
  },
};

export const earChordQualityAdvancedExercise: Exercise = {
  ...EAR_QUIZ_DEFAULTS,
  id: "ear_chord_quality_advanced",
  title: "Chord Quality — All Seven",
  description: "The full set by ear: major, minor, 7, maj7, m7, dim and sus4.",
  whyItMatters:
    "Telling maj7 from m7 from a plain dominant is what lets you transcribe jazz, soul and anything past three-chord rock without reaching for a chart.",
  difficulty: "hard",
  timeInMinutes: 2,
  instructions: [
    "Press Play and name the exact quality — seven are in play.",
    "Work top-down: first the 3rd (major or minor), then the 7th (none, ♭7 or natural 7).",
    "A diminished chord is the odd one out: its 5th is flattened too, so nothing sits still.",
  ],
  tips: [
    "maj7 has a semitone rub between the 7th and the root — that is the dreamy part.",
    "m7 is the smoothest of the lot; dominant 7 is the one with the itch.",
    "If it sounds tense but you cannot find the 3rd, check for sus4 before guessing diminished.",
  ],
  relatedSkills: ["ear_training", "harmony-ear", "harmony"],
  earQuizConfig: {
    mode: "chordType",
    qualities: ["major", "minor", "dom7", "maj7", "min7", "dim", "sus4"],
  },
};

// ── 2. Chord progressions ────────────────────────────────────────────────────

export const earProgressionBasicsExercise: Exercise = {
  ...EAR_QUIZ_DEFAULTS,
  id: "ear_progression_basics",
  title: "Progression Builder — 3 Chords",
  description:
    "Hear a three-chord progression and build it back from Roman-numeral tiles.",
  whyItMatters:
    "Hearing chords as degrees rather than letters is what makes a song transposable. Once you catch I–IV–V by ear, you can play along in any key without knowing the chart.",
  difficulty: "medium",
  timeInMinutes: 2,
  instructions: [
    "Press Play — three chords go past in the key shown above the tiles.",
    "Tap the degree tiles in order to fill the slots, then press Check. Tap a filled slot to clear it.",
    "'Hear the I chord' replays the tonic whenever you lose your bearings.",
  ],
  tips: [
    "Find the home chord first — the one that feels like an ending. That is I.",
    "IV feels like stepping away from home; V feels like being pulled back to it.",
    "vi is the sad one, and it shares two notes with I, so it can sneak past you.",
  ],
  relatedSkills: ["ear_training", "harmony-ear", "harmony"],
  earQuizConfig: {
    mode: "progression",
    progressions: ["I-IV-V", "I-V-IV", "I-vi-IV", "vi-IV-I", "ii-V-I"],
    degreePool: ["I", "ii", "IV", "V", "vi"],
  },
};

export const earProgressionAdvancedExercise: Exercise = {
  ...EAR_QUIZ_DEFAULTS,
  id: "ear_progression_advanced",
  title: "Progression Builder — 4 Chords",
  description:
    "Four-chord pop and jazz turnarounds — I–V–vi–IV and the rest — rebuilt degree by degree.",
  whyItMatters:
    "Four-bar loops are the backbone of most songs written in the last sixty years. Recognising them instantly turns 'learning a song' into 'confirming what you already heard'.",
  difficulty: "hard",
  timeInMinutes: 2,
  instructions: [
    "Press Play — four chords go past in the key shown above the tiles.",
    "Build the progression from the tiles, then press Check.",
    "The mediant (iii) is in play here, and it hides easily between I and V.",
  ],
  tips: [
    "Track the bass line — its shape usually gives the degrees away before the chords do.",
    "I–V–vi–IV and vi–IV–I–V are the same four chords rotated; find the tonic to tell them apart.",
    "ii and IV both lead to V — the difference is that ii is minor.",
  ],
  relatedSkills: ["ear_training", "harmony-ear", "harmony"],
  earQuizConfig: {
    mode: "progression",
    progressions: [
      "I-V-vi-IV",
      "I-vi-IV-V",
      "vi-IV-I-V",
      "I-IV-vi-V",
      "I-vi-ii-V",
      "IV-I-V-vi",
      "I-iii-IV-V",
      "iii-vi-ii-V",
      "I-V-vi-iii",
      "vi-V-IV-iii",
    ],
    degreePool: ["I", "ii", "iii", "IV", "V", "vi"],
  },
};

// ── 3. Tuning by ear ─────────────────────────────────────────────────────────

export const earTuningTrainerExercise: Exercise = {
  ...EAR_QUIZ_DEFAULTS,
  id: "ear_tuning_trainer",
  title: "Tune By Ear — Basics",
  description:
    "Two notes, one of them out. Slide it into tune by listening for the beating — the drill behind tuning without a tuner.",
  difficulty: "medium",
  timeInMinutes: 2,
  whyItMatters:
    "A tuner tells you a string is flat; your ears tell you the band is out. Hearing beats between two notes is the skill behind tuning to a piano, checking intonation and bending in tune.",
  instructions: [
    "Press 'Play both notes' — one is the reference, the other starts out of tune.",
    "Drag the slider until the wobble slows down and disappears, then press 'That's in tune'.",
    "No numbers are shown until you answer — this is an ear exercise, not an eye one.",
  ],
  tips: [
    "The wobble (beating) gets slower the closer you are; when it stops, you are there.",
    "Move past the in-tune point on purpose once — hearing the wobble speed up again tells you which side you are on.",
    "On the guitar the same test is the 5th fret against the next open string.",
  ],
  relatedSkills: ["ear_training"],
  disableTuner: true,
  earQuizConfig: {
    mode: "detune",
    toleranceCents: 8,
    minOffsetCents: 14,
    maxOffsetCents: 45,
  },
};

export const earTuningPrecisionExercise: Exercise = {
  ...EAR_QUIZ_DEFAULTS,
  id: "ear_tuning_precision",
  title: "Tune By Ear — Fine",
  description:
    "The same drill with a much tighter window — small errors, slow beats, four cents of tolerance.",
  difficulty: "hard",
  timeInMinutes: 2,
  whyItMatters:
    "The last few cents are where a guitar goes from 'tuned' to 'in tune with itself'. Training that resolution is what makes chords ring instead of shimmer.",
  instructions: [
    "Press 'Play both notes' — the error is small this time, so the beating is slow.",
    "Count the wobble: one beat a second is already only a few cents out.",
    "Slide it to a standstill, then press 'That's in tune'.",
  ],
  tips: [
    "Give each position two or three seconds — slow beats need time to show themselves.",
    "Listen to the volume of the pair, not the pitch: beating is the loudness pulsing.",
    "If you cannot hear any wobble at all, you are probably already inside the window.",
  ],
  relatedSkills: ["ear_training"],
  disableTuner: true,
  earQuizConfig: {
    mode: "detune",
    toleranceCents: 4,
    minOffsetCents: 6,
    maxOffsetCents: 25,
  },
};

// ── 4. Scales & modes ────────────────────────────────────────────────────────

export const earModeBasicsExercise: Exercise = {
  ...EAR_QUIZ_DEFAULTS,
  id: "ear_mode_basics",
  title: "Name That Mode — Three Modes",
  description:
    "A scale plays over its own tonic drone. Tell natural minor from Dorian — the single most useful ear test a guitarist can pass.",
  difficulty: "medium",
  timeInMinutes: 2,
  whyItMatters:
    "Dorian and Aeolian are the same seven notes seen from a different tonic, so the only way to tell them apart is by ear. Getting it right is what stops you playing sad minor licks over a funk groove.",
  instructions: [
    "Press Play — the scale runs up over a held root and 5th.",
    "Decide whether it is major, natural minor or Dorian, then pick your answer.",
    "'Play it slowly' gives you more time on each degree.",
  ],
  tips: [
    "The 3rd tells you the family: bright is major, flat is minor.",
    "Inside minor, it is the 6th that decides: natural 6th is Dorian, flat 6th is Aeolian.",
    "Sing the drone while the scale runs — the odd degree jumps out immediately.",
  ],
  relatedSkills: ["ear_training", "scales", "music_theory"],
  earQuizConfig: { mode: "scaleMode", scales: ["ionian", "aeolian", "dorian"] },
};

export const earModeAdvancedExercise: Exercise = {
  ...EAR_QUIZ_DEFAULTS,
  id: "ear_mode_advanced",
  title: "Name That Mode — All Six",
  description:
    "All six common modes over a drone: Ionian, Lydian, Mixolydian, Dorian, Aeolian and Phrygian.",
  difficulty: "hard",
  timeInMinutes: 2,
  whyItMatters:
    "Modes are how experienced players describe the colour of a riff in one word. Hearing them lets you pick the right scale over a vamp on the first pass instead of the third.",
  instructions: [
    "Press Play — the scale runs up over a held root and 5th.",
    "Sort it by family first (major or minor 3rd), then hunt for the one altered degree.",
    "Answer, then read the tell that separates it from its neighbour.",
  ],
  tips: [
    "Major family: natural 4 and 7 is Ionian, #4 is Lydian, ♭7 is Mixolydian.",
    "Minor family: natural 6 is Dorian, ♭6 is Aeolian, ♭2 is Phrygian.",
    "The altered degree usually sticks out on the way up — catch it the first time through.",
  ],
  relatedSkills: ["ear_training", "scales", "music_theory"],
  earQuizConfig: {
    mode: "scaleMode",
    scales: ["ionian", "lydian", "mixolydian", "dorian", "aeolian", "phrygian"],
  },
};

export const earQuizExercises: Exercise[] = [
  earChordQualityBasicsExercise,
  earChordQualityAdvancedExercise,
  earProgressionBasicsExercise,
  earProgressionAdvancedExercise,
  earTuningTrainerExercise,
  earTuningPrecisionExercise,
  earModeBasicsExercise,
  earModeAdvancedExercise,
];
