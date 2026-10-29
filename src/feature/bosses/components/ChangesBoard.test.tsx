// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CHANGELING } from "../data/changeling";
import { useBossFightStore } from "../store/bossFightStore";
import { IDLE_CHANGES } from "../utils/changesLive";
import type { ChangesPhasePlan } from "../utils/phaseGenerator";
import { ChangesBoard } from "./ChangesBoard";

afterEach(cleanup);

/** Am for a bar, F for two bars, a rush of Am and F in half notes. */
const UNITS = [
  { chord: "Am", beats: 4, quake: false },
  { chord: "F", beats: 8, quake: false },
  { chord: "Am", beats: 2, quake: true },
  { chord: "F", beats: 2, quake: true },
];

const setup = (live: Partial<typeof IDLE_CHANGES>) => {
  useBossFightStore.getState().enterFight("changes", { seed: 3 });
  const { fight } = useBossFightStore.getState();
  const plan = fight.plan as ChangesPhasePlan;
  useBossFightStore.setState({
    fight: {
      ...fight,
      plan: {
        ...plan,
        weakSpots: false,
        variation: { ...plan.variation, key: { tonic: 9, mode: "aeolian" }, progression: ["Am", "F"], units: UNITS },
      },
    },
    changesLive: { ...IDLE_CHANGES, ...live },
  });
  return render(<ChangesBoard boss={CHANGELING} />);
};

describe("ChangesBoard", () => {
  it("shows the chord being played, its beats left and the next one", () => {
    setup({ unit: 1, beatsLeft: 3 });
    expect(screen.getAllByText("F").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "3 beats left" })).toBeTruthy();
    expect(screen.getByText("Now")).toBeTruthy();
    expect(screen.getByText("Next in 3 beats")).toBeTruthy();
    expect(screen.getByText("Then")).toBeTruthy();
  });

  it("shows the chord's notes in one place — on the neck, by name — and the next chord by name only", () => {
    const { container } = setup({ unit: 1, beatsLeft: 3 });
    const neck = screen.getByRole("img", { name: "Where the tones of F sit on the neck" });
    const labels = new Set([...neck.querySelectorAll("text")].map((label) => label.textContent));
    for (const note of ["F", "A", "C"]) expect(labels.has(note)).toBe(true);
    // No degree labels, no voice-leading arrows.
    expect(labels.has("R")).toBe(false);
    expect(container.textContent).not.toContain("→");
  });

  it("says so once the chord is sounded", () => {
    setup({ unit: 1, beatsLeft: 3, landed: { 1: true } });
    expect(screen.getByLabelText("Landed")).toBeTruthy();
  });

  const cards = (container: HTMLElement) => [...container.querySelectorAll("li[data-slot]")] as HTMLElement[];
  const chordOf = (card: HTMLElement) => card.querySelector("p.font-display")?.textContent;
  const marksOf = (card: HTMLElement) => [...(card.lastElementChild?.firstElementChild?.children ?? [])];

  it("always lays out three chords — the one being played and the two after it — with a mark a beat", () => {
    const { container } = setup({ unit: 1, beatsLeft: 3 });
    // The F being played, then the rush: Am and F a half bar each.
    expect(cards(container).map(chordOf)).toEqual(["F", "Am", "F"]);
    expect(cards(container).map((card) => marksOf(card).length)).toEqual([8, 2, 2]);
    expect(cards(container)[0].className).toContain("bg-zinc-100");
    // The rush coming, in orange.
    expect(cards(container)[1].querySelector("p.font-display")?.className).toContain("text-orange-300");
  });

  it("wraps round the pass, and shows the first three before the run", () => {
    const last = setup({ unit: 3, beatsLeft: 2 });
    expect(cards(last.container).map(chordOf)).toEqual(["F", "Am", "F"]);
    cleanup();
    const before = setup({ unit: null, beatsLeft: 2 });
    expect(cards(before.container).map(chordOf)).toEqual(["Am", "F", "Am"]);
    expect(screen.getByText("First chord in 2 beats")).toBeTruthy();
    expect(screen.getByText("Next")).toBeTruthy();
  });

  it("strings the combo over the board, then shows its payout", () => {
    setup({ unit: 1, beatsLeft: 3 });
    const combo = { tricks: ["onTheOne", "smooth"] as const, points: 6 };
    act(() => {
      const { fight } = useBossFightStore.getState();
      useBossFightStore.setState({ fight: { ...fight, changeCombo: combo } });
    });
    expect(screen.getByText("On the one")).toBeTruthy();
    expect(screen.getByText("Smooth")).toBeTruthy();
    expect(screen.getByText("×2")).toBeTruthy();

    act(() => {
      const { fight } = useBossFightStore.getState();
      useBossFightStore.setState({
        fight: {
          ...fight,
          changeCombo: null,
          bankTick: fight.bankTick + 1,
          lastCombo: { ...combo, multiplier: 2, value: 12 },
        },
      });
    });
    expect(screen.getByText("+12")).toBeTruthy();
    expect(screen.getByText("Combo ×2")).toBeTruthy();
  });

  it("lists the notes heard with what they were to the chord", () => {
    setup({
      unit: 1,
      beatsLeft: 3,
      trail: [
        { pc: 0, midi: 60, role: "fifth", degree: "5", counted: true, verdict: "hit", tick: 1 },
        { pc: 2, midi: 62, role: "passing", degree: "", counted: true, verdict: "hit", tick: 2 },
        { pc: 11, midi: 59, role: "outside", degree: "", counted: true, verdict: "miss", tick: 3 },
      ],
    });
    const heard = screen.getByRole("list", { name: "Notes heard" });
    expect(heard.textContent).toBe("C5D·B✕");
  });

  it("draws the scale on the neck beside the chord, and marks the strong beats played", () => {
    // A minor's scale under F: A, C and F big, the rest of the scale small.
    const { container } = setup({ unit: 1, beatsLeft: 3, strongBeats: { "1:0": true, "1:2": false } });
    const neck = screen.getByRole("img", { name: "Where the tones of F sit on the neck" });
    const names = (r: string) =>
      new Set(
        [...neck.querySelectorAll(`circle[r="${r}"]`)].map((dot) => dot.nextElementSibling?.textContent),
      );
    expect(names("9")).toEqual(new Set(["F", "A", "C"]));
    expect(names("6.5")).toEqual(new Set(["B", "D", "E", "G"]));
    expect(screen.getByText("F — on beats 1 and 3")).toBeTruthy();

    // The F's strong beats: 1 hit, 3 missed; 5 and 7 not played yet.
    const marks = marksOf(cards(container)[0]).map((mark) => mark.className);
    expect(marks[0]).toContain("bg-emerald-500");
    expect(marks[2]).toContain("bg-orange-500");
    expect(marks[4]).toContain("h-2.5");
    expect(marks[1]).toContain("h-1");
  });

  it("says why it bit, with the chord's notes, in the legend's place for a moment", () => {
    vi.useFakeTimers();
    // D first on beat 3 of the Am: in the scale, not in the chord.
    setup({
      unit: 0,
      beatsLeft: 2,
      lastMiss: { reason: "strongBeat", unit: 0, pc: 2, beat: 2, tick: 1 },
    });
    expect(screen.getByText("On 3: D isn't a note of Am")).toBeTruthy();
    expect(screen.getByText("A C E")).toBeTruthy();
    expect(screen.queryByText("Am — on beats 1 and 3")).toBeNull();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByText("On 3: D isn't a note of Am")).toBeNull();
    expect(screen.getByText("Am — on beats 1 and 3")).toBeTruthy();
    vi.useRealTimers();
  });

  it("names the beat in the bar, a chord let go by, and no chord under the curtain", () => {
    // Beat 2 into the F, which starts on the second bar: beat 3 of the bar.
    setup({ unit: 1, beatsLeft: 6, lastMiss: { reason: "strongBeat", unit: 1, pc: 11, beat: 2, tick: 1 } });
    expect(screen.getByText("On 3: B isn't a note of F")).toBeTruthy();
    cleanup();
    setup({ unit: 1, beatsLeft: 6, lastMiss: { reason: "silent", unit: 0, pc: null, beat: null, tick: 1 } });
    expect(screen.getByText("Am went by without a note of it")).toBeTruthy();
    cleanup();
    setup({ unit: 1, beatsLeft: 6, lastMiss: { reason: "outside", unit: 1, pc: 6, beat: null, tick: 1 } });
    expect(screen.getByText("F# — outside the key")).toBeTruthy();
    cleanup();
    setup({ unit: 1, beatsLeft: 6, lastMiss: { reason: "strongBeat", unit: 1, pc: 11, beat: 2, tick: 1 } });
    act(() => useBossFightStore.setState((s) => ({ fight: { ...s.fight, webNotes: 4 } })));
    expect(screen.getByText("On 3: B isn't a note of the chord")).toBeTruthy();
    expect(screen.queryByText("F A C")).toBeNull();
  });
});
