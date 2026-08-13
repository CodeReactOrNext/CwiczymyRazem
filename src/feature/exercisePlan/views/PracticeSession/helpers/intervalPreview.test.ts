import { describe, expect, it } from "vitest";

import {
  INTERVAL_PHRASE_HOLD_MS,
  intervalPhraseEvents,
} from "./intervalPreview";

// A minor 3rd from A2 — the pitches don't matter here, the shape of the phrase does.
const ROOT = 45;
const TARGET = 48;

describe("intervalPhraseEvents", () => {
  it("plays the two notes apart, then together", () => {
    const [root, target, both] = intervalPhraseEvents(ROOT, TARGET);

    expect(root.midis).toEqual([ROOT]);
    expect(target.midis).toEqual([TARGET]);
    expect(both.midis).toEqual([ROOT, TARGET]);
    expect(root.at).toBeLessThan(target.at);
    expect(target.at).toBeLessThan(both.at);
  });

  it("leaves each melodic note room to decay before the next one starts", () => {
    const [root, target, both] = intervalPhraseEvents(ROOT, TARGET);

    // The whole point of the phrase is hearing the distance between two pitches,
    // which is lost when the notes pile up: each single note is nearly done ringing
    // before its successor arrives, and the pair is set apart by a longer gap still.
    const rootTail = root.at + (root.duration ?? 0);
    expect(target.at).toBeGreaterThan(rootTail * 0.8);
    expect(both.at - target.at).toBeGreaterThan(target.at - root.at);
  });

  it("backs the pair off so two notes at once don't jump in volume", () => {
    const [, , both] = intervalPhraseEvents(ROOT, TARGET);
    expect(both.gain).toBeLessThan(1);
  });

  it("holds the round open past the pair's attack", () => {
    const [, , both] = intervalPhraseEvents(ROOT, TARGET);
    // Rotating before the last event has been heard is what left one round's notes
    // running into the next.
    expect(INTERVAL_PHRASE_HOLD_MS).toBeGreaterThan(both.at * 1000 + 500);
  });
});
