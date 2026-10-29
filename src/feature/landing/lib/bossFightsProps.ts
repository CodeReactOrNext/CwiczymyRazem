import { BOSSES } from "feature/bosses/data/bosses";
import type { BossId, DrillKind } from "feature/bosses/types/boss.types";
import type { BoonId, BoonRarity } from "feature/bosses/utils/boons";
import { BOON, BOONS, dealDraft, DRAFT_SIZE } from "feature/bosses/utils/boons";
import type { BossFightState } from "feature/bosses/utils/bossEngine";
import {
  applyJudgement,
  CHANGES_MULTIPLIER_STREAK,
  CHORD_MULTIPLIER_STREAK,
  createFight,
  dealPhase,
  ENRAGE_BELOW,
  MAX_MULTIPLIER_STREAK,
  momentumStreakFor,
  PARRY_STREAK,
  PHASE_HEAL,
  phaseBpm,
  PLAYER_MAX_HP,
  SLAM_DAMAGE,
  streakMultiplier,
  WEAK_SPOT_CHARGE,
} from "feature/bosses/utils/bossEngine";
import { noteName } from "feature/bosses/utils/changesHarmony";
import {
  changesPerSecond,
  QUAKES_FROM,
} from "feature/bosses/utils/chordPhaseGenerator";
import {
  GATE_BITE,
  GATE_EVERY,
  GATE_HP,
  isGatePhase,
} from "feature/bosses/utils/difficulty";
import { threatsOf } from "feature/bosses/utils/phaseChanges";
import type { PhasePlan } from "feature/bosses/utils/phaseGenerator";
import {
  AFFIX_FROM,
  createRng,
  SLAMS_FROM,
  WEAK_SPOTS_FROM,
} from "feature/bosses/utils/phaseGenerator";
import { spiderPassNotes } from "feature/bosses/utils/spiderTab";
import fs from "fs";
import path from "path";

/** The fight's own copy, read from the English locale so the page says what the game says. */
type Locale = Record<string, unknown>;

const readLocale = (): Locale =>
  JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public/locales/en/bosses.json"),
      "utf8",
    ),
  );

const lookup = (locale: Locale, key: string): string | undefined => {
  const value = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object" ? (node as Locale)[part] : undefined,
      locale,
    );
  return typeof value === "string" ? value : undefined;
};

const interpolate = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );

/** The same lookup as `useBossText`: the boss's own wording first, the shared one otherwise. */
const textFor =
  (locale: Locale, boss: BossId | null) =>
  (key: string, vars: Record<string, string | number> = {}) => {
    const text =
      (boss && lookup(locale, `bosses.${boss}.${key}`)) ?? lookup(locale, key);
    if (text === undefined)
      throw new Error(`Boss Fights landing: no copy for "${key}"`);
    return interpolate(text, vars);
  };

// ── The numbers ─────────────────────────────────────────────────────────────

export interface BossFightNumbers {
  playerHp: number;
  parry: number;
  slamDamage: number;
  heal: number;
  enragePercent: number;
  weakCharge: number;
  slamsFrom: number;
  quakesFrom: number;
  weakFrom: number;
  affixFrom: number;
  gateEvery: number;
  gateHpPercent: number;
  gateBitePercent: number;
  boonCount: number;
  draftSize: number;
  slowDownBpm: number;
}

const NUMBERS: BossFightNumbers = {
  playerHp: PLAYER_MAX_HP,
  parry: PARRY_STREAK,
  slamDamage: SLAM_DAMAGE,
  heal: PHASE_HEAL,
  enragePercent: Math.round(ENRAGE_BELOW * 100),
  weakCharge: WEAK_SPOT_CHARGE,
  slamsFrom: SLAMS_FROM,
  quakesFrom: QUAKES_FROM,
  weakFrom: WEAK_SPOTS_FROM,
  affixFrom: AFFIX_FROM,
  gateEvery: GATE_EVERY,
  gateHpPercent: Math.round((GATE_HP - 1) * 100),
  gateBitePercent: Math.round((GATE_BITE - 1) * 100),
  boonCount: BOONS.length,
  draftSize: DRAFT_SIZE,
  slowDownBpm: BOON.slowDownBpm,
};

/** How long a streak takes to double a strike, per drill. */
const MULTIPLIER_STREAK: Record<DrillKind, number> = {
  spider: MAX_MULTIPLIER_STREAK,
  chords: CHORD_MULTIPLIER_STREAK,
  changes: CHANGES_MULTIPLIER_STREAK,
};

// ── The roster ──────────────────────────────────────────────────────────────

export interface BossCard {
  id: BossId;
  name: string;
  title: string;
  /** The lair's own pitch for the boss. */
  pitch: string;
  /** What a phase of it is made of, in a few words. */
  drill: string;
  /** The skill it trains. */
  trains: string;
  /** What a hit is, and what a miss is. */
  hit: string;
  miss: string;
  /** In a row, for a strike at ×2. */
  multiplierStreak: number;
}

const ROSTER: Record<
  BossId,
  Pick<BossCard, "drill" | "trains" | "hit" | "miss">
> = {
  fretweaver: {
    drill: "Chromatic finger drills, all 24 finger orders",
    trains: "Finger independence, alternate picking and speed",
    hit: "Every note of the drill, on time",
    miss: "A wrong or late note",
  },
  colossus: {
    drill: "Chord progressions: open, power, barre, sevenths",
    trains: "Clean chord changes in time",
    hit: "A chord that rings on the beat, every string but one heard",
    miss: "A change you don't get to in time",
  },
  changeling: {
    drill: "Chord changes to improvise over, nothing to read",
    trains: "Soloing that follows the chords",
    hit: "A note of the chord on beats 1 and 3, the scale in between",
    miss: "A note from outside the key, or a chord let go by",
  },
};

// ── The ladder ──────────────────────────────────────────────────────────────

export interface LadderPhase {
  phase: number;
  bpm: number;
  /** Notes (the spider) or chord changes (the others) a second. */
  rate: number;
  rhythm: string;
  /** What is dealt: the finger orders, or the progression. */
  drill: string;
  /** Where on the neck, or which key — the second line. */
  detail: string;
  hp: number;
  gate: boolean;
  /** Threats that join the fight in this phase. */
  joins: string[];
  /** Every threat live in this phase. */
  threats: string[];
}

export interface BossLadder {
  id: BossId;
  unit: string;
  phases: LadderPhase[];
}

/** The run every ladder is dealt from — any seed would do; this one is fixed so the page doesn't change between builds. */
export const LADDER_SEED = 7;
export const LADDER_PHASES = 15;

const CHORD_RHYTHM: Record<1 | 2 | 4, string> = {
  4: "a chord a bar",
  2: "two chords a bar",
  1: "four chords a bar",
};

const rateOf = (plan: PhasePlan) =>
  plan.kind === "spider"
    ? (plan.variation.bpm * plan.variation.notesPerBeat) / 60
    : changesPerSecond(plan.variation);

const describe = (
  plan: PhasePlan,
  t: ReturnType<typeof textFor>,
): Pick<LadderPhase, "rhythm" | "drill" | "detail"> => {
  if (plan.kind === "spider") {
    const { patterns, route, positions, notesPerBeat } = plan.variation;
    const subdivision = {
      1: "quarters",
      2: "eighths",
      3: "triplets",
      4: "sixteenths",
    }[notesPerBeat];
    return {
      rhythm: t(`subdivision.${subdivision}`),
      drill: patterns.join(" · "),
      detail: `${t(`route.${route}`)}, from fret ${Math.min(...positions)}`,
    };
  }
  if (plan.kind === "chords") {
    return {
      rhythm: CHORD_RHYTHM[plan.variation.beatsPerChord],
      drill: plan.variation.progression.join(" – "),
      detail: t(`chord_family.${plan.variation.family}`),
    };
  }
  const { key, progression, family } = plan.variation;
  return {
    rhythm: t(
      plan.variation.beatsPerChord === 4
        ? "changes_rhythm.bar"
        : "changes_rhythm.half_bar",
    ),
    drill: progression.join(" – "),
    detail: `${noteName(key.tonic, key)} ${t(`key_mode.${key.mode}`)}, ${t(`harmony_family.${family}`)}`,
  };
};

const ladderFor = (id: BossId, kind: DrillKind, locale: Locale): BossLadder => {
  const t = textFor(locale, id);
  let before: string[] = [];
  const phases = Array.from({ length: LADDER_PHASES }, (_, index) => {
    const plan = dealPhase(kind, LADDER_SEED, index);
    const threats = threatsOf(plan).map((threat) => t(`threats.${threat}`));
    const joins = threats.filter((threat) => !before.includes(threat));
    before = threats;
    return {
      phase: index + 1,
      bpm: plan.variation.bpm,
      rate: Math.round(rateOf(plan) * 100) / 100,
      ...describe(plan, t),
      hp: plan.rules.bossHp,
      gate: isGatePhase(index + 1),
      joins,
      threats,
    };
  });
  return {
    id,
    unit: kind === "spider" ? "notes a second" : "changes a second",
    phases,
  };
};

// ── The draft ───────────────────────────────────────────────────────────────

export interface BoonCard {
  id: BoonId;
  rarity: BoonRarity;
  name: string;
  body: string;
}

const boonCards = (locale: Locale): BoonCard[] => {
  const t = textFor(locale, "fretweaver");
  const vars = {
    ...BOON,
    armorPercent: Math.round(BOON.armorCut * 100),
    bladePercent: Math.round(BOON.bladeBonus * 100),
    lightBladePercent: Math.round(BOON.lightBladeCut * 100),
    thornsPercent: Math.round(BOON.thornsShare * 100),
    overdrivePercent: Math.round((BOON.overdriveDamage - 1) * 100),
    momentumStreak: momentumStreakFor({ kind: "spider" }),
    maxStreak: MAX_MULTIPLIER_STREAK,
  };
  return BOONS.map((boon) => ({
    id: boon.id,
    rarity: boon.rarity,
    // "the spider" on a page about three bosses reads as the boss.
    name: t(`boons.${boon.id}.name`),
    body: t(`boons.${boon.id}.body`, vars).replaceAll("the spider", "the boss"),
  }));
};

// ── The hero: phase 1 of a run, through the engine ──────────────────────────

/** One note of the hero's run, and the fight right after it. */
export interface HeroFrame {
  string: number;
  fret: number;
  /** 4 dead on · 3 on time · 2 close · 1 loose · 0 missed. */
  grade: 0 | 1 | 2 | 3 | 4;
  bossHp: number;
  playerHp: number;
  charge: number;
  combo: number;
  multiplier: number;
  /** Damage of the strike this note set off. */
  strike: number | null;
  /** HP the bite took. */
  bite: number | null;
}

export interface HeroRun {
  bossMaxHp: number;
  playerMaxHp: number;
  chargeMax: number;
  bpm: number;
  rhythm: string;
  pattern: number[];
  frames: HeroFrame[];
  /** The break the run ends on. */
  next: { phase: number; bpm: number; heal: number; draft: BoonId[] };
}

export const HERO_SEED = 7;
/** The made-up player: about one note in eighteen missed, most of the rest on time. */
const HERO_PLAYER_SEED = 11;

const heroRun = (locale: Locale): HeroRun => {
  const t = textFor(locale, "fretweaver");
  let fight: BossFightState = createFight(HERO_SEED, "spider");
  const first = fight.plan;
  if (first.kind !== "spider")
    throw new Error("Boss Fights landing: the hero needs the spider");
  const notes = spiderPassNotes(first.variation);
  const rng = createRng(HERO_PLAYER_SEED);
  const frames: HeroFrame[] = [];

  while (!fight.holding) {
    if (frames.length > 400)
      throw new Error(
        "Boss Fights landing: the hero run never cleared phase 1",
      );
    const roll = rng();
    const grade: HeroFrame["grade"] =
      roll < 0.055 ? 0 : roll < 0.1 ? 1 : roll < 0.25 ? 2 : roll < 0.6 ? 3 : 4;
    const before = fight;
    fight = applyJudgement(fight, {
      hit: grade > 0,
      grade: grade === 0 ? null : grade === 4 ? 3 : grade,
      perfect: grade === 4,
    });
    const note = notes[frames.length % notes.length];
    frames.push({
      ...note,
      grade,
      bossHp: fight.holding ? 0 : fight.bossHp,
      playerHp: fight.playerHp,
      charge: fight.holding ? 0 : fight.charge,
      combo: fight.combo,
      multiplier: streakMultiplier(fight.combo),
      strike:
        fight.strikeTick !== before.strikeTick
          ? (fight.lastStrike?.damage ?? null)
          : null,
      bite: fight.biteTick !== before.biteTick ? fight.lastBite : null,
    });
  }

  return {
    bossMaxHp: first.rules.bossHp,
    playerMaxHp: PLAYER_MAX_HP,
    chargeMax: createFight(HERO_SEED, "spider").chargeMax,
    bpm: first.variation.bpm,
    rhythm: t(
      `subdivision.${{ 1: "quarters", 2: "eighths", 3: "triplets", 4: "sixteenths" }[first.variation.notesPerBeat]}`,
    ),
    pattern: first.variation.patterns[0].split("").map(Number),
    frames,
    next: {
      phase: fight.plan.index + 1,
      bpm: phaseBpm(fight),
      heal: fight.lastHeal,
      draft: fight.draft ?? [],
    },
  };
};

// ── The page ────────────────────────────────────────────────────────────────

export interface BossFightRule {
  title: string;
  body: string;
}

export interface BossFightsPageProps {
  numbers: BossFightNumbers;
  bosses: BossCard[];
  ladders: BossLadder[];
  boons: BoonCard[];
  rules: BossFightRule[];
  hero: HeroRun;
  /** Drafts as a run deals them between its first phases, nothing taken yet. */
  deals: BoonId[][];
}

const RULE_KEYS = [
  "sword",
  "strike",
  "bite",
  "slam",
  "threats",
  "endless",
  "draft",
  "gates",
] as const;

/**
 * Everything the page shows about the fights, read at build time from the
 * fight engine and the game's own copy: the phases, the boons and the rules
 * can't say something the game doesn't do. The engine stays on the server.
 */
export const buildBossFightsProps = (): BossFightsPageProps => {
  const locale = readLocale();
  const t = textFor(locale, "fretweaver");
  const ruleVars = {
    max: MAX_MULTIPLIER_STREAK,
    slams: SLAMS_FROM,
    parry: PARRY_STREAK,
    heal: PHASE_HEAL,
    weak: WEAK_SPOTS_FROM,
    weakCharge: WEAK_SPOT_CHARGE,
    affix: AFFIX_FROM,
    gate: GATE_EVERY,
    gateHp: NUMBERS.gateHpPercent,
  };

  return {
    numbers: NUMBERS,
    bosses: BOSSES.map((boss) => {
      const own = textFor(locale, boss.id);
      return {
        id: boss.id,
        name: own("name"),
        title: own("title"),
        pitch: own("lair.pitch"),
        ...ROSTER[boss.id],
        multiplierStreak: MULTIPLIER_STREAK[boss.drill],
      };
    }),
    ladders: BOSSES.map((boss) => ladderFor(boss.id, boss.drill, locale)),
    boons: boonCards(locale),
    rules: RULE_KEYS.map((key) => ({
      title: t(`rules.${key}.title`),
      // The rules are written for the spider; the page shows them for all three.
      body: t(`rules.${key}.body`, ruleVars).replaceAll(
        "the spider",
        "the boss",
      ),
    })),
    hero: heroRun(locale),
    deals: [2, 3, 4, 5, 6].map((phase) => dealDraft(LADDER_SEED, phase, {})),
  };
};
