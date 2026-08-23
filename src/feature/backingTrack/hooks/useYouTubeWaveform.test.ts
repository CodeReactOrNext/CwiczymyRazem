// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useYouTubeWaveform } from "./useYouTubeWaveform";

const readWaveform = vi.fn();
const writeWaveform = vi.fn();

vi.mock("../services/waveformCache", () => ({
  readWaveform: (...args: unknown[]) => readWaveform(...args),
  writeWaveform: (...args: unknown[]) => writeWaveform(...args),
  deleteWaveform: vi.fn(),
  WAVEFORM_SCHEMA: 2,
}));

const acquireTabAudioCapture = vi.fn();
const peekTabAudioCapture = vi.fn();
const releaseTabAudioCapture = vi.fn();
const isSupported = vi.fn();

vi.mock("../services/tabAudioCapture", () => ({
  acquireTabAudioCapture: (...args: unknown[]) => acquireTabAudioCapture(...args),
  peekTabAudioCapture: (...args: unknown[]) => peekTabAudioCapture(...args),
  releaseTabAudioCapture: (...args: unknown[]) => releaseTabAudioCapture(...args),
  isTabAudioCaptureSupported: () => isSupported(),
  TabAudioCaptureError: class TabAudioCaptureError extends Error {},
}));

/** A capture that is open and hears nothing — enough to test what attaches. */
const fakeCapture = () => ({
  toPerformanceMs: (contextTime: number) => contextTime * 1000,
  latencySec: 0.12,
  calibrate: vi.fn().mockResolvedValue(0.12),
  subscribe: vi.fn().mockReturnValue(vi.fn()),
  isLive: () => true,
  onEnded: vi.fn().mockReturnValue(vi.fn()),
});

const clock = () => ({ currentTime: 0, duration: 240, rate: 1, isPlaying: true });

const render = (videoId: string | null = "abc123") =>
  renderHook(
    ({ id }: { id: string | null }) =>
      useYouTubeWaveform({ videoId: id, getClock: clock, enabled: true }),
    { initialProps: { id: videoId } },
  );

beforeEach(() => {
  readWaveform.mockReset().mockResolvedValue(null);
  writeWaveform.mockReset();
  acquireTabAudioCapture.mockReset().mockRejectedValue(new Error("no gesture"));
  peekTabAudioCapture.mockReset().mockReturnValue(null);
  releaseTabAudioCapture.mockReset();
  isSupported.mockReset().mockReturnValue(true);
  // The web build unless a test says otherwise — the desktop one is where
  // listening may start on its own.
  delete (window as { electronWindow?: unknown }).electronWindow;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as { electronWindow?: unknown }).electronWindow;
});

describe("useYouTubeWaveform", () => {
  it("has nothing to show for a video it has never heard", () => {
    const { result } = render();

    expect(result.current.status).toBe("idle");
    expect(result.current.coverage).toBe(0);
    expect(result.current.peaks).toBeNull();
  });

  it("says there is nothing to do without a video", () => {
    const { result } = render(null);

    expect(result.current.status).toBe("unsupported");
  });

  it("says there is nothing to do where the browser can't share audio", () => {
    isSupported.mockReturnValue(false);
    const { result } = render();

    expect(result.current.status).toBe("unsupported");
  });

  it("looks for a waveform saved on a previous visit", () => {
    render();

    expect(readWaveform).toHaveBeenCalledWith("abc123");
  });

  it("shows what a previous visit learned before hearing anything new", async () => {
    readWaveform.mockResolvedValue({
      videoId: "abc123",
      peaks: Uint8Array.from([1, 128, 255]),
      onsets: Uint8Array.from([1, 200, 1]),
      peakScale: 0.9,
      onsetScale: 0.2,
      durationSec: 240,
      bucketsPerSecond: 120,
      coverage: 0.5,
      latencyMs: 120,
      schema: 2,
      updatedAt: 0,
    });

    const { result } = render();

    await waitFor(() => expect(result.current.coverage).toBe(0.5));
    expect(result.current.peaks).not.toBeNull();
    expect(result.current.onsets).not.toBeNull();
  });

  it("writes nothing on close when nothing was heard", () => {
    // The dangerous direction: closing the screen must not stamp an empty
    // waveform over one a previous session spent a play-through learning.
    const { unmount } = render();

    unmount();

    expect(writeWaveform).not.toHaveBeenCalled();
  });

  it("writes nothing when the video is swapped before anything is heard", () => {
    const { rerender } = render();

    rerender({ id: "def456" });

    expect(writeWaveform).not.toHaveBeenCalled();
  });

  it("does not open a capture by itself in a browser", () => {
    // Display capture costs a permission prompt, and putting one in front of
    // somebody who did not ask for it is not on.
    render();

    expect(acquireTabAudioCapture).not.toHaveBeenCalled();
  });

  it("opens one by itself on the desktop build, where nothing is asked", async () => {
    (window as { electronWindow?: unknown }).electronWindow = { platform: "win32" };
    acquireTabAudioCapture.mockResolvedValue(fakeCapture());

    render();

    await waitFor(() => expect(acquireTabAudioCapture).toHaveBeenCalled());
  });

  it("attaches to a capture that is already open, prompting nobody", async () => {
    // What makes a second video free: the capture is shared and outlives the
    // video it was opened for.
    const capture = fakeCapture();
    peekTabAudioCapture.mockReturnValue(capture);

    const { result } = render();

    await waitFor(() => expect(result.current.status).toBe("listening"));
    expect(capture.subscribe).toHaveBeenCalled();
    expect(acquireTabAudioCapture).not.toHaveBeenCalled();
  });

  it("reports the capture delay it will be correcting for", async () => {
    peekTabAudioCapture.mockReturnValue(fakeCapture());

    const { result } = render();

    await waitFor(() => expect(result.current.latencyMs).toBeCloseTo(120));
  });

  it("stops listening for the rest of the page once it is turned off by hand", async () => {
    peekTabAudioCapture.mockReturnValue(fakeCapture());
    const { result, unmount } = render();
    await waitFor(() => expect(result.current.status).toBe("listening"));

    act(() => result.current.stop());
    expect(releaseTabAudioCapture).toHaveBeenCalled();

    // A remount must not quietly re-arm the thing that was just switched off.
    unmount();
    peekTabAudioCapture.mockReturnValue(null);
    (window as { electronWindow?: unknown }).electronWindow = { platform: "win32" };
    render();

    expect(acquireTabAudioCapture).not.toHaveBeenCalled();
  });
});
