import { describe, expect, it } from "vitest";

import { formatSeasonName } from "./seasonName";

describe("formatSeasonName", () => {
  it("turns a season id into the month's name", () => {
    expect(formatSeasonName("Season 2026-11")).toBe("November season");
    expect(formatSeasonName("2027-01")).toBe("January season");
  });

  it("leaves anything else alone", () => {
    expect(formatSeasonName("Summer Cup")).toBe("Summer Cup");
    expect(formatSeasonName("Season 2026-13")).toBe("Season 2026-13");
  });
});
