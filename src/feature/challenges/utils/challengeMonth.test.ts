import {
  challengeMonthLabel,
  challengeWindow,
  currentChallengeId,
  daysLeftInChallenge,
  isChallengeLive,
  shiftChallengeId,
  votingChallengeId,
} from "feature/challenges/utils/challengeMonth";
import { describe, expect, it } from "vitest";

describe("challengeMonth", () => {
  it("buckets a date into its UTC month", () => {
    expect(currentChallengeId(new Date("2026-08-07T12:00:00Z"))).toBe(
      "2026-08",
    );
    expect(currentChallengeId(new Date("2026-01-01T00:00:00Z"))).toBe(
      "2026-01",
    );
  });

  it("rolls the year over when shifting months", () => {
    expect(shiftChallengeId("2026-12", 1)).toBe("2027-01");
    expect(shiftChallengeId("2026-01", -1)).toBe("2025-12");
    expect(shiftChallengeId("2026-08", 0)).toBe("2026-08");
  });

  it("opens nominations for the month after the live board", () => {
    expect(votingChallengeId(new Date("2026-12-20T00:00:00Z"))).toBe("2027-01");
  });

  it("spans the whole month, inclusive of the last instant", () => {
    const { startsAt, endsAt } = challengeWindow("2026-02");
    expect(startsAt.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(endsAt.toISOString()).toBe("2026-02-28T23:59:59.999Z");
  });

  it("counts days left and never goes negative", () => {
    expect(
      daysLeftInChallenge("2026-08", new Date("2026-08-30T00:00:00Z")),
    ).toBe(2);
    expect(
      daysLeftInChallenge("2026-08", new Date("2026-09-10T00:00:00Z")),
    ).toBe(0);
  });

  it("labels the month in a human-readable way", () => {
    expect(challengeMonthLabel("2026-08")).toBe("August 2026");
  });

  it("knows whether a board is the live one", () => {
    const now = new Date("2026-08-07T12:00:00Z");
    expect(isChallengeLive("2026-08", now)).toBe(true);
    expect(isChallengeLive("2026-07", now)).toBe(false);
  });

  it("rejects malformed ids", () => {
    expect(() => challengeWindow("2026-13")).toThrow();
    expect(() => challengeWindow("august")).toThrow();
  });
});
