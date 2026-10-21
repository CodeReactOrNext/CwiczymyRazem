import type { NoteJudgement } from "feature/exercisePlan/views/PracticeSession/hooks/useNoteMatching";

import type { DrillKind } from "../types/boss.types";
import type { BoonId, BoonStacks } from "./boons";
import { BOON, boonBpmShift, dealDraft, stacksOf } from "./boons";
import { subdivisionKey } from "./bossArt";
import { generateChordPhase } from "./chordPhaseGenerator";
import { changeKey, changesOf } from "./chordTab";
import type { PhasePlan } from "./phaseGenerator";
import {
  CHORD_MULTIPLIER_STREAK,
  createRng,
  generatePhase,
  MAX_MULTIPLIER_STREAK,
  phaseSeed,
  pick,
} from "./phaseGenerator";

export const PLAYER_MAX_HP = 100;
/** A streak this long when a slam lands blocks it (Steady hand: shorter). */
export const PARRY_STREAK = 4;
/** A slam that isn't blocked. */
export const SLAM_DAMAGE = 15;
/** A block charges the sword by this share of a full charge. */
export const COUNTER_CHARGE = 0.5;
export { CHORD_MULTIPLIER_STREAK, MAX_MULTIPLIER_STREAK };
/** A quake that isn't blocked. */
export const QUAKE_DAMAGE = SLAM_DAMAGE;
/** HP the player gets back for every phase cleared. */
export const PHASE_HEAL = 20;
/** Under this share of the phase's HP the boss enrages… */
export const ENRAGE_BELOW = 0.3;
/** …and bites and slams this much harder… */
export const RAGE_DAMAGE = 1.5;
/** …and slams this much sooner. */
const RAGE_SLAM_PACE = 0.75;
/** An open weak spot charges the sword this much faster; venom halves it. */
export const WEAK_SPOT_CHARGE = 2;
const VENOM_CHARGE = 0.5;
/** Rerolls a run starts with; one more every REROLL_EVERY phases cleared. */
const START_REROLLS = 1;
const REROLL_EVERY = 5;
/** The tempo boons can't push a phase past. */
const MIN_BPM = 50;
const MAX_BPM = 200;

export type FightOutcome = "lost";

/** One phase as it went — what the verdict charts. */
export interface PhaseRecord {
  /** 1-based. */
  phase: number;
  bpm: number;
  /** Translation key of the phase's rhythm ("subdivision.eighths"). */
  rhythm: string;
  /** HP lost in the phase, to bites and slams. */
  damageTaken: number;
  /** HP left when it ended (before the break's heal). */
  hpEnd: number;
  hits: number;
  misses: number;
}

export interface BossFightState {
  runSeed: number;
  /** The phase being fought: its drill, threats and numbers. */
  plan: PhasePlan;
  /** The phase cleared last, and the tempo it was played at — what the
   *  briefing between phases compares against. Null in the first phase. */
  previousPlan: PhasePlan | null;
  previousBpm: number;
  /** HP of the current phase. */
  bossHp: number;
  bossMaxHp: number;
  /** Damage over the whole run, every phase included. */
  totalDamage: number;
  playerHp: number;
  playerMaxHp: number;
  combo: number;
  maxCombo: number;
  hits: number;
  misses: number;
  perfects: number;
  /** Sword points gathered since the last strike. */
  charge: number;
  chargeMax: number;
  strikes: number;
  /** Bumped on every strike — the slash, the flinch and the big number. */
  strikeTick: number;
  lastStrike: { damage: number; multiplier: number } | null;
  /** Bumped when a miss throws away a charge. */
  shatterTick: number;
  /** Bumped on every bite that lands — shields and second wind included. */
  biteTick: number;
  /** HP the last bite took (0 when a shield or second wind caught it). */
  lastBite: number;
  /** What caught the last bite, if anything did. */
  lastBiteCaught: "shield" | "secondWind" | null;
  /**
   * The colossus's fight only. The last strum judged (its index in the pass),
   * what the alerts read the next one from…
   */
  lastUnit: number | null;
  /** …the quake under way (its first strum), the strums of it judged so far
   *  and how many of them were missed… */
  quakeRun: number | null;
  quakeJudged: readonly number[];
  quakeMisses: number;
  /** …misses over the run, by change ("G>C")… */
  changeMisses: Record<string, number>;
  /** …and the phase's weak spot: the change the player has missed most. */
  weakChange: string | null;
  /** Notes until the next slam, and how many of them are the warning. */
  notesToSlam: number;
  slamWindup: number;
  slamTick: number;
  lastSlam: { blocked: boolean; damage: number } | null;
  blocks: number;
  /** Bumped every time the player loses HP, to a bite or a slam. */
  playerHurtTick: number;
  /** Notes the sword stays slowed by venom. */
  poisonedNotes: number;
  /** Notes since the last strike — what a regenerating boss waits on. */
  notesSinceStrike: number;
  /** Notes until the next weak spot opens, and notes the open one has left. */
  notesToWeakSpot: number;
  weakSpotNotes: number;
  /** Notes until the spider next webs the tab, and notes the web has left. */
  notesToWeb: number;
  webNotes: number;
  /** Bumped when the boss breaks into its next phase. */
  phaseTick: number;
  /** HP the player got back at the last phase break. */
  lastHeal: number;
  /**
   * Between two phases: the run is held while the boss changes form and the
   * player drafts a boon; no note counts until the next phase is under way.
   */
  holding: boolean;
  /** The phase is in its last stretch: harder bites, quicker slams. */
  enraged: boolean;
  /** Boons taken this run, by stacks. */
  boons: BoonStacks;
  /** The cards on offer during a break; null once one is taken. */
  draft: BoonId[] | null;
  rerollsLeft: number;
  /** Rerolls used this break — part of what the next deal is seeded on. */
  rerollsThisBreak: number;
  /** Bites a shield still soaks up. */
  shieldCharges: number;
  /** Misses second wind still forgives this phase. */
  forgivenLeft: number;
  /** Every phase cleared so far. */
  phaseLog: PhaseRecord[];
  /** The current phase's running totals, for its entry in the log. */
  phaseDamageTaken: number;
  phaseStartHits: number;
  phaseStartMisses: number;
  outcome: FightOutcome | null;
}

/** Strike multiplier for a streak: ×1 at the start, ×2 from `cap` on. */
export const streakMultiplier = (streak: number, cap = MAX_MULTIPLIER_STREAK) =>
  Math.round((1 + Math.min(streak, cap) / cap) * 10) / 10;

/** The streak a phase's strikes reach ×2 at: notes for the spider, changes for the colossus. */
export const multiplierStreakFor = (plan: Pick<PhasePlan, "kind">) =>
  plan.kind === "chords" ? CHORD_MULTIPLIER_STREAK : MAX_MULTIPLIER_STREAK;

/** The same with Momentum: half as long. */
export const momentumStreakFor = (plan: Pick<PhasePlan, "kind">) =>
  Math.round((multiplierStreakFor(plan) * BOON.momentumStreak) / MAX_MULTIPLIER_STREAK);

/** The streak multiplier with the run's boons. */
export const fightMultiplier = (state: Pick<BossFightState, "combo" | "boons" | "plan">) =>
  streakMultiplier(
    state.combo,
    stacksOf(state.boons, "momentum") ? momentumStreakFor(state.plan) : multiplierStreakFor(state.plan),
  );

/** Sword points one hit is worth: its timing grade, 4 when dead on (6 with Precision). */
export const hitPoints = (grade: 1 | 2 | 3, perfect: boolean, boons: BoonStacks = {}) =>
  perfect ? (stacksOf(boons, "precision") ? BOON.precisionPoints : 4) : grade;

/** Sword points a strike needs: the phase's, less with a lighter blade. */
export const chargeMaxFor = (plan: PhasePlan, boons: BoonStacks) =>
  Math.max(3, Math.round(plan.rules.chargeMax * (1 - BOON.lightBladeCut) ** stacksOf(boons, "lightBlade")));

/** The phase's tempo with the run's boons on it. */
export const phaseBpm = (state: Pick<BossFightState, "plan" | "boons">) =>
  Math.min(MAX_BPM, Math.max(MIN_BPM, state.plan.variation.bpm + boonBpmShift(state.boons)));

/** The streak a slam needs to be blocked. */
export const parryStreak = (state: Pick<BossFightState, "boons">) =>
  stacksOf(state.boons, "steadyHand") ? BOON.steadyHandStreak : PARRY_STREAK;

/** Missed chords a quake still counts as blocked with: none, one with Steady hand. */
export const quakeMissesAllowed = (state: Pick<BossFightState, "boons">) =>
  stacksOf(state.boons, "steadyHand") ? BOON.steadyHandQuakeMisses : 0;

/** Deals a phase of the boss's own kind. */
export const dealPhase = (kind: DrillKind, runSeed: number, index: number): PhasePlan =>
  kind === "chords" ? generateChordPhase(runSeed, index) : generatePhase(runSeed, index);

/**
 * The colossus's weak spot for a phase: of the changes its pass makes, the
 * one the player has missed most this run — fix it and it pays double. Before
 * any misses, or between equals, one is drawn from the run's seed.
 */
export const weakChangeFor = (
  plan: PhasePlan,
  changeMisses: Record<string, number>,
  runSeed: number,
): string | null => {
  if (plan.kind !== "chords" || !plan.weakSpots) return null;
  const changes = changesOf(plan.variation);
  if (!changes.length) return null;
  const worst = Math.max(...changes.map((key) => changeMisses[key] ?? 0));
  const candidates = changes.filter((key) => (changeMisses[key] ?? 0) === worst);
  return pick(createRng(phaseSeed(runSeed, plan.index) ^ 0x5bd1e995), candidates);
};

const CHORD_RHYTHM_KEYS = {
  4: "subdivision.wholes",
  2: "subdivision.halves",
  1: "subdivision.quarters",
} as const;

/** The translation key of a chord drill's rhythm. */
export const chordRhythmKey = (beatsPerChord: 1 | 2 | 4) => CHORD_RHYTHM_KEYS[beatsPerChord];

/** The rhythm a phase is played in, as a translation key. */
export const rhythmKeyOf = (plan: PhasePlan) =>
  plan.kind === "chords"
    ? chordRhythmKey(plan.variation.beatsPerChord)
    : `subdivision.${subdivisionKey(plan.variation)}`;

/** The phase's own counters, fresh: a full slam count, the first weak spot ahead. */
const phaseStart = (plan: PhasePlan, boons: BoonStacks) => ({
  lastUnit: null,
  quakeRun: null,
  quakeJudged: [],
  quakeMisses: 0,
  notesToSlam: plan.rules.slamEvery,
  slamWindup: plan.rules.slamWindup,
  notesToWeakSpot: plan.rules.weakSpotEvery,
  weakSpotNotes: 0,
  notesToWeb: plan.rules.webEvery,
  webNotes: 0,
  poisonedNotes: 0,
  notesSinceStrike: 0,
  chargeMax: chargeMaxFor(plan, boons),
  forgivenLeft: stacksOf(boons, "secondWind") * BOON.secondWindMisses,
});

export const createFight = (runSeed: number, kind: DrillKind = "spider"): BossFightState => {
  const plan = dealPhase(kind, runSeed, 0);
  return {
    runSeed,
    plan,
    changeMisses: {},
    weakChange: weakChangeFor(plan, {}, runSeed),
    previousPlan: null,
    previousBpm: 0,
    bossHp: plan.rules.bossHp,
    bossMaxHp: plan.rules.bossHp,
    totalDamage: 0,
    playerHp: PLAYER_MAX_HP,
    playerMaxHp: PLAYER_MAX_HP,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    perfects: 0,
    charge: 0,
    strikes: 0,
    strikeTick: 0,
    lastStrike: null,
    shatterTick: 0,
    biteTick: 0,
    lastBite: 0,
    lastBiteCaught: null,
    slamTick: 0,
    lastSlam: null,
    blocks: 0,
    playerHurtTick: 0,
    phaseTick: 0,
    lastHeal: 0,
    holding: false,
    enraged: false,
    boons: {},
    draft: null,
    rerollsLeft: START_REROLLS,
    rerollsThisBreak: 0,
    shieldCharges: 0,
    phaseLog: [],
    phaseDamageTaken: 0,
    phaseStartHits: 0,
    phaseStartMisses: 0,
    outcome: null,
    ...phaseStart(plan, {}),
  };
};

/** The phase being fought, as its log entry would read if it ended now. */
export const currentPhaseRecord = (state: BossFightState): PhaseRecord => ({
  phase: state.plan.index + 1,
  bpm: phaseBpm(state),
  rhythm: rhythmKeyOf(state.plan),
  damageTaken: state.phaseDamageTaken,
  hpEnd: state.playerHp,
  hits: state.hits - state.phaseStartHits,
  misses: state.misses - state.phaseStartMisses,
});

/** The whole run phase by phase, the one it ended in included. */
export const runLog = (state: BossFightState): PhaseRecord[] =>
  state.holding ? state.phaseLog : [...state.phaseLog, currentPhaseRecord(state)];

/**
 * The phase's HP is gone: the boss breaks into the next, the player heals and
 * is dealt a draft of boons to pick from before it starts.
 */
const breakIntoNextPhase = (state: BossFightState): BossFightState => {
  const plan = dealPhase(state.plan.kind, state.runSeed, state.plan.index + 1);
  const playerHp = Math.min(state.playerMaxHp, state.playerHp + PHASE_HEAL);
  const start = phaseStart(plan, state.boons);
  const cleared = state.plan.index + 1;
  return {
    ...state,
    plan,
    previousPlan: state.plan,
    previousBpm: phaseBpm(state),
    phaseLog: [...state.phaseLog, currentPhaseRecord(state)],
    phaseDamageTaken: 0,
    phaseStartHits: state.hits,
    phaseStartMisses: state.misses,
    bossHp: plan.rules.bossHp,
    bossMaxHp: plan.rules.bossHp,
    charge: Math.min(state.charge, start.chargeMax - 1),
    playerHp,
    lastHeal: playerHp - state.playerHp,
    phaseTick: state.phaseTick + 1,
    holding: true,
    enraged: false,
    weakChange: weakChangeFor(plan, state.changeMisses, state.runSeed),
    draft: dealDraft(state.runSeed, plan.index + 1, state.boons),
    rerollsThisBreak: 0,
    rerollsLeft: state.rerollsLeft + (cleared % REROLL_EVERY === 0 ? 1 : 0),
    ...start,
  };
};

/** A full sword strikes; anything short of full waits. */
const withStrike = (state: BossFightState): BossFightState => {
  if (state.charge < state.chargeMax) return state;
  const multiplier = fightMultiplier(state);
  const boost =
    (1 + BOON.bladeBonus * stacksOf(state.boons, "blade")) *
    BOON.overdriveDamage ** stacksOf(state.boons, "overdrive");
  const bossHp = Math.max(0, state.bossHp - Math.round(state.charge * multiplier * boost));
  const struck: BossFightState = {
    ...state,
    bossHp,
    totalDamage: state.totalDamage + state.bossHp - bossHp,
    charge: 0,
    strikes: state.strikes + 1,
    strikeTick: state.strikeTick + 1,
    lastStrike: { damage: state.bossHp - bossHp, multiplier },
    notesSinceStrike: 0,
    playerHp: Math.min(
      state.playerMaxHp,
      state.playerHp + BOON.lifestealHp * stacksOf(state.boons, "lifesteal"),
    ),
  };
  return bossHp === 0 ? breakIntoNextPhase(struck) : struck;
};

const rageDamage = (state: BossFightState, damage: number) =>
  state.enraged ? Math.ceil(damage * RAGE_DAMAGE) : damage;

/** A miss: a bite — unless second wind forgives it outright or a shield takes it. */
const withBite = (state: BossFightState): BossFightState => {
  const { rules, affixes } = state.plan;
  const next = { ...state, misses: state.misses + 1, notesSinceStrike: state.notesSinceStrike + 1 };

  // Second wind: the miss counts, but the streak, the charge and the HP stand.
  if (next.forgivenLeft > 0) {
    return {
      ...next,
      forgivenLeft: next.forgivenLeft - 1,
      biteTick: next.biteTick + 1,
      lastBite: 0,
      lastBiteCaught: "secondWind",
    };
  }

  if (next.charge > 0) next.shatterTick += 1;
  next.combo = 0;
  next.charge = 0;
  next.biteTick += 1;

  const armor = (1 - BOON.armorCut) ** stacksOf(next.boons, "armor");
  const damage = Math.max(1, Math.round(rageDamage(next, rules.biteDamage) * armor));
  if (next.shieldCharges > 0) {
    next.shieldCharges -= 1;
    next.lastBite = 0;
    next.lastBiteCaught = "shield";
  } else {
    next.lastBite = damage;
    next.lastBiteCaught = null;
    next.phaseDamageTaken += Math.min(damage, next.playerHp);
    next.playerHp = Math.max(0, next.playerHp - damage);
    next.playerHurtTick += 1;
  }

  // Thorns bite back, though never hard enough to end the phase.
  const thorns = Math.round(next.bossMaxHp * BOON.thornsShare * stacksOf(next.boons, "thorns"));
  if (thorns > 0) {
    const bossHp = Math.max(1, next.bossHp - thorns);
    next.totalDamage += next.bossHp - bossHp;
    next.bossHp = bossHp;
  }

  if (affixes.includes("venom") && !stacksOf(next.boons, "antidote")) {
    next.poisonedNotes = rules.venomNotes + 1;
  }
  return next;
};

/** The tab is under a web: the player plays from memory. */
export const isWebbed = (state: Pick<BossFightState, "webNotes">) => state.webNotes > 0;

/** A weak spot is open right now. */
export const isWeakSpotOpen = (state: Pick<BossFightState, "weakSpotNotes">) =>
  state.weakSpotNotes > 0;

/** The sword's charge rate while a weak spot is open. */
export const weakSpotCharge = (state: Pick<BossFightState, "boons">) =>
  stacksOf(state.boons, "exploit") ? BOON.exploitCharge : WEAK_SPOT_CHARGE;

/** The boss is healing itself (regen) — no strike for too long. */
export const isRegenerating = (
  state: Pick<BossFightState, "plan" | "notesSinceStrike" | "holding" | "outcome">,
) =>
  state.plan.affixes.includes("regen") &&
  !state.holding &&
  !state.outcome &&
  state.notesSinceStrike > state.plan.rules.regenAfter;

/**
 * A slam lands — or, on the colossus, a quake: blocked, it half-charges the
 * sword (which may strike); not, it takes its damage.
 */
const withSlam = (state: BossFightState, blocked: boolean, baseDamage: number): BossFightState => {
  const damage = blocked ? 0 : rageDamage(state, baseDamage);
  const next: BossFightState = {
    ...state,
    phaseDamageTaken: state.phaseDamageTaken + Math.min(damage, state.playerHp),
    playerHp: Math.max(0, state.playerHp - damage),
    playerHurtTick: state.playerHurtTick + (blocked ? 0 : 1),
    slamTick: state.slamTick + 1,
    lastSlam: { blocked, damage },
  };
  if (!blocked) return next;
  next.blocks += 1;
  next.charge += Math.round(next.chargeMax * COUNTER_CHARGE);
  return withStrike(next);
};

// ── The colossus: strums, quakes and the weak change ────────────────────────

/** Beats ahead a quake is called out. */
export const QUAKE_WARNING_BEATS = 4;

/** The strum after the last one judged — the one being played or about to be. */
export const nextStrum = (state: Pick<BossFightState, "plan" | "lastUnit">) =>
  state.plan.kind === "chords" && state.lastUnit !== null
    ? (state.lastUnit + 1) % state.plan.variation.units.length
    : null;

/** Strum `unit` makes the phase's weak change. */
export const isWeakChange = (state: Pick<BossFightState, "plan" | "weakChange">, unit: number) =>
  state.plan.kind === "chords" &&
  state.weakChange !== null &&
  changeKey(state.plan.variation, unit) === state.weakChange;

/** The quake strum `unit` belongs to, as its first strum and its length; null outside one. */
export const quakeRunOf = (plan: PhasePlan, unit: number) => {
  if (plan.kind !== "chords" || !plan.variation.units[unit]?.quake) return null;
  const { units } = plan.variation;
  const at = (i: number) => units[(i + units.length) % units.length];
  let start = unit;
  while (at(start - 1).quake && start - unit > -units.length) start -= 1;
  let length = 0;
  while (at(start + length).quake && length < units.length) length += 1;
  return { start: (start + units.length) % units.length, length };
};

export interface QuakeWarning {
  /** Coming within a bar, or under way. */
  stage: "coming" | "on";
  /** Beats until it starts, or strums left in it. */
  left: number;
  /** What `left` counts down from. */
  total: number;
}

/** The quake about to hit or already shaking, read from the next strum. */
export const quakeWarning = (
  state: Pick<BossFightState, "plan" | "lastUnit" | "holding" | "outcome">,
): QuakeWarning | null => {
  const { plan } = state;
  if (plan.kind !== "chords" || !plan.quakes || state.holding || state.outcome) return null;
  const next = nextStrum(state);
  if (next === null) return null;
  const { units } = plan.variation;
  const run = quakeRunOf(plan, next);
  if (run) {
    const done = (next - run.start + units.length) % units.length;
    return { stage: "on", left: run.length - done, total: run.length };
  }
  let beats = 0;
  for (let step = 0; step < units.length && beats <= QUAKE_WARNING_BEATS; step++) {
    const unit = units[(next + step) % units.length];
    if (unit.quake) return { stage: "coming", left: beats, total: QUAKE_WARNING_BEATS };
    beats += unit.beats;
  }
  return null;
};

/** A strum later in the pass than `last` — late misses must not wind the alerts back. */
const isAhead = (last: number | null, unit: number, units: number) =>
  last === null || unit === last || (unit - last + units) % units < units / 2;

/**
 * The colossus's side of a judged strum: misses counted under its change, the
 * alerts moved on, and a quake landing once every strum of it is judged —
 * order doesn't matter, a miss comes in after the strum that follows it.
 */
const withStrum = (
  state: BossFightState,
  unit: number,
  hit: boolean,
): BossFightState => {
  if (state.plan.kind !== "chords") return state;
  const { units } = state.plan.variation;
  let next: BossFightState = {
    ...state,
    lastUnit: isAhead(state.lastUnit, unit, units.length) ? unit : state.lastUnit,
  };
  if (!hit) {
    const key = changeKey(state.plan.variation, unit);
    if (key) next.changeMisses = { ...next.changeMisses, [key]: (next.changeMisses[key] ?? 0) + 1 };
  }

  const run = state.plan.quakes ? quakeRunOf(state.plan, unit) : null;
  if (!run) return next;
  // A strum this quake already had: the pass came round again.
  const fresh = next.quakeRun !== run.start || next.quakeJudged.includes(unit);
  const judged = fresh ? [unit] : [...next.quakeJudged, unit];
  const misses = (fresh ? 0 : next.quakeMisses) + (hit ? 0 : 1);
  next = { ...next, quakeRun: run.start, quakeJudged: judged, quakeMisses: misses };
  if (judged.length < run.length) return next;
  next = withSlam(next, misses <= quakeMissesAllowed(next), QUAKE_DAMAGE);
  return { ...next, quakeRun: null, quakeJudged: [], quakeMisses: 0 };
};

/** A judged note — or, on the colossus, a judged strum and where it sits in the pass. */
export type FightJudgement = Pick<NoteJudgement, "hit" | "grade" | "perfect"> & {
  /** The strum's index in the colossus's pass. */
  unit?: number;
};

/**
 * One judged note against the fight: a hit charges the sword (and a full one
 * strikes), a miss shatters the charge and draws a bite, and every note moves
 * the phase's clocks on — the next slam, the next weak spot, the web, the
 * venom, the boss's healing. On the colossus a "note" is a whole strum: its
 * weak spot is a change, and its slams are the quakes written into the pass.
 * The fight ends only when the player's HP runs out; between two phases no
 * note counts.
 */
export const applyJudgement = (
  state: BossFightState,
  judgement: FightJudgement,
): BossFightState => {
  if (state.outcome || state.holding) return state;
  const { rules, affixes } = state.plan;
  const strum = state.plan.kind === "chords" ? (judgement.unit ?? null) : null;
  let next: BossFightState = { ...state };
  const weakSpotOpen = strum !== null ? isWeakChange(next, strum) : isWeakSpotOpen(next);

  if (judgement.hit) {
    next.combo += 1;
    next.maxCombo = Math.max(next.maxCombo, next.combo);
    next.hits += 1;
    next.perfects += judgement.perfect ? 1 : 0;
    const rate =
      (weakSpotOpen ? weakSpotCharge(next) : 1) * (next.poisonedNotes > 0 ? VENOM_CHARGE : 1);
    const points = hitPoints(judgement.grade ?? 3, judgement.perfect, next.boons);
    next.charge += Math.max(1, Math.round(points * rate));
    next.notesSinceStrike += 1;
    next = withStrike(next);
    // The phase just broke — everything else waits for the next one.
    if (next.holding) return next;
  } else {
    next = withBite(next);
  }

  if (next.poisonedNotes > 0) next.poisonedNotes -= 1;

  if (isRegenerating(next)) {
    next.bossHp = Math.min(next.bossMaxHp, next.bossHp + rules.regenPerNote);
  }

  if (state.plan.weakSpots && state.plan.kind === "spider") {
    if (next.weakSpotNotes > 0) {
      next.weakSpotNotes -= 1;
    } else if (--next.notesToWeakSpot <= 0) {
      const longer = stacksOf(next.boons, "exploit") ? BOON.exploitLength : 1;
      next.weakSpotNotes = Math.round(rules.weakSpotLength * longer);
      next.notesToWeakSpot = rules.weakSpotEvery;
    }
  }

  if (affixes.includes("web")) {
    if (next.webNotes > 0) {
      // Every note counts the web down; one played on time tears it twice as fast.
      const tear = judgement.hit && judgement.grade === 3 ? 2 : 1;
      next.webNotes = Math.max(0, next.webNotes - tear);
    } else if (--next.notesToWeb <= 0) {
      const shorter = stacksOf(next.boons, "clearSight") ? BOON.clearSightShare : 1;
      next.webNotes = Math.max(1, Math.round(rules.webLength * shorter));
      next.notesToWeb = rules.webEvery;
    }
  }

  if (state.plan.slams && --next.notesToSlam <= 0) {
    next = withSlam(next, next.combo >= parryStreak(next), SLAM_DAMAGE);
    next.notesToSlam = Math.round(rules.slamEvery * (next.enraged ? RAGE_SLAM_PACE : 1));
    if (next.holding) return next;
  }

  if (strum !== null) {
    next = withStrum(next, strum, judgement.hit);
    if (next.holding) return next;
  }

  next.enraged = next.bossHp / next.bossMaxHp < ENRAGE_BELOW;
  if (next.playerHp === 0) next.outcome = "lost";
  return next;
};

/** Takes a boon from the draft: its stack, and whatever it does at once. */
export const pickBoon = (state: BossFightState, id: BoonId): BossFightState => {
  if (!state.draft?.includes(id)) return state;
  const boons = { ...state.boons, [id]: stacksOf(state.boons, id) + 1 };
  const next: BossFightState = { ...state, boons, draft: null };
  switch (id) {
    case "vitality":
      next.playerMaxHp += BOON.vitalityHp;
      next.playerHp += BOON.vitalityHp;
      break;
    case "bandage":
      next.playerHp = Math.min(next.playerMaxHp, next.playerHp + BOON.bandageHp);
      break;
    case "shield":
      next.shieldCharges += BOON.shieldCharges;
      break;
    case "secondWind":
      next.forgivenLeft += BOON.secondWindMisses;
      break;
    case "lightBlade":
      next.chargeMax = chargeMaxFor(next.plan, boons);
      next.charge = Math.min(next.charge, next.chargeMax - 1);
      break;
    default:
      break;
  }
  return next;
};

/** Deals the draft again, for one of the run's rerolls. */
export const rerollDraft = (state: BossFightState): BossFightState => {
  if (!state.draft || state.rerollsLeft <= 0) return state;
  const rerollsThisBreak = state.rerollsThisBreak + 1;
  return {
    ...state,
    rerollsLeft: state.rerollsLeft - 1,
    rerollsThisBreak,
    draft: dealDraft(state.runSeed, state.plan.index + 1, state.boons, rerollsThisBreak),
  };
};

/**
 * The next phase gets under way: the run starts over on its drill and tempo,
 * the streak with it (the break broke it). The sword keeps its charge.
 */
export const endPhaseBreak = (state: BossFightState): BossFightState =>
  state.holding ? { ...state, holding: false, draft: null, combo: 0 } : state;

/** The slam is close enough to warn about. */
export const isSlamComing = (
  state: Pick<BossFightState, "plan" | "notesToSlam" | "slamWindup">,
) => state.plan.slams && state.notesToSlam <= state.slamWindup;

/** 1-based phase number, as shown. */
export const phaseNumber = (state: Pick<BossFightState, "plan">) => state.plan.index + 1;

/** Share of notes hit, 0–100. */
export const fightAccuracy = (state: Pick<BossFightState, "hits" | "misses">) => {
  const total = state.hits + state.misses;
  return total === 0 ? 0 : Math.round((state.hits / total) * 100);
};
