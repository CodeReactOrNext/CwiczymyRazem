import { bossEnergyFloor, CHANGES_ENERGY_FLOOR } from "feature/autoBacking/bossBacking";

import type { BossFightState } from "../utils/bossEngine";
import { chordPass, fightMultiplier, isSlamComing, quakeWarning } from "../utils/bossEngine";
import { STRONG_BEAT_EVERY } from "../utils/changesJudge";
import { unitSpans } from "../utils/changesTab";
import type { BossCue } from "./bossCues";

export type CueEvent =
  /** Plays as soon as it can — a strike on the run's grid, the animation waiting for it (`tick`). */
  | { kind: "now"; cue: BossCue; tick?: number }
  /**
   * The band's energy follows the run: up on the next beat, down at once after
   * a miss (`drop`) — or both on the next of every `everyBeats` beats.
   */
  | { kind: "energy"; level: number; drop: boolean; everyBeats?: number }
  /** The sword's charge, 0–1 — the build toward a strike. */
  | { kind: "tension"; amount: number }
  /** The player's HP is low (or no longer): the heartbeat. */
  | { kind: "danger"; on: boolean }
  /** Ticks on the beats before a slam about this many beats away. */
  | { kind: "slamCountdown"; beatsAway: number }
  /** Ticks into the next quake (rush) of the pass, on its own beats. */
  | { kind: "quakeCountdown"; starts: number[]; passBeats: number };

/** Under this share of HP the player is in danger: the band's heartbeat. */
export const DANGER_HP = 0.25;
/** Hits in a row before the band starts to build. */
const GROOVE_STREAK = 3;

/**
 * How much of the score the band plays for this run (AmbientBand.plays): the
 * bare pulse after a miss, the groove once a streak gets going, the drive past
 * a third of the way to ×2, everything near it — never under the phase's floor.
 */
export const musicEnergy = (fight: BossFightState) => {
  const progress = fightMultiplier(fight) - 1;
  const level =
    fight.combo < GROOVE_STREAK ? 1 : progress < 0.3 ? 2 : progress < 0.7 ? 3 : 4;
  const floor = fight.plan.kind === "changes" ? CHANGES_ENERGY_FLOOR : bossEnergyFloor(fight.plan.index + 1);
  return Math.max(floor, level);
};

/**
 * A solo over the changes is judged on beats 1 and 3, and its band moves
 * with it there: up or down on the next of them, not on the next eighth.
 */
const energyGrid = (fight: BossFightState) =>
  fight.plan.kind === "changes" ? { everyBeats: STRONG_BEAT_EVERY } : {};

const tensionOf = (fight: BossFightState) =>
  fight.chargeMax > 0 ? Math.min(1, fight.charge / fight.chargeMax) : 0;

const inDanger = (fight: BossFightState) => fight.playerHp / fight.playerMaxHp < DANGER_HP;

/** Where in the pass each quake (rush) starts, in beats from its top. */
const quakeStarts = (fight: BossFightState) => {
  const pass = chordPass(fight.plan);
  if (!pass) return null;
  const { units } = pass.variation;
  const spans = unitSpans(pass.variation);
  const starts = units.flatMap((unit, i) =>
    unit.quake && !units[(i - 1 + units.length) % units.length].quake ? [spans[i].start] : [],
  );
  return { starts, passBeats: spans[spans.length - 1]?.end ?? 0 };
};

/**
 * What one change of the fight sounds like: a strike, a bite, a slam landing or
 * blocked, a changeling trick or its combo paid out (the payout drowns the
 * trick that ended it), a new phase (a gate's gong), the run lost — and, the
 * moment one is called, the countdown into a slam or a quake. A new run is
 * silent.
 */
export const cueEvents = (next: BossFightState, previous: BossFightState): CueEvent[] => {
  // A new run: silent, the band back to the start of it.
  if (next.runSeed !== previous.runSeed) {
    return [
      { kind: "energy", level: musicEnergy(next), drop: true },
      { kind: "tension", amount: 0 },
      { kind: "danger", on: false },
    ];
  }
  const events: CueEvent[] = [];
  if (next.strikeTick > previous.strikeTick) {
    events.push({ kind: "now", cue: "strike", tick: next.strikeTick });
  }
  if (next.biteTick > previous.biteTick && next.lastBite > 0) events.push({ kind: "now", cue: "hurt" });
  if (next.slamTick > previous.slamTick && next.lastSlam) {
    events.push({ kind: "now", cue: next.lastSlam.blocked ? "block" : "impact" });
  }
  if (next.bankTick > previous.bankTick) events.push({ kind: "now", cue: "bank" });
  else if (next.trickTick > previous.trickTick) events.push({ kind: "now", cue: "trick" });
  if (next.phaseTick > previous.phaseTick) events.push({ kind: "now", cue: next.plan.gate ? "gate" : "molt" });
  if (next.outcome && !previous.outcome) events.push({ kind: "now", cue: "defeat" });

  const energy = musicEnergy(next);
  if (energy !== musicEnergy(previous)) {
    events.push({ kind: "energy", level: energy, drop: next.combo < previous.combo, ...energyGrid(next) });
  }
  const tension = tensionOf(next);
  if (tension !== tensionOf(previous)) events.push({ kind: "tension", amount: tension });
  if (inDanger(next) !== inDanger(previous)) events.push({ kind: "danger", on: inDanger(next) });

  if (next.holding || next.outcome) return events;

  if (isSlamComing(next) && !isSlamComing(previous) && next.plan.kind === "spider") {
    events.push({ kind: "slamCountdown", beatsAway: next.notesToSlam / next.plan.variation.notesPerBeat });
  }
  if (quakeWarning(next)?.stage === "coming" && quakeWarning(previous)?.stage !== "coming") {
    const quakes = quakeStarts(next);
    if (quakes?.starts.length) events.push({ kind: "quakeCountdown", ...quakes });
  }
  return events;
};
