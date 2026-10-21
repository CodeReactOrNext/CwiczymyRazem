// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FRETWEAVER } from "../data/fretweaver";
import { useBossFightStore } from "../store/bossFightStore";
import { fightWith,FIXTURE_SEED } from "../utils/fightFixtures";
import type { PhasePlan } from "../utils/phaseGenerator";
import { generatePhase } from "../utils/phaseGenerator";
import { BossDraft } from "./BossDraft";

const openDraft = (draft = ["armor", "blade", "bandage"] as const, rerollsLeft = 1) =>
  useBossFightStore.setState({
    fight: { ...fightWith(), holding: true, draft: [...draft], rerollsLeft },
    draftOpen: true,
  });

describe("BossDraft", () => {
  beforeEach(() => openDraft());
  afterEach(cleanup);

  it("deals three numbered cards with rarity and what they do", () => {
    render(<BossDraft boss={FRETWEAVER} />);
    expect(screen.getByText("Pick a boon")).toBeTruthy();
    expect(screen.getByText("Armor")).toBeTruthy();
    expect(screen.getByText("Bites take 25% less HP. Stacks.")).toBeTruthy();
    expect(screen.getByText("Sharp blade")).toBeTruthy();
    expect(screen.getByText("Bandage")).toBeTruthy();
    expect(screen.getAllByText("Common")).toHaveLength(3);
  });

  it("takes a card on click", () => {
    render(<BossDraft boss={FRETWEAVER} />);
    fireEvent.click(screen.getByText("Sharp blade"));
    const { fight, draftOpen } = useBossFightStore.getState();
    expect(fight.boons.blade).toBe(1);
    expect(fight.draft).toBeNull();
    expect(draftOpen).toBe(false);
  });

  it("takes a card by its number key", () => {
    render(<BossDraft boss={FRETWEAVER} />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "3" }));
    });
    expect(useBossFightStore.getState().fight.boons.bandage).toBe(1);
  });

  it("rerolls while the run has one", () => {
    render(<BossDraft boss={FRETWEAVER} />);
    fireEvent.click(screen.getByText("Reroll (1)"));
    const { fight } = useBossFightStore.getState();
    expect(fight.rerollsLeft).toBe(0);
    expect(fight.draft).toHaveLength(3);
    expect(screen.getByText("Reroll (0)").closest("button")?.disabled).toBe(true);
  });

  it("shows the player's HP to weigh the cards against", () => {
    useBossFightStore.setState((state) => ({ fight: { ...state.fight, playerHp: 62 } }));
    render(<BossDraft boss={FRETWEAVER} />);
    expect(screen.getByText("62 / 100")).toBeTruthy();
  });

  it("puts what stayed the same on one line", () => {
    const base = fightWith();
    useBossFightStore.setState((state) => ({
      fight: { ...state.fight, previousPlan: base.plan, previousBpm: base.plan.variation.bpm },
    }));
    render(<BossDraft boss={FRETWEAVER} />);
    expect(screen.getByText("Notes come at the same speed")).toBeTruthy();
    expect(screen.getByText(/^Unchanged — Tempo: /)).toBeTruthy();
  });

  it("shows how many of a stacking boon the run holds", () => {
    useBossFightStore.setState((state) => ({
      fight: { ...state.fight, boons: { armor: 2 } },
    }));
    render(<BossDraft boss={FRETWEAVER} />);
    expect(screen.getByText("You have 2")).toBeTruthy();
  });

  it("briefs what the next phase changes", () => {
    const base = generatePhase(FIXTURE_SEED, 0);
    const previousPlan: PhasePlan = {
      ...base,
      slams: false,
      affixes: ["frenzy"],
      variation: { bpm: 96, notesPerBeat: 2, patterns: ["1234"], route: "walk", positions: [5] },
    };
    const plan: PhasePlan = {
      ...base,
      slams: true,
      affixes: ["venom"],
      variation: { bpm: 104, notesPerBeat: 3, patterns: ["1324"], route: "skip", positions: [7] },
    };
    useBossFightStore.setState((state) => ({
      fight: { ...state.fight, plan, previousPlan, previousBpm: 96 },
    }));
    render(<BossDraft boss={FRETWEAVER} />);
    expect(screen.getByText("What changes")).toBeTruthy();
    // 96 eighths → 104 triplets: the notes come 63% faster.
    expect(screen.getByText("Notes come 63% faster")).toBeTruthy();
    expect(screen.getByText("96 → 104 BPM")).toBeTruthy();
    expect(screen.getByText("eighths → triplets")).toBeTruthy();
    expect(screen.getByText("string skipping")).toBeTruthy();
    expect(screen.getByText("frets 7–10")).toBeTruthy();
    expect(screen.getByText("New: Slams, Venom")).toBeTruthy();
    expect(screen.getByText("Gone: Frenzy")).toBeTruthy();
  });

  it("shows each card in the player's own numbers, and what it counters or pairs with", () => {
    useBossFightStore.setState((state) => ({
      fight: {
        ...state.fight,
        playerHp: 62,
        boons: { blade: 1 },
        draft: ["bandage", "antidote", "lightBlade"],
        plan: { ...state.fight.plan, affixes: ["venom"] },
      },
    }));
    render(<BossDraft boss={FRETWEAVER} />);
    expect(screen.getByText("HP 62 → 97")).toBeTruthy();
    expect(screen.getByText("Counters: Venom")).toBeTruthy();
    expect(screen.getByText("Pairs with: Sharp blade")).toBeTruthy();
  });
});
