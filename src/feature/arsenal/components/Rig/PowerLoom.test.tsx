// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PedalDcPlug } from "./PowerLoom";

/**
 * The plug on a pedal is placed in percentages of the pedal's own box, so what
 * is worth pinning is where that box ends up: a plug in a nut on the edge stands
 * clear above the enclosure, and one seated in a socket drawn on the top face
 * reaches down to it while still poking out over the edge for the cable.
 */
const boxOf = (dc: { x: number; y: number }) => {
  const { container } = render(<PedalDcPlug dc={dc} widthUnits={24} />);
  const svg = container.querySelector("svg")!;
  const top = parseFloat(svg.style.top);
  const height = parseFloat(svg.style.height);
  return { top, bottom: top + height, left: parseFloat(svg.style.left) };
};

describe("PedalDcPlug", () => {
  it("stands above the enclosure when the socket is a nut on its edge", () => {
    const box = boxOf({ x: 0.8, y: 0 });

    expect(box.left).toBe(80);
    expect(box.top).toBeLessThan(0);
    // Nothing but the sliver of shadow past the tip lands on the pedal.
    expect(box.bottom).toBeLessThan(2);
  });

  it("reaches into a socket set into the top face and still clears the edge", () => {
    const box = boxOf({ x: 0.5, y: 0.055 });

    // The tip is 5.5% of the way down the pedal; the box runs past it…
    expect(box.bottom).toBeGreaterThan(5.5);
    // …and the back of the plug is still above the top edge.
    expect(box.top).toBeLessThan(0);
  });
});
