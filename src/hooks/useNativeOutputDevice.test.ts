import { describe, expect, it } from "vitest";

import { fuzzyMatchOutputDevice } from "./useNativeOutputDevice";

const device = (deviceId: string, label: string): MediaDeviceInfo =>
  ({ deviceId, label, kind: "audiooutput", groupId: "" }) as MediaDeviceInfo;

describe("fuzzyMatchOutputDevice", () => {
  it("matches when the output label contains the input device name", () => {
    const candidates = [device("1", "Speakers (Realtek Audio)"), device("2", "Audient iD4 (Digital Audio Interface)")];
    expect(fuzzyMatchOutputDevice("Audient USB Audio ASIO Driver", candidates)?.deviceId).toBe("2");
  });

  it("matches when the input device name contains the output label", () => {
    const candidates = [device("1", "iD4")];
    expect(fuzzyMatchOutputDevice("Audient iD4 ASIO Driver", candidates)?.deviceId).toBe("1");
  });

  it("returns null when nothing overlaps", () => {
    const candidates = [device("1", "Speakers (Realtek Audio)"), device("2", "Headphones (USB)")];
    expect(fuzzyMatchOutputDevice("ASIO4ALL v2", candidates)).toBeNull();
  });

  it("returns null for short or empty hints instead of guessing", () => {
    const candidates = [device("1", "Speakers")];
    expect(fuzzyMatchOutputDevice("", candidates)).toBeNull();
    expect(fuzzyMatchOutputDevice(null, candidates)).toBeNull();
    expect(fuzzyMatchOutputDevice("USB", candidates)).toBeNull();
  });

  it("picks the candidate with the longer overlap when multiple match", () => {
    const candidates = [device("1", "Audient"), device("2", "Audient iD4 USB Audio")];
    expect(fuzzyMatchOutputDevice("Audient iD4", candidates)?.deviceId).toBe("2");
  });
});
