import { describe, expect, it } from "vitest";

import { addSkillTime } from "./reportUpdateUserState";

describe("addSkillTime", () => {
  it("adds the session's time to the stored totals", () => {
    expect(
      addSkillTime({ legato: 1000 }, { legato: 500, tapping: 200 }, 10_000),
    ).toEqual({
      legato: 1500,
      tapping: 200,
    });
  });

  it("caps a skill at the session's length and drops junk entries", () => {
    expect(
      addSkillTime(
        undefined,
        { legato: 999_999, tapping: -5, chords: Number.NaN, "bad id!": 100 },
        60_000,
      ),
    ).toEqual({ legato: 60_000 });
  });
});
