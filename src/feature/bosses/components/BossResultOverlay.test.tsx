// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { BossFightSessionControls } from "feature/exercisePlan/views/PracticeSession/contexts/BossFightControlsContext";
import { BossFightControlsProvider } from "feature/exercisePlan/views/PracticeSession/contexts/BossFightControlsContext";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FRETWEAVER } from "../data/fretweaver";
import { useBossFightStore } from "../store/bossFightStore";
import { fightWith } from "../utils/fightFixtures";
import { generatePhase } from "../utils/phaseGenerator";
import { BossResultOverlay } from "./BossResultOverlay";

const controls = (): BossFightSessionControls => ({
  restart: vi.fn(),
  resume: vi.fn(),
  finish: vi.fn(),
  isFinishing: false,
});

const renderOverlay = (session: BossFightSessionControls) =>
  render(
    <BossFightControlsProvider value={session}>
      <BossResultOverlay boss={FRETWEAVER} />
    </BossFightControlsProvider>,
  );

/** Ends a run in the given phase, as if it had been played out. */
const loseIn = (phase: number, newRecord = false) =>
  act(() =>
    useBossFightStore.setState((state) => ({
      newRecord,
      fight: {
        ...state.fight,
        plan: generatePhase(state.fight.runSeed, phase - 1),
        outcome: "lost",
        playerHp: 0,
        totalDamage: 4321,
        maxCombo: 57,
        hits: 30,
        misses: 10,
      },
    })),
  );

describe("BossResultOverlay", () => {
  beforeEach(() => useBossFightStore.setState({ fight: fightWith(), newRecord: false }));
  afterEach(cleanup);

  it("stays hidden while the run goes on", () => {
    renderOverlay(controls());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("tells how far the run got", async () => {
    renderOverlay(controls());
    loseIn(7);
    expect(await screen.findByRole("dialog", {}, { timeout: 2000 })).toBeTruthy();
    expect(screen.getByText("Caught in the web")).toBeTruthy();
    expect(screen.getByText("Your run ended in phase 7.")).toBeTruthy();
    expect(screen.getByText((4321).toLocaleString())).toBeTruthy();
    expect(screen.getByText("57")).toBeTruthy();
    expect(screen.getByText("75%")).toBeTruthy();
    expect(screen.queryByText("New record")).toBeNull();
  });

  it("calls out a new record", async () => {
    renderOverlay(controls());
    loseIn(9, true);
    expect(await screen.findByText("New record", {}, { timeout: 2000 })).toBeTruthy();
  });

  it("starts a new fight or finishes the session", async () => {
    const session = controls();
    renderOverlay(session);
    loseIn(3);
    fireEvent.click(await screen.findByText("Fight again", {}, { timeout: 2000 }));
    expect(session.restart).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText("Finish"));
    expect(session.finish).toHaveBeenCalledOnce();
  });

  it("lists the run's build", async () => {
    useBossFightStore.setState((state) => ({
      fight: { ...state.fight, boons: { armor: 2, momentum: 1 } },
    }));
    renderOverlay(controls());
    loseIn(4);
    expect(await screen.findByText("Your build", {}, { timeout: 2000 })).toBeTruthy();
    expect(screen.getByText("Armor")).toBeTruthy();
    expect(screen.getByText("×2")).toBeTruthy();
    expect(screen.getByText("Momentum")).toBeTruthy();
  });

  it("charts the run phase by phase and measures it against the record", async () => {
    useBossFightStore.setState((state) => ({
      recordBefore: { bestPhase: 5, bestDamage: 3000, runs: 2 },
      fight: {
        ...state.fight,
        phaseLog: [
          { phase: 1, bpm: 96, rhythm: "subdivision.quarters", damageTaken: 10, hpEnd: 90, hits: 40, misses: 1 },
          { phase: 2, bpm: 132, rhythm: "subdivision.quarters", damageTaken: 34, hpEnd: 76, hits: 60, misses: 4 },
        ],
      },
    }));
    renderOverlay(controls());
    loseIn(7);
    expect((await screen.findAllByText("HP lost each phase", {}, { timeout: 2000 })).length).toBeGreaterThan(0);
    expect(screen.getByText("2 phases past your record")).toBeTruthy();
    expect(screen.getByText(/^Hardest: phase/)).toBeTruthy();
  });
});
