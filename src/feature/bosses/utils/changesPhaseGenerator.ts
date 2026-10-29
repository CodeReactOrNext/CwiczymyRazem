import { CHANGES_TONICS } from "../data/changeling";
import type { ChangesMode, ChangesVariation, ChordUnit, HarmonyFamily } from "../types/boss.types";
import { dealProgression } from "./changesProgression";
import { changesPerSecond, dealQuakeStarts, PASS_BARS, QUAKE_BARS } from "./chordPhaseGenerator";
import type { ChangesPhasePlan, PhaseRules, Rng } from "./phaseGenerator";
import {
  CHANGES_MULTIPLIER_STREAK,
  clamp,
  createRng,
  dealAffixes,
  earlyMercy,
  phaseHpFor,
  phaseSeed,
  pick,
  WEAK_SPOTS_FROM,
} from "./phaseGenerator";

/** Bars in the first pass at the least — a short loop to find the chords in. */
const FIRST_PASS_BARS = 4;
const BEATS_PER_BAR = 4;
/** Different chords in the first phase — one more every phase after it, up to MAX_CHORDS. */
export const FIRST_CHORDS = 3;
export const MAX_CHORDS = 7;
const MIN_BPM = 66;
const MAX_BPM = 150;
/**
 * Chord tones a beat a solid soloist lands — between quarters and eighths,
 * as phrases breathe. What the phase's HP and sword are sized on.
 */
export const EXPECTED_HITS_PER_BEAT = 1.2;

/**
 * Chord changes a second: 0.3 at the start (a chord a bar at 72 BPM), 6% more
 * every phase, one a second at most — two chords a bar at 120.
 */
export const targetChangesPerSecond = (index: number) => Math.min(1, 0.3 * 1.06 ** index);

/** Major and minor for five phases, then the modes, the blues, harmonic minor. */
const modesFor = (index: number): ChangesMode[] =>
  index < 5
    ? ["ionian", "aeolian"]
    : index < 10
      ? ["ionian", "aeolian", "dorian", "mixolydian"]
      : index < 15
        ? ["ionian", "aeolian", "dorian", "mixolydian", "blues"]
        : ["ionian", "aeolian", "dorian", "mixolydian", "blues", "harmonicMinor"];

/** Different chords in a phase: three in the first, one more a phase, MAX_CHORDS at most. */
export const chordsFor = (index: number) => Math.min(FIRST_CHORDS + index, MAX_CHORDS);

/**
 * Triads for three phases; then, now and then — likelier phase by phase —
 * sevenths. The blues is sevenths throughout.
 */
const familyFor = (rng: Rng, index: number, mode: ChangesMode): HarmonyFamily =>
  mode === "blues" || (index >= 3 && rng() < Math.min(0.75, 0.1 * (index - 1))) ? "sevenths" : "triads";

/**
 * The colourful chords a phase brings — borrowed, secondary dominants,
 * diminished — now and then from the third phase, likelier as it climbs, and
 * from the eighth sometimes two.
 */
const colorsFor = (rng: Rng, index: number) => {
  if (index < 2 || rng() >= Math.min(0.6, 0.12 * index)) return 0;
  return index >= 7 && rng() < 0.4 ? 2 : 1;
};

/**
 * The pass chord by chord: the whole progression as many times as fills
 * `minBars` at the least — a chord every `beatsPerChord` beats, twice as many
 * in a rush bar — so it always comes round from its last chord to its first.
 */
export const dealPass = (
  progression: readonly string[],
  beatsPerChord: number,
  minBars: number,
  quakeStarts: readonly number[],
): ChordUnit[] => {
  const quakeBars = new Set(
    quakeStarts.flatMap((start) => Array.from({ length: QUAKE_BARS }, (_, i) => start + i)),
  );
  const chordsIn = (bar: number) => (BEATS_PER_BAR / beatsPerChord) * (quakeBars.has(bar) ? 2 : 1);
  let bars = minBars;
  let chords = Array.from({ length: bars }, (_, bar) => chordsIn(bar)).reduce((sum, n) => sum + n, 0);
  while (chords % progression.length !== 0 && bars < minBars + 4 * progression.length) {
    chords += chordsIn(bars);
    bars += 1;
  }
  const units: ChordUnit[] = [];
  for (let bar = 0; bar < bars; bar++) {
    const quake = quakeBars.has(bar);
    const beats = quake ? beatsPerChord / 2 : beatsPerChord;
    for (let beat = 0; beat < BEATS_PER_BAR; beat += beats) {
      units.push({ chord: progression[units.length % progression.length], beats, quake });
    }
  }
  return units;
};

/**
 * A chord a bar for eight phases, then half a bar too — whichever keeps the
 * tempo playable for the wanted changes a second.
 */
const dealTempo = (rng: Rng, index: number) => {
  const cps = targetChangesPerSecond(index);
  const options: ChangesVariation["beatsPerChord"][] = index < 8 ? [4] : index < 14 ? [4, 2] : [2];
  const bpmFor = (beatsPerChord: number) => Math.round(cps * 60 * beatsPerChord);
  const playable = options.filter((b) => bpmFor(b) >= MIN_BPM && bpmFor(b) <= MAX_BPM);
  const beatsPerChord = playable.length ? pick(rng, playable) : options[0];
  return { beatsPerChord, bpm: clamp(bpmFor(beatsPerChord), MIN_BPM, MAX_BPM) };
};

/**
 * The numbers of a phase. The player picks how many notes to play, so the
 * phase is sized on what a solid soloist lands at its tempo; bites on its
 * changes, which is how often a chord can be let go by without a tone of it.
 */
const rulesFor = (variation: ChangesVariation, index: number): PhaseRules => {
  const hps = (variation.bpm / 60) * EXPECTED_HITS_PER_BEAT;
  const cps = changesPerSecond(variation);
  const bossHp = phaseHpFor(hps, index, CHANGES_MULTIPLIER_STREAK);
  return {
    bossHp,
    biteDamage: Math.max(1, Math.ceil((100 / (10 + 4 * cps)) * earlyMercy(index))),
    chargeMax: clamp(Math.round(hps * 1.6), 5, 14) * 3,
    // Rushes are written into the pass, not dealt on a count.
    slamEvery: 0,
    slamWindup: 0,
    venomNotes: Math.max(4, Math.round(hps * 4)),
    regenAfter: Math.max(6, Math.round(hps * 5)),
    regenPerNote: Math.max(1, Math.round(bossHp * 0.004)),
    // The weak spots are the guide tones, open the whole phase.
    weakSpotEvery: 0,
    weakSpotLength: 0,
    webEvery: Math.max(10, Math.round(hps * 14)),
    webLength: Math.max(6, Math.round(hps * 5)),
  };
};

/**
 * Deals phase `index` of a changeling run seeded `runSeed`: a key, a
 * progression of different chords in it — one more every phase, now and then
 * sevenths or colourful ones — its tempo, the rushes written into the pass,
 * the threats and the numbers. The same seed and index always deal the same
 * phase.
 */
export const generateChangesPhase = (runSeed: number, index: number): ChangesPhasePlan => {
  const rng = createRng(phaseSeed(runSeed, index));
  const mode = pick(rng, modesFor(index));
  const tonic = pick(rng, CHANGES_TONICS[mode]);
  const family = familyFor(rng, index, mode);
  const progression = dealProgression(rng, tonic, mode, {
    chords: chordsFor(index),
    colors: colorsFor(rng, index),
    family,
  });
  const { beatsPerChord, bpm } = dealTempo(rng, index);
  const affixes = dealAffixes(rng, index);
  const quakeStarts = dealQuakeStarts(rng, index, affixes.includes("frenzy"));
  const bars = index === 0 ? FIRST_PASS_BARS : PASS_BARS;
  const variation: ChangesVariation = {
    bpm,
    key: { tonic, mode },
    family,
    progression,
    beatsPerChord,
    units: dealPass(progression, beatsPerChord, bars, quakeStarts),
  };
  return {
    kind: "changes",
    index,
    variation,
    slams: false,
    quakes: quakeStarts.length > 0,
    weakSpots: index + 1 >= WEAK_SPOTS_FROM,
    affixes,
    rules: rulesFor(variation, index),
  };
};
