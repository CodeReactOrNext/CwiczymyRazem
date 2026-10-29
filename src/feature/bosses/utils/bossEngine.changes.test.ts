import { describe, expect, it } from "vitest";

import { changesPlayhead, onPlayhead, useBossFightStore } from "../store/bossFightStore";
import type { ChordUnit } from "../types/boss.types";
import type { BossFightState } from "./bossEngine";
import {
  applyJudgement,
  CHANGES_MULTIPLIER_STREAK,
  COMBO_MAX_MULTIPLIER,
  comboMultiplier,
  createFight,
  multiplierStreakFor,
  PLAYER_MAX_HP,
  QUAKE_DAMAGE,
  quakeWarning,
  rhythmKeyOf,
  trickPoints,
  WEAK_SPOT_CHARGE,
} from "./bossEngine";
import { chordRoot, chordScale, chordTones } from "./changesHarmony";
import type { ChangeTrick } from "./changesJudge";
import { generateChangesPhase } from "./changesPhaseGenerator";

const SEED = 42;

/** The root of a chord, sounding an octave above middle C's. */
const rootHz = (chord: string) => 440 * 2 ** ((60 + (chordRoot(chord) ?? 0) - 69) / 12);

/** A changeling fight on a known pass — C and G, a bar each, a rush over bars 3 and 4 when asked. */
const changesFight = ({ index = 0, rush = false } = {}): BossFightState => {
  const base = createFight(SEED, "changes");
  const dealt = generateChangesPhase(SEED, index);
  const units: ChordUnit[] = [
    { chord: "C", beats: 4, quake: false },
    { chord: "G", beats: 4, quake: false },
    ...(rush
      ? [
          { chord: "C", beats: 2, quake: true },
          { chord: "G", beats: 2, quake: true },
          { chord: "C", beats: 2, quake: true },
          { chord: "G", beats: 2, quake: true },
        ]
      : []),
  ];
  const plan = {
    ...dealt,
    quakes: rush,
    variation: { ...dealt.variation, progression: ["C", "G"], units },
  };
  return { ...base, plan, bossHp: 5000, bossMaxHp: 5000, chargeMax: 1000 };
};

const note = (unit: number, extra: { weak?: boolean; perfect?: boolean } = {}) => ({
  hit: true,
  grade: 3 as const,
  perfect: extra.perfect ?? false,
  unit,
  weak: extra.weak ?? false,
});
const settle = (unit: number, landed: boolean) => ({
  hit: landed,
  grade: landed ? (3 as const) : null,
  perfect: false,
  unit,
  settle: true,
});

describe("the changeling's fight", () => {
  it("deals its own kind of phase", () => {
    const fight = createFight(SEED, "changes");
    expect(fight.plan.kind).toBe("changes");
    expect(multiplierStreakFor(fight.plan)).toBe(CHANGES_MULTIPLIER_STREAK);
    expect(rhythmKeyOf(fight.plan)).toBe("changes_rhythm.bar");
  });

  it("charges the sword on a chord tone, four points right on the change", () => {
    let fight = changesFight();
    fight = applyJudgement(fight, note(0));
    expect(fight.charge).toBe(3);
    fight = applyJudgement(fight, note(0, { perfect: true }));
    expect(fight.charge).toBe(7);
    expect(fight.combo).toBe(2);
  });

  it("pays a landed chord nothing more, and bites on one let go by", () => {
    let fight = applyJudgement(changesFight(), note(0));
    const landed = applyJudgement(fight, settle(0, true));
    expect(landed.playerHp).toBe(PLAYER_MAX_HP);
    expect(landed.charge).toBe(fight.charge);
    expect(landed.hits).toBe(fight.hits);

    fight = applyJudgement(landed, settle(1, false));
    expect(fight.playerHp).toBeLessThan(PLAYER_MAX_HP);
    expect(fight.combo).toBe(0);
    expect(fight.charge).toBe(0);
    expect(fight.misses).toBe(1);
  });

  it("charges guide tones double once weak spots open", () => {
    const early = applyJudgement(changesFight({ index: 0 }), note(0, { weak: true }));
    expect(early.charge).toBe(3);
    const later = applyJudgement(changesFight({ index: 5 }), note(0, { weak: true }));
    expect(later.charge).toBe(3 * WEAK_SPOT_CHARGE);
  });

  it("blocks a rush when every chord in it lands", () => {
    let fight = changesFight({ rush: true });
    fight = applyJudgement(fight, settle(0, true));
    fight = applyJudgement(fight, settle(1, true));
    expect(quakeWarning(fight)).toMatchObject({ stage: "on", left: 4 });
    for (const unit of [2, 3, 4, 5]) fight = applyJudgement(fight, settle(unit, true));
    expect(fight.lastSlam).toEqual({ blocked: true, damage: 0 });
    expect(fight.blocks).toBe(1);
    expect(fight.playerHp).toBe(PLAYER_MAX_HP);
  });

  it("lands the rush on the player when a chord in it slips", () => {
    let fight = changesFight({ rush: true });
    for (const unit of [0, 1, 2]) fight = applyJudgement(fight, settle(unit, true));
    fight = applyJudgement(fight, settle(3, false));
    const hpBefore = fight.playerHp;
    for (const unit of [4, 5]) fight = applyJudgement(fight, settle(unit, true));
    expect(fight.lastSlam).toEqual({ blocked: false, damage: QUAKE_DAMAGE });
    expect(fight.playerHp).toBe(hpBefore - QUAKE_DAMAGE);
  });
});

describe("the changeling's combo", () => {
  const landing = (unit: number, tricks: ChangeTrick[]) => ({ ...note(unit), landing: true, tricks });
  const miss = (unit: number) => ({ hit: false, grade: null, perfect: false, unit });
  const play = (fight: BossFightState, ...judgements: Parameters<typeof applyJudgement>[1][]) =>
    judgements.reduce(applyJudgement, fight);

  it("strings tricks change after change and pays them out when the progression comes round", () => {
    // A bar a chord: a trick is worth trickPoints(4).
    const worth = trickPoints(4);
    const strung = play(changesFight(), landing(0, ["onTheOne", "smooth"]));
    expect(strung.changeCombo).toEqual({ tricks: ["onTheOne", "smooth"], points: 2 * worth });
    expect(strung).toMatchObject({ trickTick: 1, onTheOnes: 1, smoothChanges: 1, bossHp: 5000 });

    // G is the pass's last chord: the combo of three tricks pays ×3.
    const paid = play(strung, landing(1, ["onTheOne"]));
    expect(paid.changeCombo).toBeNull();
    expect(paid.lastCombo).toMatchObject({ points: 3 * worth, multiplier: 3, value: 9 * worth });
    expect(paid).toMatchObject({ bankTick: 1, bestCombo: 9 * worth, bossHp: 5000 - 9 * worth });
  });

  it("pays out what there is when a chord lands without a trick", () => {
    const fight = play(changesFight({ rush: true }), landing(0, ["smooth"]), landing(1, []));
    expect(fight.changeCombo).toBeNull();
    expect(fight.bankTick).toBe(1);
    expect(fight.bossHp).toBe(5000 - trickPoints(4));
  });

  it("caps the multiplier", () => {
    const fight = play(
      changesFight({ rush: true }),
      ...[0, 1, 2, 3, 4].map((unit) => landing(unit, ["onTheOne", "smooth"])),
    );
    expect(fight.changeCombo?.tricks).toHaveLength(10);
    expect(comboMultiplier(fight.changeCombo!)).toBe(COMBO_MAX_MULTIPLIER);
  });

  it("loses the combo to a miss, or a chord let go by", () => {
    const strung = play(changesFight({ rush: true }), landing(0, ["onTheOne"]));
    for (const lost of [play(strung, miss(0)), play(strung, settle(1, false))]) {
      expect(lost.changeCombo).toBeNull();
      expect(lost).toMatchObject({ bailTick: 1, bankTick: 0, bossHp: 5000 });
      expect(lost.lastCombo).toMatchObject({ points: trickPoints(4), multiplier: 1 });
    }
  });

  it("pays out a combo still being strung when a strike breaks the phase, the striking note's tricks with it", () => {
    const worth = trickPoints(4);
    const strung = play(changesFight({ rush: true }), landing(0, ["onTheOne"]));
    // One more note fills the sword and breaks the phase.
    const ready = { ...strung, bossHp: 1, chargeMax: 4, charge: 3 };
    const broken = play(ready, landing(1, ["smooth"]));
    expect(broken).toMatchObject({ holding: true, phaseTick: 1, changeCombo: null, bankTick: 1 });
    expect(broken.lastCombo).toMatchObject({ points: 2 * worth, multiplier: 2, value: 4 * worth });
    expect(broken.bestCombo).toBe(4 * worth);
    expect(broken.smoothChanges).toBe(1);
  });

  it("keeps it through a miss second wind forgives", () => {
    const strung = play({ ...changesFight({ rush: true }), forgivenLeft: 1 }, landing(0, ["onTheOne"]));
    const forgiven = play(strung, miss(0));
    expect(forgiven.changeCombo).toEqual(strung.changeCombo);
    expect(forgiven.bailTick).toBe(0);
  });
});

describe("the store's free play", () => {
  it("turns the notes heard into the fight", () => {
    const store = useBossFightStore.getState();
    store.enterFight("changes", { seed: SEED });
    const { plan } = useBossFightStore.getState().fight;
    if (plan.kind !== "changes") throw new Error("not a changes fight");
    const first = plan.variation.units[0].chord;
    const msPerBeat = 60000 / plan.variation.bpm;
    const root = chordRoot(first);
    const hz = rootHz(first);

    store.feedFreePlay({ beat: 0, msPerBeat, attacks: [], tuningShift: 0 });
    store.feedFreePlay({ beat: 0.5, msPerBeat, attacks: [{ beat: 0.1, pitchHz: hz }], tuningShift: 0 });
    const { fight, changesLive } = useBossFightStore.getState();
    expect(fight.hits).toBe(1);
    expect(fight.charge).toBe(4);
    expect(changesLive.unit).toBe(0);
    expect(changesLive.lastNote).toMatchObject({ pc: root, role: "root", counted: true });
  });

  it("charges 1 for a note of the scale between the strong beats, and bites on one on a strong beat", () => {
    const store = useBossFightStore.getState();
    store.enterFight("changes", { seed: SEED });
    const { plan } = useBossFightStore.getState().fight;
    if (plan.kind !== "changes") throw new Error("not a changes fight");
    const { units } = plan.variation;
    const first = units[0].chord;
    // A note of the key the first chord hasn't got, an octave above middle C.
    const pc = [...chordScale(first, plan.variation.key)].find((p) => !chordTones(first).includes(p))!;
    const hz = 440 * 2 ** ((72 + pc - 69) / 12);
    const msPerBeat = 60000 / plan.variation.bpm;

    store.feedFreePlay({ beat: 0, msPerBeat, attacks: [], tuningShift: 0 });
    store.feedFreePlay({ beat: 1.2, msPerBeat, attacks: [{ beat: 1, pitchHz: hz }], tuningShift: 0 });
    expect(useBossFightStore.getState().fight).toMatchObject({ hits: 1, charge: 1, misses: 0 });

    store.feedFreePlay({ beat: 2.2, msPerBeat, attacks: [{ beat: 2, pitchHz: hz * 2 }], tuningShift: 0 });
    expect(useBossFightStore.getState().fight).toMatchObject({ hits: 1, charge: 0, misses: 1 });
    expect(useBossFightStore.getState().changesLive.strongBeats).toEqual({ "0:2": false });
  });

  it("forgets where the run was once the phase breaks", () => {
    const store = useBossFightStore.getState();
    store.enterFight("changes", { seed: SEED });
    const { fight } = useBossFightStore.getState();
    if (fight.plan.kind !== "changes") throw new Error("not a changes fight");
    // One strike from the end of the phase.
    useBossFightStore.setState({ fight: { ...fight, bossHp: 1, chargeMax: 3 } });
    const msPerBeat = 60000 / fight.plan.variation.bpm;
    store.feedFreePlay({ beat: 4, msPerBeat, attacks: [], tuningShift: 0 });
    expect(useBossFightStore.getState().changesLive.unit).toBe(1);

    // The first chord's root as the pass comes round: it strikes, and the phase breaks.
    const hz = rootHz(fight.plan.variation.units[0].chord);
    const passBeats = fight.plan.variation.units.reduce((sum, unit) => sum + unit.beats, 0);
    for (let beat = 4.5; beat < passBeats; beat += 0.5) {
      store.feedFreePlay({ beat, msPerBeat, attacks: [], tuningShift: 0 });
    }
    store.feedFreePlay({
      beat: passBeats + 0.2,
      msPerBeat,
      attacks: [{ beat: passBeats + 0.1, pitchHz: hz }],
      tuningShift: 0,
    });
    const after = useBossFightStore.getState();
    expect(after.fight.holding).toBe(true);
    expect(after.changesLive.unit).toBeNull();
  });

  it("moves the board's playhead as the run moves, and only then", () => {
    const store = useBossFightStore.getState();
    store.enterFight("changes", { seed: SEED });
    const { fight } = useBossFightStore.getState();
    if (fight.plan.kind !== "changes") throw new Error("not a changes fight");
    const msPerBeat = 60000 / fight.plan.variation.bpm;
    const moves: (number | null)[] = [];
    const stop = onPlayhead(() => moves.push(changesPlayhead.beat));
    store.feedFreePlay({ beat: 1, msPerBeat, attacks: [], tuningShift: 0 });
    store.feedFreePlay({ beat: 1, msPerBeat, attacks: [], tuningShift: 0 });
    store.feedFreePlay({ beat: 1.5, msPerBeat, attacks: [], tuningShift: 0 });
    // Between phases nothing plays: the playhead goes, once.
    useBossFightStore.setState({ fight: { ...useBossFightStore.getState().fight, holding: true } });
    store.feedFreePlay({ beat: 2, msPerBeat, attacks: [], tuningShift: 0 });
    store.feedFreePlay({ beat: 2.5, msPerBeat, attacks: [], tuningShift: 0 });
    stop();
    store.feedFreePlay({ beat: 3, msPerBeat, attacks: [], tuningShift: 0 });
    expect(moves).toEqual([1, 1.5, null]);
  });
});
