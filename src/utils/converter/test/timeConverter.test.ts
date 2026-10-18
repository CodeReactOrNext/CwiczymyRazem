import { describe, expect, it } from "vitest";

import { convertMsToWholeHours } from "../timeConverter";

const HOUR = 3600000;

describe("convertMsToWholeHours", () => {
  it("shows whole hours without minutes", () => {
    expect(convertMsToWholeHours(5 * HOUR)).toBe("5h");
    expect(convertMsToWholeHours(5 * HOUR + 59 * 60000)).toBe("5h");
  });

  it("shows 0h under an hour", () => {
    expect(convertMsToWholeHours(45 * 60000)).toBe("0h");
    expect(convertMsToWholeHours(0)).toBe("0h");
  });

  it("never goes negative", () => {
    expect(convertMsToWholeHours(-HOUR)).toBe("0h");
  });
});
