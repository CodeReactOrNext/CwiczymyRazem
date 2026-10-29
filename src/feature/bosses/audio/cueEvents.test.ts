import { CHANGES_ENERGY_FLOOR } from "feature/autoBacking/bossBacking";
import { describe, expect, it } from "vitest";

import { createFight } from "../utils/bossEngine";
import { chordFightWith, fightWith,FIXTURE_SEED } from "../utils/fightFixtures";
import type { CueEvent } from "./cueEvents";
import { cueEvents, musicEnergy } from "./cueEvents";

/** The sounds of a change, the music it steers left out. */
const sounds = (events: CueEvent[]) =>
  events.filter((e) => e.kind !== "energy" && e.kind !== "tension" && e.kind !== "danger");

describe("the music of a run", () => {
  it("plays the bare pulse after a miss, more of the score the longer the streak", () => {
    const fight = fightWith();
    expect(musicEnergy({ ...fight, combo: 0 })).toBe(1);
    expect(musicEnergy({ ...fight, combo: 5 })).toBe(2);
    expect(musicEnergy({ ...fight, combo: 24 })).toBe(3);
    expect(musicEnergy({ ...fight, combo: 48 })).toBe(4);
    // Late in the fight a miss can only strip it so far.
    expect(musicEnergy({ ...fight, combo: 0, plan: { ...fight.plan, index: 6 } })).toBe(2);
  });

  it("keeps the changeling's groove through a miss, moving the band on 1 and 3", () => {
    const fight = { ...createFight(FIXTURE_SEED, "changes"), combo: 48 };
    expect(musicEnergy({ ...fight, combo: 0 })).toBe(CHANGES_ENERGY_FLOOR);
    expect(cueEvents({ ...fight, combo: 0 }, fight)).toContainEqual({
      kind: "energy",
      level: CHANGES_ENERGY_FLOOR,
      drop: true,
      everyBeats: 2,
    });
  });

  it("drops the band at once on a miss and builds it on the beat", () => {
    const fight = { ...fightWith(), combo: 30 };
    expect(cueEvents({ ...fight, combo: 0 }, fight)).toContainEqual({ kind: "energy", level: 1, drop: true });
    expect(cueEvents({ ...fight, combo: 40 }, fight)).toContainEqual({ kind: "energy", level: 4, drop: false });
  });

  it("builds tension with the sword and calls the danger of low HP", () => {
    const fight = fightWith();
    expect(cueEvents({ ...fight, charge: 6 }, fight)).toContainEqual({ kind: "tension", amount: 6 / fight.chargeMax });
    expect(cueEvents({ ...fight, playerHp: 20 }, fight)).toContainEqual({ kind: "danger", on: true });
  });

  it("starts a new run from the bare pulse, calm", () => {
    const fight = { ...fightWith(), combo: 30, playerHp: 10 };
    expect(cueEvents({ ...fight, runSeed: fight.runSeed + 1, combo: 0, playerHp: 100 }, fight)).toEqual([
      { kind: "energy", level: 1, drop: true },
      { kind: "tension", amount: 0 },
      { kind: "danger", on: false },
    ]);
  });
});

describe("cueEvents", () => {
  it("sounds a strike, a block and a slam that lands", () => {
    const fight = fightWith();
    expect(sounds(cueEvents({ ...fight, strikeTick: 1 }, fight))).toEqual([{ kind: "now", cue: "strike", tick: 1 }]);
    expect(sounds(cueEvents({ ...fight, slamTick: 1, lastSlam: { blocked: true, damage: 0 } }, fight))).toEqual([
      { kind: "now", cue: "block" },
    ]);
    expect(sounds(cueEvents({ ...fight, slamTick: 1, lastSlam: { blocked: false, damage: 15 } }, fight))).toEqual([
      { kind: "now", cue: "impact" },
    ]);
  });

  it("answers a bite that hurts, not one a shield caught", () => {
    const fight = fightWith();
    expect(sounds(cueEvents({ ...fight, biteTick: 1, lastBite: 7 }, fight))).toEqual([{ kind: "now", cue: "hurt" }]);
    expect(sounds(cueEvents({ ...fight, biteTick: 1, lastBite: 0, lastBiteCaught: "shield" }, fight))).toEqual([]);
  });

  it("strikes a gong for a gate and sighs for any other new phase", () => {
    const fight = fightWith();
    const broke = { ...fight, phaseTick: 1, holding: true };
    expect(sounds(cueEvents(broke, fight))).toEqual([{ kind: "now", cue: "molt" }]);
    expect(sounds(cueEvents({ ...broke, plan: { ...broke.plan, gate: true } }, fight))).toEqual([
      { kind: "now", cue: "gate" },
    ]);
  });

  it("mourns a lost run, and keeps a new one silent", () => {
    const fight = fightWith();
    expect(sounds(cueEvents({ ...fight, outcome: "lost" }, fight))).toEqual([{ kind: "now", cue: "defeat" }]);
    expect(sounds(cueEvents({ ...fight, runSeed: fight.runSeed + 1, strikeTick: 3 }, fight))).toEqual([]);
  });

  it("counts a slam in the moment its wind-up starts", () => {
    const fight = fightWith({ slamWindup: 4 }, { slams: true });
    if (fight.plan.kind !== "spider") throw new Error("not a spider fight");
    const before = { ...fight, notesToSlam: 5 };
    const winding = { ...fight, notesToSlam: 4 };
    expect(sounds(cueEvents(winding, before))).toEqual([
      { kind: "slamCountdown", beatsAway: 4 / fight.plan.variation.notesPerBeat },
    ]);
    // Only once.
    expect(sounds(cueEvents({ ...winding, notesToSlam: 3 }, winding))).toEqual([]);
  });

  it("counts into the pass's next quake once it is called", () => {
    const fight = chordFightWith();
    // G C D G at half notes, then the quake from beat 8 of a 16-beat pass.
    const coming = { ...fight, lastUnit: 2 };
    expect(sounds(cueEvents(coming, fight))).toEqual([{ kind: "quakeCountdown", starts: [8], passBeats: 16 }]);
    expect(sounds(cueEvents({ ...coming, lastUnit: 3 }, coming))).toEqual([]);
  });
});
