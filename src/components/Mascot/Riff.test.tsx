// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Riff, RiffFace, type RiffMood, RiffSays } from "./Riff";

const MOODS: RiffMood[] = [
  "idle",
  "celebrate",
  "hop",
  "levelUp",
  "asleep",
  "standby",
  "focus",
  "nudge",
  "shrug",
  "dizzy",
  "lookAround",
  "warmup",
  "unplugged",
  "plugIn",
  "error",
  "listen",
];

describe("Riff", () => {
  afterEach(cleanup);

  it.each(MOODS)("draws the %s mood", (mood) => {
    const { container } = render(<Riff mood={mood} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("switches moods and unmounts mid-reaction without throwing", () => {
    const { rerender, unmount } = render(<Riff mood='asleep' />);
    rerender(<Riff mood='celebrate' />);
    rerender(<Riff mood='idle' talking lively />);
    // Unmounting while talking used to start an animation on a gone component.
    expect(() => unmount()).not.toThrow();
  });

  it("keeps the whole line of a speech bubble readable from the start", () => {
    render(<RiffSays text='Someone pulled the cable.' />);
    expect(screen.getAllByText("Someone pulled the cable.").length).toBeGreaterThan(0);
  });

  it("titles the small face when asked to", () => {
    render(<RiffFace title='Streak' />);
    expect(screen.getByRole("img", { name: "Streak" })).toBeTruthy();
  });

  it("does not crash when rendered and torn down quickly", async () => {
    const { unmount } = render(<Riff mood='plugIn' />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    unmount();
  });
});
