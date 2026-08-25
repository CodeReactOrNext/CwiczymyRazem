// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { YouTubeWaveform } from "../hooks/useYouTubeWaveform";
import { WaveformCaptureDialog } from "./WaveformCaptureDialog";

/** The player the dialog drives, and what the last render asked the hook for. */
const player = { playVideo: vi.fn(), pauseVideo: vi.fn() };
const spy = {
  listen: false,
  start: vi.fn(),
  stop: vi.fn(),
  flush: vi.fn(() => Promise.resolve()),
  coverage: 0,
};

vi.mock("react-youtube", async () => {
  const { useEffect } = await import("react");
  return {
    default: function YouTubeStub({ onReady }: { onReady: (e: { target: unknown }) => void }) {
      useEffect(() => onReady({ target: player }), [onReady]);
      return <div data-testid='youtube-player' />;
    },
  };
});

vi.mock("../hooks/useYouTubeWaveform", () => ({
  useYouTubeWaveform: (params: { listen: boolean }): YouTubeWaveform => {
    spy.listen = params.listen;
    return {
      status: "idle",
      peaks: null,
      onsets: null,
      peaksPerSecond: 120,
      durationSec: 0,
      coverage: spy.coverage,
      isComplete: false,
      revision: 0,
      latencyMs: null,
      error: null,
      start: spy.start,
      stop: spy.stop,
      watch: () => () => {},
      flush: spy.flush,
      refresh: vi.fn(),
    };
  },
}));

beforeEach(() => {
  spy.listen = false;
  spy.coverage = 0;
  spy.start.mockClear();
  spy.stop.mockClear();
  spy.flush.mockClear();
  player.playVideo.mockClear();
  player.pauseVideo.mockClear();
});

afterEach(cleanup);

const renderDialog = (onCaptured = vi.fn(), onClose = vi.fn()) => {
  render(
    <WaveformCaptureDialog videoId='abc' onCaptured={onCaptured} onClose={onClose} />,
  );
  return { onCaptured, onClose };
};

describe("WaveformCaptureDialog", () => {
  it("listens to nothing until it is asked to", () => {
    renderDialog();

    // The whole point of moving capture in here: opening it costs nothing.
    expect(spy.listen).toBe(false);
    expect(player.playVideo).not.toHaveBeenCalled();
  });

  it("starts the capture and the video together", () => {
    renderDialog();

    fireEvent.click(screen.getByText("Start capture"));

    expect(spy.listen).toBe(true);
    // `start` is what carries the click into the platform's permission prompt.
    expect(spy.start).toHaveBeenCalled();
    expect(player.playVideo).toHaveBeenCalled();
  });

  it("stops itself after the length that was picked", async () => {
    vi.useFakeTimers();
    try {
      const { onCaptured } = renderDialog();

      fireEvent.click(screen.getByText("15 s"));
      fireEvent.click(screen.getByText("Start capture"));
      expect(spy.listen).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(15_000);
        await Promise.resolve();
      });

      expect(spy.stop).toHaveBeenCalled();
      expect(player.pauseVideo).toHaveBeenCalled();
      expect(spy.listen).toBe(false);
      // Written before the timeline is told to re-read it, or it would read
      // back the picture from before this pass.
      expect(spy.flush).toHaveBeenCalled();
      expect(onCaptured).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("runs until stopped by hand when no length is set", async () => {
    vi.useFakeTimers();
    try {
      renderDialog();

      fireEvent.click(screen.getByText("Until I stop"));
      fireEvent.click(screen.getByText("Start capture"));

      await act(async () => {
        vi.advanceTimersByTime(600_000);
        await Promise.resolve();
      });
      expect(spy.stop).not.toHaveBeenCalled();

      await act(async () => {
        fireEvent.click(screen.getByText("Stop"));
        await Promise.resolve();
      });
      expect(spy.stop).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("reports how much of the video has been heard", () => {
    spy.coverage = 0.23;
    renderDialog();

    expect(screen.getByText("23% of the video heard")).toBeTruthy();
  });

  it("closes on Escape without taking the editor behind it down", () => {
    const onClose = vi.fn();
    const onEditorEscape = vi.fn();
    window.addEventListener("keydown", onEditorEscape);
    try {
      renderDialog(vi.fn(), onClose);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).toHaveBeenCalled();
      expect(onEditorEscape).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("keydown", onEditorEscape);
    }
  });
});
