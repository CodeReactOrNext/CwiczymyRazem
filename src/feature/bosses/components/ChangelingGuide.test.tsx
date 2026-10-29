// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CHANGELING } from "../data/changeling";
import { useBossLobbyStore } from "../store/bossLobbyStore";
import { ChangelingGuide } from "./ChangelingGuide";

afterEach(cleanup);

const open = (onOpenChange = vi.fn()) =>
  render(
    <ChangelingGuide
      boss={CHANGELING}
      open
      onOpenChange={onOpenChange}
      fightHref='/practice/boss/changeling'
    />,
  );

const next = () =>
  fireEvent.click(screen.getByRole("button", { name: "Next" }));

describe("ChangelingGuide", () => {
  it("walks through the fight step by step, each with a picture of the board", () => {
    open();
    expect(
      screen.getByRole("heading", { name: "Three chords, always" }),
    ).toBeTruthy();
    // The lane, with the chord being played and the two after it.
    expect(screen.getByText("Now")).toBeTruthy();
    expect(screen.getAllByText("Am").length).toBeGreaterThan(0);

    next();
    expect(
      screen.getByRole("heading", {
        name: "Beats 1 and 3: a note of the chord",
      }),
    ).toBeTruthy();
    expect(screen.getByText("A ✓")).toBeTruthy();
    expect(screen.getByText("D ✕")).toBeTruthy();

    next();
    expect(screen.getByRole("heading", { name: "Where to play" })).toBeTruthy();
    // A picture — hidden from the reader, the text says it.
    expect(
      document.querySelector(
        'svg[aria-label="Where the tones of Am sit on the neck"]',
      ),
    ).toBeTruthy();

    next();
    // On the one + Smooth + On the one, then their payout.
    expect(screen.getAllByText("On the one")).toHaveLength(2);
    expect(screen.getByText("Smooth")).toBeTruthy();
    expect(screen.getByText("+27")).toBeTruthy();

    next();
    expect(screen.getByRole("heading", { name: "What hurts" })).toBeTruthy();
    expect(screen.getByText("A note from outside the key.")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Fight" }).getAttribute("href"),
    ).toBe("/practice/boss/changeling");
  });

  it("goes back, and jumps to a step from the bar on top", () => {
    open();
    next();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("heading", { name: "Three chords, always" }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Tricks and the combo" }),
    );
    expect(
      screen.getByRole("heading", { name: "Tricks and the combo" }),
    ).toBeTruthy();
  });
});

describe("the lobby's guides", () => {
  it("remembers a boss's guide as seen, once", () => {
    useBossLobbyStore.setState({ guidesSeen: [] });
    useBossLobbyStore.getState().markGuideSeen("changeling");
    useBossLobbyStore.getState().markGuideSeen("changeling");
    expect(useBossLobbyStore.getState().guidesSeen).toEqual(["changeling"]);
  });
});
