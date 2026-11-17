import {
  IMPROV_EPOCH_MS,
  IMPROV_ROUND_MS,
  improvDateRange,
  improvRoundId,
  improvRoundIndex,
  improvRoundWindow,
  improvTimeLeft,
} from "feature/improv/utils/improvRound";
import { describe, expect, it } from "vitest";

const HOUR = 60 * 60 * 1000;

describe("improv rounds", () => {
  it("counts five-day windows from the epoch", () => {
    expect(improvRoundIndex(IMPROV_EPOCH_MS)).toBe(0);
    expect(improvRoundIndex(IMPROV_EPOCH_MS + IMPROV_ROUND_MS - 1)).toBe(0);
    expect(improvRoundIndex(IMPROV_EPOCH_MS + IMPROV_ROUND_MS)).toBe(1);
    expect(
      improvRoundIndex(IMPROV_EPOCH_MS + 12 * IMPROV_ROUND_MS + HOUR),
    ).toBe(12);
  });

  it("never goes below the first round", () => {
    expect(improvRoundIndex(IMPROV_EPOCH_MS - 10 * IMPROV_ROUND_MS)).toBe(0);
  });

  it("gives ids that sort in running order", () => {
    expect(improvRoundId(0)).toBe("r0001");
    expect(improvRoundId(11)).toBe("r0012");
    expect(improvRoundId(9) < improvRoundId(10)).toBe(true);
  });

  it("puts windows back to back", () => {
    const first = improvRoundWindow(0);
    const second = improvRoundWindow(1);
    expect(first.startsAt).toBe(IMPROV_EPOCH_MS);
    expect(first.endsAt).toBe(second.startsAt);
    expect(first.endsAt - first.startsAt).toBe(5 * 24 * HOUR);
  });

  it("names the biggest unit left", () => {
    const end = IMPROV_EPOCH_MS + IMPROV_ROUND_MS;
    expect(improvTimeLeft(end, end - 3 * 24 * HOUR - 1)).toEqual({
      unit: "days",
      count: 3,
    });
    expect(improvTimeLeft(end, end - 5 * HOUR)).toEqual({
      unit: "hours",
      count: 5,
    });
    expect(improvTimeLeft(end, end - 20_000)).toEqual({
      unit: "minutes",
      count: 1,
    });
    expect(improvTimeLeft(end, end)).toEqual({ unit: "over" });
  });

  it("formats a round's dates with its last day inclusive", () => {
    const { startsAt, endsAt } = improvRoundWindow(0);
    expect(improvDateRange(startsAt, endsAt)).toBe("16.–20.11.");
    // The fourth window sits wholly in December; the range below it spans two months.
    const december = improvRoundWindow(3);
    expect(improvDateRange(december.startsAt, december.endsAt)).toBe(
      "1.–5.12.",
    );
    expect(improvDateRange(Date.UTC(2026, 10, 28), Date.UTC(2026, 11, 3))).toBe(
      "28.11.–2.12.",
    );
  });
});
