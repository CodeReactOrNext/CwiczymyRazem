import { ALL_FINGER_ORDERS } from "../data/fretweaver";
import type { NotesPerBeat, SpiderRoute, SpiderVariation } from "../types/boss.types";
import { notesPerBar, notesPerSecond, stringsPerPosition } from "./spiderTab";

/** Powers the spider picks up from phase AFFIX_FROM on, more as it climbs. */
export type Affix = "venom" | "regen" | "frenzy" | "web";
export const AFFIXES: readonly Affix[] = ["venom", "regen", "frenzy", "web"];

/** 1-based phase numbers where each threat joins the fight. */
export const SLAMS_FROM = 2;
export const WEAK_SPOTS_FROM = 3;
export const AFFIX_FROM = 4;

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

/** One phase of the fight: the drill, the threats and the numbers. */
export interface PhasePlan {
  /** 0-based. */
  index: number;
  variation: SpiderVariation;
  slams: boolean;
  weakSpots: boolean;
  affixes: readonly Affix[];
  rules: PhaseRules;
}

type Rng = () => number;

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
const phaseSeed = (runSeed: number, index: number) =>
  (runSeed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;

export const newRunSeed = () => Math.floor(Math.random() * 0xffffffff);

const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];
const randInt = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const shuffled = <T,>(rng: Rng, items: readonly T[]): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * How fast the spider wants the notes, by phase: 1.6 a second at the start,
 * 0.6 more every phase, topping out at 12 — sixteenths at 180.
 */
export const targetNotesPerSecond = (index: number) => Math.min(12, 1.6 + 0.6 * index);

const MIN_BPM = 55;
const MAX_BPM = 180;

/** Subdivisions the spider may deal at a phase — from quarters to sixteenths. */
const subdivisionsFor = (index: number): NotesPerBeat[] =>
  index < 2 ? [1, 2] : index < 5 ? [2, 3] : index < 8 ? [2, 3, 4] : [3, 4];

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
    index < 1
      ? ["1234"]
      : index < 2
        ? ["1234", "4321"]
        : index < 4
          ? ["1234", "4321", "1324", "4231", "1243", "3421"]
          : ALL_FINGER_ORDERS;
  const count = index < 2 ? 1 : index < 5 ? randInt(rng, 1, 2) : index < 8 ? randInt(rng, 2, 4) : randInt(rng, 3, 6);
  const patterns = shuffled(rng, pool).slice(0, count);
  const descendPatterns =
    rng() < 0.5
      ? patterns.map((p) => p.split("").reverse().join(""))
      : shuffled(rng, pool).slice(0, count);
  return { patterns, descendPatterns };
};

const routesFor = (index: number): SpiderRoute[] =>
  index < 3 ? ["walk"] : index < 5 ? ["walk", "skip"] : ["walk", "walk", "skip", "diagonal"];

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

const dealAffixes = (rng: Rng, index: number): Affix[] => {
  const phase = index + 1;
  if (phase < AFFIX_FROM) return [];
  const count = phase < 7 ? 1 : phase < 10 ? 2 : 3;
  return shuffled(rng, AFFIXES).slice(0, count);
};

/** The numbers of a phase, sized on its notes per second. */
const rulesFor = (variation: SpiderVariation, index: number, affixes: readonly Affix[]): PhaseRules => {
  const nps = notesPerSecond(variation);
  const frenzy = affixes.includes("frenzy");
  // A solid run brings a phase down in 40 s at first, up to a minute later on.
  const phaseSeconds = Math.min(60, 40 + 2 * index);
  const bossHp = Math.round((nps * phaseSeconds * 3.6) / 10) * 10;
  return {
    bossHp,
    // About as many misses per second of play whatever the speed.
    biteDamage: Math.ceil(100 / (8 + 2.4 * nps)),
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
export const generatePhase = (runSeed: number, index: number): PhasePlan => {
  const rng = createRng(phaseSeed(runSeed, index));
  const { notesPerBeat, bpm } = dealTempo(rng, index);
  const { patterns, descendPatterns } = dealPatterns(rng, index);
  const route = pick(rng, routesFor(index));
  const positions = dealPositions(rng, route, notesPerBeat);
  const variation: SpiderVariation = { bpm, notesPerBeat, patterns, descendPatterns, route, positions };
  const affixes = dealAffixes(rng, index);
  return {
    index,
    variation,
    slams: index + 1 >= SLAMS_FROM,
    weakSpots: index + 1 >= WEAK_SPOTS_FROM,
    affixes,
    rules: rulesFor(variation, index, affixes),
  };
};
