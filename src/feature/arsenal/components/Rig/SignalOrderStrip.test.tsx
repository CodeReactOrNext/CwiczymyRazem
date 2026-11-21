// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { BoardCopy, BoardLevel } from "../../data/boardDuplicates";
import {
  type ChainVerdict,
  PLAYABLE_SIGNAL_STAGES,
  SIGNAL_STAGES,
} from "../../data/signalChain";
import { SignalOrderStrip } from "./SignalOrderStrip";

/**
 * The strip is a checklist with a prize at the end, so what it has to get
 * right is the count on the bar, and that a stage explains itself when it is
 * pressed — the explanation used to be a tooltip, which a phone never shows.
 */
const stageIndex = (id: string) =>
  SIGNAL_STAGES.findIndex((stage) => stage.id === id);

const copy = (itemId: string, level: number): BoardCopy => ({
  itemId,
  model: itemId,
  total: 1,
  name: itemId,
  level,
  index: 0,
  share: 1,
  counted: level,
});

const board: BoardLevel = {
  level: 7,
  fullLevel: 7,
  penalty: 0,
  duplicates: [],
  copies: new Map([
    ["tuner-1", copy("tuner-1", 3)],
    ["reverb-1", copy("reverb-1", 4)],
  ]),
};

const verdict = {
  nodes: [
    { itemId: "tuner-1", stage: stageIndex("tuner") },
    { itemId: "reverb-1", stage: stageIndex("reverb") },
  ],
  links: [{ from: 0, to: 1, ok: true }],
  okLinks: 1,
  wrongLinks: 0,
  flawless: true,
  complete: false,
  rate: 2,
  tier: "book",
  tip: null,
  filledStages: [stageIndex("tuner"), stageIndex("reverb")],
} as unknown as ChainVerdict;

afterEach(cleanup);

describe("SignalOrderStrip", () => {
  it("counts the stages the board covers against all of them", () => {
    render(<SignalOrderStrip verdict={verdict} board={board} />);

    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("2");
    expect(bar.getAttribute("aria-valuemax")).toBe(
      String(PLAYABLE_SIGNAL_STAGES.length),
    );
    expect(
      screen.getByText(`2 / ${PLAYABLE_SIGNAL_STAGES.length}`),
    ).toBeTruthy();
  });

  it("explains a stage when it is pressed, and folds it away again", () => {
    render(<SignalOrderStrip verdict={verdict} board={board} />);
    const tuner = screen.getByRole("button", { name: "Tuner" });

    fireEvent.click(tuner);
    expect(tuner.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/worth Lv 3 of your Rig Level/i)).toBeTruthy();

    fireEvent.click(tuner);
    expect(tuner.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByText(/worth Lv 3/i)).toBeNull();
  });

  it("says so when the rig runs nothing of the stage pressed", () => {
    render(<SignalOrderStrip verdict={verdict} board={board} />);

    fireEvent.click(screen.getByRole("button", { name: "Delay" }));
    expect(
      screen.getByText(/nothing of this kind is in service/i),
    ).toBeTruthy();
  });

  it("says nothing under the row until a stage is asked about", () => {
    const { container } = render(
      <SignalOrderStrip verdict={verdict} board={board} />,
    );

    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(screen.queryByText(/to go/i)).toBeNull();
  });
});
