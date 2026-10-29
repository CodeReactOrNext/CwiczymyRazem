// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import type { NoteJudgement } from "feature/exercisePlan/views/PracticeSession/hooks/useNoteMatching";
import { afterEach, describe, expect, it, vi } from "vitest";

import { bossCuePlayer } from "../audio/bossCuePlayer";
import { FRETWEAVER } from "../data/fretweaver";
import { useBossFightStore } from "../store/bossFightStore";
import type { BossRecord } from "../types/boss.types";
import type { BossFightState } from "../utils/bossEngine";
import { PHASE_HEAL, SLAM_DAMAGE } from "../utils/bossEngine";
import { fightWith } from "../utils/fightFixtures";
import { BossArena } from "./BossArena";

vi.mock("store/hooks", () => ({
  useAppSelector: () => undefined,
  useAppDispatch: () => vi.fn(),
}));

const NO_RECORD: BossRecord = { bestPhase: 0, bestDamage: 0, bestScore: 0, reached: {}, runs: 0 };

const note = (hit: boolean): NoteJudgement => ({
  noteKey: "0-0-0",
  hit,
  grade: hit ? 3 : null,
  perfect: false,
  combo: 0,
});

const judge = (...notes: NoteJudgement[]) =>
  act(() => notes.forEach((n) => useBossFightStore.getState().judge(n)));

const renderArena = (fight: BossFightState, record = NO_RECORD) => {
  useBossFightStore.setState({ fight, draftOpen: false });
  return render(<BossArena boss={FRETWEAVER} record={record} />);
};

/** An HP readout — the number and its "/ max" sit in nested spans. */
const hp = (value: number, max: number) =>
  screen.getByText(
    (_content, element) =>
      element?.tagName === "SPAN" &&
      element.textContent === `${value} / ${max}` &&
      !element.parentElement?.textContent?.startsWith(`${value} / ${max}`),
  );

describe("BossArena", () => {
  afterEach(cleanup);

  it("faces the player's HP and sword off against the boss's, with the phase between", () => {
    renderArena(fightWith({ bossHp: 300 }));
    const { bpm } = useBossFightStore.getState().fight.plan.variation;
    expect(screen.getByText("The Fretweaver")).toBeTruthy();
    expect(screen.getByText("Phase 1")).toBeTruthy();
    expect(screen.getByText(new RegExp(`^${bpm} BPM · `))).toBeTruthy();
    expect(hp(300, 300)).toBeTruthy();
    expect(hp(100, 100)).toBeTruthy();
    expect(screen.getByRole("meter", { name: "Sword" }).getAttribute("aria-valuenow")).toBe("0");
  });

  it("shows every threat of the phase as an icon", () => {
    renderArena(fightWith({}, { slams: true, weakSpots: true, affixes: ["venom", "regen"] }));
    for (const name of ["Bites", "Slams", "Weak spots", "Venom", "Regeneration"]) {
      expect(screen.getByLabelText(name)).toBeTruthy();
    }
  });

  it("shows the player's record beside their name", () => {
    renderArena(fightWith(), { bestPhase: 6, bestDamage: 4000, bestScore: 4000, reached: { normal: 6 }, runs: 3 });
    expect(screen.getByText("Normal · Record: phase 6")).toBeTruthy();
  });

  it("charges the sword with hits and strikes when it is full", () => {
    renderArena(fightWith({ bossHp: 300 }));
    judge(note(true));
    expect(screen.getByRole("meter", { name: "Sword" }).getAttribute("aria-valuenow")).toBe("3");
    judge(note(true), note(true));
    // 9 points at a streak of 3: ×1.1.
    expect(hp(290, 300)).toBeTruthy();
    expect(screen.getByText("10")).toBeTruthy();
  });

  it("calls the sword ready when it is nearly full", () => {
    renderArena(fightWith({ bossHp: 300, chargeMax: 10 }));
    judge(note(true), note(true));
    expect(screen.queryByText("Ready to strike")).toBeNull();
    judge(note(true));
    expect(screen.getByText("Ready to strike")).toBeTruthy();
  });

  it("takes HP off the player on a miss, and warns when it runs low", () => {
    renderArena({ ...fightWith(), playerHp: 30 });
    judge(note(false));
    expect(hp(20, 100)).toBeTruthy();
    expect(screen.getByText("−10")).toBeTruthy();
    expect(hp(20, 100).className).toContain("text-orange-300");
  });

  it("warns of a slam, and shows it land on a player off their streak", () => {
    renderArena(fightWith({ bossHp: 900, slamEvery: 8, slamWindup: 3 }, { slams: true }));
    judge(note(true), note(true), note(true), note(true));
    expect(screen.queryByText(/Slam incoming/)).toBeNull();
    judge(note(true));
    expect(screen.getByText(/Slam incoming/)).toBeTruthy();
    judge(note(true), note(false), note(true));
    expect(hp(100 - 10 - SLAM_DAMAGE, 100)).toBeTruthy();
  });

  it("shows a block when the player holds a streak through the slam", () => {
    renderArena(fightWith({ bossHp: 900, slamEvery: 8 }, { slams: true }));
    judge(...Array.from({ length: 8 }, () => note(true)));
    expect(screen.getByText("Blocked")).toBeTruthy();
  });

  it("calls out an open weak spot", () => {
    renderArena(fightWith({ bossHp: 900, weakSpotEvery: 2 }, { weakSpots: true }));
    judge(note(true), note(true));
    expect(screen.getByText("Weak spot — your sword charges ×2")).toBeTruthy();
  });

  it("marks the sword while venom slows it", () => {
    renderArena(fightWith({}, { affixes: ["venom"] }));
    judge(note(false));
    expect(screen.getByText("Poisoned")).toBeTruthy();
  });

  it("shows the heal and the next phase when the boss breaks", () => {
    renderArena({ ...fightWith({ bossHp: 9 }), playerHp: 50 });
    judge(note(true), note(true), note(true));
    expect(screen.getByText("Phase 2")).toBeTruthy();
    expect(screen.getByText(`+${PHASE_HEAL}`)).toBeTruthy();
    expect(hp(50 + PHASE_HEAL, 100)).toBeTruthy();
  });

  it("holds a strike's number for the band's beat, but not one that broke the phase", () => {
    const beat = vi.spyOn(bossCuePlayer, "strikeDelayMs").mockReturnValue(300);
    renderArena(fightWith({ bossHp: 300 }));
    judge(note(true), note(true), note(true));
    expect(screen.queryByText("10")).toBeNull();
    cleanup();

    renderArena({ ...fightWith({ bossHp: 9 }), playerHp: 50 });
    judge(note(true), note(true), note(true));
    // The next phase is already up: the number lands with it, not over its full HP.
    expect(screen.getByText("Phase 2")).toBeTruthy();
    expect(screen.getByText("9")).toBeTruthy();
    beat.mockRestore();
  });

  it("shows a shield catching a bite, and the run's build", () => {
    renderArena({ ...fightWith({ bossHp: 300 }), boons: { shield: 1, armor: 2 }, shieldCharges: 3 });
    expect(screen.getByLabelText("Armor ×2")).toBeTruthy();
    expect(screen.getByLabelText("Shield (3)")).toBeTruthy();
    judge(note(false));
    expect(screen.getByText("Shield")).toBeTruthy();
    expect(hp(100, 100)).toBeTruthy();
    expect(screen.getByLabelText("Shield (2)")).toBeTruthy();
  });
});
