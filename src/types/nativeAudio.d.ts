// Injected by the Electron preload (electron/preload.js). Present only in the
// desktop build; the web build leaves `window.nativeAudio` undefined.
export interface NativeAudioDevice {
  id: number;
  name: string;
  inputChannels: number;
  outputChannels: number;
  isDefaultInput: boolean;
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

export interface NativeAudioApi {
  isAvailable: true;
  listDevices: () => Promise<NativeAudioDeviceList>;
  start: (opts: NativeAudioStartOpts) => Promise<NativeAudioStreamInfo>;
  stop: () => Promise<boolean>;
  getStatus: () => Promise<{ isOpen: boolean; info: NativeAudioStreamInfo | null }>;
  /** Subscribe to captured FLOAT32 mono PCM blocks. Returns an unsubscribe fn. */
  onFrame: (cb: (buf: Uint8Array) => void) => () => void;
}

export interface AmpParams {
  /** 0..1 — pre-gain into the waveshaper (distortion amount). */
  drive: number;
  /** 0..1 — dark (0) → bright (1) tone filter. */
  tone: number;
  /** 0..1 — output level. */
  level: number;
  /** Cabinet simulation on/off. */
  cab: boolean;
}

export interface AmpStreamInfo {
  deviceName: string;
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

export interface NativeAmpApi {
  isAvailable: true;
  listDevices: () => Promise<NativeAudioDeviceList>;
  start: (opts?: AmpStartOpts) => Promise<AmpStreamInfo>;
  setParams: (params: Partial<AmpParams>) => Promise<AmpStreamInfo | null>;
  stop: () => Promise<boolean>;
  getStatus: () => Promise<{ isOpen: boolean; info: AmpStreamInfo | null }>;
}

declare global {
  interface Window {
    nativeAudio?: NativeAudioApi;
    nativeAmp?: NativeAmpApi;
  }
}

export {};
