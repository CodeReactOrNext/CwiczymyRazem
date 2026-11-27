import { describe, expect, it } from "vitest";

import { FUSION_FAME_COST } from "../data/fusion";
import type { ScrapPart } from "../types/arsenal.types";
import {
  countReadyStacks,
  getForgeSections,
  getPartTierLadder,
} from "./forgeShelves";

const wallet: ScrapPart[] = [
  { partId: "pickup", tier: "Standard", qty: 9 },
  { partId: "pickup", tier: "Epic", qty: 2 },
  { partId: "body", tier: "Legendary", qty: 1 },
  { partId: "diode", tier: "Standard", qty: 3 },
  { partId: "screws", tier: "Standard", qty: 750 },
  { partId: "pot", tier: "Epic", qty: 47 },
];

describe("getPartTierLadder", () => {
  it("climbs to the part's cap, with Unique only for parts that show", () => {
    expect(getPartTierLadder("pickup")).toEqual([
      "Standard",
      "Epic",
      "Legendary",
      "Unique",
    ]);
    expect(getPartTierLadder("neck")).toEqual([
      "Standard",
      "Epic",
      "Legendary",
    ]);
    expect(getPartTierLadder("pot")).toEqual(["Standard", "Epic"]);
    expect(getPartTierLadder("screws")).toEqual(["Standard"]);
  });
});

describe("getForgeSections", () => {
  it("lays out the whole roster by teardown, held or not", () => {
    const sections = getForgeSections(wallet, 10_000);
    expect(sections.map((s) => s.group)).toEqual(["guitar", "pedal", "shared"]);
    expect(sections[0].shelves.map((s) => s.partId)).toEqual([
      "body",
      "neck",
      "bridge",
      "pickup",
      "tuners",
    ]);
  });

  it("draws every tier lowest first, with the ones not held at zero", () => {
    const [guitar] = getForgeSections(wallet, 10_000);
    const pickup = guitar.shelves.find((s) => s.partId === "pickup");
    expect(pickup?.stacks.map((s) => [s.tier, s.qty])).toEqual([
      ["Standard", 9],
      ["Epic", 2],
      ["Legendary", 0],
      ["Unique", 0],
    ]);
    expect(pickup?.stacks[2].progress).toBeNull();
  });

  it("marks only stacks that can climb, are big enough and can be paid for", () => {
    const [guitar, pedal, shared] = getForgeSections(wallet, 10_000);
    // 9 Standard pickups cover one rework; 2 Epic do not; a lone Legendary body does not.
    expect(guitar.ready).toBe(1);
    // 3 Standard diodes are short of 5.
    expect(pedal.ready).toBe(0);
    // Screws never climb and pots stop at Epic.
    expect(shared.ready).toBe(0);
    const screws = shared.shelves.find((s) => s.partId === "screws");
    expect(screws?.stacks[0].progress).toBeNull();
  });

  it("is not ready without the bench fee", () => {
    expect(countReadyStacks(wallet, FUSION_FAME_COST - 1)).toBe(0);
    expect(countReadyStacks(wallet, FUSION_FAME_COST)).toBe(1);
  });

  it("keeps only shelves with something to make when filtered", () => {
    const sections = getForgeSections(wallet, 10_000, true);
    expect(sections.map((s) => s.group)).toEqual(["guitar"]);
    expect(sections[0].shelves.map((s) => s.partId)).toEqual(["pickup"]);
  });
});
