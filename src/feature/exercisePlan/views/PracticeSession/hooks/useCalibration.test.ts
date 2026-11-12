// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useCalibration } from "./useCalibration";

const MIC_PREFERENCE_KEY = "mic_tracking_enabled";

describe("useCalibration", () => {
  beforeEach(() => localStorage.clear());

  it("saves the mic preference only once the wizard finishes", () => {
    const { result } = renderHook(() => useCalibration(true, true));

    act(() => result.current.handleEnableMic());
    expect(result.current.sessionPhase).toBe("calibrating");
    expect(localStorage.getItem(MIC_PREFERENCE_KEY)).toBeNull();

    act(() => result.current.handleCalibrationComplete());
    expect(result.current.isMicEnabled).toBe(true);
    expect(result.current.sessionPhase).toBe("ready");
    expect(localStorage.getItem(MIC_PREFERENCE_KEY)).toBe("true");
  });

  it("sends a cancelled wizard back to the mic prompt when the mic is required", () => {
    const { result } = renderHook(() => useCalibration(true, true));

    act(() => result.current.handleEnableMic());
    act(() => result.current.handleCalibrationCancel());

    expect(result.current.sessionPhase).toBe("mic_prompt");
    expect(result.current.isMicEnabled).toBe(false);
    expect(localStorage.getItem(MIC_PREFERENCE_KEY)).toBeNull();
  });

  it("lets a cancelled wizard fall through to the session when the mic is optional", () => {
    const { result } = renderHook(() => useCalibration(true, false));

    act(() => result.current.handleEnableMic());
    act(() => result.current.handleCalibrationCancel());

    expect(result.current.sessionPhase).toBe("ready");
    expect(result.current.isMicEnabled).toBe(false);
  });

  it("just closes a recalibration when the mic is already on", () => {
    localStorage.setItem(MIC_PREFERENCE_KEY, "true");
    const { result } = renderHook(() => useCalibration(true, true));

    act(() => result.current.handleRecalibrate());
    act(() => result.current.handleCalibrationCancel());

    expect(result.current.sessionPhase).toBe("ready");
    expect(result.current.isMicEnabled).toBe(true);
  });

  it("opens on the wizard when the mic was already said yes to, set up before or not", () => {
    const fresh = renderHook(() => useCalibration(true, false, "setup"));
    expect(fresh.result.current.sessionPhase).toBe("calibrating");
    expect(fresh.result.current.isMicEnabled).toBe(false);

    localStorage.setItem(MIC_PREFERENCE_KEY, "true");
    const setUp = renderHook(() => useCalibration(true, false, "setup"));
    expect(setUp.result.current.sessionPhase).toBe("calibrating");
    expect(setUp.result.current.isMicEnabled).toBe(true);

    act(() => setUp.result.current.handleCalibrationCancel());
    expect(setUp.result.current.sessionPhase).toBe("ready");
    expect(setUp.result.current.isMicEnabled).toBe(true);
  });

  it("starts with the mic off and remembers it when the player said no", () => {
    const { result } = renderHook(() => useCalibration(true, false, "off"));

    expect(result.current.sessionPhase).toBe("ready");
    expect(result.current.isMicEnabled).toBe(false);
    expect(localStorage.getItem(MIC_PREFERENCE_KEY)).toBe("false");

    // The next session doesn't ask again.
    const next = renderHook(() => useCalibration(true));
    expect(next.result.current.sessionPhase).toBe("ready");
    expect(next.result.current.isMicEnabled).toBe(false);
  });
});
