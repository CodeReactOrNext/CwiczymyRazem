import { describe, expect, it } from "vitest";

import { OutputQueueMonitor } from "./outputQueueMonitor";

/** Simulates the engine's per-block sequence: (maybe drop) → write → evaluate.
 *  `popped` says whether the hardware callback preceding this block popped a
 *  block (it doesn't when the queue was empty — an underrun). */
function tick(monitor, { popped = true } = {}) {
  if (popped) monitor.onConsumed();
  const dropped = monitor.shouldDropWrite();
  if (!dropped) monitor.onWritten();
  return { dropped, evaluation: dropped ? null : monitor.evaluate() };
}

describe("OutputQueueMonitor", () => {
  it("never drops on a healthy stream (depth reads exactly 1 after every write)", () => {
    const m = new OutputQueueMonitor();
    // First block: nothing to pop yet.
    let r = tick(m, { popped: false });
    expect(r.dropped).toBe(false);
    expect(m.depth()).toBe(1);
    for (let i = 0; i < 2000; i++) {
      r = tick(m);
      expect(r.dropped).toBe(false);
      expect(r.evaluation.drops).toBe(0);
    }
    expect(m.stats()).toMatchObject({ drops: 0, underruns: 0, maxExcess: 0 });
  });

  it("confirms a single extra block over confirmBlocks readings before skipping one write", () => {
    const m = new OutputQueueMonitor({ confirmBlocks: 5 });
    tick(m, { popped: false });
    // A stall: the callback found the queue empty (no pop), then JS catches up
    // and writes two blocks back to back → one permanent extra block. That
    // catch-up write is itself the first "one behind" reading.
    const underrun = tick(m, { popped: false }); // depth 2
    expect(underrun.evaluation.drops).toBe(0);
    const results = [];
    for (let i = 0; i < 4; i++) results.push(tick(m));
    // Readings 2-4 of "one behind" → no action yet, fifth → schedule one drop.
    expect(results.slice(0, 3).every((r) => r.evaluation.drops === 0)).toBe(true);
    expect(results[3].evaluation).toEqual({ drops: 1, hard: false });
    // Next block is dropped, which lets the queue drain back to a depth of 1.
    const dropped = tick(m);
    expect(dropped.dropped).toBe(true);
    expect(m.depth()).toBe(1);
    const after = tick(m);
    expect(after.dropped).toBe(false);
    expect(after.evaluation.drops).toBe(0);
    expect(m.stats()).toMatchObject({ drops: 1, softEvents: 1, hardEvents: 0, underruns: 1 });
  });

  it("drops a large backlog immediately instead of waiting for confirmation", () => {
    const m = new OutputQueueMonitor({ confirmBlocks: 40, hardLimitExcess: 3 });
    tick(m, { popped: false });
    // Long stall: callbacks found nothing, then JS writes the backlogged blocks
    // in a burst without any pops in between. The moment the excess reaches the
    // hard limit (3 extra blocks) the whole backlog is scheduled for dropping.
    const first = tick(m, { popped: false });
    const second = tick(m, { popped: false });
    expect(first.evaluation.hard).toBe(false);
    expect(second.evaluation.hard).toBe(false);
    const third = tick(m, { popped: false });
    expect(third.evaluation).toEqual({ drops: 3, hard: true });
    // The following 3 blocks are skipped (each callback pops one), then normal.
    for (let i = 0; i < 3; i++) expect(tick(m).dropped).toBe(true);
    expect(m.depth()).toBe(1);
    expect(tick(m).dropped).toBe(false);
    expect(m.stats()).toMatchObject({ drops: 3, hardEvents: 1, maxExcess: 3 });
  });

  it("a transient one-behind reading that clears itself never causes a drop", () => {
    const m = new OutputQueueMonitor({ confirmBlocks: 5 });
    tick(m, { popped: false });
    // Reading is one low for a single block (a pop dispatched late), then back.
    tick(m, { popped: false });
    m.onConsumed(); // the late pop arrives
    for (let i = 0; i < 20; i++) {
      const r = tick(m);
      expect(r.dropped).toBe(false);
      expect(r.evaluation.drops).toBe(0);
    }
    expect(m.stats().drops).toBe(0);
  });

  it("counts each on-time → behind transition as one underrun", () => {
    const m = new OutputQueueMonitor({ confirmBlocks: 3 });
    tick(m, { popped: false });
    for (let stall = 0; stall < 3; stall++) {
      tick(m, { popped: false }); // underrun
      for (let i = 0; i < 3; i++) tick(m); // confirmed after 3 → one drop scheduled
      tick(m); // dropped → back to healthy
      for (let i = 0; i < 5; i++) tick(m);
    }
    expect(m.stats().underruns).toBe(3);
    expect(m.stats().drops).toBe(3);
  });

  it("a late delivery sheds the backlog immediately, keeping only the freshest block", () => {
    const m = new OutputQueueMonitor();
    tick(m, { popped: false });
    for (let i = 0; i < 10; i++) tick(m);
    // A stall of 3.4 block periods: callbacks k+1 (popped the last good block),
    // k+2 and k+3 fired; k+2/k+3 found nothing. audify now delivers the 3
    // backlogged inputs back to back — drop the first two, write the third.
    expect(m.onLateDelivery(3.4)).toBe(2);
    const r1 = tick(m);            // the pop from callback k+1 is accounted here
    expect(r1.dropped).toBe(true);
    const r2 = tick(m, { popped: false });
    expect(r2.dropped).toBe(true);
    const r3 = tick(m, { popped: false });
    expect(r3.dropped).toBe(false);
    expect(m.depth()).toBe(1);     // exactly the block in flight — latency back to normal
    expect(r3.evaluation.drops).toBe(0);
    expect(m.stats()).toMatchObject({ drops: 2, stallEvents: 1, underruns: 0 });
    // Under two block periods late is jitter, not a backlog — nothing to shed.
    expect(m.onLateDelivery(1.9)).toBe(0);
    expect(tick(m).dropped).toBe(false);
  });

  it("raises the safety margin after repeated underruns instead of clicking forever", () => {
    let clock = 0;
    const m = new OutputQueueMonitor({ confirmBlocks: 3, marginUnderruns: 3, marginWindowMs: 10000, now: () => clock });
    tick(m, { popped: false });
    const underrunThenCorrect = () => {
      tick(m, { popped: false }); // underrun → one behind
      for (let i = 0; i < 3; i++) tick(m); // confirmed → drop scheduled
      tick(m); // dropped → healthy again
      for (let i = 0; i < 5; i++) tick(m);
    };
    // Two underruns 1s apart: corrected the normal way, margin untouched.
    underrunThenCorrect();
    clock += 1000;
    underrunThenCorrect();
    expect(m.stats()).toMatchObject({ underruns: 2, drops: 2, safetyBlocks: 0 });

    // The third within the window raises the target depth: the extra block
    // already in the queue is simply kept, and no further write is dropped.
    clock += 1000;
    const r = tick(m, { popped: false });
    expect(r.evaluation.drops).toBe(0);
    expect(m.stats()).toMatchObject({ underruns: 3, safetyBlocks: 1 });
    for (let i = 0; i < 50; i++) {
      const t = tick(m);
      expect(t.dropped).toBe(false);
      expect(t.evaluation.drops).toBe(0);
    }
    expect(m.depth()).toBe(2);
    expect(m.stats().drops).toBe(2);
  });

  it("underruns outside the window don't count towards the margin", () => {
    let clock = 0;
    const m = new OutputQueueMonitor({ confirmBlocks: 2, marginUnderruns: 2, marginWindowMs: 1000, now: () => clock });
    tick(m, { popped: false });
    tick(m, { popped: false }); // underrun #1 at t=0
    for (let i = 0; i < 2; i++) tick(m);
    tick(m); // dropped
    clock += 5000; // window has long expired
    tick(m, { popped: false }); // underrun #2 — alone in its window
    expect(m.stats()).toMatchObject({ underruns: 2, safetyBlocks: 0 });
  });

  it("reset() clears all accounting for a fresh stream", () => {
    const m = new OutputQueueMonitor({ marginUnderruns: 1 });
    tick(m, { popped: false });
    tick(m, { popped: false });
    m.onLateDelivery(4);
    expect(m.stats().safetyBlocks).toBe(1);
    m.reset();
    expect(m.depth()).toBe(0);
    expect(m.stats()).toEqual({ depth: 0, drops: 0, hardEvents: 0, softEvents: 0, stallEvents: 0, underruns: 0, maxExcess: 0, safetyBlocks: 0 });
  });
});
