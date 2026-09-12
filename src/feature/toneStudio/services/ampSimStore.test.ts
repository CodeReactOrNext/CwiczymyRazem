// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAmpSimState,
  loadAmpPreset,
  resetAmpSimStoreForTests,
  setAmpParams,
  startAmp,
  stopAmp,
  subscribeAmpSim,
  toggleAmp,
} from "./ampSimStore";

const streamInfo = {
  deviceName: "Scarlett 2i2",
  outDeviceName: null,
  sampleRate: 48000,
  frameSize: 256,
  outChannels: 2,
  outFirstChannel: 0,
  inChannel: 0,
  roundTripMs: 11,
  params: getAmpSimState().params,
};

/** A preload bridge with just the channels the store actually calls. */
const fakeBridge = (status = { isOpen: false, info: null }) => {
  const bridge = {
    isAvailable: true as const,
    start: vi.fn().mockResolvedValue(streamInfo),
    stop: vi.fn().mockResolvedValue(true),
    setParams: vi.fn().mockResolvedValue(streamInfo),
    getStatus: vi.fn().mockResolvedValue(status),
    onOverload: vi.fn().mockReturnValue(() => {}),
    onConnectionIssue: vi.fn().mockReturnValue(() => {}),
    onDevicesChanged: vi.fn().mockReturnValue(() => {}),
  };
  (window as unknown as { nativeAmp: unknown }).nativeAmp = bridge;
  return bridge;
};

beforeEach(() => {
  resetAmpSimStoreForTests();
  localStorage.clear();
  delete (window as unknown as { nativeAmp?: unknown }).nativeAmp;
});

describe("ampSimStore", () => {
  it("reports the amp unavailable when there is no desktop bridge", () => {
    subscribeAmpSim(() => {});
    expect(getAmpSimState().available).toBe(false);
  });

  it("hydrates persisted settings on the first subscriber", () => {
    localStorage.setItem("amp_sim_buffer_size", "128");
    localStorage.setItem("amp_sim_params", JSON.stringify({ drive: 0.9 }));
    localStorage.setItem("amp_sim_active_preset", "preset-7");
    fakeBridge();

    subscribeAmpSim(() => {});

    const state = getAmpSimState();
    expect(state.available).toBe(true);
    expect(state.bufferSize).toBe(128);
    expect(state.params.drive).toBe(0.9);
    // Params missing from the stored blob keep their defaults.
    expect(state.params.mid).toBe(0.5);
    expect(state.activePresetId).toBe("preset-7");
  });

  it("never stops the stream when a control unsubscribes", async () => {
    const bridge = fakeBridge();
    const unsubscribe = subscribeAmpSim(() => {});
    await startAmp();
    expect(getAmpSimState().isOn).toBe(true);

    // The Tone Studio page (or the session toolbar) going away.
    unsubscribe();

    expect(bridge.stop).not.toHaveBeenCalled();
    expect(getAmpSimState().isOn).toBe(true);
  });

  it("starts on the persisted device, channel, buffer and params", async () => {
    localStorage.setItem("native_audio_device_id", "3");
    localStorage.setItem("native_audio_channel_id", "1");
    localStorage.setItem("amp_sim_buffer_size", "128");
    const bridge = fakeBridge();
    subscribeAmpSim(() => {});

    await startAmp();

    expect(bridge.start).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 3,
        channel: 1,
        frameSize: 128,
        params: getAmpSimState().params,
      }),
    );
    expect(getAmpSimState().info).toEqual(streamInfo);
  });

  it("surfaces a failed start instead of claiming the amp is on", async () => {
    const bridge = fakeBridge();
    bridge.start.mockRejectedValueOnce(new Error("Device in use"));
    subscribeAmpSim(() => {});

    await startAmp();

    expect(getAmpSimState().isOn).toBe(false);
    expect(getAmpSimState().error).toBe("Device in use");
    expect(getAmpSimState().isBusy).toBe(false);
  });

  it("adopts a stream the main process is already running", async () => {
    fakeBridge({ isOpen: true, info: streamInfo as never });
    subscribeAmpSim(() => {});
    // getStatus resolves on a microtask, after hydrate returns.
    await vi.waitFor(() => expect(getAmpSimState().isOn).toBe(true));
    expect(getAmpSimState().info).toEqual(streamInfo);
  });

  it("shares one amp between every subscriber", async () => {
    fakeBridge();
    const header = vi.fn();
    const toneStudio = vi.fn();
    subscribeAmpSim(header);
    subscribeAmpSim(toneStudio);

    await toggleAmp();

    expect(getAmpSimState().isOn).toBe(true);
    expect(header).toHaveBeenCalled();
    expect(toneStudio).toHaveBeenCalled();
  });

  it("toggles the running stream off", async () => {
    const bridge = fakeBridge();
    subscribeAmpSim(() => {});
    await startAmp();

    await toggleAmp();

    expect(bridge.stop).toHaveBeenCalled();
    expect(getAmpSimState().isOn).toBe(false);
    expect(getAmpSimState().info).toBeNull();
  });

  it("pushes only the changed params to the engine but persists the whole set", () => {
    const bridge = fakeBridge();
    subscribeAmpSim(() => {});

    setAmpParams({ drive: 0.8 });

    expect(bridge.setParams).toHaveBeenCalledWith({ drive: 0.8 });
    expect(getAmpSimState().params.drive).toBe(0.8);
    expect(JSON.parse(localStorage.getItem("amp_sim_params") ?? "{}").mid).toBe(
      0.5,
    );
  });

  it("remembers which preset the live params came from", () => {
    fakeBridge();
    subscribeAmpSim(() => {});

    loadAmpPreset("crunch", { ...getAmpSimState().params, drive: 0.7 });

    expect(getAmpSimState().activePresetId).toBe("crunch");
    expect(localStorage.getItem("amp_sim_active_preset")).toBe("crunch");
  });

  it("does nothing at all without a bridge", async () => {
    subscribeAmpSim(() => {});
    await startAmp();
    await stopAmp();
    expect(getAmpSimState().isOn).toBe(false);
    expect(getAmpSimState().error).toBeNull();
  });
});
