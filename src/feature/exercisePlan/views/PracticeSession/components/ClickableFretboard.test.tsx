// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { useHandednessStore } from "hooks/useHandedness";
import { afterEach, describe, expect, it, vi } from "vitest";

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

describe("ClickableFretboard moving window", () => {
  const board = (startFret: number, endFret: number) => (
    <ClickableFretboard startFret={startFret} endFret={endFret} strings={undefined} foundKeys={[]} totalTargets={1} lastClick={null} />
  );
  const viewBox = () => screen.getByLabelText("Clickable fretboard").getAttribute("viewBox");

  afterEach(() => {
    vi.useRealTimers();
  });

  // Frets 5–8 plus three context frets each side: 2–11 on camera.
  const AT_FRETS_5_8 = "285 0 1965 558";
  // The same frame moved up to frets 8–11: 5–14 on camera, same width.
  const AT_FRETS_8_11 = "855 0 1965 558";

  it("frames the window plus context frets", () => {
    render(board(5, 8));
    expect(viewBox()).toBe(AT_FRETS_5_8);
  });

  it("travels along the neck to a moved window instead of cutting to it", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const { rerender } = render(board(5, 8));
    rerender(board(8, 11));

    // Still showing where the last round was: the move starts from there…
    expect(viewBox()).toBe(AT_FRETS_5_8);
    vi.advanceTimersByTime(300);
    const [midX] = viewBox()!.split(" ").map(Number);
    expect(midX).toBeGreaterThan(285);
    expect(midX).toBeLessThan(855);
    // …and lands on the new window.
    vi.advanceTimersByTime(600);
    expect(viewBox()).toBe(AT_FRETS_8_11);
  });
});

describe("ClickableFretboard light theme", () => {
  afterEach(() => document.documentElement.classList.remove("theme-light"));

  const goldCells = () => document.querySelectorAll('rect[fill="#f59e0b"][opacity="0.72"]');
  const oneString = (
    <ClickableFretboard startFret={6} endFret={12} strings={[6]} foundKeys={[]} totalTargets={1} lastClick={null} />
  );

  it("lights the string in play only across the window", () => {
    document.documentElement.classList.add("theme-light");
    render(oneString);

    expect(goldCells()).toHaveLength(1);
    // Seven frets, 6–12.
    expect(goldCells()[0].getAttribute("width")).toBe(String(7 * 190));
  });

  it("leaves the dark neck without it", () => {
    render(oneString);
    expect(goldCells()).toHaveLength(0);
  });
});
