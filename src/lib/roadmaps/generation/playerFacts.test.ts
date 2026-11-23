import { describe, expect, it } from "vitest";

import {
  playerFacts,
  renderPlayerFacts,
  suggestRoadmapLevel,
  yearsPlaying,
} from "./playerFacts";

const NOW = Date.parse("2026-11-23T12:00:00Z");
const HOUR = 3_600_000;
const yearsAgo = (years: number) => ({
  seconds: Math.round((NOW - years * 365.25 * 24 * HOUR) / 1000),
});

describe("yearsPlaying", () => {
  it("reads a Firestore timestamp in whichever shape it arrives", () => {
    expect(
      yearsPlaying({ statistics: { guitarStartDate: yearsAgo(3) } }, NOW),
    ).toBeCloseTo(3, 1);
    expect(
      yearsPlaying(
        { statistics: { guitarStartDate: { _seconds: yearsAgo(2).seconds } } },
        NOW,
      ),
    ).toBeCloseTo(2, 1);
    expect(
      yearsPlaying(
        { statistics: { guitarStartDate: "2024-11-23T12:00:00Z" } },
        NOW,
      ),
    ).toBeCloseTo(2, 1);
  });

  it("is null when the player never said, or said a date in the future", () => {
    expect(yearsPlaying({}, NOW)).toBeNull();
    expect(yearsPlaying(null, NOW)).toBeNull();
    expect(
      yearsPlaying({ statistics: { guitarStartDate: yearsAgo(-1) } }, NOW),
    ).toBeNull();
  });
});

describe("suggestRoadmapLevel", () => {
  it("stays on Intermediate for an account that says nothing", () => {
    expect(suggestRoadmapLevel(null, NOW)).toBe("Intermediate");
    expect(suggestRoadmapLevel({ statistics: {} }, NOW)).toBe("Intermediate");
  });

  it("moves down for somebody new, and never up", () => {
    const at = (years: number) =>
      suggestRoadmapLevel(
        { statistics: { guitarStartDate: yearsAgo(years) } },
        NOW,
      );
    expect(at(0.1)).toBe("Absolute Beginner");
    expect(at(1)).toBe("Beginner");
    expect(at(3)).toBe("Intermediate");
    expect(at(20)).toBe("Intermediate");
  });
});

describe("playerFacts", () => {
  it("says nothing about an empty account", () => {
    expect(playerFacts(null, NOW)).toEqual([]);
    expect(playerFacts({ statistics: { time: { technique: HOUR } } }, NOW)).toEqual(
      [],
    );
  });

  it("turns the record into lines a prompt can use", () => {
    const facts = playerFacts(
      {
        statistics: {
          guitarStartDate: yearsAgo(4),
          sessionCount: 120,
          time: {
            technique: 30 * HOUR,
            theory: 8 * HOUR,
            hearing: 1 * HOUR,
            creativity: 11 * HOUR,
          },
        },
        skills: {
          timeSpent: {
            alternate_picking: 12 * HOUR,
            legato: 6 * HOUR,
            rhythm: 0.1 * HOUR,
          },
        },
      },
      NOW,
    );

    expect(facts[0]).toBe("Has played guitar for about 4 years.");
    expect(facts[1]).toContain("Logged 50 hours in this app over 120 sessions");
    expect(facts[1]).toContain("technique 60%");
    expect(facts[2]).toContain("Almost never practises ear here (2%");
    expect(facts[3]).toBe(
      "Most practised skills here: alternate picking (12 h), legato (6 h).",
    );
    expect(renderPlayerFacts(facts).split("\n")).toHaveLength(4);
  });

  it("falls back to skill levels when no time was tracked per skill", () => {
    const facts = playerFacts(
      { skills: { unlockedSkills: { bending: 5, vibrato: 3, tapping: 1 } } },
      NOW,
    );
    expect(facts).toEqual([
      "Highest skill levels in the app: bending (level 5), vibrato (level 3).",
    ]);
  });
});
