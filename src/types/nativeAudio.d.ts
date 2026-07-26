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
  /** Reverb effect (post-delay) on/off. */
  reverbEnabled: boolean;
  /** 0..1 room size / decay length. */
  reverbSize: number;
  /** 0..1 high-frequency damping in the reverb tail. */
  reverbDamping: number;
  /** 0..1 dry/wet mix. */
  reverbMix: number;
  /** Loaded cabinet IR id (see toneStudio.d.ts), or null for the built-in biquad
   *  cabinet model. Only used when `cab` is true. */
  irId: string | null;
  /** NAM (Neural Amp Modeler) captured-amp model on/off. When true and a model is
   *  loaded, it REPLACES the preamp/tone-stack/power/cabinet block (drive, bass,
   *  mid, treble, cab, irId are all ignored) — gate/overdrive stay before it and
   *  delay/reverb stay after, same as pedals-into-amp-into-rack in a real rig.
   *  Falls back to the traditional chain if no model is loaded yet. */
  namEnabled: boolean;
  /** Imported NAM model id (see toneStudio.d.ts), or null. */
  namModelId: string | null;
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
