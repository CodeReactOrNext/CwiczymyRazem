import { describe, expect, it } from "vitest";

import type { BossFightState } from "./bossEngine";
import { applyJudgement, biteDamageFor, createFight, dealPhase, phaseBpm, runScore } from "./bossEngine";
import { EMPTY_RECORD } from "./bossProgress";
import {
  DIFFICULTY,
  GATE_HP,
  isGatePhase,
  nextSavepoint,
  parseDifficulty,
  savepointsFor,
  validStart,
} from "./difficulty";
import { generatePhase } from "./phaseGenerator";

const SEED = 42;
const miss = { hit: false, grade: null, perfect: false } as const;

describe("difficulty", () => {
  it("reads anything unknown as normal", () => {
    expect(parseDifficulty("brutal")).toBe("brutal");
    expect(parseDifficulty("nightmare")).toBe("normal");
    expect(parseDifficulty(undefined)).toBe("normal");
  });

  it("scales what a bite costs", () => {
    const normal = createFight(SEED);
    const hard = createFight(SEED, "spider", { difficulty: "hard" });
    const easy = createFight(SEED, "spider", { difficulty: "easy" });
    const bite = (fight: BossFightState) => fight.playerHp - applyJudgement(fight, miss).playerHp;
    expect(bite(hard)).toBe(Math.round(normal.plan.rules.biteDamage * DIFFICULTY.hard.damage));
    expect(bite(easy)).toBe(Math.max(1, Math.round(normal.plan.rules.biteDamage * DIFFICULTY.easy.damage)));
    expect(bite(hard)).toBeGreaterThan(bite(normal));
    expect(biteDamageFor(hard, 0)).toBe(bite(hard));
  });

  it("scales the tempo", () => {
    const normal = createFight(SEED);
    const brutal = createFight(SEED, "spider", { difficulty: "brutal" });
    expect(phaseBpm(brutal)).toBe(Math.round(normal.plan.variation.bpm * DIFFICULTY.brutal.tempo));
    expect(phaseBpm(createFight(SEED, "spider", { difficulty: "easy" }))).toBeLessThan(phaseBpm(normal));
  });

  it("scales the score", () => {
    const hard = { ...createFight(SEED, "spider", { difficulty: "hard" }), totalDamage: 1000 };
    expect(runScore(hard)).toMatchObject({ dealt: 1000, skipped: 0, multiplier: 1.5, total: 1500 });
  });
});

describe("gates", () => {
  it("guards every fifth phase with more HP", () => {
    expect([4, 5, 6, 10, 15].map(isGatePhase)).toEqual([false, true, false, true, true]);
    const plain = generatePhase(SEED, 4);
    const gate = dealPhase("spider", SEED, 4);
    expect(gate.gate).toBe(true);
    expect(gate.rules.bossHp).toBe(Math.round((plain.rules.bossHp * GATE_HP) / 10) * 10);
    expect(gate.rules.biteDamage).toBeGreaterThan(plain.rules.biteDamage);
    expect(dealPhase("spider", SEED, 5).gate).toBeUndefined();
  });
});

describe("savepoints", () => {
  it("opens every gate reached, on that difficulty and the easier ones", () => {
    expect(savepointsFor(EMPTY_RECORD, "normal")).toEqual([1]);
    const record = { reached: { normal: 12, hard: 6 } };
    expect(savepointsFor(record, "easy")).toEqual([1, 5, 10]);
    expect(savepointsFor(record, "normal")).toEqual([1, 5, 10]);
    expect(savepointsFor(record, "hard")).toEqual([1, 5]);
    expect(savepointsFor(record, "brutal")).toEqual([1]);
    expect(nextSavepoint(record, "hard")).toBe(10);
    expect(nextSavepoint(record, "brutal")).toBe(5);
  });

  it("only lets a run start where the record has opened", () => {
    const record = { reached: { normal: 12 } };
    expect(validStart(record, "normal", "10")).toBe(10);
    expect(validStart(record, "normal", "15")).toBe(1);
    expect(validStart(record, "hard", "10")).toBe(1);
    expect(validStart(record, "normal", undefined)).toBe(1);
  });

  it("starts a run at its savepoint and banks the skipped phases once that one is cleared", () => {
    const fight = createFight(SEED, "spider", { startPhase: 10 });
    expect(fight.plan.index).toBe(9);
    expect(fight.plan.gate).toBe(true);
    expect(fight.startPhase).toBe(10);
    const skipped = Array.from({ length: 9 }, (_, i) => dealPhase("spider", SEED, i).rules.bossHp).reduce(
      (sum, hp) => sum + hp,
      0,
    );
    expect(fight.skippedHp).toBe(skipped);

    const fell = { ...fight, totalDamage: 300 };
    expect(runScore(fell)).toMatchObject({ banked: false, total: 300 });
    const cleared = { ...fell, phaseLog: [{ phase: 10, bpm: 100, rhythm: "", damageTaken: 0, hpEnd: 100, hits: 0, misses: 0 }] };
    expect(runScore(cleared)).toMatchObject({ banked: true, total: 300 + skipped });
  });
});
