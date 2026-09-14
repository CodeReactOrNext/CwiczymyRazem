import { describe, expect, it } from "vitest";

import { DRAG_THRESHOLD, grabOffsetY, hasLeftTheTap } from "./pedalDrag";

describe("hasLeftTheTap", () => {
  const start = { x: 100, y: 100 };

  it("keeps a press that has not moved a tap", () => {
    expect(hasLeftTheTap(start, { x: 100, y: 100 })).toBe(false);
  });

  it("keeps the wobble of a finger on a stompswitch a tap", () => {
    expect(hasLeftTheTap(start, { x: 102, y: 102 })).toBe(false);
  });

  it("turns a press into a drag once it crosses the threshold", () => {
    expect(hasLeftTheTap(start, { x: 100 + DRAG_THRESHOLD, y: 100 })).toBe(
      true,
    );
  });

  it("counts both axes, so a diagonal drag starts as soon as a straight one", () => {
    expect(hasLeftTheTap(start, { x: 96, y: 104 })).toBe(true);
  });

  it("counts travel in either direction", () => {
    expect(hasLeftTheTap(start, { x: 80, y: 100 })).toBe(true);
    expect(hasLeftTheTap(start, { x: 100, y: 80 })).toBe(true);
  });
});

describe("grabOffsetY", () => {
  it("leaves a mouse drag holding the pedal where it was grabbed", () => {
    expect(grabOffsetY("mouse", 12, 40)).toBe(12);
  });

  it("lifts a pedal clear of the finger carrying it", () => {
    // Held near its own bottom edge: the pedal is above the touch, not under it.
    expect(grabOffsetY("touch", 12, 40)).toBeCloseTo(34);
  });

  it("treats a pen like a finger, since it hides the board just the same", () => {
    expect(grabOffsetY("pen", 3, 40)).toBeCloseTo(34);
  });

  it("scales the lift with the pedal, so every case behaves the same", () => {
    expect(grabOffsetY("touch", 0, 20)).toBeCloseTo(17);
  });
});
