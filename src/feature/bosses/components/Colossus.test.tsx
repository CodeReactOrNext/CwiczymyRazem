// @vitest-environment jsdom

import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { COLOSSUS } from "../data/colossus";
import { useBossFight } from "../hooks/useBossFight";
import { useBossFightStore } from "../store/bossFightStore";
import type { BossFightState } from "../utils/bossEngine";
import { applyJudgement } from "../utils/bossEngine";
import { EMPTY_RECORD } from "../utils/bossProgress";
import { dealUnits, generateChordPhase } from "../utils/chordPhaseGenerator";
import { chordNotes } from "../utils/chordTab";
import { chordFightWith } from "../utils/fightFixtures";
import { BossArena } from "./BossArena";
import { BossDraft } from "./BossDraft";
import { BossWebOverlay } from "./BossWebOverlay";

vi.mock("store/hooks", () => ({
  useAppSelector: () => undefined,
  useAppDispatch: () => vi.fn(),
}));

const quiet = { chargeMax: 1000, bossHp: 10_000 };
const strum = (unit: number) => ({ unit, hit: true, grade: 3 as const, perfect: false });
const tone = (noteKey: string, hit = true) => ({
  noteKey,
  hit,
  grade: hit ? (3 as const) : null,
  perfect: false,
  combo: 0,
});

const renderArena = (fight: BossFightState) => {
  useBossFightStore.setState({ fight, draftOpen: false });
  return render(<BossArena boss={COLOSSUS} record={EMPTY_RECORD} />);
};

describe("the colossus in the arena", () => {
  afterEach(cleanup);

  it("names itself and reads its rhythm in half notes", () => {
    renderArena(chordFightWith());
    expect(screen.getByText("The Stone Colossus")).toBeTruthy();
    expect(screen.getByText(/BPM · half notes/)).toBeTruthy();
    expect(screen.getByLabelText("Fists")).toBeTruthy();
    expect(screen.getByLabelText("Quakes")).toBeTruthy();
  });

  it("calls a quake out a bar ahead, then counts its chords down", () => {
    const fight = chordFightWith(quiet);
    renderArena(applyJudgement(fight, strum(2)));
    expect(screen.getByText("Quake in a bar — the changes come twice as fast")).toBeTruthy();
    cleanup();
    renderArena(applyJudgement(fight, strum(3)));
    expect(screen.getByText("Quake — play every chord clean · 8 left")).toBeTruthy();
  });

  it("shows its weak change, and calls it when it is next", () => {
    // No quake in this pass — a quake coming would be called out first.
    const units = dealUnits(["G", "C", "D"], 2, 4, []);
    const fight = chordFightWith(quiet, { units, weakChange: "C>D" });
    renderArena(applyJudgement(fight, strum(1)));
    expect(screen.getByText("C → D")).toBeTruthy();
    expect(screen.getByText("Weak change now: C → D — sword ×2")).toBeTruthy();
  });
});

describe("petrify", () => {
  afterEach(cleanup);

  it("turns the tab to stone, leaving only the progression", () => {
    useBossFightStore.setState({ fight: { ...chordFightWith({}, { affixes: ["web"] }), webNotes: 3 } });
    render(<BossWebOverlay boss={COLOSSUS} />);
    expect(screen.getByText("G → C → D")).toBeTruthy();
    expect(screen.getByText("Petrified — play the progression from memory")).toBeTruthy();
  });
});

describe("the colossus's draft", () => {
  afterEach(cleanup);

  it("briefs the next progression in chord shapes, and words the cards its own way", () => {
    const previousPlan = generateChordPhase(11, 4);
    const plan = generateChordPhase(11, 5);
    useBossFightStore.setState({
      fight: {
        ...chordFightWith(),
        plan,
        previousPlan,
        previousBpm: previousPlan.variation.bpm,
        holding: true,
        draft: ["steadyHand", "antidote", "armor"],
      },
      draftOpen: true,
    });
    render(<BossDraft boss={COLOSSUS} />);
    expect(screen.getByText(/^Changes come \d+% (faster|slower)$|^Changes come at the same speed$/)).toBeTruthy();
    expect(screen.getByText("power chords")).toBeTruthy();
    for (const chord of plan.variation.progression) expect(screen.getByLabelText(chord)).toBeTruthy();
    expect(screen.getByText("Misses a quake allows 0 → 1")).toBeTruthy();
    expect(screen.getByText("Dust mask")).toBeTruthy();
    expect(screen.getByText("Counters: Quakes")).toBeTruthy();
  });
});

describe("the colossus's fight in the store", () => {
  it("gathers a chord's tones into one strum", () => {
    const onRunEnd = vi.fn();
    renderHook(() => useBossFight({ boss: COLOSSUS, record: EMPTY_RECORD, difficulty: "normal", startPhase: 1, onRunEnd }));
    act(() => useBossFightStore.setState({ fight: chordFightWith(quiet) }));
    const tones = chordNotes("G").map((_, i) => `0-0-${i}`);
    expect(tones).toHaveLength(6);

    act(() => tones.slice(0, 4).forEach((key) => useBossFightStore.getState().judge(tone(key))));
    expect(useBossFightStore.getState().fight.hits).toBe(0);
    // Five of six heard: the strum is clean, the sixth string forgiven.
    act(() => useBossFightStore.getState().judge(tone(tones[4])));
    expect(useBossFightStore.getState().fight.hits).toBe(1);
    expect(useBossFightStore.getState().fight.charge).toBe(3);
    act(() => useBossFightStore.getState().judge(tone(tones[5], false)));
    expect(useBossFightStore.getState().fight.misses).toBe(0);
  });

  it("deals the colossus's own fight on entry", () => {
    const onRunEnd = vi.fn();
    const { result } = renderHook(() => useBossFight({ boss: COLOSSUS, record: EMPTY_RECORD, difficulty: "normal", startPhase: 1, onRunEnd }));
    expect(result.current.plan.kind).toBe("chords");
  });
});
