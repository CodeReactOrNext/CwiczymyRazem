import type { ChordQuality, PitchClass } from "feature/autoBacking/theory";
import { chordSymbol, usesFlats } from "feature/autoBacking/theory";

import type { ChangesMode, HarmonyFamily } from "../types/boss.types";
import { modeSeventh } from "./changesHarmony";
import type { Rng } from "./phaseGenerator";
import { shuffled } from "./phaseGenerator";

/** Where a chord pulls: home, away from it, or back toward it. */
type HarmonicFunction = "tonic" | "predominant" | "dominant";

interface ChangelingDegree {
  /** Roman numeral as players say it. */
  degree: string;
  /** Semitones above the tonic. */
  offset: number;
  quality: ChordQuality;
  function: HarmonicFunction;
  /** How often it turns up, against the others. */
  prior: number;
  /**
   * From outside the key's own chords — borrowed, a secondary dominant, a
   * diminished one: what makes a phase harder now and then.
   */
  color?: boolean;
  /** What it becomes among sevenths where the key's scale doesn't stack it — a borrowed chord's own. */
  seventh?: ChordQuality;
  /** A secondary dominant: the degree it resolves to, played right after it. */
  resolves?: string;
}

/**
 * The chords each mode can deal, its home chord first. The key's own chords
 * come first; after them the colourful ones — borrowed from the parallel key,
 * secondary dominants, diminished.
 */
const VOCABULARY: Readonly<Record<ChangesMode, readonly ChangelingDegree[]>> = {
  ionian: [
    { degree: "I", offset: 0, quality: "maj", function: "tonic", prior: 1 },
    { degree: "vi", offset: 9, quality: "min", function: "tonic", prior: 0.75 },
    { degree: "iii", offset: 4, quality: "min", function: "tonic", prior: 0.4 },
    {
      degree: "IV",
      offset: 5,
      quality: "maj",
      function: "predominant",
      prior: 0.9,
    },
    {
      degree: "ii",
      offset: 2,
      quality: "min",
      function: "predominant",
      prior: 0.7,
    },
    {
      degree: "V",
      offset: 7,
      quality: "maj",
      function: "dominant",
      prior: 0.9,
    },
    {
      degree: "bVII",
      offset: 10,
      quality: "maj",
      function: "predominant",
      prior: 0.6,
      color: true,
      seventh: "7",
    },
    {
      degree: "bVI",
      offset: 8,
      quality: "maj",
      function: "predominant",
      prior: 0.5,
      color: true,
      seventh: "maj7",
    },
    {
      degree: "vii°",
      offset: 11,
      quality: "dim",
      function: "dominant",
      prior: 0.35,
      color: true,
    },
    {
      degree: "III7",
      offset: 4,
      quality: "7",
      function: "dominant",
      prior: 0.6,
      color: true,
      resolves: "vi",
    },
    {
      degree: "II7",
      offset: 2,
      quality: "7",
      function: "dominant",
      prior: 0.55,
      color: true,
      resolves: "V",
    },
    {
      degree: "VI7",
      offset: 9,
      quality: "7",
      function: "dominant",
      prior: 0.5,
      color: true,
      resolves: "ii",
    },
  ],
  aeolian: [
    { degree: "i", offset: 0, quality: "min", function: "tonic", prior: 1 },
    {
      degree: "bIII",
      offset: 3,
      quality: "maj",
      function: "tonic",
      prior: 0.6,
    },
    {
      degree: "bVI",
      offset: 8,
      quality: "maj",
      function: "predominant",
      prior: 0.85,
    },
    {
      degree: "iv",
      offset: 5,
      quality: "min",
      function: "predominant",
      prior: 0.8,
    },
    {
      degree: "bVII",
      offset: 10,
      quality: "maj",
      function: "dominant",
      prior: 0.85,
    },
    {
      degree: "v",
      offset: 7,
      quality: "min",
      function: "dominant",
      prior: 0.5,
    },
    {
      degree: "V",
      offset: 7,
      quality: "maj",
      function: "dominant",
      prior: 0.6,
      color: true,
      seventh: "7",
    },
    {
      degree: "IV",
      offset: 5,
      quality: "maj",
      function: "predominant",
      prior: 0.45,
      color: true,
      seventh: "7",
    },
    {
      degree: "ii°",
      offset: 2,
      quality: "dim",
      function: "predominant",
      prior: 0.35,
      color: true,
    },
    {
      degree: "bIII7",
      offset: 3,
      quality: "7",
      function: "dominant",
      prior: 0.45,
      color: true,
      resolves: "bVI",
    },
  ],
  dorian: [
    { degree: "i", offset: 0, quality: "min", function: "tonic", prior: 1 },
    {
      degree: "bIII",
      offset: 3,
      quality: "maj",
      function: "tonic",
      prior: 0.5,
    },
    {
      degree: "IV",
      offset: 5,
      quality: "maj",
      function: "predominant",
      prior: 0.9,
    },
    {
      degree: "ii",
      offset: 2,
      quality: "min",
      function: "predominant",
      prior: 0.45,
    },
    {
      degree: "bVII",
      offset: 10,
      quality: "maj",
      function: "dominant",
      prior: 0.75,
    },
    {
      degree: "v",
      offset: 7,
      quality: "min",
      function: "dominant",
      prior: 0.45,
    },
    {
      degree: "V",
      offset: 7,
      quality: "maj",
      function: "dominant",
      prior: 0.45,
      color: true,
      seventh: "7",
    },
    {
      degree: "vi°",
      offset: 9,
      quality: "dim",
      function: "predominant",
      prior: 0.3,
      color: true,
    },
  ],
  mixolydian: [
    { degree: "I", offset: 0, quality: "maj", function: "tonic", prior: 1 },
    { degree: "vi", offset: 9, quality: "min", function: "tonic", prior: 0.45 },
    {
      degree: "IV",
      offset: 5,
      quality: "maj",
      function: "predominant",
      prior: 0.85,
    },
    {
      degree: "ii",
      offset: 2,
      quality: "min",
      function: "predominant",
      prior: 0.45,
    },
    {
      degree: "bVII",
      offset: 10,
      quality: "maj",
      function: "dominant",
      prior: 0.9,
    },
    {
      degree: "v",
      offset: 7,
      quality: "min",
      function: "dominant",
      prior: 0.5,
    },
    {
      degree: "V",
      offset: 7,
      quality: "maj",
      function: "dominant",
      prior: 0.5,
      color: true,
      seventh: "7",
    },
    {
      degree: "iii°",
      offset: 4,
      quality: "dim",
      function: "dominant",
      prior: 0.3,
      color: true,
    },
  ],
  harmonicMinor: [
    { degree: "i", offset: 0, quality: "min", function: "tonic", prior: 1 },
    {
      degree: "bVI",
      offset: 8,
      quality: "maj",
      function: "predominant",
      prior: 0.8,
    },
    {
      degree: "iv",
      offset: 5,
      quality: "min",
      function: "predominant",
      prior: 0.85,
    },
    { degree: "V", offset: 7, quality: "maj", function: "dominant", prior: 1 },
    {
      degree: "bIII",
      offset: 3,
      quality: "maj",
      function: "tonic",
      prior: 0.45,
      color: true,
      seventh: "maj7",
    },
    {
      degree: "bVII",
      offset: 10,
      quality: "maj",
      function: "dominant",
      prior: 0.45,
      color: true,
      seventh: "7",
    },
    {
      degree: "ii°",
      offset: 2,
      quality: "dim",
      function: "predominant",
      prior: 0.4,
      color: true,
    },
    {
      degree: "vii°",
      offset: 11,
      quality: "dim",
      function: "dominant",
      prior: 0.4,
      color: true,
    },
  ],
  blues: [
    { degree: "I7", offset: 0, quality: "7", function: "tonic", prior: 1 },
    {
      degree: "IV7",
      offset: 5,
      quality: "7",
      function: "predominant",
      prior: 0.95,
    },
    { degree: "V7", offset: 7, quality: "7", function: "dominant", prior: 0.9 },
    {
      degree: "ii7",
      offset: 2,
      quality: "min7",
      function: "predominant",
      prior: 0.5,
      color: true,
    },
    {
      degree: "bVII7",
      offset: 10,
      quality: "7",
      function: "dominant",
      prior: 0.35,
      color: true,
    },
    {
      degree: "VI7",
      offset: 9,
      quality: "7",
      function: "dominant",
      prior: 0.5,
      color: true,
      resolves: "ii7",
    },
  ],
};

const FUNCTION_ORDER: readonly HarmonicFunction[] = [
  "tonic",
  "predominant",
  "dominant",
];

/** One of `items`, the likelier the higher its prior. */
const weightedPick = <T extends { prior: number }>(
  rng: Rng,
  items: readonly T[],
): T => {
  const total = items.reduce((sum, item) => sum + item.prior, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.prior;
    if (roll < 0) return item;
  }
  return items[items.length - 1];
};

export interface ProgressionRequest {
  /** Different chords wanted; fewer when the mode hasn't got them. */
  chords: number;
  /** Of them, how many colourful ones — borrowed, secondary dominants, diminished. */
  colors: number;
  family: HarmonyFamily;
}

/**
 * Deals the degrees of a progression of different chords: home first, a
 * chord that leads back to it, one to get away to, then as many more as the
 * key has room for, colourful ones last. No two share a root.
 */
const dealDegrees = (
  rng: Rng,
  mode: ChangesMode,
  { chords, colors }: ProgressionRequest,
) => {
  const vocabulary = VOCABULARY[mode];
  const [home] = vocabulary;
  const chosen: ChangelingDegree[] = [home];
  const free = (degree: ChangelingDegree) =>
    !chosen.some((taken) => taken.offset === degree.offset) &&
    (!degree.resolves ||
      chosen.some((taken) => taken.degree === degree.resolves));
  const take = (pool: readonly ChangelingDegree[]) => {
    const open = pool.filter(free);
    if (open.length) chosen.push(weightedPick(rng, open));
  };
  const own = vocabulary.filter((degree) => !degree.color);
  const colorful = vocabulary.filter((degree) => degree.color);
  const wantOwn = Math.max(1, chords - colors);

  take(own.filter((degree) => degree.function === "dominant"));
  if (chosen.length < wantOwn)
    take(own.filter((degree) => degree.function !== "dominant"));
  while (chosen.length < wantOwn && own.some(free)) take(own);
  // Past the key's own chords, every one more is a colourful one…
  while (chosen.length < chords && colorful.some(free)) take(colorful);
  // …and when those are gone, the key's own make up the rest.
  while (chosen.length < chords && own.some(free)) take(own);
  return chosen;
};

/**
 * The degrees in playing order: home, the rest of the home chords, then
 * those that lead away, then those that lead back — and each secondary
 * dominant right before the chord it resolves to.
 */
const orderDegrees = (rng: Rng, chosen: readonly ChangelingDegree[]) => {
  const [home, ...rest] = chosen;
  const ordered = [
    home,
    ...FUNCTION_ORDER.flatMap((fn) =>
      shuffled(
        rng,
        rest.filter((degree) => degree.function === fn && !degree.resolves),
      ),
    ),
  ];
  for (const secondary of rest.filter((degree) => degree.resolves)) {
    ordered.splice(
      Math.max(
        1,
        ordered.findIndex((degree) => degree.degree === secondary.resolves),
      ),
      0,
      secondary,
    );
  }
  return ordered;
};

/** A degree's chord in the key, by name. Among sevenths a chord takes its seventh; a diminished one stays as it is. */
const chordOf = (
  tonic: PitchClass,
  mode: ChangesMode,
  degree: ChangelingDegree,
  family: HarmonyFamily,
) => {
  let quality = degree.quality;
  if (family === "sevenths" && (quality === "maj" || quality === "min")) {
    quality =
      (degree.color ? degree.seventh : modeSeventh(mode, degree.offset)) ??
      quality;
  }
  // A lowered degree borrowed into the key is spelled with a flat: B♭ in C, not A♯.
  const flats = degree.degree.startsWith("b") || usesFlats(tonic, mode);
  return chordSymbol({ root: (tonic + degree.offset) % 12, quality }, flats);
};

/**
 * A progression of different chords in a key, in playing order: the home
 * chord first, then away from it and back — as many as asked for while the
 * mode has them, so many of them colourful.
 */
export const dealProgression = (
  rng: Rng,
  tonic: PitchClass,
  mode: ChangesMode,
  request: ProgressionRequest,
): string[] =>
  orderDegrees(rng, dealDegrees(rng, mode, request)).map((degree) =>
    chordOf(tonic, mode, degree, request.family),
  );
