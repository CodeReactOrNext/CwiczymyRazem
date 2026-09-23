import { describe, expect, it } from "vitest";

import { mapWithConcurrency } from "./mapWithConcurrency";

/** A task that resolves only when the test says so. */
const deferred = () => {
  let resolve!: (value: string) => void;
  const promise = new Promise<string>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("mapWithConcurrency", () => {
  it("keeps the results in the order of the items, not of completion", async () => {
    const results = await mapWithConcurrency(
      [30, 10, 20, 0],
      2,
      async (ms, index) => {
        await new Promise((resolve) => setTimeout(resolve, ms));
        return `${index}:${ms}`;
      },
    );

    expect(results).toEqual(["0:30", "1:10", "2:20", "3:0"]);
  });

  it("never has more than `limit` tasks in flight", async () => {
    const gates = [deferred(), deferred(), deferred(), deferred(), deferred()];
    let inFlight = 0;
    let peak = 0;

    const all = mapWithConcurrency(gates, 2, async (gate) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      const value = await gate.promise;
      inFlight -= 1;
      return value;
    });

    await tick();
    expect(peak).toBe(2);

    gates.forEach((gate, index) => gate.resolve(`g${index}`));
    await expect(all).resolves.toEqual(["g0", "g1", "g2", "g3", "g4"]);
    expect(peak).toBe(2);
  });

  it("starts the next item as soon as a slot frees up", async () => {
    const started: number[] = [];
    const gates = [deferred(), deferred(), deferred()];

    const all = mapWithConcurrency(gates, 1, async (gate, index) => {
      started.push(index);
      return gate.promise;
    });

    await tick();
    expect(started).toEqual([0]);

    gates[0].resolve("a");
    await tick();
    expect(started).toEqual([0, 1]);

    gates[1].resolve("b");
    gates[2].resolve("c");
    await expect(all).resolves.toEqual(["a", "b", "c"]);
  });

  it("runs everything at once when the limit is larger than the list", async () => {
    let inFlight = 0;
    let peak = 0;

    await mapWithConcurrency([1, 2, 3], 10, async (value) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await tick();
      inFlight -= 1;
      return value;
    });

    expect(peak).toBe(3);
  });

  it("treats a limit below one as one rather than stalling", async () => {
    const order: number[] = [];

    await mapWithConcurrency([1, 2], 0, async (value) => {
      order.push(value);
      await tick();
      return value;
    });

    expect(order).toEqual([1, 2]);
  });

  it("does nothing for an empty list", async () => {
    await expect(
      mapWithConcurrency([], 3, async () => "never"),
    ).resolves.toEqual([]);
  });

  it("surfaces a failing task", async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (value) => {
        if (value === 2) throw new Error("phase 2 failed");
        return value;
      }),
    ).rejects.toThrow("phase 2 failed");
  });
});
