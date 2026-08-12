import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { IntervalClickPanel } from "./IntervalClickPanel";

// Rendered without a NoteMatchingProvider: the context defaults stand in for a
// session that hasn't started tracking yet, which is exactly the state the panel
// mounts in. Anything that crashes here crashes on the way into the exercise.
const renderPanel = () =>
  render(
    <IntervalClickPanel
      rootNote="A"
      intervalLabel="Perfect 5th ↑"
      targetNote="E"
      description="Click one root, then the interval measured from that spot"
      startFret={0}
      endFret={4}
      isPlaying={false}
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
    expect(screen.getByText("Click any A between frets 0 and 4")).toBeDefined();
    expect(screen.getByText("1. Root")).toBeDefined();
    expect(screen.getByText("2. Target")).toBeDefined();
  });

  it("reuses the shared neck diagram", () => {
    renderPanel();
    expect(screen.getByLabelText("Clickable fretboard")).toBeDefined();
  });
});
