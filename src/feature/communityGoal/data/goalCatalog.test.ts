import { describe, expect, it } from "vitest";

import { perSupporterLine } from "./goalCatalog";

describe("perSupporterLine", () => {
  it("divides the target down to what one supporter is agreeing to", () => {
    expect(perSupporterLine(48, 16, "minutes")).toBe(
      "about 3 h each across 16 supporters",
    );
  });

  it("keeps the half-hours a whole number would round away", () => {
    expect(perSupporterLine(24, 16, "technique")).toBe(
      "about 1.5 h each across 16 supporters",
    );
  });

  it("counts a session goal in sessions", () => {
    expect(perSupporterLine(40, 16, "sessions")).toBe(
      "about 2.5 sessions each across 16 supporters",
    );
  });

  it("names a one-person roster rather than pluralising it", () => {
    expect(perSupporterLine(8, 1, "minutes")).toBe(
      "about 8 h each across the one supporter",
    );
  });

  it("says nothing when there is nothing to divide", () => {
    expect(perSupporterLine(48, 0, "minutes")).toBeNull();
    expect(perSupporterLine(0, 16, "minutes")).toBeNull();
  });
});
