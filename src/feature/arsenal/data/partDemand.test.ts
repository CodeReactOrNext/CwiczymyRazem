import { describe, expect, it } from "vitest";

import { getPartDemand } from "./partDemand";

describe("part demand", () => {
  it("counts what build ladders ask for", () => {
    // Op-amps head most pedal ladders; Legendary tuners head none.
    expect(getPartDemand("opamp", "Legendary")).toBeGreaterThan(0);
    expect(getPartDemand("tuners", "Legendary")).toBe(0);
  });

  it("counts mod bills too", () => {
    // Only `locking-tuners` asks for tuners, at Epic.
    expect(getPartDemand("tuners", "Epic")).toBeGreaterThan(0);
  });

  it("is zero for parts and tiers nothing asks for", () => {
    expect(getPartDemand("screws", "Legendary")).toBe(0);
  });
});
