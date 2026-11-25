// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { COLOSSUS } from "../data/colossus";
import { FRETWEAVER } from "../data/fretweaver";
import { BossHowTo } from "./BossHowTo";

afterEach(cleanup);

describe("BossHowTo", () => {
  it("says one thing at a time and closes after the third", () => {
    const onOpenChange = vi.fn();
    render(<BossHowTo boss={FRETWEAVER} open onOpenChange={onOpenChange} />);
    expect(screen.getByText("Play the runs from the tab, in time.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.queryByText("Play the runs from the tab, in time.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("words the fight the boss's own way", () => {
    render(<BossHowTo boss={COLOSSUS} open onOpenChange={vi.fn()} />);
    expect(screen.getByText("Change chords in time with the tab.")).toBeTruthy();
  });
});
