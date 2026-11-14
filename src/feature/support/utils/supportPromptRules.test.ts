import { describe, expect, it } from "vitest";

import {
  getSupportPrompt,
  type SupportPromptInput,
} from "./supportPromptRules";

const DAY = 86_400_000;
const NOW = 1_800_000_000_000;

const input = (patch: Partial<SupportPromptInput> = {}): SupportPromptInput => ({
  now: NOW,
  accountCreatedMs: NOW - 60 * DAY,
  sessionCount: 20,
  isSupporter: false,
  seenSessionCount: 19,
  practicedToday: true,
  lastShownMs: 0,
  lastDonateClickMs: 0,
  supporterNoteCount: 0,
  ...patch,
});

describe("getSupportPrompt", () => {
  it("asks a settled player right after a session", () => {
    expect(getSupportPrompt(input())).toBe("ask");
  });

  it("waits for three days and five sessions", () => {
    expect(
      getSupportPrompt(input({ accountCreatedMs: NOW - 2 * DAY })),
    ).toBeNull();
    expect(getSupportPrompt(input({ accountCreatedMs: NOW - 4 * DAY }))).toBe(
      "ask",
    );
    expect(
      getSupportPrompt(input({ sessionCount: 4, seenSessionCount: 3 })),
    ).toBeNull();
  });

  it("never shows on the way in: it needs a session saved since the last look", () => {
    expect(getSupportPrompt(input({ seenSessionCount: 20 }))).toBeNull();
    expect(getSupportPrompt(input({ seenSessionCount: null }))).toBeNull();
    expect(getSupportPrompt(input({ practicedToday: false }))).toBeNull();
  });

  it("keeps a week between two asks", () => {
    expect(getSupportPrompt(input({ lastShownMs: NOW - 6 * DAY }))).toBeNull();
    expect(getSupportPrompt(input({ lastShownMs: NOW - 8 * DAY }))).toBe("ask");
  });

  it("stays quiet for a month after a click on the donate button", () => {
    const clicked = (daysAgo: number) =>
      getSupportPrompt(
        input({
          lastShownMs: NOW - daysAgo * DAY,
          lastDonateClickMs: NOW - daysAgo * DAY,
        }),
      );

    expect(clicked(10)).toBeNull();
    expect(clicked(29)).toBeNull();
    expect(clicked(31)).toBe("ask");
  });

  it("writes to a supporter every twenty days, the first time at once", () => {
    const supporter = (patch: Partial<SupportPromptInput>) =>
      getSupportPrompt(input({ isSupporter: true, ...patch }));

    // An ask shown yesterday, before they donated, does not hold the thanks.
    expect(supporter({ lastShownMs: NOW - DAY })).toBe("thanks");
    expect(
      supporter({ supporterNoteCount: 1, lastShownMs: NOW - 19 * DAY }),
    ).toBeNull();
    expect(
      supporter({ supporterNoteCount: 1, lastShownMs: NOW - 21 * DAY }),
    ).toBe("thanks");
  });

  it("makes every fourth supporter note the 'again' one", () => {
    const note = (supporterNoteCount: number) =>
      getSupportPrompt(input({ isSupporter: true, supporterNoteCount }));

    expect([0, 1, 2, 3, 4, 7].map(note)).toEqual([
      "thanks",
      "thanks",
      "thanks",
      "again",
      "thanks",
      "again",
    ]);
  });

  it("never asks a supporter, however long ago the last prompt was", () => {
    const variant = getSupportPrompt(
      input({ isSupporter: true, supporterNoteCount: 2, lastShownMs: 0 }),
    );
    expect(variant).toBe("thanks");
  });
});
