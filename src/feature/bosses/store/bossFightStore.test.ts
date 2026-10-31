import { describe, expect, it } from "vitest";

import type { PhaseRecord } from "../utils/bossEngine";
import { sessionClearedPhase, useBossFightStore } from "./bossFightStore";

/** The fight as if it had cleared phases up to `phase`. */
const clearUpTo = (phase: number) => {
  const { fight } = useBossFightStore.getState();
  const phaseLog = Array.from({ length: phase }, (_, i) => ({ phase: i + 1 }) as PhaseRecord);
  useBossFightStore.setState({ fight: { ...fight, phaseLog } });
};

describe("sessionClearedPhase", () => {
  it("is 0 until a phase is cleared", () => {
    useBossFightStore.getState().enterFight("spider", { seed: 1 });
    expect(sessionClearedPhase(useBossFightStore.getState())).toBe(0);
  });

  it("keeps the furthest phase over every run of the fight", () => {
    useBossFightStore.getState().enterFight("spider", { seed: 1 });
    clearUpTo(6);
    useBossFightStore.getState().newRun(2);
    clearUpTo(3);
    expect(sessionClearedPhase(useBossFightStore.getState())).toBe(6);
  });

  it("starts over when a fight is entered again", () => {
    useBossFightStore.getState().enterFight("spider", { seed: 1 });
    clearUpTo(6);
    useBossFightStore.getState().enterFight("spider", { seed: 2 });
    expect(sessionClearedPhase(useBossFightStore.getState())).toBe(0);
  });
});

describe("missShot", () => {
  const note = (noteKey: string, hit: boolean) => ({
    noteKey,
    hit,
    grade: hit ? (3 as const) : null,
    perfect: false,
    combo: hit ? 1 : 0,
  });

  it("names the note a bite was for, and nothing for a hit", () => {
    useBossFightStore.getState().enterFight("spider", { seed: 1 });
    useBossFightStore.getState().judge(note("0-0-0", true));
    expect(useBossFightStore.getState().missShot).toBeNull();
    useBossFightStore.getState().judge(note("0-1-0", false));
    const { missShot, fight } = useBossFightStore.getState();
    expect(missShot).toEqual({ noteKey: "0-1-0", biteTick: fight.biteTick });
  });
});
