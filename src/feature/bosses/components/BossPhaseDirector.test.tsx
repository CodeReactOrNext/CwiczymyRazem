// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import type { BossFightSessionControls } from "feature/exercisePlan/views/PracticeSession/contexts/BossFightControlsContext";
import { BossFightControlsProvider } from "feature/exercisePlan/views/PracticeSession/contexts/BossFightControlsContext";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FRETWEAVER } from "../data/fretweaver";
import { useBossFightStore } from "../store/bossFightStore";
import { fightWith } from "../utils/fightFixtures";
import { BossPhaseDirector, MOLT_MS, RESUME_AFTER_PICK_MS } from "./BossPhaseDirector";
import { BossPhaseIntro } from "./BossPhaseIntro";

const hit = { noteKey: "0-0-0", hit: true, grade: 3 as const, perfect: false, combo: 0 };

const controls = (): BossFightSessionControls => ({
  restart: vi.fn(),
  resume: vi.fn(),
  finish: vi.fn(),
  isFinishing: false,
});

const renderBreak = (session: BossFightSessionControls) =>
  render(
    <BossFightControlsProvider value={session}>
      <BossPhaseDirector />
      <BossPhaseIntro boss={FRETWEAVER} />
    </BossFightControlsProvider>,
  );

/** Clears phase 1 of the fixture fight. */
const breakPhase = () =>
  act(() => {
    for (let i = 0; i < 3; i++) useBossFightStore.getState().judge(hit);
  });

const pickFirst = () =>
  act(() => {
    const { fight, pickBoon } = useBossFightStore.getState();
    pickBoon(fight.draft![0]);
  });

describe("phase break", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useBossFightStore.setState({ fight: fightWith({ bossHp: 9 }), draftOpen: false });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("opens on the phase intro, then deals the draft", () => {
    renderBreak(controls());
    breakPhase();
    expect(screen.getByText("Phase 2")).toBeTruthy();
    expect(screen.getByText(/^Notes come/)).toBeTruthy();
    expect(useBossFightStore.getState().draftOpen).toBe(false);

    act(() => vi.advanceTimersByTime(MOLT_MS));
    expect(useBossFightStore.getState().draftOpen).toBe(true);
    expect(screen.queryByText("Phase 2")).toBeNull();
  });

  it("holds the run while the draft is open, however long the player takes", () => {
    const session = controls();
    renderBreak(session);
    breakPhase();
    act(() => vi.advanceTimersByTime(MOLT_MS + 60_000));
    expect(session.resume).not.toHaveBeenCalled();
    expect(useBossFightStore.getState().fight.holding).toBe(true);
  });

  it("counts the next phase in a beat after the pick, once", () => {
    const session = controls();
    renderBreak(session);
    breakPhase();
    act(() => vi.advanceTimersByTime(MOLT_MS));
    pickFirst();

    act(() => vi.advanceTimersByTime(RESUME_AFTER_PICK_MS - 1));
    expect(session.resume).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(session.resume).toHaveBeenCalledOnce();
    expect(useBossFightStore.getState().fight.holding).toBe(false);
    expect(useBossFightStore.getState().fight.plan.index).toBe(1);

    act(() => vi.advanceTimersByTime(10_000));
    expect(session.resume).toHaveBeenCalledOnce();
  });
});
