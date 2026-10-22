import { describe, expect, it } from "vitest";

import { BOON } from "./boons";
import type { BossFightState, FightJudgement } from "./bossEngine";
import {
  applyJudgement,
  CHORD_MULTIPLIER_STREAK,
  COUNTER_CHARGE,
  createFight,
  fightMultiplier,
  nextStrum,
  pickBoon,
  QUAKE_DAMAGE,
  quakeWarning,
  rhythmKeyOf,
  weakChangeFor,
} from "./bossEngine";
import { generateChordPhase } from "./chordPhaseGenerator";
import { chordFightWith, FIXTURE_RULES } from "./fightFixtures";

const strum = (unit: number, hit = true, grade: 1 | 2 | 3 = 3): FightJudgement => ({
  unit,
  hit,
  grade: hit ? grade : null,
  perfect: false,
});
const play = (state: BossFightState, strums: FightJudgement[]) => strums.reduce(applyJudgement, state);
/** Strums `from` to `to`, all clean. */
const run = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => strum(from + i));

/** A big sword and a tough boss, so strikes don't get in the way of what is tested. */
const quiet = { chargeMax: 1000, bossHp: 10_000 };

describe("the colossus's fight", () => {
  it("deals chord phases, the next one too", () => {
    const fight = createFight(7, "chords");
    expect(fight.plan.kind).toBe("chords");
    const broken = play({ ...fight, bossHp: 1, chargeMax: 1 }, [strum(0)]);
    expect(broken.holding).toBe(true);
    expect(broken.plan.kind).toBe("chords");
    expect(broken.plan.index).toBe(1);
  });

  it("reaches the double multiplier on a shorter streak of changes", () => {
    const fight = chordFightWith();
    expect(fightMultiplier({ ...fight, combo: CHORD_MULTIPLIER_STREAK })).toBe(2);
    expect(fightMultiplier({ ...fight, combo: CHORD_MULTIPLIER_STREAK / 2 })).toBe(1.5);
    expect(fightMultiplier({ ...fight, boons: { momentum: 1 }, combo: CHORD_MULTIPLIER_STREAK / 2 })).toBe(2);
  });

  it("reads its rhythm in halves or quarters", () => {
    expect(rhythmKeyOf(chordFightWith().plan)).toBe("subdivision.halves");
  });
});

describe("quakes", () => {
  it("are blocked when every chord of them is clean, half-charging the sword", () => {
    const s = play(chordFightWith(quiet), run(0, 11));
    expect(s.slamTick).toBe(1);
    expect(s.lastSlam).toEqual({ blocked: true, damage: 0 });
    expect(s.blocks).toBe(1);
    expect(s.charge).toBe(12 * 3 + Math.round(1000 * COUNTER_CHARGE));
  });

  it("land when a chord of them is missed", () => {
    const strums = run(0, 11).map((s) => (s.unit === 6 ? strum(6, false) : s));
    const s = play(chordFightWith(quiet), strums);
    expect(s.lastSlam).toEqual({ blocked: false, damage: QUAKE_DAMAGE });
    expect(s.playerHp).toBe(100 - FIXTURE_RULES.biteDamage - QUAKE_DAMAGE);
  });

  it("wait for a miss that comes in after the strum that followed it", () => {
    // Strum 10 is missed — but a miss is only settled once its window has
    // passed, after strum 11 was already heard.
    const s = play(chordFightWith(quiet), [...run(4, 9), strum(11), strum(10, false)]);
    expect(s.slamTick).toBe(1);
    expect(s.lastSlam?.blocked).toBe(false);
  });

  it("let one miss through with Steady hand", () => {
    const steady = { ...chordFightWith(quiet), boons: { steadyHand: 1 } };
    const one = play(steady, run(4, 11).map((s) => (s.unit === 5 ? strum(5, false) : s)));
    expect(one.lastSlam?.blocked).toBe(true);
    const two = play(
      steady,
      run(4, 11).map((s) => (s.unit === 5 || s.unit === 7 ? strum(s.unit!, false) : s)),
    );
    expect(two.lastSlam?.blocked).toBe(false);
    expect(BOON.steadyHandQuakeMisses).toBe(1);
  });

  it("start their count over when the pass comes round again", () => {
    const s = play(chordFightWith(quiet), [strum(4), strum(5), strum(4)]);
    expect(s.quakeJudged).toEqual([4]);
    expect(s.slamTick).toBe(0);
  });

  it("are called out a bar ahead, then counted down strum by strum", () => {
    const fight = chordFightWith(quiet);
    expect(quakeWarning(fight)).toBeNull();
    // After strum 2 the next is strum 3, two beats before the quake.
    expect(quakeWarning(play(fight, [strum(2)]))).toEqual({ stage: "coming", left: 2, total: 4 });
    expect(quakeWarning(play(fight, [strum(3)]))).toEqual({ stage: "on", left: 8, total: 8 });
    expect(quakeWarning(play(fight, [strum(3), strum(4), strum(5)]))).toEqual({
      stage: "on",
      left: 6,
      total: 8,
    });
    expect(quakeWarning(play(fight, run(3, 11)))).toBeNull();
  });

  it("don't wind the alerts back for a late miss", () => {
    const s = play(chordFightWith(quiet), [strum(5), strum(4, false)]);
    expect(s.lastUnit).toBe(5);
    expect(nextStrum(s)).toBe(6);
  });
});

describe("the weak change", () => {
  it("charges the sword twice as fast when played clean", () => {
    const fight = chordFightWith(quiet, { weakChange: "G>C" });
    expect(play(fight, [strum(1)]).charge).toBe(6);
    expect(play(fight, [strum(2)]).charge).toBe(3);
    expect(play({ ...fight, boons: { exploit: 1 } }, [strum(1)]).charge).toBe(9);
  });

  it("is the change missed most this run, counted as the misses come", () => {
    const s = play(chordFightWith(quiet), [strum(2, false), strum(2, false), strum(1, false)]);
    expect(s.changeMisses).toEqual({ "C>D": 2, "G>C": 1 });
    const plan = { ...s.plan, weakSpots: true };
    expect(weakChangeFor(plan, s.changeMisses, s.runSeed)).toBe("C>D");
  });

  it("is drawn from the run's seed before any misses, and only once weak spots are on", () => {
    const plan = { ...generateChordPhase(3, 4), weakSpots: true };
    const picked = weakChangeFor(plan, {}, 3);
    expect(picked).not.toBeNull();
    expect(weakChangeFor(plan, {}, 3)).toBe(picked);
    expect(weakChangeFor({ ...plan, weakSpots: false }, {}, 3)).toBeNull();
  });
});

describe("boons on the colossus", () => {
  it("take effect the same way", () => {
    const fight = { ...chordFightWith(), draft: ["armor" as const, "shield" as const, "bandage" as const] };
    expect(pickBoon(fight, "shield").shieldCharges).toBe(BOON.shieldCharges);
  });
});
