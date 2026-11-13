import {
  bar,
  beat,
  note,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Bass tabs number their strings 1 (G) to 4 (E).
const G_STRING = 1;
const D_STRING = 2;
const A_STRING = 3;
const E_STRING = 4;

type Position = [string: number, fret: number];

const quarters = (positions: Position[], chordName?: string) =>
  positions.map(([string, fret], i) =>
    beat(1, note(string, fret), i === 0 && chordName ? { chordName } : {}),
  );

export const bassRootAndFifthExercise: Exercise = {
  id: "bass_root_and_fifth",
  addedAt: "2026-11-13",
  instrument: "bass",
  title: "Bass — Root and Fifth",
  description:
    "The most used bass line there is: the root of each chord followed by its fifth, over C, F and G.",
  whyItMatters:
    "Root and fifth is the foundation of bass playing in country, rock, pop and Latin music. The fifth always sits in the same place — one string up, two frets higher — so one shape lets you follow any chord chart.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Play the root with your index finger and the fifth with your ring or pinky: one string higher, two frets up.",
    "One note per beat, alternating index and middle finger on the plucking hand.",
    "Bar 1: C. Bar 2: F. Bar 3: G. Bar 4: back to C, holding the last note.",
    "Stop each note just as the next one starts, so they do not overlap.",
  ],
  tips: [
    "Rest the plucking thumb on the pickup or the low E string to keep the hand steady.",
    "Mute the string you just left with the plucking finger that follows through onto it.",
    "Listen to the length of every note — on bass, where a note ends matters as much as where it starts.",
  ],
  metronomeSpeed: { min: 40, max: 140, recommended: 70 },
  relatedSkills: ["rhythm", "harmony"],
  tablature: [
    bar(quarters([[A_STRING, 3], [D_STRING, 5], [A_STRING, 3], [D_STRING, 5]], "C")),
    bar(quarters([[E_STRING, 1], [A_STRING, 3], [E_STRING, 1], [A_STRING, 3]], "F")),
    bar(quarters([[E_STRING, 3], [A_STRING, 5], [E_STRING, 3], [A_STRING, 5]], "G")),
    bar([
      ...quarters([[A_STRING, 3], [D_STRING, 5]], "C"),
      beat(2, note(A_STRING, 3)),
    ]),
  ],
};

const eighths = (string: number, fret: number, chordName: string) =>
  bar(
    Array.from({ length: 8 }, (_, i) =>
      beat(0.5, note(string, fret), i === 0 ? { chordName } : {}),
    ),
  );

export const bassEighthNoteDriveExercise: Exercise = {
  id: "bass_eighth_note_drive",
  addedAt: "2026-11-13",
  instrument: "bass",
  title: "Bass — Eighth-Note Drive",
  description:
    "Steady eighth notes on the root of each chord — A minor, F, C, G — with nothing to hide behind but your timing.",
  whyItMatters:
    "Pumping eighth notes on the root is the bass line of most rock and pop songs. It sounds simple and exposes everything: uneven volume between two fingers, notes that rush, changes that arrive late. Getting it even is what makes a band sound tight.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Eight notes per bar, strictly alternating index and middle finger.",
    "Every note the same volume and the same length.",
    "Change to the next root exactly on beat one — no gap and no early move.",
    "Loop the four bars until the changes stop being audible as an effort.",
  ],
  tips: [
    "Record a few bars and listen back: the weaker plucking finger is usually obvious.",
    "Pluck across the string into the next one rather than pulling upwards.",
    "For a tighter sound, play with a pick and all downstrokes.",
  ],
  metronomeSpeed: { min: 50, max: 160, recommended: 90 },
  relatedSkills: ["rhythm"],
  tablature: [
    eighths(E_STRING, 5, "Am"),
    eighths(E_STRING, 1, "F"),
    eighths(A_STRING, 3, "C"),
    eighths(E_STRING, 3, "G"),
  ],
};

export const bassWalkingLineExercise: Exercise = {
  id: "bass_walking_line_g",
  addedAt: "2026-11-13",
  instrument: "bass",
  title: "Bass — Walking Line in G",
  description:
    "A four-bar walking bass line over G, C and D: chord tones on the strong beats and a passing note leading into each change.",
  whyItMatters:
    "A walking line connects chords instead of just naming them. The recipe is small — root on beat one, chord tones in the middle, a note one fret away from the next root on beat four — and it is the basis of blues, jazz and rockabilly bass.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "One note per beat, each held for its full length so the line sounds connected.",
    "Beat one of every bar is the root of the chord: G, C, D, G.",
    "Beats two and three outline the chord with its third and fifth.",
    "Beat four is the approach note — notice how it sits right next to the root that follows.",
  ],
  tips: [
    "Stay in one position: index finger on fret 2, one finger per fret.",
    "Sing the root of the next chord before you reach it; the approach note should feel like it is pulling there.",
    "When it is fluent, change the notes on beats two and three and keep the roots and approaches.",
  ],
  metronomeSpeed: { min: 50, max: 160, recommended: 80 },
  relatedSkills: ["rhythm", "harmony", "music_theory"],
  tablature: [
    bar(quarters([[E_STRING, 3], [A_STRING, 2], [A_STRING, 5], [A_STRING, 2]], "G")),
    bar(quarters([[A_STRING, 3], [D_STRING, 2], [D_STRING, 5], [A_STRING, 4]], "C")),
    bar(quarters([[A_STRING, 5], [D_STRING, 4], [G_STRING, 2], [E_STRING, 2]], "D")),
    bar(quarters([[E_STRING, 3], [A_STRING, 2], [A_STRING, 5], [E_STRING, 2]], "G")),
  ],
};

/** Root and its octave — two strings higher, two frets up — in eighth notes. */
const octaveBar = (rootString: number, fret: number, chordName: string) =>
  bar(
    Array.from({ length: 8 }, (_, i) =>
      beat(
        0.5,
        i % 2 === 0 ? note(rootString, fret) : note(rootString - 2, fret + 2),
        i === 0 ? { chordName } : {},
      ),
    ),
  );

export const bassOctaveGrooveExercise: Exercise = {
  id: "bass_octave_groove",
  addedAt: "2026-11-13",
  instrument: "bass",
  title: "Bass — Octave Groove",
  description:
    "Bounce between each root and its octave in eighth notes — the disco and dance-rock bass line — over A minor, F, C and G.",
  whyItMatters:
    "The octave shape is the second thing every bassist learns after the root. It adds motion without adding any new harmony, and jumping two strings in time is the best string-crossing workout the plucking hand can get.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Index finger on the root, pinky on the octave: two strings higher and two frets up.",
    "Alternate low and high in even eighth notes, plucking the low note with the index and the high note with the middle finger.",
    "Keep the low note short so it is silent while the octave sounds.",
    "Move the whole shape to the next root on beat one of each bar.",
  ],
  tips: [
    "Mute the low string with the fretting finger the moment you leave it.",
    "Make the high note a little shorter and punchier than the low one for the classic bounce.",
    "With a pick: down on the root, up on the octave.",
  ],
  metronomeSpeed: { min: 50, max: 150, recommended: 90 },
  relatedSkills: ["rhythm", "string_skipping"],
  tablature: [
    octaveBar(E_STRING, 5, "Am"),
    octaveBar(E_STRING, 1, "F"),
    octaveBar(A_STRING, 3, "C"),
    octaveBar(E_STRING, 3, "G"),
  ],
};

const G_MAJOR_SCALE: Position[] = [
  [E_STRING, 3], [E_STRING, 5],
  [A_STRING, 2], [A_STRING, 3], [A_STRING, 5],
  [D_STRING, 2], [D_STRING, 4], [D_STRING, 5],
];
const G_MAJOR_SCALE_DOWN = [...G_MAJOR_SCALE].reverse();

export const bassMajorScaleExercise: Exercise = {
  id: "bass_major_scale_one_octave",
  addedAt: "2026-11-13",
  instrument: "bass",
  title: "Bass — Major Scale, One Octave",
  description:
    "The G major scale across three strings in one position, one note per click, up and back down.",
  whyItMatters:
    "This one fingering is movable: start it on any note and you have that major scale. It is the map bass lines are drawn on — the root, third and fifth you use every day are notes one, three and five of this shape.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Start with your middle finger on G — the E string, fret 3 — and keep one finger per fret.",
    "Play one note per click, alternating index and middle finger on the plucking hand.",
    "Bars 1–2 go up to the high G; bars 3–4 come back down.",
    "Name the notes as you go: G, A, B, C, D, E, F sharp, G.",
  ],
  tips: [
    "Keep the fretting fingers hovering over their frets instead of flying away after each note.",
    "Let each note last until the next one starts — no gaps and no overlaps.",
    "Once it is easy here, move the whole shape up two frets and play A major.",
  ],
  metronomeSpeed: { min: 40, max: 140, recommended: 70 },
  relatedSkills: ["scales", "music_theory"],
  tablature: [
    bar(quarters(G_MAJOR_SCALE.slice(0, 4))),
    bar(quarters(G_MAJOR_SCALE.slice(4))),
    bar(quarters(G_MAJOR_SCALE_DOWN.slice(0, 4))),
    bar(quarters(G_MAJOR_SCALE_DOWN.slice(4))),
  ],
};

/** Root, third, fifth, sixth — the boogie walk — from a root on `rootString`. */
const boogieWalk = (rootString: number, fret: number, chordName: string) =>
  bar(
    quarters(
      [
        [rootString, fret],
        [rootString - 1, fret - 1],
        [rootString - 1, fret + 2],
        [rootString - 2, fret - 1],
      ],
      chordName,
    ),
  );

const BLUES_WALK = {
  A: () => boogieWalk(E_STRING, 5, "A"),
  D: () => boogieWalk(A_STRING, 5, "D"),
  E: () => boogieWalk(A_STRING, 7, "E"),
};

export const bassBluesWalkExercise: Exercise = {
  id: "bass_blues_walk_12_bar",
  addedAt: "2026-11-13",
  instrument: "bass",
  title: "Bass — 12-Bar Blues Walk in A",
  description:
    "The full twelve-bar blues in A with the classic boogie walk — root, third, fifth, sixth — on every chord.",
  whyItMatters:
    "Root-third-fifth-sixth is the bass line of rock and roll and jump blues, and it is one shape that moves unchanged to each chord. Playing it through all twelve bars teaches the blues form from the bottom up, where the band actually hears it.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 2,
  instructions: [
    "Middle finger on the root, index on the third (next string, one fret back), pinky on the fifth, index on the sixth (two strings up).",
    "One note per beat, each held for its full length.",
    "Four bars of A, two of D, two of A, then E, D, A and E to turn around.",
    "Move the same shape to each new root — nothing changes but the starting fret and string.",
  ],
  tips: [
    "Count the bars in three lines of four so you always know where the next change is.",
    "Lean slightly into beat one of every bar to mark the root for the band.",
    "Try it with a shuffle feel: play each note twice, long–short.",
  ],
  metronomeSpeed: { min: 50, max: 160, recommended: 90 },
  relatedSkills: ["rhythm", "harmony"],
  tablature: (
    ["A", "A", "A", "A", "D", "D", "A", "A", "E", "D", "A", "E"] as const
  ).map((chord) => BLUES_WALK[chord]()),
};
