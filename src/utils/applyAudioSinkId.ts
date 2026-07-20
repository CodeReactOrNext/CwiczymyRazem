// Redirects Web Audio output to a specific device. Used on Electron to keep the
// app's own playback (metronome, tab-along synth, AlphaTab, backing tracks) on the
// same physical interface as the native ASIO capture stream — ASIO is exclusive on
// the hardware, so if playback goes out through a different default output device,
// the driver gets "taken over" and native capture glitches/dies.
//
// `AudioContext.setSinkId` is the standard Audio Output Devices API (stable in
// Chromium since v110 — not yet in this project's `lib.dom.d.ts`).
declare global {
  interface AudioContext {
    setSinkId?(sinkId: string): Promise<void>;
    readonly sinkId?: string;
  }
}

/** No-op if unsupported, no device chosen, or already on that sink. */
export async function applySinkId(ctx: AudioContext | null | undefined, deviceId: string | null): Promise<void> {
  if (!ctx || !deviceId) return;
  if (typeof ctx.setSinkId !== "function") return;
  if (ctx.sinkId === deviceId) return;
  try {
    await ctx.setSinkId(deviceId);
  } catch {
    /* ignore — device may have disappeared, or the API may reject mid-session */
  }
}

interface AlphaTabOutputApi {
  enumerateOutputDevices(): Promise<{ deviceId: string }[]>;
  setOutputDevice(device: { deviceId: string } | null): Promise<void>;
}

/**
 * AlphaTab manages its own internal AudioContext with no public way to redirect it
 * via setSinkId — it exposes its own equivalent device-selection API instead, built
 * on the same `deviceId` space as navigator.mediaDevices.
 */
export async function applyAlphaTabOutputDevice(api: AlphaTabOutputApi | null | undefined, deviceId: string | null): Promise<void> {
  if (!api || !deviceId) return;
  try {
    const devices = await api.enumerateOutputDevices();
    const match = devices.find((d) => d.deviceId === deviceId);
    if (match) await api.setOutputDevice(match);
  } catch {
    /* ignore — leave AlphaTab on its default device */
  }
}
