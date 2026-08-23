// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { createRecordingTempoMap } from "../utils/tempoMap";
import { StemLane } from "./StemLane";

// jsdom ships no ResizeObserver, which Radix's Slider measures its thumb with.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterEach(cleanup);

const LANE_WIDTH = 1000;

beforeAll(() => {
  // jsdom lays nothing out, so the lane would compute a nonsense seconds-per-pixel.
  Object.defineProperty(HTMLCanvasElement.prototype, "clientWidth", {
    configurable: true,
    get: () => LANE_WIDTH,
  });
});

const timeline = {
  startTime: null,
  effectiveBpm: 120,
  // An exercise with no tempo automation: warped beats are score beats.
  scoreClockRef: { current: null },
  sourceBpm: 120,
  offsetMs: 8_000,
  // No anchors: an even grid, exactly what sourceBpm and offsetMs described before.
  tempoMap: createRecordingTempoMap({ anchors: [], offsetMs: 8_000, sourceBpm: 120 }),
  beatsPerBar: 4,
  // 1000 px across 4 s → 4 ms per pixel.
  windowSec: 4,
  centreSecOverride: null,
};

function renderLane(stemOffsetMs: number, onStemOffsetChange = vi.fn()) {
  render(
    <StemLane
      {...timeline}
      stem={{ trackId: "guitar", volume: 1, muted: false, offsetMs: stemOffsetMs }}
      name='Guitar'
      src={null}
      heightPx={80}
      onStemOffsetChange={onStemOffsetChange}
      onVolumeChange={vi.fn()}
      onToggleMute={vi.fn()}
      onSolo={vi.fn()}
      onRemove={vi.fn()}
    />,
  );
  return {
    onStemOffsetChange,
    lane: screen.getByLabelText("Backing track alignment grid — drag to shift the recording"),
  };
}

function drag(lane: HTMLElement, fromX: number, toX: number) {
  fireEvent.pointerDown(lane, { clientX: fromX, pointerId: 1 });
  fireEvent.pointerMove(lane, { clientX: toX, pointerId: 1 });
}

describe("StemLane dragging", () => {
  it("moves the stem from where it already sits, not from the shared offset", () => {
    // The regression this guards: the lane used to compute the new value from
    // the assignment's offset (8000 ms here) and write it to the stem, so the
    // first pixel of a drag teleported the clip.
    const { onStemOffsetChange, lane } = renderLane(200);

    drag(lane, 500, 550);

    const [next] = onStemOffsetChange.mock.calls[0];
    expect(next).toBeCloseTo(0);
    expect(Math.abs(next - timeline.offsetMs)).toBeGreaterThan(1_000);
  });

  it("dragging right pulls the clip later, which lowers its offset", () => {
    const { onStemOffsetChange, lane } = renderLane(1_000);

    drag(lane, 400, 500);

    expect(onStemOffsetChange.mock.calls[0][0]).toBeCloseTo(600);
  });

  it("dragging left pushes it the other way by the same amount", () => {
    const { onStemOffsetChange, lane } = renderLane(1_000);

    drag(lane, 500, 400);

    expect(onStemOffsetChange.mock.calls[0][0]).toBeCloseTo(1_400);
  });

  it("does not re-seek on every pointer event — that would stutter the audio", () => {
    const { onStemOffsetChange, lane } = renderLane(0);

    drag(lane, 500, 520);

    expect(onStemOffsetChange.mock.calls[0][1]).toEqual({ realign: false });
  });

  it("asks for one re-seek on release, without moving the clip again", () => {
    const { onStemOffsetChange, lane } = renderLane(350);

    drag(lane, 500, 520);
    fireEvent.pointerUp(lane, { clientX: 520, pointerId: 1 });

    const last = onStemOffsetChange.mock.calls.at(-1);
    expect(last?.[1]).toEqual({ realign: true });
    // Release adds nothing of its own: it commits the offset the stem is on.
    expect(last?.[0]).toBe(350);
  });

  it("ignores pointer movement that never started on the lane", () => {
    const { onStemOffsetChange, lane } = renderLane(0);

    fireEvent.pointerMove(lane, { clientX: 700, pointerId: 1 });

    expect(onStemOffsetChange).not.toHaveBeenCalled();
  });

  it("says where the stem sits relative to the recording", () => {
    renderLane(0);
    expect(screen.getByText("On the grid")).toBeTruthy();
  });
});
