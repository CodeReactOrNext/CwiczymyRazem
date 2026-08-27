// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { useHandednessStore } from "hooks/useHandedness";
import { afterEach, describe, expect, it } from "vitest";

import { ClickableFretboard } from "./ClickableFretboard";

const renderBoard = () =>
  render(
    <ClickableFretboard
      startFret={0}
      endFret={4}
      strings={undefined}
      foundKeys={[]}
      totalTargets={6}
      lastClick={null}
    />,
  );

/** Every fret number / string label on the board. */
const labels = () => Array.from(document.querySelectorAll("text"));

// No global setup file in this project, so cleanup is explicit, and the
// preference is a module-level store shared by every test in the file.
afterEach(() => {
  cleanup();
  useHandednessStore.setState({ leftHanded: false });
});

describe("ClickableFretboard handedness", () => {
  it("draws the neck as-is for right-handed players", () => {
    renderBoard();
    const svg = screen.getByLabelText("Clickable fretboard");

    expect(svg.getAttribute("style")).not.toContain("scaleX(-1)");
    expect(labels().every((text) => !text.getAttribute("transform"))).toBe(true);
  });

  it("mirrors the neck for left-handed players", () => {
    useHandednessStore.setState({ leftHanded: true });
    renderBoard();
    const svg = screen.getByLabelText("Clickable fretboard, left-handed");

    expect(svg.getAttribute("style")).toContain("scaleX(-1)");
    // Nothing readable may travel with the mirror: every label carries the
    // counter-transform that flips it back upright.
    expect(labels().length).toBeGreaterThan(0);
    expect(
      labels().every((text) =>
        /^translate\(-?[\d.]+ 0\) scale\(-1 1\)$/.test(text.getAttribute("transform") ?? ""),
      ),
    ).toBe(true);
  });

  it("keeps the string names on the far side of the nut when mirrored", () => {
    useHandednessStore.setState({ leftHanded: true });
    renderBoard();

    const highE = labels().find((text) => text.textContent === "e")!;
    expect(highE.getAttribute("text-anchor")).toBe("start");
  });
});
