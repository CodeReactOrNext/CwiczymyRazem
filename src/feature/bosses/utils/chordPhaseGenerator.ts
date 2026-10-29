import { CHORD_FAMILIES, CHORD_SETS } from "../data/colossus";
import type { ChordFamily, ChordUnit, ChordVariation } from "../types/boss.types";
import type { ChordPhasePlan, PhaseRules, Rng } from "./phaseGenerator";
import {
  CHORD_MULTIPLIER_STREAK,
  clamp,
  createRng,
  dealAffixes,
  earlyMercy,
  phaseHpFor,
  phaseSeed,
  pick,
  randInt,
  shuffled,
  WEAK_SPOTS_FROM,
} from "./phaseGenerator";

/** 1-based phase from which the colossus quakes. */
export const QUAKES_FROM = 3;
/** Bars one quake lasts. */
export const QUAKE_BARS = 2;
/** Bars in a pass: four in the first phase, eight once there are quakes to fit. */
const FIRST_PASS_BARS = 4;
export const PASS_BARS = 8;
const BEATS_PER_BAR = 4;
const MIN_BPM = 60;
const MAX_BPM = 160;

/**
 * Chord changes a second outside the quakes: 0.3 at the start (a chord a bar
 * at 72 BPM), 7% more every phase, topping out at 1.5 — quarters at 90 — past
 * the twenty-third. A quake doubles it, so the hardest stretch of the fight is
 * 3 changes a second.
 */
export const targetChangesPerSecond = (index: number) => Math.min(1.5, 0.3 * 1.07 ** index);

/** Five phases of each family — open, power, barre, seventh — then any of them. */
export const familyFor = (rng: Rng, index: number): ChordFamily =>
  index < 5
    ? "open"
    : index < 10
      ? "power"
      : index < 15
        ? "barre"
        : index < 20
          ? "seventh"
          : pick(rng, CHORD_FAMILIES);

/** Two chords to shuttle between at first, up to five later on. */
const progressionLength = (rng: Rng, index: number) =>
  index < 3
    ? 2
    : index < 5
      ? randInt(rng, 2, 3)
      : index < 8
        ? 3
        : index < 14
          ? randInt(rng, 3, 4)
          : randInt(rng, 3, 5);

/** A progression from one of the family's sets: its home chord, then the rest in any order. */
const dealProgression = (rng: Rng, family: ChordFamily, index: number) => {
  const set = pick(rng, CHORD_SETS[family]);
  const length = Math.min(set.length, progressionLength(rng, index));
  return [set[0], ...shuffled(rng, set.slice(1)).slice(0, length - 1)];
};

/**
 * A chord a bar for eight phases, then half notes, then quarters too —
 * whichever keeps the tempo playable (half notes need 0.5 changes a second to
 * reach 60 BPM, quarters a whole one).
 */
const dealTempo = (rng: Rng, index: number) => {
  const cps = targetChangesPerSecond(index);
  const options: ChordVariation["beatsPerChord"][] =
    index < 8 ? [4] : index < 12 ? [4, 2] : index < 18 ? [2] : index < 23 ? [2, 1] : [1, 2];
  const bpmFor = (beatsPerChord: number) => Math.round(cps * 60 * beatsPerChord);
  const playable = options.filter((b) => bpmFor(b) >= MIN_BPM && bpmFor(b) <= MAX_BPM);
  const beatsPerChord = playable.length ? pick(rng, playable) : options[0];
  return { beatsPerChord, bpm: clamp(bpmFor(beatsPerChord), MIN_BPM, MAX_BPM) };
};

/**
 * First bars of the pass's quakes — none before QUAKES_FROM, one after, two
 * with aftershocks. Never the pass's first bar or touching each other, so the
 * bar before every quake is a normal one to see it coming in.
 */
export const dealQuakeStarts = (rng: Rng, index: number, aftershocks: boolean): number[] => {
  if (index + 1 < QUAKES_FROM) return [];
  if (!aftershocks) return [randInt(rng, 2, PASS_BARS - QUAKE_BARS - 1)];
  const first = randInt(rng, 1, 2);
  return [first, randInt(rng, first + QUAKE_BARS + 1, PASS_BARS - QUAKE_BARS)];
};

/**
 * The pass strum by strum: the progression cycled bar after bar, one chord
 * per `beatsPerChord` beats and twice as many in a quake bar. The pass loops,
 * so its last chord is never the first one again — every strum is a change.
 */
export const dealUnits = (
  progression: readonly string[],
  beatsPerChord: number,
  bars: number,
  quakeStarts: readonly number[],
): ChordUnit[] => {
  const quakeBars = new Set(
    quakeStarts.flatMap((start) => Array.from({ length: QUAKE_BARS }, (_, i) => start + i)),
  );
  const units: ChordUnit[] = [];
  let dealt = 0;
  for (let bar = 0; bar < bars; bar++) {
    const quake = quakeBars.has(bar);
    const beats = quake ? beatsPerChord / 2 : beatsPerChord;
    for (let beat = 0; beat < BEATS_PER_BAR; beat += beats) {
      units.push({ chord: progression[dealt++ % progression.length], beats, quake });
    }
  }
  const last = units.length - 1;
  if (last > 0 && units[last].chord === units[0].chord) {
    const other = progression.find(
      (chord) => chord !== units[0].chord && chord !== units[last - 1].chord,
    );
    if (other) units[last] = { ...units[last], chord: other };
  }
  return units;
};

/** Beats in a pass. */
export const passBeats = (variation: Pick<ChordVariation, "units">) =>
  variation.units.reduce((sum, unit) => sum + unit.beats, 0);

/** Chord changes a second over the whole pass, quakes included. */
export const changesPerSecond = (variation: Pick<ChordVariation, "bpm" | "units">) => {
  const beats = passBeats(variation);
  return beats > 0 ? (variation.units.length * variation.bpm) / (beats * 60) : 0;
};

/**
 * The numbers of a phase, sized on its changes per second. A change is a
 * strum of several notes, so there are fewer of them than the spider's notes
 * and each one weighs more: a smaller sword, softer bites, petrify counted in
 * chords.
 */
const rulesFor = (variation: ChordVariation, index: number): PhaseRules => {
  const cps = changesPerSecond(variation);
  const bossHp = phaseHpFor(cps, index, CHORD_MULTIPLIER_STREAK);
  return {
    bossHp,
    biteDamage: Math.max(1, Math.ceil((100 / (10 + 4 * cps)) * earlyMercy(index))),
    chargeMax: clamp(Math.round(cps * 4), 3, 8) * 3,
    // Quakes are written into the tab, not dealt on a count.
    slamEvery: 0,
    slamWindup: 0,
    venomNotes: Math.max(3, Math.round(cps * 4)),
    regenAfter: Math.max(4, Math.round(cps * 5)),
    regenPerNote: Math.max(1, Math.round(bossHp * 0.015)),
    // The weak spot is a change, open for the whole phase (see weakChangeFor).
    weakSpotEvery: 0,
    weakSpotLength: 0,
    webEvery: Math.max(8, Math.round(cps * 16)),
    webLength: Math.max(4, Math.round(cps * 6)),
  };
};

/**
 * Deals phase `index` of a colossus run seeded `runSeed`: a progression from
 * the phase's chord family at its tempo, the quakes written into the pass, the
 * threats and the numbers. The same seed and index always deal the same phase.
 */
export const generateChordPhase = (runSeed: number, index: number): ChordPhasePlan => {
  const rng = createRng(phaseSeed(runSeed, index));
  const family = familyFor(rng, index);
  const progression = dealProgression(rng, family, index);
  const { beatsPerChord, bpm } = dealTempo(rng, index);
  const affixes = dealAffixes(rng, index);
  const quakeStarts = dealQuakeStarts(rng, index, affixes.includes("frenzy"));
  const bars = index === 0 ? FIRST_PASS_BARS : PASS_BARS;
  const variation: ChordVariation = {
    bpm,
    family,
    progression,
    beatsPerChord,
    units: dealUnits(progression, beatsPerChord, bars, quakeStarts),
  };
  return {
    kind: "chords",
    index,
    variation,
    slams: false,
    quakes: quakeStarts.length > 0,
    weakSpots: index + 1 >= WEAK_SPOTS_FROM,
    affixes,
    rules: rulesFor(variation, index),
  };
};
