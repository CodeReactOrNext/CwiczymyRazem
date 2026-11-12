// @vitest-environment jsdom
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { gapTestEngine } from "./metronomeGapTestEngine";

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

  it("reports nothing about the silence — counting it is the player's job", () => {
    pressSpaceOn(document.body);
    const state = gapTestEngine.getSnapshot();
    expect(state.leadBar).toBe(0);
    expect(state).not.toHaveProperty("silentBar");
    expect(state).not.toHaveProperty("getReady");
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
