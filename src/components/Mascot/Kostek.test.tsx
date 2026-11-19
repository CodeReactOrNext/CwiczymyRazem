// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Kostek, KostekFace, type KostekMood, KostekSays } from "./Kostek";

const MOODS: KostekMood[] = [
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
  "wave",
  "approve",
  "chill",
  "wait",
  "ready",
  "micOff",
  "duel",
  "emptyCase",
];

describe("Kostek", () => {
  afterEach(cleanup);

  it.each(MOODS)("draws the %s mood", (mood) => {
    const { container } = render(<Kostek mood={mood} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("switches moods and unmounts mid-reaction without throwing", () => {
    const { rerender, unmount } = render(<Kostek mood='asleep' />);
    rerender(<Kostek mood='celebrate' />);
    rerender(<Kostek mood='idle' talking lively arrive />);
    rerender(<Kostek mood='wave' eyesClosed />);
    expect(() => unmount()).not.toThrow();
  });

  it("keeps the whole line of a speech bubble readable from the start", () => {
    render(<KostekSays text='Someone pulled the cable.' />);
    expect(screen.getAllByText("Someone pulled the cable.").length).toBeGreaterThan(0);
  });

  it("titles the small face when asked to", () => {
    render(<KostekFace title='Streak' active={false} asleep />);
    expect(screen.getByRole("img", { name: "Streak" })).toBeTruthy();
  });

  it("does not crash when rendered and torn down quickly", async () => {
    const { unmount } = render(<Kostek mood='levelUp' />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    unmount();
  });
});
