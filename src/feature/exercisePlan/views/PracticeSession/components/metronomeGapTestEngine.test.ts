// @vitest-environment jsdom
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { gapTestEngine, makeCueOffsets } from "./metronomeGapTestEngine";

/** How far an offset sits from the nearest beat line, in beats. */
const offBeat = (offset: number) => Math.abs(offset - Math.round(offset));

describe("makeCueOffsets", () => {
  it("times one cue per silent bar and reveals the first one without delay", () => {
    const offsets = makeCueOffsets(4);
    expect(offsets).toHaveLength(4);
    expect(offsets[0]).toBe(0);
  });

  it("keeps every cue clear of a beat line and inside its own bar", () => {
    for (let round = 0; round < 200; round++) {
      makeCueOffsets(6)
        .slice(1)
        .forEach((offset) => {
          // 0.29 rather than 0.3: the offsets are floating-point sums.
          expect(offBeat(offset)).toBeGreaterThan(0.29);
          expect(offset).toBeLessThan(4);
        });
    }
  });

  it("draws each bar on its own, so the cues aren't the grid with one shift", () => {
    const queue = [0.9, 0, 0.1, 0.5, 0.9, 1];
    const rand = () => queue.shift() ?? 0;
    const offsets = makeCueOffsets(4, rand);
    expect(offsets[0]).toBe(0);
    expect(offsets[1]).toBeCloseTo(1.3, 5);
    expect(offsets[2]).toBeCloseTo(0.5, 5);
    expect(offsets[3]).toBeCloseTo(1.7, 5);
    // Bar-to-bar spacing varies, so the cues can't be counted as a pulse.
    expect(offsets[2] - offsets[1]).not.toBeCloseTo(offsets[3] - offsets[2], 5);
  });
});

class FakeAudioParam {
  value = 0;
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
}

class FakeAudioNode {
  frequency = new FakeAudioParam();
  gain = new FakeAudioParam();
  type = "";
  connect<T>(target: T): T {
    return target;
  }
  start() {}
  stop() {}
}

/** Just enough Web Audio for the engine to schedule its click track. */
class FakeAudioContext {
  currentTime = 0;
  baseLatency = 0;
  outputLatency = 0;
  destination = {};
  resume() {
    return Promise.resolve();
  }
  createOscillator() {
    return new FakeAudioNode();
  }
  createGain() {
    return new FakeAudioNode();
  }
}

describe("the spacebar while a gap test panel is mounted", () => {
  let sessionShortcut: Mock<(event: Event) => void>;

  const pressSpaceOn = (target: EventTarget) =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "Space",
        bubbles: true,
        cancelable: true,
      }),
    );

  beforeEach(() => {
    (window as unknown as { AudioContext: unknown }).AudioContext =
      FakeAudioContext;
    sessionShortcut = vi.fn<(event: Event) => void>();
    // Stands in for useSessionControls' play/pause shortcut: same target, bubble phase.
    window.addEventListener("keydown", sessionShortcut);
    gapTestEngine.retain();
  });

  afterEach(() => {
    gapTestEngine.release();
    gapTestEngine.reset(); // the engine is a module singleton — clear its history
    window.removeEventListener("keydown", sessionShortcut);
  });

  it("starts a round instead of reaching the session's play/pause shortcut", () => {
    pressSpaceOn(document.body);
    expect(gapTestEngine.getSnapshot().running).toBe(true);
    expect(sessionShortcut).not.toHaveBeenCalled();
  });

  it("taps a live round without pausing the practice clock", () => {
    pressSpaceOn(document.body); // starts the round
    pressSpaceOn(document.body); // answers it
    expect(sessionShortcut).not.toHaveBeenCalled();
  });

  it("leaves the key alone while the player is typing", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    pressSpaceOn(input);
    expect(gapTestEngine.getSnapshot().running).toBe(false);
    expect(sessionShortcut).toHaveBeenCalledTimes(1);
    input.remove();
  });

  it("drops a live round when the session clock stops", () => {
    pressSpaceOn(document.body);
    gapTestEngine.stop();
    const state = gapTestEngine.getSnapshot();
    expect(state.running).toBe(false);
    expect(state.phase).toBe("idle");
    expect(state.history).toHaveLength(0);
  });
});
