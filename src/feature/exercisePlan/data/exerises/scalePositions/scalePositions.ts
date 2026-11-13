import {
  bar,
  beat,
  note,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type {
  Exercise,
  TablatureBeat,
} from "feature/exercisePlan/types/exercise.types";

type Position = [string: number, fret: number];

const run = (positions: Position[], duration: number): TablatureBeat[] =>
  positions.map(([string, fret]) => beat(duration, note(string, fret)));

const hold = ([string, fret]: Position, duration: number) =>
  beat(duration, note(string, fret));

// ── C major, open position ───────────────────────────────────────────────────

const C_MAJOR_OPEN: Position[] = [
  [5, 3], [4, 0], [4, 2], [4, 3],
  [3, 0], [3, 2], [2, 0], [2, 1],
];
const C_MAJOR_DOWN = [...C_MAJOR_OPEN].reverse();

export const majorScaleOpenPositionExercise: Exercise = {
  id: "major_scale_open_position_c",
  addedAt: "2026-11-13",
  title: "Major Scale — Open Position C",
  description:
    "The C major scale in the first three frets, one octave up and down, one note per click.",
  whyItMatters:
    "This is the do-re-mi scale, played where the guitar is easiest to reach. It is the reference every other scale and chord is measured against, and the first step from playing shapes to playing notes you can name.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Use one finger per fret: index on fret 1, middle on fret 2, ring on fret 3.",
    "Start on C — the A string, fret 3 — and play one note per click up to the next C.",
    "Bars 3–4: come back down the same way.",
    "Say the note names as you play: C, D, E, F, G, A, B, C.",
  ],
  tips: [
    "Alternate the pick — down, up, down, up — even at this slow speed.",
    "Let open strings ring only for their own beat; touch them lightly with a spare finger to stop them.",
    "Sing along. Hearing the scale in your head is the point of learning it.",
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["scales", "music_theory"],
  tablature: [
    bar(run(C_MAJOR_OPEN.slice(0, 4), 1)),
    bar(run(C_MAJOR_OPEN.slice(4), 1)),
    bar(run(C_MAJOR_DOWN.slice(0, 4), 1)),
    bar(run(C_MAJOR_DOWN.slice(4), 1)),
  ],
};

// ── A natural minor, fifth position ──────────────────────────────────────────

/** Two octaves, low A to high A. */
const A_MINOR: Position[] = [
  [6, 5], [6, 7], [6, 8],
  [5, 5], [5, 7], [5, 8],
  [4, 5], [4, 7],
  [3, 4], [3, 5], [3, 7],
  [2, 5], [2, 6], [2, 8],
  [1, 5],
];
const A_MINOR_DOWN = [...A_MINOR].reverse();

export const naturalMinorPositionExercise: Exercise = {
  id: "minor_scale_a_natural_minor",
  addedAt: "2026-11-13",
  title: "Minor Scale — A Natural Minor",
  description:
    "A natural minor across two octaves in fifth position: the minor pentatonic box with its two missing notes filled in.",
  whyItMatters:
    "The natural minor scale is the minor pentatonic plus two notes — and those two notes are where minor melodies get their sadness. Learning it on top of the box you already know turns five safe notes into seven expressive ones.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Stay in fifth position with one finger per fret; reach back with the index for fret 4 on the G string.",
    "Bars 1–2: climb from the low A to the high A in eighth notes.",
    "Bars 3–4: come back down and hold the low A.",
    "Notice the notes that are not in the pentatonic box: fret 7 on the low E and fret 8 on the A string, and their octaves.",
  ],
  tips: [
    "Use alternate picking throughout.",
    "The half steps — frets 7 to 8 — are the heart of the minor sound. Lean on them.",
    "Afterwards, improvise with the pentatonic and add just one of the new notes at a time.",
  ],
  metronomeSpeed: { min: 40, max: 150, recommended: 70 },
  relatedSkills: ["scales", "alternate_picking", "music_theory"],
  tablature: [
    bar(run(A_MINOR.slice(0, 8), 0.5)),
    bar([...run(A_MINOR.slice(8, 14), 0.5), hold(A_MINOR[14], 1)]),
    bar(run(A_MINOR_DOWN.slice(0, 8), 0.5)),
    bar([...run(A_MINOR_DOWN.slice(8, 14), 0.5), hold(A_MINOR_DOWN[14], 1)]),
  ],
};

// ── A blues scale, box 1 ─────────────────────────────────────────────────────

const A_BLUES: Position[] = [
  [6, 5], [6, 8],
  [5, 5], [5, 6], [5, 7],
  [4, 5], [4, 7],
  [3, 5], [3, 7], [3, 8],
  [2, 5], [2, 8],
  [1, 5], [1, 8],
];
const A_BLUES_DOWN = [...A_BLUES].reverse().slice(1);

export const bluesScaleBoxExercise: Exercise = {
  id: "blues_scale_box_1",
  addedAt: "2026-11-13",
  title: "Blues Scale — Box 1 with the Blue Note",
  description:
    "The A minor pentatonic box with the blue note added — fret 6 on the A string and fret 8 on the G string.",
  whyItMatters:
    "One extra note turns the minor pentatonic into the blues scale. The blue note is tense on its own and never a place to stop, but passing through it is the most recognisable sound in blues and rock soloing.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Play box 1 of the A minor pentatonic as usual, index finger on fret 5.",
    "Add the blue note with your middle finger on the A string (fret 6) and your pinky on the G string (fret 8).",
    "Bars 1–2: up to the top and hold. Bars 3–4: back down to the low A.",
    "Pass through the blue note — never rest on it.",
  ],
  tips: [
    "Alternate picking, even through the three-note strings.",
    "Try sliding into the blue note or out of it instead of fretting it squarely.",
    "After the run, make up a short phrase that touches the blue note once.",
  ],
  metronomeSpeed: { min: 40, max: 150, recommended: 70 },
  relatedSkills: ["scales", "phrasing"],
  tablature: [
    bar(run(A_BLUES.slice(0, 8), 0.5)),
    bar([...run(A_BLUES.slice(8, 13), 0.5), hold(A_BLUES[13], 1.5)]),
    bar(run(A_BLUES_DOWN.slice(0, 8), 0.5)),
    bar([...run(A_BLUES_DOWN.slice(8, 12), 0.5), hold(A_BLUES_DOWN[12], 2)]),
  ],
};

// ── G major pentatonic ───────────────────────────────────────────────────────

const G_MAJOR_PENTATONIC: Position[] = [
  [6, 3], [6, 5],
  [5, 2], [5, 5],
  [4, 2], [4, 5],
  [3, 2], [3, 4],
  [2, 3], [2, 5],
  [1, 3], [1, 5],
];
const G_PENTATONIC_DOWN = [...G_MAJOR_PENTATONIC].reverse();

export const majorPentatonicBoxExercise: Exercise = {
  id: "major_pentatonic_g_box",
  addedAt: "2026-11-13",
  title: "Major Pentatonic — G Major Box",
  description:
    "The G major pentatonic in second position — five bright notes, two per string, from the low G up and back.",
  whyItMatters:
    "The major pentatonic is the sweet, open sound of country, southern rock and classic pop solos. It uses the same shapes as the minor pentatonic with a different home note, so learning to hear G as the centre is the whole lesson.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Start with your middle finger on the low G — the low E string, fret 3.",
    "Two notes per string: frets 2 and 5 on most strings, with the G and B strings shifted.",
    "Bars 1–2: up to the top and rest on the high G. Bars 3–4: back down to the low G.",
    "Begin and end on G every time so your ear learns it as home.",
  ],
  tips: [
    "This is the E minor pentatonic box with a different root — play it over a G chord to hear the difference.",
    "Alternate picking, one down and one up per string.",
    "Try bending the A on the G string (fret 2) up a whole step: that bend is the country sound.",
  ],
  metronomeSpeed: { min: 40, max: 150, recommended: 70 },
  relatedSkills: ["scales", "music_theory"],
  tablature: [
    bar(run(G_MAJOR_PENTATONIC.slice(0, 8), 0.5)),
    bar([...run(G_MAJOR_PENTATONIC.slice(8), 0.5), hold([1, 3], 2)]),
    bar(run(G_PENTATONIC_DOWN.slice(0, 8), 0.5)),
    bar([...run(G_PENTATONIC_DOWN.slice(8), 0.5), hold([6, 3], 2)]),
  ],
};

// ── Seventh-chord arpeggios ──────────────────────────────────────────────────

/** Root, third, fifth, seventh, octave — and back down to the third. */
const upAndBack = (name: string, tones: Position[]) => {
  const [root, third, fifth, seventh, octave] = tones;
  const order = [root, third, fifth, seventh, octave, seventh, fifth, third];
  return bar(
    order.map(([string, fret], i) =>
      beat(0.5, note(string, fret), i === 0 ? { chordName: name } : {}),
    ),
  );
};

export const seventhChordArpeggiosExercise: Exercise = {
  id: "arpeggios_seventh_chords_c",
  addedAt: "2026-11-13",
  title: "Arpeggios — Seventh Chords in C",
  description:
    "One-octave seventh-chord arpeggios through the progression Cmaj7 – Am7 – Dm7 – G7, up to the octave and back.",
  whyItMatters:
    "Arpeggios are chords played as melody: the notes that always sound right over the harmony. Running them through a real progression, rather than one chord at a time, is how soloists learn to follow the changes instead of noodling over them.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 2,
  instructions: [
    "Each bar is one chord: root, third, fifth, seventh, octave, then back down.",
    "Bar 1: Cmaj7 from the A string. Bar 2: Am7 from the low E string. Bar 3: Dm7. Bar 4: G7.",
    "Use alternate picking and keep the eighth notes even across the string changes.",
    "Say the chord name on beat one of each bar.",
  ],
  tips: [
    "Compare the shapes: major seventh, minor seventh and dominant seventh differ by one or two notes.",
    "Let the notes be separate — lift each finger as the next one lands, so it does not ring like a chord.",
    "Record the four chords and improvise using only the arpeggio notes of whichever chord is playing.",
  ],
  metronomeSpeed: { min: 40, max: 140, recommended: 70 },
  relatedSkills: ["harmony", "music_theory", "scales"],
  tablature: [
    upAndBack("Cmaj7", [[5, 3], [4, 2], [4, 5], [3, 4], [3, 5]]),
    upAndBack("Am7", [[6, 5], [5, 3], [5, 7], [4, 5], [4, 7]]),
    upAndBack("Dm7", [[5, 5], [4, 3], [4, 7], [3, 5], [3, 7]]),
    upAndBack("G7", [[6, 3], [5, 2], [5, 5], [4, 3], [4, 5]]),
  ],
};
