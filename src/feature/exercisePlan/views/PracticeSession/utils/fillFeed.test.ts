import { describe, expect, it } from "vitest";

import type { FillStep } from "./fillFeed";
import { clearFillFeed, createFillFeed, fillFeedEnd, pushFillStep, readFillSteps } from "./fillFeed";

const step = (beat: number): FillStep => ({ noteKey: "0-0-0", audioSec: beat, beat });

describe("fillFeed", () => {
  it("gives every reader all the steps, each from where it left off", () => {
    const feed = createFillFeed();
    let desktop = fillFeedEnd(feed);
    pushFillStep(feed, step(1));
    pushFillStep(feed, step(2));
    const phoneStart = fillFeedEnd(feed);
    pushFillStep(feed, step(3));

    const first = readFillSteps(feed, desktop);
    expect(first.steps.map((s) => s.beat)).toEqual([1, 2, 3]);
    desktop = first.next;
    expect(readFillSteps(feed, desktop).steps).toEqual([]);
    expect(readFillSteps(feed, phoneStart).steps.map((s) => s.beat)).toEqual([3]);
  });

  it("keeps a bounded tail; a reader that fell behind gets what is left", () => {
    const feed = createFillFeed();
    const from = fillFeedEnd(feed);
    for (let i = 0; i < 2000; i++) pushFillStep(feed, step(i));
    expect(feed.steps.length).toBeLessThan(512);
    const read = readFillSteps(feed, from);
    expect(read.steps[read.steps.length - 1].beat).toBe(1999);
    expect(read.next).toBe(2000);
  });

  it("drops unread steps on a clear, and readers carry on after it", () => {
    const feed = createFillFeed();
    const from = fillFeedEnd(feed);
    pushFillStep(feed, step(1));
    clearFillFeed(feed);
    pushFillStep(feed, step(2));
    expect(readFillSteps(feed, from).steps.map((s) => s.beat)).toEqual([2]);
  });
});
