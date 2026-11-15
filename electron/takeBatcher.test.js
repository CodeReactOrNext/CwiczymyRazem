import { describe, expect, it } from "vitest";

import { createTakeBatcher } from "./takeBatcher";

const floats = (chunk) => new Float32Array(chunk.pcm.buffer, chunk.pcm.byteOffset, chunk.frames * 2);

describe("createTakeBatcher", () => {
  it("gathers blocks into stereo batches, a mono source on both sides", () => {
    const sent = [];
    const batcher = createTakeBatcher((chunk) => sent.push(chunk), 4);
    batcher.push(Float32Array.of(1, 2), null, 2, 48000, false, 1000);
    expect(sent).toHaveLength(0);
    batcher.push(Float32Array.of(3, 4), null, 2, 48000, false, 1010);
    expect(sent).toHaveLength(1);
    expect(sent[0].frames).toBe(4);
    expect(Array.from(floats(sent[0]))).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
    expect(sent[0].sampleRate).toBe(48000);
    expect(sent[0].wet).toBe(false);
    expect(sent[0].endWallMs).toBe(1010);
  });

  it("keeps the two sides of a stereo source apart", () => {
    const sent = [];
    const batcher = createTakeBatcher((chunk) => sent.push(chunk), 2);
    batcher.push(Float32Array.of(1, 2), Float32Array.of(-1, -2), 2, 44100, true, 5);
    expect(Array.from(floats(sent[0]))).toEqual([1, -1, 2, -2]);
    expect(sent[0].wet).toBe(true);
  });

  it("stamps a batch that ends mid-block with when its own last sample arrived", () => {
    const sent = [];
    const batcher = createTakeBatcher((chunk) => sent.push(chunk), 2);
    // Three frames at 1000 Hz arriving at t=100: the first two ended 1 ms earlier.
    batcher.push(Float32Array.of(1, 2, 3), null, 3, 1000, false, 100);
    expect(sent).toHaveLength(1);
    expect(sent[0].endWallMs).toBe(99);
    batcher.flush();
    expect(sent).toHaveLength(2);
    expect(sent[1].frames).toBe(1);
    expect(sent[1].endWallMs).toBe(100);
  });

  it("gives each batch a buffer of its own, exactly its length", () => {
    const sent = [];
    const batcher = createTakeBatcher((chunk) => sent.push(chunk), 2);
    batcher.push(Float32Array.of(1, 2, 3, 4), null, 4, 48000, false, 0);
    expect(sent).toHaveLength(2);
    expect(sent[0].pcm.buffer).not.toBe(sent[1].pcm.buffer);
    expect(sent[0].pcm.buffer.byteLength).toBe(2 * 2 * 4);
    expect(Array.from(floats(sent[0]))).toEqual([1, 1, 2, 2]);
    expect(Array.from(floats(sent[1]))).toEqual([3, 3, 4, 4]);
  });

  it("does not mix two sample rates in one batch", () => {
    const sent = [];
    const batcher = createTakeBatcher((chunk) => sent.push(chunk), 4);
    batcher.push(Float32Array.of(1), null, 1, 44100, false, 10);
    batcher.push(Float32Array.of(2), null, 1, 48000, false, 20);
    expect(sent).toHaveLength(1);
    expect(sent[0].sampleRate).toBe(44100);
    expect(sent[0].frames).toBe(1);
    batcher.flush();
    expect(sent[1].sampleRate).toBe(48000);
  });

  it("drops what is waiting on reset", () => {
    const sent = [];
    const batcher = createTakeBatcher((chunk) => sent.push(chunk), 4);
    batcher.push(Float32Array.of(1), null, 1, 48000, false, 10);
    batcher.reset();
    batcher.flush();
    expect(sent).toHaveLength(0);
  });
});
