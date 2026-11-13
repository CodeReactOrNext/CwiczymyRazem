import {
  bar,
  beat,
  note,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type {
  Exercise,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

const ADDED = "2026-11-13";

/** A triad heard two ways: its notes one by one, low to high, then together. */
const spelledOut = (name: string, triad: TablatureNote[]) =>
  bar([
    ...triad.map((n, i) =>
      beat(1, { ...n, isLetRing: true }, i === 0 ? { chordName: name } : {}),
    ),
    beat(1, triad),
  ]);

// ── Harmony ──────────────────────────────────────────────────────────────────

const C_TRIAD = [note(5, 3), note(4, 2), note(3, 0)];
const F_TRIAD = [note(4, 3), note(3, 2), note(2, 1)];
const G_TRIAD = [note(6, 3), note(5, 2), note(4, 0)];

export const harmonyRootThirdFifthExercise: Exercise = {
  id: "harmony_root_third_fifth",
  addedAt: ADDED,
  title: "Harmony — Root, Third, Fifth",
  description:
    "Take the chords C, F and G apart: play the three notes each one is made of, then all three together.",
  whyItMatters:
    "Every major and minor chord is just three notes — a root, a third and a fifth. Hearing them one at a time and then as a chord is the moment chords stop being finger shapes and start being something you understand.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1.5,
  instructions: [
    "Each bar is one chord. Beats 1–3: play its three notes one by one, lowest first, and let them ring.",
    "Beat 4: play the same three notes together.",
    "Say 'root, third, fifth' as you play the single notes.",
    "Bar 1: C. Bar 2: F. Bar 3: G. Bar 4: back to C.",
  ],
  tips: [
    "The root gives the chord its name — it is the note C in a C chord.",
    "Sing each note before you play the chord, then listen for it inside the chord.",
    "These three shapes are small pieces of the full open chords you may already know.",
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 60 },
  relatedSkills: ["harmony", "chords", "music_theory"],
  tablature: [
    spelledOut("C", C_TRIAD),
    spelledOut("F", F_TRIAD),
    spelledOut("G", G_TRIAD),
    spelledOut("C", C_TRIAD),
  ],
};

const A_MAJOR = [note(3, 2), note(2, 2), note(1, 0)];
const A_MINOR = [note(3, 2), note(2, 1), note(1, 0)];
const E_MAJOR = [note(3, 1), note(2, 0), note(1, 0)];
const E_MINOR = [note(3, 0), note(2, 0), note(1, 0)];

export const harmonyMajorVsMinorExercise: Exercise = {
  id: "harmony_major_vs_minor",
  addedAt: ADDED,
  title: "Harmony — Major vs Minor",
  description:
    "A next to A minor, E next to E minor, on the top three strings. One note moves by one fret, and the whole mood changes.",
  whyItMatters:
    "The difference between a major and a minor chord is a single note — the third — moved down one fret. Seeing and hearing that with your own hands explains more about harmony than any chart.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1.5,
  instructions: [
    "Each bar: three single notes, low to high, then the chord.",
    "Bar 1 is A major, bar 2 is A minor. Only the note on the B string changes — from fret 2 to fret 1.",
    "Bar 3 is E major, bar 4 is E minor. This time the note on the G string drops from fret 1 to open.",
    "Describe the change in your own words: brighter, darker, happier, sadder.",
  ],
  tips: [
    "The note that moves is the third. The other two notes are identical in both chords.",
    "Play the two versions back and forth without the click until you can hear the change with your eyes closed.",
    "Try the same test on any chord you know: find its third and lower it one fret.",
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 60 },
  relatedSkills: ["harmony", "chords", "ear_training"],
  tablature: [
    spelledOut("A", A_MAJOR),
    spelledOut("Am", A_MINOR),
    spelledOut("E", E_MAJOR),
    spelledOut("Em", E_MINOR),
  ],
};

// ── Fretboard ────────────────────────────────────────────────────────────────

/** Frets of the natural notes along one string, open string to the 12th fret. */
const naturalsAlong = (string: number, frets: number[]) => {
  const up = frets.map((fret) => beat(1, note(string, fret)));
  const down = [...up].reverse();
  return [bar(up.slice(0, 4)), bar(up.slice(4)), bar(down.slice(0, 4)), bar(down.slice(4))];
};

export const notesOnLowEStringExercise: Exercise = {
  id: "notes_natural_low_e_string",
  addedAt: ADDED,
  title: "Fretboard — Natural Notes on the Low E",
  description:
    "Walk up the low E string through the notes E, F, G, A, B, C, D and E, saying each name, then walk back down.",
  whyItMatters:
    "The low E string is the address book for barre chords and power chords: the note under your index finger names the chord. Knowing these eight notes by heart is the single most useful piece of fretboard knowledge a beginner can have.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1.5,
  instructions: [
    "Play one note per click and say its name out loud: E, F, G, A, B, C, D, E.",
    "The frets are 0, 1, 3, 5, 7, 8, 10 and 12.",
    "Use one finger and slide it from note to note — this is about names, not fingering.",
    "Bars 3–4: come back down, naming the notes in reverse.",
  ],
  tips: [
    "Most notes are two frets apart. Only E–F and B–C are next-door neighbours.",
    "The dots on the neck help: G is on the first dot, A on the second, B on the third.",
    "Fret 12 is E again — the same note as the open string, one octave higher.",
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 50 },
  relatedSkills: ["music_theory"],
  tablature: naturalsAlong(6, [0, 1, 3, 5, 7, 8, 10, 12]),
};

export const notesOnAStringExercise: Exercise = {
  id: "notes_natural_a_string",
  addedAt: ADDED,
  title: "Fretboard — Natural Notes on the A String",
  description:
    "The same walk on the A string: A, B, C, D, E, F, G and A, named out loud on the way up and on the way down.",
  whyItMatters:
    "Half of all barre chords and power chords take their name from the A string. With this string and the low E string memorised, you can find any chord root on the neck.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1.5,
  instructions: [
    "Play one note per click and say its name out loud: A, B, C, D, E, F, G, A.",
    "The frets are 0, 2, 3, 5, 7, 8, 10 and 12.",
    "Use one finger and slide it from note to note.",
    "Bars 3–4: come back down, naming the notes in reverse.",
  ],
  tips: [
    "The neighbours with no fret between them are the same as before: B–C and E–F.",
    "Compare with the low E string: frets 3 and up line up differently, but the pattern of gaps is the same.",
    "Test yourself afterwards: pick a note name at random and find it on both strings.",
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 50 },
  relatedSkills: ["music_theory"],
  tablature: naturalsAlong(5, [0, 2, 3, 5, 7, 8, 10, 12]),
};

// ── Creativity and tone — open practice ──────────────────────────────────────

export const improvThreeNotesExercise: Exercise = {
  id: "improv_three_notes_only",
  addedAt: ADDED,
  title: "Improv — Three Notes Only",
  description:
    "Improvise over a backing track with just three notes. With nothing to choose between, rhythm becomes the whole game.",
  whyItMatters:
    "Beginners freeze when improvising because there are too many notes to pick from. Three notes that all sound good removes the fear of a wrong one and shows that a solo is mostly rhythm and space.",
  requiresBackingTrack: true,
  backingTrackSearchQueries: [
    "A Minor Slow Backing Track",
    "A Minor Easy Blues Backing Track",
    "Am Slow Rock Backing Track",
  ],
  difficulty: "beginner",
  category: "creativity",
  timeInMinutes: 2.5,
  instructions: [
    "Put on a slow backing track in A minor.",
    "Use only these notes: fret 7 on the D string, and frets 5 and 7 on the G string.",
    "Start with one note at a time: play it, leave a gap, play it again with a different rhythm.",
    "Then join two or three notes into short phrases, with silence between them.",
    "When you want a phrase to sound finished, end it on fret 7 of the D string — that is A, the home note.",
  ],
  tips: [
    "A phrase you could sing is a good phrase.",
    "Repeat an idea before moving on. Repetition is what makes it sound deliberate.",
    "Silence counts. Try leaving more space than feels comfortable.",
  ],
  disableMic: true,
  metronomeSpeed: null,
  relatedSkills: ["improvisation", "phrasing"],
};

export const phrasingPlayThenRestExercise: Exercise = {
  id: "phrasing_play_then_rest",
  addedAt: ADDED,
  title: "Phrasing — Play, Then Rest",
  description:
    "Play for one bar, stay silent for one bar. A simple rule that makes anything you play sound like sentences instead of a stream.",
  whyItMatters:
    "Singers have to breathe, so their lines have natural gaps; guitarists do not, and tend to play without stopping. Forcing a bar of silence after every phrase is the quickest way to start sounding musical.",
  difficulty: "beginner",
  category: "creativity",
  timeInMinutes: 2.5,
  instructions: [
    "Set a slow click and count bars of four beats.",
    "Bar 1: play a short idea using a few notes of any scale you know — the E minor pentatonic in open position works well.",
    "Bar 2: play nothing. Mute the strings and keep counting.",
    "Repeat: one bar of playing, one bar of silence, for the whole exercise.",
    "After a while, let the phrase in each playing bar answer the one before it.",
  ],
  tips: [
    "Stop the strings completely during the rest — ringing notes do not count as silence.",
    "Hum the phrase you just played during the empty bar. It helps you decide what comes next.",
    "End phrases at different points in the bar, not always on beat four.",
  ],
  disableMic: true,
  metronomeSpeed: { min: 50, max: 100, recommended: 70 },
  relatedSkills: ["phrasing", "improvisation"],
};

export const compositionFirstRiffExercise: Exercise = {
  id: "composition_first_riff",
  addedAt: ADDED,
  title: "Composition — Your First Riff",
  description:
    "Write a riff of your own from three notes on the low strings: choose the notes, find a rhythm, repeat it until it sticks.",
  whyItMatters:
    "A riff is the smallest complete piece of music a guitarist can write, and making one is within reach from the first weeks. Creating something yourself, however simple, changes how you listen to every riff you learn afterwards.",
  difficulty: "beginner",
  category: "creativity",
  timeInMinutes: 5,
  instructions: [
    "Pick three notes from these: the open low E string, fret 3 and fret 5 on the low E string, the open A string, fret 2 on the A string.",
    "Clap or tap a short rhythm you like — one bar long — before you touch the guitar.",
    "Put your three notes onto that rhythm. Try a few orders and keep the one you prefer.",
    "Play it four times in a row without changing it. A riff only becomes a riff when it repeats.",
    "Record it on your phone and give it a name.",
  ],
  tips: [
    "Starting and ending on the open low E string makes almost anything sound like a riff.",
    "Fewer notes and a stronger rhythm beat many notes and a vague rhythm.",
    "If you are stuck, change one thing only: one note, or where one note falls.",
  ],
  disableMic: true,
  metronomeSpeed: null,
  relatedSkills: ["composition", "rhythm"],
};

export const tonePickPositionExercise: Exercise = {
  id: "tone_where_and_how_you_pick",
  addedAt: ADDED,
  title: "Tone — Where and How You Pick",
  description:
    "Change your sound without touching a knob: pick near the bridge and near the neck, softly and hard, and listen to what each does.",
  whyItMatters:
    "Most of a guitarist's tone comes from the hands, not the gear. Learning early that the same note can be bright or warm, gentle or aggressive, gives you control over your sound on any guitar and any amp.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 2.5,
  instructions: [
    "Play the open G string slowly, over and over.",
    "Pick it right next to the bridge, then halfway, then over the end of the fretboard. Notice bright and thin turning warm and round.",
    "Stay in one spot and pick as softly as you can, then gradually as hard as you can.",
    "Now combine them: soft near the neck, hard near the bridge, and the other way round.",
    "Play a short melody or riff you know twice, with two very different sounds.",
  ],
  tips: [
    "Angle the pick slightly instead of hitting the string flat — the attack gets smoother.",
    "Soft picking with the amp turned up often sounds better than hard picking with it turned down.",
    "Pay attention to which sound you like for which kind of music. That preference is the start of your own tone.",
  ],
  disableMic: true,
  metronomeSpeed: null,
  relatedSkills: ["audio_production", "articulation"],
};
