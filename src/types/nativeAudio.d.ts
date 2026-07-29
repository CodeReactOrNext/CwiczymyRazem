// Injected by the Electron preload (electron/preload.js). Present only in the
// desktop build; the web build leaves `window.nativeAudio` undefined.
export interface NativeAudioDevice {
  id: number;
  name: string;
  inputChannels: number;
  outputChannels: number;
  isDefaultInput: boolean;
  isDefaultOutput?: boolean;
  preferredSampleRate?: number;
  sampleRates?: number[];
}

export interface NativeAudioDeviceList {
  /** Active audio API, e.g. "ASIO" / "WASAPI". */
  api: string;
  devices: NativeAudioDevice[];
}

export interface NativeAudioStreamInfo {
  deviceId: number;
  deviceName: string;
  channel: number;
  sampleRate: number;
  frameSize: number;
  streamLatencyFrames: number;
  /** Measured capture latency (stream latency + one block) in ms. */
  latencyMs: number;
}

export interface NativeAudioStartOpts {
  deviceId: number;
  channel?: number;
  sampleRate?: number;
  frameSize?: number;
}

/** Fired when the shared native stream is lost (device disconnected, driver reset
 *  from its own control panel, system resume) and again as the engine retries in
 *  the background — see nativeAudioEngine.js's scheduleRecovery. `"lost"` fires
 *  once, `"retrying"` on each subsequent attempt, `"recovered"` once the stream is
 *  back, `"failed"` once retries are exhausted (the user needs to act: replug the
 *  interface, close whatever else is holding the ASIO driver, then restart). */
export interface ConnectionIssueInfo {
  status: "lost" | "retrying" | "recovered" | "failed";
  message?: string;
  attempt?: number;
}

export interface NativeAudioApi {
  isAvailable: true;
  listDevices: () => Promise<NativeAudioDeviceList>;
  start: (opts: NativeAudioStartOpts) => Promise<NativeAudioStreamInfo>;
  stop: () => Promise<boolean>;
  getStatus: () => Promise<{ isOpen: boolean; info: NativeAudioStreamInfo | null }>;
  /** Subscribe to captured FLOAT32 mono PCM blocks. Returns an unsubscribe fn.
   *  `sentAt` is the main process's Date.now() when this block was sent — main
   *  and renderer share the OS clock, so comparing it against Date.now() on
   *  receipt measures the actual main→renderer hand-off delay (IPC + however
   *  busy the renderer's event loop is right now), which isn't otherwise
   *  visible to the renderer-side latency estimate. */
  onFrame: (cb: (buf: Uint8Array, sentAt: number) => void) => () => void;
  /** Subscribe to stream-loss/recovery events. Returns an unsubscribe fn. */
  onConnectionIssue: (cb: (info: ConnectionIssueInfo) => void) => () => void;
  /** Subscribe to native device-list changes (hot-plug). Returns an unsubscribe fn. */
  onDevicesChanged: (cb: () => void) => () => void;
}

export interface AmpParams {
  /** 0..1 — pre-gain into the first (preamp) gain stage, ahead of the tone
   *  stack. Gentler ceiling than `drive` below — cascades with it rather than
   *  replacing it, like a real amp's preamp section feeding its power amp. */
  preampGain: number;
  /** 0..1 — pre-gain into the power-amp (second/final) waveshaper (distortion amount). */
  drive: number;
  /** 0..1 — low shelf (~120Hz), 0.5 = flat/0dB, like a real tone stack. */
  bass: number;
  /** 0..1 — mid peaking (~800Hz), 0.5 = flat/0dB. */
  mid: number;
  /** 0..1 — high shelf (~3kHz), 0.5 = flat/0dB. */
  treble: number;
  /** 0..1 — output level. */
  level: number;
  /** Cabinet simulation on/off (master bypass — see `irId` for which model runs). */
  cab: boolean;
  /** Noise gate on/off — kills hum/hiss below the threshold ahead of the drive stage. */
  gate: boolean;
  /** Overdrive pedal (pre-amp, cubic soft-clip — a different clip character than the
   *  amp's own `drive`) on/off. No dry/wet blend, like a real stompbox: fully in the
   *  signal path or fully bypassed. */
  overdriveEnabled: boolean;
  /** 0..1 — pre-gain into the pedal's clipper. */
  overdriveDrive: number;
  /** 0..1 — post-clip lowpass brightness, 0 = dark, 1 = bright. */
  overdriveTone: number;
  /** 0..1 — output level/boost after clipping. */
  overdriveLevel: number;
  /** Delay effect (post-cabinet) on/off. */
  delayEnabled: boolean;
  /** 0-800ish ms delay time. */
  delayMs: number;
  /** 0..1 feedback (repeats), clamped internally below 1 for stability. */
  delayFeedback: number;
  /** 0..1 dry/wet mix. */
  delayMix: number;
  /** Loaded cabinet IR id (see toneStudio.d.ts), or null for the built-in biquad
   *  cabinet model. Only used when `cab` is true. */
  irId: string | null;
  /** NAM (Neural Amp Modeler) captured-amp model on/off. When true and a model is
   *  loaded, it REPLACES the preamp/tone-stack/power/cabinet block (drive, bass,
   *  mid, treble, cab, irId are all ignored) — gate/overdrive stay before it and
   *  delay stays after, same as pedals-into-amp-into-rack in a real rig.
   *  Falls back to the traditional chain if no model is loaded yet. */
  namEnabled: boolean;
  /** Imported NAM model id (see toneStudio.d.ts), or null. */
  namModelId: string | null;
}

export interface AmpStreamInfo {
  deviceName: string;
  /** Output device actually in use. On ASIO this always equals the input device
   *  (see nativeAudioEngine.js) regardless of any requested `outputDeviceId`. */
  outDeviceName: string | null;
  sampleRate: number;
  frameSize: number;
  outChannels: number;
  inChannel: number;
  /** Estimated input→output round-trip latency in ms. */
  roundTripMs: number;
  params: AmpParams;
}

export interface AmpStartOpts {
  /** Omit to auto-pick the default input device. */
  deviceId?: number;
  channel?: number;
  sampleRate?: number;
  frameSize?: number;
  /** Optional output device (defaults to the input device — required for ASIO). */
  outputDeviceId?: number;
  params?: Partial<AmpParams>;
}

/** Fired when the DSP chain (usually a NAM model too heavy for the current
 *  buffer size) fell far enough behind real time that the engine had to clear
 *  the output queue to recover — a real, audible click just happened. */
export interface AmpOverloadInfo {
  /** How much accumulated drift (ms) triggered the recovery. */
  driftMs: number;
  namEnabled: boolean;
}

export interface NativeAmpApi {
  isAvailable: true;
  listDevices: () => Promise<NativeAudioDeviceList>;
  start: (opts?: AmpStartOpts) => Promise<AmpStreamInfo>;
  setParams: (params: Partial<AmpParams>) => Promise<AmpStreamInfo | null>;
  stop: () => Promise<boolean>;
  getStatus: () => Promise<{ isOpen: boolean; info: AmpStreamInfo | null }>;
  /** Subscribe to overload-recovery events. Returns an unsubscribe fn. */
  onOverload: (cb: (info: AmpOverloadInfo) => void) => () => void;
  /** Subscribe to stream-loss/recovery events (the amp shares the one underlying
   *  stream with capture, so it can be affected too). Returns an unsubscribe fn. */
  onConnectionIssue: (cb: (info: ConnectionIssueInfo) => void) => () => void;
  /** Subscribe to native device-list changes (hot-plug). Returns an unsubscribe fn. */
  onDevicesChanged: (cb: () => void) => () => void;
}

declare global {
  interface Window {
    nativeAudio?: NativeAudioApi;
    nativeAmp?: NativeAmpApi;
  }
}

export {};
