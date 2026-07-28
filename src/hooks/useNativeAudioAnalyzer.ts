import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NativeAudioDevice, NativeAudioStreamInfo } from "types/nativeAudio";

import { createGuitarBufferProcessor, createGuitarDetectors } from "./guitarBufferProcessor";
import type { AudioRefs } from "./useAudioAnalyzer";

// Mirrors useAudioAnalyzer's public contract so PracticeSession is agnostic to
// the input source. The difference: PCM comes from a native low-latency stream
// (ASIO / WASAPI) via the Electron bridge instead of getUserMedia.

const GAIN_STORAGE_KEY = "audio_input_gain"; // shared with the web path
const DEVICE_STORAGE_KEY = "native_audio_device_id";
const DEFAULT_GAIN = 3.0;
const WINDOW_SIZE = 2048; // aubio analysis window — must match createGuitarDetectors

function loadPersistedGain(): number {
  try {
    const stored = localStorage.getItem(GAIN_STORAGE_KEY);
    if (stored !== null) {
      const val = parseFloat(stored);
      if (!isNaN(val) && val >= 0.5 && val <= 10.0) return val;
    }
  } catch { /* ignore */ }
  return DEFAULT_GAIN;
}

function loadPersistedDeviceId(): number | null {
  try {
    const stored = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (stored !== null) {
      const val = parseInt(stored, 10);
      if (!isNaN(val)) return val;
    }
  } catch { /* ignore */ }
  return null;
}

interface NativeAnalyzerState {
  isListening: boolean;
  error: string | null;
  inputGain: number;
  /** Available native input devices (populated on init). */
  devices: NativeAudioDevice[];
  /** Active audio API reported by the driver, e.g. "ASIO". */
  api: string | null;
  /** Negotiated stream info incl. measured capture latency. */
  streamInfo: NativeAudioStreamInfo | null;
}

export const useNativeAudioAnalyzer = () => {
  const [state, setState] = useState<NativeAnalyzerState>({
    isListening: false,
    error: null,
    inputGain: loadPersistedGain(),
    devices: [],
    api: null,
    streamInfo: null,
  });

  const inputGainRef = useRef<number>(loadPersistedGain());
  const selectedDeviceIdRef = useRef<number | null>(loadPersistedDeviceId());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Realtime refs (same shape the rest of the app consumes)
  const frequencyRef = useRef<number>(0);
  const volumeRef = useRef<number>(0);
  const rawVolumeRef = useRef<number>(0);
  const noiseFloorRef = useRef<number>(0);
  const confidenceRef = useRef<number>(0);
  const lastOnsetTimeRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);
  const onsetChromaRef = useRef<Float32Array | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null); // always null here (no Web Audio graph)

  // Accumulator: native blocks (e.g. 256 frames) → 2048-sample analysis windows
  const windowBufRef = useRef<Float32Array>(new Float32Array(WINDOW_SIZE));
  const windowPosRef = useRef<number>(0);
  const streamInfoRef = useRef<NativeAudioStreamInfo | null>(null);
  // EMA of the main→renderer IPC hand-off delay (see native.onFrame below) —
  // folded into getLatencyMs() so note-matching's compensation reflects this
  // hop instead of silently assuming it's zero (it isn't: this is where the
  // actual aubio DSP work happens, on the same thread as React/3D rendering).
  const ipcDelayEmaRef = useRef<number>(0);
  // Set once the stream is open and aubio detectors are built for its *actual*
  // negotiated sample rate (see init() — the driver doesn't always grant the
  // rate we ask for). Frames that arrive before that are safely dropped.
  const processRef = useRef<((win: Float32Array) => void) | null>(null);
  // Bumped by every init()/close() call; each init() snapshots it into
  // myGeneration and rechecks after every await. React StrictMode (dev) double-
  // invokes mount effects (and PracticeSession.tsx's own mic-enable effect adds
  // a second, independent source of the same thing), so two overlapping init()
  // calls sharing this ONE hook instance's refs is a real scenario, not just a
  // theoretical race — a plain "return () => close()" cleanup isn't enough to
  // prevent it, because close() runs (and no-ops) before the superseded call
  // has reached anything to unsubscribe. Without this, BOTH calls ended up
  // registering their own live native.onFrame listener against the SAME shared
  // windowBufRef/windowPosRef, doubling every captured block into the analysis
  // window and corrupting pitch detection for the whole session.
  const generationRef = useRef(0);

  const init = useCallback(async () => {
    const myGeneration = ++generationRef.current;
    const native = window.nativeAudio;
    if (!native) {
      setState(prev => ({ ...prev, error: "Native audio bridge unavailable" }));
      return;
    }

    try {
      const { api, devices } = await native.listDevices();
      if (myGeneration !== generationRef.current) return; // superseded while awaiting
      const inputDevices = devices.filter(d => d.inputChannels > 0);

      // Pick: persisted choice → default input → first available input device.
      // Re-read storage so a device picked elsewhere (e.g. the amp panel) applies.
      const persisted = loadPersistedDeviceId() ?? selectedDeviceIdRef.current;
      const chosen =
        inputDevices.find(d => d.id === persisted) ||
        inputDevices.find(d => d.isDefaultInput) ||
        inputDevices[0];

      if (!chosen) {
        setState(prev => ({ ...prev, api, devices: inputDevices, error: "No input devices found" }));
        return;
      }
      selectedDeviceIdRef.current = chosen.id;

      // Reset accumulator
      windowBufRef.current = new Float32Array(WINDOW_SIZE);
      windowPosRef.current = 0;
      processRef.current = null;

      // Subscribe to PCM blocks: reinterpret raw bytes as FLOAT32, fill 2048
      // windows, then run the shared DSP on each full window. Registered before
      // native.start() so no frame is missed once the stream opens; processRef
      // is still null at that point (detectors aren't built until we know the
      // stream's actual sample rate below), so early frames are just dropped.
      unsubscribeRef.current = native.onFrame((bytes: Uint8Array, sentAt: number) => {
        // Extra safety net on top of the checks around each `await` below: if a
        // stale unsubscribe somehow didn't run (see generationRef above), still
        // never let a superseded generation's frames touch the shared buffer.
        if (myGeneration !== generationRef.current) return;
        // Measure this block's actual main→renderer delivery delay (clocks are
        // shared, no skew to correct for) and fold it into a smoothed running
        // estimate. A single sample is noisy (structured-clone jitter, a GC
        // tick) — the EMA is what getLatencyMs() below actually reads.
        const ipcDelayMs = Date.now() - sentAt;
        ipcDelayEmaRef.current = ipcDelayEmaRef.current === 0
          ? ipcDelayMs
          : ipcDelayEmaRef.current * 0.9 + ipcDelayMs * 0.1;

        // Reinterpret raw bytes as FLOAT32. Float32Array requires a 4-byte
        // aligned offset; IPC buffers usually are, but copy if not.
        let samples: Float32Array;
        if (bytes.byteOffset % 4 === 0) {
          samples = new Float32Array(bytes.buffer as ArrayBuffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4));
        } else {
          const copy = new Uint8Array(bytes.byteLength);
          copy.set(bytes);
          samples = new Float32Array(copy.buffer, 0, Math.floor(copy.byteLength / 4));
        }
        const win = windowBufRef.current;
        let pos = windowPosRef.current;
        for (let i = 0; i < samples.length; i++) {
          win[pos++] = samples[i];
          if (pos === WINDOW_SIZE) {
            processRef.current?.(win);
            pos = 0;
          }
        }
        windowPosRef.current = pos;
      });

      // Open the low-latency stream. Small frameSize → minimal capture latency.
      // No sampleRate hint: some ASIO drivers report a preferred rate they then
      // refuse to open at, so the engine negotiates and reports back what it
      // actually got — detectors below are built for that, not a guess.
      const info = await native.start({
        deviceId: chosen.id,
        channel: 0,
        frameSize: 256,
      });
      if (myGeneration !== generationRef.current) {
        // Superseded while the stream was opening — a newer generation already
        // owns (or is opening its own) stream; this one must not linger.
        native.stop().catch(() => { /* ignore */ });
        return;
      }
      streamInfoRef.current = info;

      // aubio detectors at the stream's actual (negotiated) sample rate.
      // @ts-ignore — aubiojs has no types
      const AubioModule = await import("aubiojs");
      const Aubio = AubioModule.default || AubioModule;
      const aubio = await Aubio();
      if (myGeneration !== generationRef.current) return; // superseded while aubio (wasm) loaded
      const detectors = createGuitarDetectors(aubio, info.sampleRate);

      processRef.current = createGuitarBufferProcessor({
        detectors,
        getGain: () => inputGainRef.current,
        analyser: null, // no AnalyserNode in the native path → no chroma snapshots
        targets: {
          frequencyRef, volumeRef, rawVolumeRef, noiseFloorRef, confidenceRef,
          lastOnsetTimeRef, lastTickTimeRef, onsetChromaRef,
        },
        onActive: () => {
          setState(prev =>
            prev.isListening === true && prev.error === null
              ? prev
              : { ...prev, isListening: true, error: null }
          );
        },
      });

      setState(prev => ({
        ...prev,
        isListening: true,
        error: null,
        devices: inputDevices,
        api,
        streamInfo: info,
      }));
    } catch (err: any) {
      console.error("Error initializing native audio analyzer:", err);
      setState(prev => ({ ...prev, error: err?.message || "Native audio init failed" }));
    }
  }, []);

  const close = useCallback(() => {
    generationRef.current++; // invalidate any in-flight init() (see generationRef above)
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    window.nativeAudio?.stop().catch(() => { /* ignore */ });

    processRef.current = null;
    windowPosRef.current = 0;
    streamInfoRef.current = null;
    frequencyRef.current = 0;
    volumeRef.current = 0;
    rawVolumeRef.current = 0;
    noiseFloorRef.current = 0;
    confidenceRef.current = 0;
    lastOnsetTimeRef.current = 0;
    lastTickTimeRef.current = 0;
    onsetChromaRef.current = null;
    ipcDelayEmaRef.current = 0;

    setState(prev => ({ ...prev, isListening: false, streamInfo: null }));
  }, []);

  useEffect(() => {
    return () => { close(); };
  }, [close]);

  const setInputGain = useCallback((value: number) => {
    const clamped = Math.max(0.5, Math.min(10.0, value));
    inputGainRef.current = clamped;
    try {
      localStorage.setItem(GAIN_STORAGE_KEY, String(clamped));
    } catch { /* ignore */ }
    setState(prev => ({ ...prev, inputGain: clamped }));
  }, []);

  /** Switch the active input device (e.g. user picks their interface/channel).
   *  Restarts the stream if currently listening. */
  const selectDevice = useCallback(async (deviceId: number) => {
    selectedDeviceIdRef.current = deviceId;
    try { localStorage.setItem(DEVICE_STORAGE_KEY, String(deviceId)); } catch { /* ignore */ }
    if (state.isListening) {
      close();
      await init();
    }
  }, [state.isListening, close, init]);

  const getLatencyMs = useCallback(() => {
    const info = streamInfoRef.current;
    const sr = info?.sampleRate || 48000;
    const captureMs = info?.latencyMs ?? 0;     // hardware → app (ASIO ≈ few ms)
    const windowMs = (WINDOW_SIZE / sr) * 1000; // DSP analysis window
    const ipcMs = ipcDelayEmaRef.current;       // measured main→renderer hand-off (see native.onFrame)
    return captureMs + windowMs + ipcMs;
  }, []);

  const audioRefs: AudioRefs = {
    frequencyRef, volumeRef, rawVolumeRef, noiseFloorRef, lastOnsetTimeRef,
    lastTickTimeRef, confidenceRef, analyserRef, onsetChromaRef,
  };

  return useMemo(() => ({
    ...state,
    init,
    close,
    audioRefs,
    getLatencyMs,
    setInputGain,
    selectDevice,
  }), [state, init, close, audioRefs, getLatencyMs, setInputGain, selectDevice]);
};
