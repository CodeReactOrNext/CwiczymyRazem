import { ALL_FINGER_ORDERS } from "../data/fretweaver";
import type { ChangesVariation, ChordVariation, NotesPerBeat, SpiderRoute, SpiderVariation } from "../types/boss.types";
import { notesPerBar, notesPerSecond, stringsPerPosition } from "./spiderTab";

/** Powers the spider picks up from phase AFFIX_FROM on, more as it climbs. */
export type Affix = "venom" | "regen" | "frenzy" | "web";
export const AFFIXES: readonly Affix[] = ["venom", "regen", "frenzy", "web"];

/** 1-based phase numbers where each threat joins the fight. */
export const SLAMS_FROM = 3;
export const WEAK_SPOTS_FROM = 4;
export const AFFIX_FROM = 6;

/** Powers a phase brings: one from AFFIX_FROM, two from phase 9, three from phase 13. */
export const affixCountAt = (phase: number) =>
  phase < AFFIX_FROM ? 0 : phase < 9 ? 1 : phase < 13 ? 2 : 3;

/** The streak at which a strike hits twice as hard; it scales up to there. */
export const MAX_MULTIPLIER_STREAK = 48;
/** The same for chord changes, which come several times slower than notes. */
export const CHORD_MULTIPLIER_STREAK = 16;
/** The same for the changeling: notes, but only the chord tones among them count. */
export const CHANGES_MULTIPLIER_STREAK = 32;

/** Seconds of solid play a phase lasts: 70 in the first, 3 more a phase, two minutes at most. */
export const phaseSecondsFor = (index: number) => Math.min(120, 70 + 3 * index);

/** Strike damage of `hits` clean hits in a row, 3 points each, the streak multiplier climbing to ×2 at `cap`. */
const cleanRunDamage = (hits: number, cap: number) => {
  const n = Math.max(0, Math.round(hits));
  const ramp = n <= cap ? (n * (n + 1)) / 2 : (cap * (cap + 1)) / 2 + (n - cap) * cap;
  return 3 * (n + ramp / cap);
};

/**
 * A phase's HP: what a solid run — nine hits in ten — deals over
 * phaseSecondsFor(index) at `hitsPerSecond`, the streak multiplier included.
 * Sizing it on hits alone ignored the multiplier, which nearly doubles a clean
 * run's damage, and the phases went by in half the time they were meant to.
 */
export const phaseHpFor = (hitsPerSecond: number, index: number, streakCap: number) =>
  Math.max(30, Math.round((cleanRunDamage(hitsPerSecond * phaseSecondsFor(index), streakCap) * 0.9) / 10) * 10);

/**
 * What a bite costs in the opening phases, as a share of the full price:
 * half in the first, a tenth more each phase after, in full from the sixth.
 * Both bosses start gentle so a first run gets past the opening.
 */
export const earlyMercy = (index: number) => Math.min(1, 0.5 + 0.1 * index);

export interface PhaseRules {
  bossHp: number;
  /** HP a miss costs. */
  biteDamage: number;
  /** Sword points a strike needs. */
  chargeMax: number;
  /** Notes between slams, and the notes of warning before one lands. */
  slamEvery: number;
  slamWindup: number;
  /** Notes a venomous bite keeps the sword slowed for. */
  venomNotes: number;
  /** Notes without a strike before a regenerating boss starts to heal… */
  regenAfter: number;
  /** …and what it heals per note from then on. */
  regenPerNote: number;
  /** Notes between weak spots, and how many notes one stays open. */
  weakSpotEvery: number;
  weakSpotLength: number;
  /** Notes between two webs spat over the tab, and how long one covers it. */
  webEvery: number;
  webLength: number;
}

interface PhasePlanBase {
  /** 0-based. */
  index: number;
  /** A gate (every fifth phase): tougher, and a savepoint once reached — see dealPhase. */
  gate?: boolean;
  slams: boolean;
  weakSpots: boolean;
  affixes: readonly Affix[];
  rules: PhaseRules;
}

/** One phase of the spider's fight: the drill, the threats and the numbers. */
export interface SpiderPhasePlan extends PhasePlanBase {
  kind: "spider";
  variation: SpiderVariation;
}

/**
 * One phase of the colossus's fight. Its slams are quakes, written into the
 * tab (see chordPhaseGenerator), so `slams` stays off and `quakes` says
 * whether the pass has any.
 */
export interface ChordPhasePlan extends PhasePlanBase {
  kind: "chords";
  variation: ChordVariation;
  quakes: boolean;
}

/**
 * One phase of the changeling's fight: a progression to solo over. Like the
 * colossus its slams are written into the pass — rushes, where the chords
 * change twice as often — so `slams` stays off and `quakes` says whether
 * the pass has any.
 */
export interface ChangesPhasePlan extends PhasePlanBase {
  kind: "changes";
  variation: ChangesVariation;
  quakes: boolean;
}

/** One phase of a fight, whichever boss deals it. */
export type PhasePlan = SpiderPhasePlan | ChordPhasePlan | ChangesPhasePlan;

export type Rng = () => number;

/** mulberry32 — small, fast, and the same numbers for the same seed. */
export const createRng = (seed: number): Rng => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** A run's seed mixed with the phase, so each phase deals on its own. */
export const phaseSeed = (runSeed: number, index: number) =>
  (runSeed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;

export const newRunSeed = () => Math.floor(Math.random() * 0xffffffff);

export const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];
export const randInt = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
export const shuffled = <T,>(rng: Rng, items: readonly T[]): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * How fast the spider wants the notes, by phase: one a second at the start
 * (quarters at 60), 8% more every phase — twice as fast by the tenth, topping
 * out at 12 (sixteenths at 180) past the thirtieth.
 */
export const targetNotesPerSecond = (index: number) => Math.min(12, 1.08 ** index);

const MIN_BPM = 55;
const MAX_BPM = 180;

/** Subdivisions the spider may deal at a phase — from quarters to sixteenths. */
const subdivisionsFor = (index: number): NotesPerBeat[] =>
  index < 9 ? [1, 2] : index < 16 ? [2, 3] : index < 22 ? [2, 3, 4] : [3, 4];

/** A subdivision whose tempo for the wanted speed stays playable, then the tempo. */
const dealTempo = (rng: Rng, index: number) => {
  const nps = targetNotesPerSecond(index);
  const bpmFor = (npb: NotesPerBeat) => Math.round((nps * 60) / npb);
  const options = subdivisionsFor(index);
  const playable = options.filter((npb) => bpmFor(npb) >= MIN_BPM && bpmFor(npb) <= MAX_BPM);
  const notesPerBeat = playable.length
    ? pick(rng, playable)
    : options.reduce((best, npb) =>
        Math.abs(bpmFor(npb) - 120) < Math.abs(bpmFor(best) - 120) ? npb : best,
      );
  return { notesPerBeat, bpm: clamp(bpmFor(notesPerBeat), MIN_BPM, MAX_BPM) };
};

/** Finger orders grow from 1234 alone to all 24, more of them per phase. */
const dealPatterns = (rng: Rng, index: number) => {
  const pool =
    index < 3
      ? ["1234"]
      : index < 6
        ? ["1234", "4321"]
        : index < 10
          ? ["1234", "4321", "1324", "4231", "1243", "3421"]
          : ALL_FINGER_ORDERS;
  const count = index < 6 ? 1 : index < 10 ? randInt(rng, 1, 2) : index < 14 ? randInt(rng, 2, 4) : randInt(rng, 3, 6);
  const patterns = shuffled(rng, pool).slice(0, count);
  const descendPatterns =
    rng() < 0.5
      ? patterns.map((p) => p.split("").reverse().join(""))
      : shuffled(rng, pool).slice(0, count);
  return { patterns, descendPatterns };
};

const routesFor = (index: number): SpiderRoute[] =>
  index < 6 ? ["walk"] : index < 10 ? ["walk", "skip"] : ["walk", "walk", "skip", "diagonal"];

/**
 * Where the pass goes. Its length is picked so it fills whole 4/4 bars at the
 * dealt subdivision; the frets stay between 1 and 15.
 */
const dealPositions = (rng: Rng, route: SpiderRoute, notesPerBeat: NotesPerBeat) => {
  const perPosition = stringsPerPosition(route) * 4;
  const bar = notesPerBar({ notesPerBeat });
  const counts = [2, 3, 4, 5, 6].filter(
    (n) => (n * perPosition) % bar === 0 && (route !== "diagonal" || n % 2 === 0),
  );
  const count = pick(rng, counts);

  if (route === "diagonal") {
    // Up a diagonal from `low`, back down from five frets higher.
    return Array.from({ length: count / 2 }, () => {
      const low = randInt(rng, 1, 7);
      return [low, low + 5];
    }).flat();
  }
  const positions = [randInt(rng, 1, 9)];
  while (positions.length < count) {
    const step = pick(rng, [-1, 0, 1, 1]);
    positions.push(clamp(positions[positions.length - 1] + step, 1, 11));
  }
  return positions;
};

export const dealAffixes = (rng: Rng, index: number): Affix[] => {
  const count = affixCountAt(index + 1);
  return count ? shuffled(rng, AFFIXES).slice(0, count) : [];
};

/** The numbers of a phase, sized on its notes per second. */
const rulesFor = (variation: SpiderVariation, index: number, affixes: readonly Affix[]): PhaseRules => {
  const nps = notesPerSecond(variation);
  const frenzy = affixes.includes("frenzy");
  const bossHp = phaseHpFor(nps, index, MAX_MULTIPLIER_STREAK);
  return {
    bossHp,
    // About as many misses per second of play whatever the speed, softer early on.
    biteDamage: Math.max(1, Math.ceil((100 / (8 + 2.4 * nps)) * earlyMercy(index))),
    chargeMax: clamp(Math.round(nps * 1.6), 5, 14) * 3,
    slamEvery: Math.max(12, Math.round(nps * (frenzy ? 6 : 9))),
    slamWindup: Math.max(4, Math.round(nps * (frenzy ? 2.2 : 3))),
    venomNotes: Math.max(4, Math.round(nps * 4)),
    regenAfter: Math.max(6, Math.round(nps * 5)),
    regenPerNote: Math.max(1, Math.round(bossHp * 0.004)),
    weakSpotEvery: Math.max(10, Math.round(nps * 12)),
    weakSpotLength: Math.max(4, Math.round(nps * 3)),
    webEvery: Math.max(12, Math.round(nps * 14)),
    webLength: Math.max(6, Math.round(nps * 4)),
  };
};

/**
 * Deals phase `index` of the run seeded `runSeed`: a random drill (finger
 * orders, route, position, subdivision) at the phase's speed, the threats it
 * brings, and the numbers. The same seed and index always deal the same phase.
 */
export const generatePhase = (runSeed: number, index: number): SpiderPhasePlan => {
  const rng = createRng(phaseSeed(runSeed, index));
  const { notesPerBeat, bpm } = dealTempo(rng, index);
  const { patterns, descendPatterns } = dealPatterns(rng, index);
  const route = pick(rng, routesFor(index));
  const positions = dealPositions(rng, route, notesPerBeat);
  const variation: SpiderVariation = { bpm, notesPerBeat, patterns, descendPatterns, route, positions };
  const affixes = dealAffixes(rng, index);
  return {
    kind: "spider",
    index,
    variation,
    slams: index + 1 >= SLAMS_FROM,
    weakSpots: index + 1 >= WEAK_SPOTS_FROM,
    affixes,
    rules: rulesFor(variation, index, affixes),
  };
};
