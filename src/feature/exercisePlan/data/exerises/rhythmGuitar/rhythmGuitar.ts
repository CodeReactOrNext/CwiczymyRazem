import {
  bar,
  beat,
  note,
  powerChord,
  rest,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type {
  Exercise,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

// ── Power chords with silences ───────────────────────────────────────────────

const G5 = powerChord(6, 3, 3);
const A5 = powerChord(6, 5, 3);
const C5 = powerChord(5, 3, 3);
const D5 = powerChord(5, 5, 3);

const hit = (chord: TablatureNote[], duration: number, name?: string) =>
  beat(duration, chord, name ? { chordName: name } : {});

export const powerChordStopsExercise: Exercise = {
  id: "power_chord_stops_and_rests",
  addedAt: "2026-11-13",
  title: "Power Chords — Stops and Rests",
  description:
    "Power chord riffs with written silences: hit the chord, then kill it completely until the next one.",
  whyItMatters:
    "A riff is as much about the gaps as the chords. Stopping a distorted power chord dead — no ringing strings, no hum — is what makes rhythm parts sound tight, and it takes both hands working together.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Play each chord for exactly its written length, then mute it for the whole rest.",
    "To stop a chord, relax the fretting fingers so they still touch the strings, and drop the picking-hand palm onto the bridge at the same moment.",
    "Bar 1: chord, silence, chord, silence. Bars 2–4: shorter chords and shorter gaps.",
    "Count the rests out loud at first — they are part of the riff.",
  ],
  tips: [
    "Silence should be instant. If you hear the chord fade instead of stop, mute harder with the palm.",
    "Do not lift the fretting hand off the strings; open strings will ring.",
    "Turn the gain up while you practise this — it makes every leftover noise obvious.",
  ],
  metronomeSpeed: { min: 50, max: 160, recommended: 80 },
  relatedSkills: ["rhythm", "articulation", "chords"],
  tablature: [
    bar([hit(G5, 1, "G5"), rest(1), hit(G5, 1), rest(1)]),
    bar([
      hit(G5, 0.5, "G5"), hit(G5, 0.5), rest(1),
      hit(A5, 0.5, "A5"), hit(A5, 0.5), rest(1),
    ]),
    bar([
      hit(C5, 1, "C5"), rest(0.5), hit(C5, 0.5),
      hit(D5, 1, "D5"), rest(1),
    ]),
    bar([
      hit(G5, 0.5, "G5"), rest(0.5), hit(G5, 0.5), rest(0.5),
      hit(C5, 0.5, "C5"), hit(D5, 0.5, "D5"), hit(G5, 1, "G5"),
    ]),
  ],
};

// ── Sixteenth-note palm muting ───────────────────────────────────────────────

const SIXTEENTH = 0.25;
const chug = (fret = 0) => beat(SIXTEENTH, note(6, fret, { isPalmMute: true }));
const open = () => beat(SIXTEENTH, note(6, 0));
const times = <T,>(count: number, make: () => T): T[] =>
  Array.from({ length: count }, make);

export const palmMuteSixteenthChugExercise: Exercise = {
  id: "palm_mute_sixteenth_chug",
  addedAt: "2026-11-13",
  title: "Palm Muting — Sixteenth Chug",
  description:
    "Palm-muted sixteenth notes with alternate picking on the low E string, with single notes opened up and a moving bass line.",
  whyItMatters:
    "Sixteenth-note chugging is the engine of thrash and modern metal rhythm playing. At this speed downstrokes run out, so the mute has to survive alternate picking — and upstrokes are exactly where the palm tends to lift.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Use strict alternate picking: down-up-down-up, four notes per beat.",
    "Bar 1: everything muted. Bar 2: the first note of each beat rings open. Bar 3: the third note rings open.",
    "Bar 4: keep the chug going while the fretting hand moves to frets 3 and 5.",
    "Keep the palm planted on the bridge through the upstrokes.",
  ],
  tips: [
    "Make the upstrokes as loud as the downstrokes — record yourself to check.",
    "Move the pick from the wrist with the smallest motion that still sounds the string.",
    "Tension in the forearm means the tempo is too high. Drop it and build back up.",
  ],
  metronomeSpeed: { min: 40, max: 140, recommended: 70 },
  relatedSkills: ["rhythm", "alternate_picking", "articulation"],
  tablature: [
    bar(times(16, chug)),
    bar(times(4, () => [open(), chug(), chug(), chug()]).flat()),
    bar(times(4, () => [chug(), chug(), open(), chug()]).flat()),
    bar([
      ...times(8, chug),
      ...times(4, () => chug(3)),
      ...times(4, () => chug(5)),
    ]),
  ],
};

// ── Off-beat chord chops ─────────────────────────────────────────────────────

const triad = (g: number, b: number, e: number): TablatureNote[] =>
  [note(3, g), note(2, b), note(1, e)].map((n) => ({ ...n, isStaccato: true }));

const A_MINOR = triad(5, 5, 5);
const D_MINOR = triad(7, 6, 5);
const F_MAJOR = triad(5, 6, 5);
const G_MAJOR = triad(7, 8, 7);

/** Silence on every beat, a short chord on every "and". */
const chops = (chord: TablatureNote[], name: string) =>
  bar(
    times(4, () => [rest(0.5), beat(0.5, chord)]).flat().map((b, i) =>
      i === 1 ? { ...b, chordName: name } : b,
    ),
  );

export const offBeatChopsExercise: Exercise = {
  id: "rhythm_off_beat_chops",
  addedAt: "2026-11-13",
  title: "Rhythm — Off-Beat Chops",
  description:
    "Short three-string chords placed only on the off-beats, with silence on every click — the reggae and ska rhythm guitar part.",
  whyItMatters:
    "Playing only between the beats is the quickest test of your internal clock: there is no click under your note to lean on. It is the core of reggae and ska guitar, and it makes every other syncopated rhythm easier to feel.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Stay silent on the click. Play a short upstroke exactly halfway to the next one.",
    "Use the small triad shapes on the top three strings: A minor, D minor, G, then F.",
    "Cut every chord short by releasing the finger pressure right after the strum.",
    "Keep the strumming hand moving down on the beat without touching the strings.",
  ],
  tips: [
    "Count '1 and 2 and' out loud and play only on the 'and'.",
    "The silent downstroke is what keeps you in time — do not freeze the hand between chops.",
    "If the chops drift onto the beat, slow down until the gap feels wide.",
  ],
  metronomeSpeed: { min: 50, max: 150, recommended: 80 },
  relatedSkills: ["rhythm", "chords"],
  tablature: [
    chops(A_MINOR, "Am"),
    chops(D_MINOR, "Dm"),
    chops(G_MAJOR, "G"),
    chops(F_MAJOR, "F"),
  ],
};
