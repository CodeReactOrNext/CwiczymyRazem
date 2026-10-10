import { describe, expect, it } from "vitest";

import { GUITAR_PARTS } from "../data/guitarParts";
import type {
  BodyPart,
  HeadPart,
  NeckPart,
} from "../types/guitarBuilder.types";
import { layoutGuitar } from "./layout";

const body: BodyPart = {
  key: "b",
  name: "Body",
  src: "",
  maps: "",
  surface: "",
  width: 600,
  height: 400,
  jointX: 599,
  axisY: 200,
  fretStartX: 450,
  finishHue: 0,
  finishL: 0.5,
  pickguardL: null,
  pickupTone: null,
  singleCoils: [],
  stickerSpot: { x: 0, y: 0 },
};

const neck: NeckPart = {
  key: "n",
  name: "Neck",
  src: "",
  width: 700,
  height: 104,
  jointX: 200,
  axisY: 52,
  nutX: 700,
  nutWidth: 70,
};

const head: HeadPart = {
  key: "h",
  name: "Head",
  src: "",
  width: 200,
  height: 160,
  nutX: 3,
  axisY: 80,
  nutWidth: 80,
};

describe("layoutGuitar", () => {
  const { steps, width, height } = layoutGuitar(body, neck, head);
  const [bodyStep, overhang, neckStep, headStep] = steps;

  it("stretches the neck's fretboard overhang to end where the body's did", () => {
    expect(overhang.src).toEqual({ x: 0, y: 0, w: 200, h: 104 });
    expect(overhang.dest.w).toBe(149);
    expect(overhang.dest.x).toBe(bodyStep.dest.x + body.fretStartX);
  });

  it("butts the neck against the body joint on the same axis", () => {
    expect(neckStep.dest.x).toBe(bodyStep.dest.x + body.jointX);
    expect(neckStep.dest.y + neck.axisY).toBe(bodyStep.dest.y + body.axisY);
  });

  it("scales the headstock so its nut matches the neck's", () => {
    const scale = neck.nutWidth / head.nutWidth;
    expect(headStep.dest.w).toBeCloseTo(head.width * scale);
    expect(headStep.dest.x + head.nutX * scale).toBeCloseTo(
      neckStep.dest.x + neck.nutX - neck.jointX,
    );
    expect(headStep.dest.y + head.axisY * scale).toBeCloseTo(
      bodyStep.dest.y + body.axisY,
    );
  });

  it("keeps every part inside the canvas", () => {
    for (const { dest } of steps) {
      expect(dest.x).toBeGreaterThanOrEqual(0);
      expect(dest.y).toBeGreaterThanOrEqual(0);
      expect(dest.x + dest.w).toBeLessThanOrEqual(width);
      expect(dest.y + dest.h).toBeLessThanOrEqual(height);
    }
  });
});

describe("generated parts manifest", () => {
  it("has every body's fretboard ending before its joint", () => {
    for (const part of GUITAR_PARTS.bodies)
      expect(part.fretStartX).toBeLessThan(part.jointX);
  });

  it("has every neck with an overhang and a nut past the joint", () => {
    for (const part of GUITAR_PARTS.necks) {
      expect(part.jointX).toBeGreaterThan(0);
      expect(part.nutX).toBeGreaterThan(part.jointX);
    }
  });
});
