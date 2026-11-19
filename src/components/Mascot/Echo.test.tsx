// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Echo, EchoFace, type EchoMood, EchoSays } from "./Echo";

const MOODS: EchoMood[] = [
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
  "sad",
  "surprised",
  "think",
];

describe("Echo", () => {
  afterEach(cleanup);

  it.each(MOODS)("draws the %s mood", (mood) => {
    const { container } = render(<Echo mood={mood} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("switches moods and unmounts mid-reaction without throwing", () => {
    const { rerender, unmount } = render(<Echo mood='asleep' />);
    rerender(<Echo mood='celebrate' />);
    rerender(<Echo mood='idle' talking lively arrive />);
    expect(() => unmount()).not.toThrow();
  });

  it("keeps the whole line of a speech bubble readable from the start", () => {
    render(<EchoSays text='Someone pulled the cable.' />);
    expect(screen.getAllByText("Someone pulled the cable.").length).toBeGreaterThan(0);
  });

  it("titles the small face when asked to", () => {
    render(<EchoFace title='Streak' active={false} asleep />);
    expect(screen.getByRole("img", { name: "Streak" })).toBeTruthy();
  });

  it("does not crash when rendered and torn down quickly", async () => {
    const { unmount } = render(<Echo mood='levelUp' />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    unmount();
  });
});
