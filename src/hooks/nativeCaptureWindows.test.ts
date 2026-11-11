import { describe, expect, it } from "vitest";

import { batchWaitMs, blockArrivalLeadMs, createCaptureWindower } from "./nativeCaptureWindows";

const SR = 48000;

/** `length` samples counting up from `from`, so a window shows what it holds. */
const ramp = (from: number, length: number) => Float32Array.from({ length }, (_, i) => from + i);

describe("blockArrivalLeadMs", () => {
  it("is zero for a message of one block", () => {
    expect(blockArrivalLeadMs(0, 256, 256, SR)).toBe(0);
    expect(blockArrivalLeadMs(255, 256, 256, SR)).toBe(0);
  });

  it("counts the whole blocks after the sample's own", () => {
    const blockMs = (64 * 1000) / SR;
    // Four 64-frame blocks to a message.
    expect(blockArrivalLeadMs(0, 256, 64, SR)).toBeCloseTo(3 * blockMs);
    expect(blockArrivalLeadMs(63, 256, 64, SR)).toBeCloseTo(3 * blockMs);
    expect(blockArrivalLeadMs(64, 256, 64, SR)).toBeCloseTo(2 * blockMs);
    expect(blockArrivalLeadMs(255, 256, 64, SR)).toBe(0);
  });

  it("is zero where the block size is unknown or doesn't divide the message", () => {
    expect(blockArrivalLeadMs(0, 256, 0, SR)).toBe(0);
    expect(blockArrivalLeadMs(0, 300, 128, SR)).toBe(0);
    expect(blockArrivalLeadMs(0, 256, 64, 0)).toBe(0);
  });
});

describe("batchWaitMs", () => {
  it("is zero for one block a message", () => {
    expect(batchWaitMs(256, 256, SR)).toBe(0);
    expect(batchWaitMs(0, 256, SR)).toBe(0);
  });

  it("is the mean wait for the rest of the message", () => {
    // Four blocks: a window ends in any of them, waiting 3, 2, 1 or 0 blocks.
    expect(batchWaitMs(256, 64, SR)).toBeCloseTo((1.5 * 64 * 1000) / SR);
    expect(batchWaitMs(256, 128, SR)).toBeCloseTo((0.5 * 128 * 1000) / SR);
  });
});

describe("createCaptureWindower", () => {
  it("cuts messages of any size into full windows, in order", () => {
    const windows: number[][] = [];
    const windower = createCaptureWindower(4, (win) => { windows.push([...win]); return false; });
    windower.push(ramp(0, 3), 100, SR, 0);
    expect(windows).toHaveLength(0);
    windower.push(ramp(3, 6), 110, SR, 0);
    expect(windows).toEqual([[0, 1, 2, 3], [4, 5, 6, 7]]);
  });

  it("fills a new buffer once a window was kept", () => {
    const kept: Float32Array[] = [];
    const windower = createCaptureWindower(2, (win) => { kept.push(win); return true; });
    windower.push(ramp(0, 4), 100, SR, 0);
    expect(kept).toHaveLength(2);
    expect(kept[0]).not.toBe(kept[1]);
    expect([...kept[0]]).toEqual([0, 1]);
    expect([...kept[1]]).toEqual([2, 3]);
  });

  it("stamps a window with when its last sample's block would have arrived alone", () => {
    const times: number[] = [];
    const windower = createCaptureWindower(64, (_win, timeMs) => { times.push(timeMs); return false; });
    const blockMs = (64 * 1000) / SR;
    // One message of four 64-frame blocks: four windows, a block apart.
    windower.push(ramp(0, 256), 1000, SR, 64);
    expect(times).toHaveLength(4);
    expect(times[0]).toBeCloseTo(1000 - 3 * blockMs);
    expect(times[1]).toBeCloseTo(1000 - 2 * blockMs);
    expect(times[2]).toBeCloseTo(1000 - blockMs);
    expect(times[3]).toBe(1000);
  });

  it("stamps with the arrival itself when every message is one block", () => {
    const times: number[] = [];
    const windower = createCaptureWindower(512, (_win, timeMs) => { times.push(timeMs); return false; });
    windower.push(ramp(0, 256), 1000, SR, 256);
    windower.push(ramp(0, 256), 1005, SR, 256);
    expect(times).toEqual([1005]);
  });

  it("starts the window over on reset", () => {
    const windows: number[][] = [];
    const windower = createCaptureWindower(3, (win) => { windows.push([...win]); return false; });
    windower.push(ramp(0, 2), 100, SR, 0);
    windower.reset();
    windower.push(ramp(10, 3), 110, SR, 0);
    expect(windows).toEqual([[10, 11, 12]]);
  });
});
