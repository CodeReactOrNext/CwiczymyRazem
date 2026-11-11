import { describe, expect, it } from "vitest";

import { BATCH_FRAMES, createFrameBatcher } from "./frameBatcher";

/** A block of `frames` FLOAT32 frames whose bytes all read `fill`. */
const block = (frames, fill) => new Uint8Array(frames * 4).fill(fill);

describe("createFrameBatcher", () => {
  it("sends a block that is long enough on its own, untouched", () => {
    const sent = [];
    const batcher = createFrameBatcher((buf) => sent.push(buf));
    const big = block(BATCH_FRAMES, 1);
    batcher.push(big);
    expect(sent).toEqual([big]);
    expect(sent[0]).toBe(big);
  });

  it("sends short blocks together, in order, once they add up", () => {
    const sent = [];
    const batcher = createFrameBatcher((buf) => sent.push(buf));
    for (let i = 1; i <= 3; i++) batcher.push(block(64, i));
    expect(sent).toHaveLength(0);
    batcher.push(block(64, 4));
    expect(sent).toHaveLength(1);
    expect(sent[0].length).toBe(BATCH_FRAMES * 4);
    expect([sent[0][0], sent[0][64 * 4], sent[0][128 * 4], sent[0][192 * 4]]).toEqual([1, 2, 3, 4]);
    // The message owns its bytes: nothing else rides along in its buffer.
    expect(sent[0].buffer.byteLength).toBe(sent[0].length);
  });

  it("keeps what a block held when the engine reuses the buffer", () => {
    const sent = [];
    const batcher = createFrameBatcher((buf) => sent.push(buf));
    const reused = block(128, 7);
    batcher.push(reused);
    reused.fill(9);
    batcher.push(reused);
    expect(sent[0][0]).toBe(7);
    expect(sent[0][128 * 4]).toBe(9);
  });

  it("loses no bytes over a long run of odd-sized blocks", () => {
    let bytes = 0;
    const batcher = createFrameBatcher((buf) => { bytes += buf.length; });
    for (let i = 0; i < 100; i++) batcher.push(block(96, 1));
    // 96 × 3 = 288 ≥ 256: every third block completes a message, and 100 leaves one waiting.
    expect(bytes).toBe(99 * 96 * 4);
  });

  it("drops what is waiting on reset", () => {
    const sent = [];
    const batcher = createFrameBatcher((buf) => sent.push(buf));
    batcher.push(block(64, 1));
    batcher.reset();
    for (let i = 0; i < 4; i++) batcher.push(block(64, 2));
    expect(sent).toHaveLength(1);
    expect(sent[0][0]).toBe(2);
  });
});
