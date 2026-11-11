import { afterEach, describe, expect, it } from "vitest";

import { configure, push, shippedHash, start, stop } from "./captureDspHost";

const SR = 48000;
const BLOCK = 256;

/** `count` blocks of a steady tone as FLOAT32 mono bytes, starting at block `from`. */
function toneBlocks(hz, from, count) {
  const blocks = [];
  for (let b = from; b < from + count; b++) {
    const samples = new Float32Array(BLOCK);
    for (let i = 0; i < BLOCK; i++) samples[i] = 0.2 * Math.sin((2 * Math.PI * hz * (b * BLOCK + i)) / SR);
    blocks.push(new Uint8Array(samples.buffer));
  }
  return blocks;
}

const until = async (condition) => {
  for (let i = 0; i < 200 && !condition(); i++) await new Promise((resolve) => setTimeout(resolve, 10));
};

afterEach(() => stop());

describe("captureDspHost", () => {
  it("stays off for a web app built with other detectors than the shell ships", async () => {
    const engaged = await start({ hash: "not-this-one", sampleRate: SR, blockFrames: BLOCK, settings: {}, onMessage() {}, onLost() {} });
    expect(engaged).toBe(false);
    // Off: the block is the caller's to send to the window.
    expect(push(toneBlocks(220, 0, 1)[0])).toBe(false);
  });

  it("reads the capture's blocks in its own thread, a message per analysis window", async () => {
    const messages = [];
    const engaged = await start({
      hash: shippedHash(),
      sampleRate: SR,
      blockFrames: BLOCK,
      settings: { gain: 3, bass: false, strum: false },
      onMessage: (message) => messages.push(message),
      onLost() {},
    });
    expect(engaged).toBe(true);

    // Two seconds of A3: 375 blocks, 46 windows of 2048 — each block stamped
    // with when it would have arrived, as the detectors read time off the stamps.
    const startMs = Date.now();
    toneBlocks(220, 0, 375).forEach((block, index) => {
      expect(push(block, startMs + ((index + 1) * BLOCK * 1000) / SR)).toBe(true);
    });
    await until(() => messages.length >= 46);

    expect(messages).toHaveLength(46);
    const last = messages[messages.length - 1];
    expect(last.type).toBe("readings");
    expect(last.samples).toBeInstanceOf(Float32Array);
    expect(last.samples).toHaveLength(2048);
    expect(Math.abs(last.readings.frequency - 220)).toBeLessThan(5);
    // The chord spectrum comes with the readings, its loudest bin on the tone.
    const { magnitudes, binHz } = last.spectrum;
    const loudest = magnitudes.indexOf(Math.max(...magnitudes));
    expect(Math.abs(loudest * binHz - 220)).toBeLessThan(binHz * 2);
    // The window is stamped with the arrival of the block that completed it.
    expect(last.timeMs).toBeCloseTo(startMs + (46 * 2048 * 1000) / SR, 3);
  }, 20_000);

  it("takes settings while it runs and stops sending once stopped", async () => {
    const messages = [];
    await start({ hash: shippedHash(), sampleRate: SR, blockFrames: BLOCK, settings: { gain: 3 }, onMessage: (message) => messages.push(message), onLost() {} });
    configure({ gain: 1 });
    for (const block of toneBlocks(220, 0, 16)) push(block);
    await until(() => messages.length >= 2);
    expect(messages.length).toBeGreaterThanOrEqual(2);

    stop();
    const seen = messages.length;
    expect(push(toneBlocks(220, 16, 1)[0])).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(messages).toHaveLength(seen);
  }, 20_000);
});
