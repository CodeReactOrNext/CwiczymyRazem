// @vitest-environment jsdom
import type { TabJson } from "lib/mcp/tablature/tabJson";
import { checkTab } from "lib/mcp/tablature/tabJson";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TAB_BOARD_JS } from "../generated/tabBoardBundle";
import { defaultBoard } from "../tabPreview";
import type { TabBoard } from "./tabBoard";

const TAB: TabJson = {
  measures: [
    {
      timeSignature: "4/4",
      beats: [
        { duration: "quarter", chord: "Em", notes: [{ string: 6, fret: 0 }, { string: 5, fret: 2 }, { string: 4, fret: 2 }] },
        { duration: "eighth", notes: [{ string: 3, fret: 5, techniques: ["hammer-on"] }] },
        { duration: "eighth", notes: [{ string: 3, fret: 7 }] },
        { duration: "quarter", notes: [{ string: 2, fret: 8, bend: { semitones: 2 } }] },
        { duration: "quarter", rest: true },
      ],
    },
  ],
};

/** jsdom has no 2D context: one that takes every call, so the worker's drawing runs. */
function fakeContext(): CanvasRenderingContext2D {
  const state: Record<string | symbol, unknown> = {};
  const noop = () => undefined;
  return new Proxy(state, {
    get: (target, prop) => {
      if (prop in target) return target[prop];
      if (prop === "measureText") return (text: string) => ({ width: text.length * 7, actualBoundingBoxAscent: 7, actualBoundingBoxDescent: 2 });
      if (prop === "createLinearGradient" || prop === "createRadialGradient") return () => ({ addColorStop: noop });
      if (prop === "getTransform") return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
      return noop;
    },
    set: (target, prop, value) => {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

describe("bundled tab board", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("mounts from the bundle, draws, and takes the page's playback calls", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      "OffscreenCanvas",
      class {
        constructor(public width: number, public height: number) {}
        getContext() { return fakeContext(); }
      },
    );
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => frames.push(callback));
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => fakeContext() as never);
    new Function(TAB_BOARD_JS)();

    const { measures } = checkTab(TAB, "guitar");
    const container = document.createElement("div");
    Object.defineProperty(container, "clientWidth", { value: 600 });
    Object.defineProperty(container, "clientHeight", { value: 260 });
    document.body.appendChild(container);
    const { RiffTabBoard } = globalThis as unknown as {
      RiffTabBoard: { mount: (el: HTMLElement, input: unknown, onSeek: (beat: number) => void) => TabBoard };
    };
    const board = RiffTabBoard.mount(container, defaultBoard(measures, 90, "guitar"), vi.fn());
    const frame = () => frames.shift()?.(performance.now());

    expect(container.querySelector("canvas")).not.toBeNull();
    expect(frames.length).toBeGreaterThan(0);
    expect(() => {
      frame();
      board.play(0);
      frame();
      board.play(1500);
      frame();
      board.pause(2);
      frame();
      board.seek(0);
      board.setVisible(false);
      frame();
    }).not.toThrow();
  });
});
