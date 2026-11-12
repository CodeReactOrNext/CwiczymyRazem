// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IntervalClickPanel } from "./IntervalClickPanel";

// Rendered without a NoteMatchingProvider: the context defaults stand in for a
// session that hasn't started tracking yet, which is exactly the state the panel
// mounts in. Anything that crashes here crashes on the way into the exercise.
const renderPanel = (isPlaying = false, onStart: () => void = () => {}) =>
  render(
    <IntervalClickPanel
      rootNote="A"
      intervalLabel="Perfect 5th ↑"
      targetNote="E"
      startFret={0}
      endFret={4}
      isPlaying={isPlaying}
      onStart={onStart}
    />,
  );

/** The two prompt tiles, in order: root, then the hidden answer. */
const stepTiles = () => screen.getAllByText(/^\d\. (Root|Target)$/).map((caption) => caption.closest("div")!.parentElement!);

// No global setup file in this project, so cleanup is explicit — otherwise the
// second render finds the first one's fretboard still in the document.
afterEach(cleanup);

describe("IntervalClickPanel", () => {
  it("shows the root and the interval, and keeps the answer hidden", () => {
    renderPanel();
    const [root, target] = stepTiles();

    expect(within(root).getByText("A")).toBeDefined();
    expect(screen.getByText("Perfect 5th ↑")).toBeDefined();
    // The note the interval lands on must not be shown before it is found.
    expect(within(target).getByText("?")).toBeDefined();
    expect(within(target).queryByText("E")).toBeNull();
  });

  it("tells the player which step they are on", () => {
    renderPanel();
    expect(screen.getByText("Click any A")).toBeDefined();
    expect(screen.getByText("1. Root")).toBeDefined();
    expect(screen.getByText("2. Target")).toBeDefined();
  });

  it("reuses the shared neck diagram", () => {
    renderPanel();
    expect(screen.getByLabelText("Clickable fretboard")).toBeDefined();
  });

  it("puts the board under the Start gate until the clock runs, without a Preview", () => {
    const onStart = vi.fn();
    renderPanel(false, onStart);
    expect(screen.queryByRole("button", { name: /preview/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("drops the gate once the clock runs", () => {
    renderPanel(true);
    expect(screen.queryByRole("button", { name: /^start$/i })).toBeNull();
  });
});
