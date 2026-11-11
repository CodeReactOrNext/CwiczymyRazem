import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { ConnectionIssueInfo, NativeAudioDevice, NativeAudioStreamInfo } from "types/nativeAudio";
import type { Spectrum } from "utils/audio/chordTones";
import type { PcmSpectrum } from "utils/audio/pcmSpectrum";
import { createPcmSpectrum } from "utils/audio/pcmSpectrum";
import type { RecentAudio } from "utils/audio/recentAudio";
import { createRecentAudio, RECENT_AUDIO_SECONDS } from "utils/audio/recentAudio";

import { GUITAR_DSP_ENGINE_HASH } from "./generated/guitarDspEngineHash";
import type { DetectedNoteEvent, InputTap } from "./guitarBufferProcessor";
import { createGuitarBufferProcessor, createGuitarDetectors } from "./guitarBufferProcessor";
import type { GuitarDspHandle } from "./guitarDspClient";
import { startGuitarDsp } from "./guitarDspClient";
import { applyDspReadings } from "./guitarDspSession";
import type { CaptureWindower } from "./nativeCaptureWindows";
import { batchWaitMs, createCaptureWindower } from "./nativeCaptureWindows";
import { createStampShifter } from "./nativeEngineStamps";
import type { AudioRefs, GuitarAudioInputOptions } from "./useAudioAnalyzer";
import { readPersistedChannel } from "./useNativeAudioDevices";

// Mirrors useAudioAnalyzer's public contract so PracticeSession is agnostic to
// the input source. The difference: PCM comes from a native low-latency stream
// (ASIO / WASAPI) via the Electron bridge instead of getUserMedia.

const GAIN_STORAGE_KEY = "audio_input_gain"; // shared with the web path
const DEVICE_STORAGE_KEY = "native_audio_device_id";
const DEFAULT_GAIN = 3.0;
const WINDOW_SIZE = 2048; // aubio analysis window — must match createGuitarDetectors
/** The shell's detection sends a message every ~43 ms, silence included; none
 *  at all for this long and the window runs the detectors itself. */
const ENGINE_DSP_SILENT_MS = 2000;

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
  /** "ok" outside of a connection-issue event; see ConnectionIssueInfo. Distinct
   *  from `error` so a transient "retrying" doesn't have to flip isListening off. */
  connectionStatus: ConnectionIssueInfo["status"] | "ok";
}

export const useNativeAudioAnalyzer = ({ bass = false, strum = false }: GuitarAudioInputOptions = {}) => {
  const [state, setState] = useState<NativeAnalyzerState>({
    isListening: false,
    error: null,
    inputGain: loadPersistedGain(),
    devices: [],
    api: null,
    streamInfo: null,
    connectionStatus: "ok",
  });

  const inputGainRef = useRef<number>(loadPersistedGain());
  const selectedDeviceIdRef = useRef<number | null>(loadPersistedDeviceId());
  const selectedChannelRef = useRef<number>(readPersistedChannel());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const dspUnsubscribeRef = useRef<(() => void) | null>(null);
  const connectionUnsubscribeRef = useRef<(() => void) | null>(null);

  // Realtime refs (same shape the rest of the app consumes)
  const frequencyRef = useRef<number>(0);
  const volumeRef = useRef<number>(0);
  const rawVolumeRef = useRef<number>(0);
  const noiseFloorRef = useRef<number>(0);
  const confidenceRef = useRef<number>(0);
  const lastOnsetTimeRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);
  const noteEventsRef = useRef<DetectedNoteEvent[]>([]);
  const lastAttackMsRef = useRef<number>(0);
  const lastLowAttackMsRef = useRef<number>(0);
  const lastSoftAttackMsRef = useRef<number>(0);
  // No Web Audio graph here, so no AnalyserNode: chords are graded on a
  // spectrum computed from the PCM itself (see pcmSpectrum.ts). Whatever runs
  // the detectors works it out with them and leaves the latest one here…
  const remoteSpectrumRef = useRef<Spectrum | null>(null);
  // …except when that is this thread (the last fallback): then it is computed
  // here, when read. Built per stream, for its negotiated sample rate.
  const spectrumRef = useRef<PcmSpectrum | null>(null);
  const recentAudioRef = useRef<RecentAudio | null>(null);
  const inputTapRef = useRef<InputTap | null>(null);
  const inputPeakRef = useRef<number>(0);
  const bassRef = useRef(bass);
  const strumRef = useRef(strum);
  /** The DSP worker, while it is the one running the detectors (see guitarDspClient). */
  const dspRef = useRef<GuitarDspHandle | null>(null);
  /** The desktop shell runs the detectors itself (see guitarDspEngine.ts). */
  const engineDspRef = useRef(false);
  /** Tells whichever of the two runs the detectors. */
  const configureDsp = useCallback((patch: { gain?: number; bass?: boolean; strum?: boolean }) => {
    dspRef.current?.configure(patch);
    if (engineDspRef.current) window.nativeAudio?.configureDsp?.(patch).catch(() => { /* ignore */ });
  }, []);
  useEffect(() => {
    bassRef.current = bass;
    strumRef.current = strum;
    configureDsp({ bass, strum });
  }, [bass, strum, configureDsp]);

  const streamInfoRef = useRef<NativeAudioStreamInfo | null>(null);
  // EMA of the main→renderer IPC hand-off delay (see native.onFrame below) —
  // folded into getLatencyMs() so note-matching's compensation reflects this
  // hop instead of silently assuming it's zero.
  const ipcDelayEmaRef = useRef<number>(0);
  // Frames in the latest capture message — more than one driver block where
  // the desktop shell sends them several at a time (see getLatencyMs).
  const messageFramesRef = useRef<number>(0);
  // Set once the stream is open and something is ready to take its windows —
  // the DSP worker, or the detectors on this thread — built for its *actual*
  // negotiated sample rate (see init() — the driver doesn't always grant the
  // rate we ask for). Frames that arrive before that are safely dropped.
  const processRef = useRef<((win: Float32Array, timeMs: number) => boolean) | null>(null);
  // Bumped by every init()/close() call; each init() snapshots it into
  // myGeneration and rechecks after every await. React StrictMode (dev) double-
  // invokes mount effects (and PracticeSession.tsx's own mic-enable effect adds
  // a second, independent source of the same thing), so two overlapping init()
  // calls sharing this ONE hook instance's refs is a real scenario, not just a
  // theoretical race — a plain "return () => close()" cleanup isn't enough to
  // prevent it, because close() runs (and no-ops) before the superseded call
  // has reached anything to unsubscribe. Without this, BOTH calls ended up
  // registering their own live native.onFrame listener against the SAME shared
  // window accumulator, doubling every captured block into the analysis
  // window and corrupting pitch detection for the whole session.
  const generationRef = useRef(0);

  // The body of init(); only ever entered through the serialized wrapper below.
  const runInit = useCallback(async (myGeneration: number) => {
    if (myGeneration !== generationRef.current) return; // superseded while waiting its turn
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
      // Re-read storage so a channel picked elsewhere (e.g. the amp panel)
      // applies, same as the device id above.
      selectedChannelRef.current = readPersistedChannel();

      // Accumulator: native blocks (e.g. 256 frames, or several to a message)
      // → 2048-sample analysis windows. One per stream, so a superseded
      // init()'s frames can never land in this one's window.
      const windower: CaptureWindower = createCaptureWindower(WINDOW_SIZE, (win, timeMs) => processRef.current?.(win, timeMs) ?? false);
      messageFramesRef.current = 0;
      processRef.current = null;
      spectrumRef.current = null;
      remoteSpectrumRef.current = null;
      engineDspRef.current = false;

      const targets = {
        frequencyRef, volumeRef, rawVolumeRef, noiseFloorRef, confidenceRef,
        lastOnsetTimeRef, lastTickTimeRef, noteEventsRef, lastAttackMsRef, lastLowAttackMsRef, lastSoftAttackMsRef, inputPeakRef,
        spectrumRef: remoteSpectrumRef,
      };
      const onActive = () => {
        setState(prev =>
          prev.isListening === true && prev.error === null
            ? prev
            : { ...prev, isListening: true, error: null }
        );
      };
      // Measure a message's actual main→renderer delivery delay (clocks are
      // shared, no skew to correct for) and fold it into a smoothed running
      // estimate. A single sample is noisy (structured-clone jitter, a GC
      // tick) — the EMA is what getLatencyMs() below actually reads.
      const noteIpcDelay = (sentAt: number) => {
        const ipcDelayMs = Date.now() - sentAt;
        ipcDelayEmaRef.current = ipcDelayEmaRef.current === 0
          ? ipcDelayMs
          : ipcDelayEmaRef.current * 0.9 + ipcDelayMs * 0.1;
      };

      // A shell that can run the detectors itself is asked to (start() below
      // says whether it does): the readings then arrive here, one message per
      // analysis window, and no block ever reaches this thread. Registered
      // before native.start(), like the blocks' listener.
      const engineWanted = typeof native.onDsp === "function" && typeof native.configureDsp === "function" && typeof native.stopDsp === "function";
      let engineHeard = false;
      /** Set once the stream is open: runs the detectors in this window instead. */
      let takeOver: (() => Promise<void>) | null = null;
      const shiftStamps = createStampShifter();
      dspUnsubscribeRef.current = !engineWanted || !native.onDsp ? null : native.onDsp((message, sentAt) => {
        if (myGeneration !== generationRef.current) return;
        if (message.type === "lost") {
          // The shell's detectors died; it sends the blocks here again.
          if (!engineDspRef.current) return;
          engineDspRef.current = false;
          takeOver?.().catch((err) => console.error("Guitar DSP takeover failed:", err));
          return;
        }
        engineHeard = true;
        noteIpcDelay(sentAt);
        // Onto the clock this window's own detection stamps with (nativeEngineStamps.ts).
        const readings = shiftStamps(message, ipcDelayEmaRef.current);
        messageFramesRef.current = readings.messageFrames ?? 0;
        applyDspReadings(targets, readings);
        // What the session keeps of the raw input: the model's look back and the tap.
        recentAudioRef.current?.push(readings.samples, readings.timeMs);
        const sampleRate = streamInfoRef.current?.sampleRate;
        if (sampleRate) inputTapRef.current?.(readings.samples, sampleRate);
        if (readings.readings.active) onActive();
      });

      // Subscribe to PCM blocks: reinterpret raw bytes as FLOAT32, fill 2048
      // windows, then hand each full window to the shared DSP. Registered before
      // native.start() so no frame is missed once the stream opens; processRef
      // is still null at that point (detectors aren't built until we know the
      // stream's actual sample rate below), so early frames are just dropped.
      unsubscribeRef.current = native.onFrame((bytes: Uint8Array, sentAt: number) => {
        // Extra safety net on top of the checks around each `await` below: if a
        // stale unsubscribe somehow didn't run (see generationRef above), still
        // never let a superseded generation's frames touch the shared buffer.
        if (myGeneration !== generationRef.current) return;
        noteIpcDelay(sentAt);

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
        messageFramesRef.current = samples.length;
        // Each window is stamped with when the driver block holding its last
        // sample would have arrived on its own: a shell that sends several
        // blocks to a message delivers the earlier ones late, and the attack
        // times read from the window must not carry that wait.
        const info = streamInfoRef.current;
        windower.push(samples, Date.now(), info?.sampleRate ?? 0, info?.frameSize ?? 0);
      });

      // Surfaces stream-loss/recovery from nativeAudioEngine.js's scheduleRecovery
      // (device disconnected, driver reset from its own control panel, system
      // resume) — without this, a lost stream just silently stops delivering
      // frames with nothing telling the user why. On "recovered" we deliberately
      // don't tear down and re-init: this onFrame subscription is a persistent
      // IPC listener the engine's internal reopen never touches, so frames just
      // resume on their own, and the engine remembers the last negotiated sample
      // rate per device (see negotiatedSampleRateByDevice in nativeAudioEngine.js),
      // so a reopen almost always lands back on the rate these detectors were
      // already built for — just refresh the displayed stream info and clear the
      // indicator.
      // Same version-skew guard as useAmpSim.ts: an older desktop build's
      // preload.js may not expose onConnectionIssue yet even though `native`
      // (window.nativeAudio) itself is present.
      connectionUnsubscribeRef.current = typeof native.onConnectionIssue !== "function" ? null : native.onConnectionIssue((info) => {
        if (myGeneration !== generationRef.current) return;
        if (info.status === "recovered") {
          // The gap mid-window (samples stopped arriving, then resumed) would
          // otherwise splice pre-loss and post-recovery audio into one 2048-sample
          // analysis window — cheap to avoid by just starting the next window fresh.
          windower.reset();
          native.getStatus().then((status) => {
            if (myGeneration !== generationRef.current) return;
            if (status.info) streamInfoRef.current = status.info;
            setState(prev => ({ ...prev, connectionStatus: "ok", streamInfo: status.info ?? prev.streamInfo }));
          }).catch(() => { /* ignore — indicator staying until the next event is harmless */ });
          return;
        }
        setState(prev => ({
          ...prev,
          connectionStatus: info.status,
          ...(info.status === "failed"
            ? { isListening: false, error: info.message || "Audio interface disconnected" }
            : {}),
        }));
      });

      // Open the low-latency stream. Small frameSize → minimal capture latency.
      // frameSize is only a request for when capture opens the stream on its
      // own: if the amp simulator is already running, the engine keeps the
      // amp's buffer size (its monitoring latency) and just attaches capture
      // to the live stream — no reopen. The windowing above works at any
      // block size, so nothing here depends on actually getting 256.
      // No sampleRate hint: some ASIO drivers report a preferred rate they then
      // refuse to open at, so the engine negotiates and reports back what it
      // actually got — detectors below are built for that, not a guess.
      const info = await native.start({
        deviceId: chosen.id,
        channel: selectedChannelRef.current,
        frameSize: 256,
        ...(engineWanted && {
          dsp: { hash: GUITAR_DSP_ENGINE_HASH, gain: inputGainRef.current, bass: bassRef.current, strum: strumRef.current },
        }),
      });
      if (myGeneration !== generationRef.current) {
        // Superseded while the stream was opening — a newer generation already
        // owns (or is opening its own) stream; this one must not linger.
        native.stop().catch(() => { /* ignore */ });
        return;
      }
      streamInfoRef.current = info;

      const recentAudio = createRecentAudio(info.sampleRate, RECENT_AUDIO_SECONDS);
      recentAudioRef.current = recentAudio;

      // The detectors on this thread — only where the worker below can't run,
      // or once it has died. They cost a few ms of every ~43 ms window, in one
      // piece, on the thread that draws the session: frames were dropped.
      const runDspHere = async () => {
        const spectrum = createPcmSpectrum(info.sampleRate);
        spectrumRef.current = spectrum;
        // aubio detectors at the stream's actual (negotiated) sample rate.
        // @ts-ignore — aubiojs has no types
        const AubioModule = await import("aubiojs");
        const Aubio = AubioModule.default || AubioModule;
        const aubio = await Aubio();
        if (myGeneration !== generationRef.current) return; // superseded while aubio (wasm) loaded
        const process = createGuitarBufferProcessor({
          detectors: createGuitarDetectors(aubio, info.sampleRate),
          getGain: () => inputGainRef.current,
          sampleRate: info.sampleRate,
          spectrum,
          recentAudio,
          isBass: () => bassRef.current,
          isStrumWanted: () => strumRef.current,
          targets: { ...targets, inputTapRef },
          onActive,
        });
        processRef.current = (win, timeMs) => { process(win, timeMs); return false; };
      };

      // The detectors in this window's worker — where the shell doesn't run
      // them itself.
      const runDspInWorker = async () => {
        const dsp = await startGuitarDsp({
          sampleRate: info.sampleRate,
          gain: inputGainRef.current,
          bass: bassRef.current,
          strum: strumRef.current,
          // The chord spectrum too: its FFT stays off this thread.
          spectrum: true,
          targets,
          onActive,
          onLost: () => {
            if (myGeneration !== generationRef.current) return;
            dspRef.current = null;
            processRef.current = null;
            runDspHere().catch((err) => console.error("Guitar DSP fallback failed:", err));
          },
        });
        if (myGeneration !== generationRef.current) { dsp?.close(); return; } // superseded while the worker started
        if (dsp) {
          dspRef.current = dsp;
          // Whatever changed while the worker was starting up.
          dsp.configure({ gain: inputGainRef.current, bass: bassRef.current, strum: strumRef.current });
          processRef.current = (win, timeMs) => {
            // What stays on this thread, both of them copies: the model's look
            // back and the raw tap — before the buffer leaves with the window.
            recentAudio.push(win, timeMs);
            inputTapRef.current?.(win, info.sampleRate);
            dsp.push(win, timeMs);
            return true;
          };
        } else {
          await runDspHere();
        }
      };

      if (info.dsp && engineWanted) {
        engineDspRef.current = true;
        takeOver = runDspInWorker;
        // Whatever changed while the stream was opening.
        configureDsp({ gain: inputGainRef.current, bass: bassRef.current, strum: strumRef.current });
        // Readings that never make it here would leave the session deaf with
        // everything looking fine: take the detection back instead.
        setTimeout(() => {
          if (engineHeard || !engineDspRef.current || myGeneration !== generationRef.current) return;
          engineDspRef.current = false;
          native.stopDsp?.().catch(() => { /* ignore */ });
          runDspInWorker().catch((err) => console.error("Guitar DSP takeover failed:", err));
        }, ENGINE_DSP_SILENT_MS);
      } else {
        await runDspInWorker();
      }
      if (myGeneration !== generationRef.current) return;

      setState(prev => ({
        ...prev,
        isListening: true,
        error: null,
        connectionStatus: "ok",
        devices: inputDevices,
        api,
        streamInfo: info,
      }));
    } catch (err: any) {
      if (myGeneration !== generationRef.current) return; // superseded — a newer call owns the outcome now
      console.error("Error initializing native audio analyzer:", err);
      const message = err?.message || "Native audio init failed";
      setState(prev => ({ ...prev, error: message }));
      // PracticeSession lights the "Pitch Detect" button from the user's
      // preference, not from isListening — so without this, a failed native
      // open (ASIO held by another app, driver refusing a reopen, ...) looked
      // exactly like a working one, just with nothing ever being detected.
      toast.error(`Couldn't start pitch detection: ${message}`);
    }
  }, [configureDsp]);

  // init() calls are serialized: a new init() never sends its native.start()
  // while a superseded init()'s start() is still in flight. Without this, the
  // mount-time dance PracticeSession does (init → close → init, e.g. when an
  // exercise's persisted mic preference differs from the global one, or React
  // StrictMode's double-invoke) raced on the Electron path: init #1's start()
  // takes hundreds of ms when it has to (re)open ASIO, so init #2's start()
  // was already sent — and possibly already attached in the engine — by the
  // time #1 resolved, saw it was superseded and called native.stop(), which
  // detached #2's capture. #2 then completed normally (its start() had
  // returned stream info), flipped isListening to true, and never received a
  // single frame: "Pitch Detect on", nothing detected, until the user toggled
  // it off and on again. Queued behind #1, #2's start() now always goes out
  // after #1's stop() — IPC is FIFO, so the engine ends up with #2 attached.
  const initChainRef = useRef<Promise<void>>(Promise.resolve());
  const init = useCallback(() => {
    const myGeneration = ++generationRef.current;
    const run = initChainRef.current.then(() => runInit(myGeneration));
    initChainRef.current = run.catch(() => { /* runInit handles its own errors; never break the chain */ });
    return run;
  }, [runInit]);

  const close = useCallback(() => {
    generationRef.current++; // invalidate any in-flight init() (see generationRef above)
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (dspUnsubscribeRef.current) {
      dspUnsubscribeRef.current();
      dspUnsubscribeRef.current = null;
    }
    if (connectionUnsubscribeRef.current) {
      connectionUnsubscribeRef.current();
      connectionUnsubscribeRef.current = null;
    }
    window.nativeAudio?.stop().catch(() => { /* ignore */ });

    dspRef.current?.close();
    dspRef.current = null;
    engineDspRef.current = false;
    processRef.current = null;
    spectrumRef.current = null;
    remoteSpectrumRef.current = null;
    recentAudioRef.current = null;
    messageFramesRef.current = 0;
    streamInfoRef.current = null;
    frequencyRef.current = 0;
    volumeRef.current = 0;
    rawVolumeRef.current = 0;
    inputPeakRef.current = 0;
    noiseFloorRef.current = 0;
    confidenceRef.current = 0;
    lastOnsetTimeRef.current = 0;
    lastTickTimeRef.current = 0;
    noteEventsRef.current = [];
    lastAttackMsRef.current = 0;
    lastLowAttackMsRef.current = 0;
    lastSoftAttackMsRef.current = 0;
    ipcDelayEmaRef.current = 0;

    setState(prev => ({ ...prev, isListening: false, streamInfo: null, connectionStatus: "ok" }));
  }, []);

  useEffect(() => {
    return () => { close(); };
  }, [close]);

  // Toasts on connectionStatus transitions (see onConnectionIssue subscription in
  // init() above) — the only user-visible signal that a live session's capture
  // stream was silently lost and (usually) recovered in the background.
  const prevConnectionStatusRef = useRef(state.connectionStatus);
  useEffect(() => {
    if (prevConnectionStatusRef.current === state.connectionStatus) return;
    prevConnectionStatusRef.current = state.connectionStatus;
    if (state.connectionStatus === "lost") toast.warning("Audio interface disconnected — reconnecting…");
    else if (state.connectionStatus === "recovered") toast.success("Audio interface reconnected.");
    else if (state.connectionStatus === "failed") toast.error("Couldn't reconnect the audio interface. Check the cable/driver and restart mic input.");
    // "retrying" is deliberately silent — one toast for the whole cycle (the
    // "lost" one above), not per attempt.
  }, [state.connectionStatus]);

  const setInputGain = useCallback((value: number) => {
    const clamped = Math.max(0.5, Math.min(10.0, value));
    inputGainRef.current = clamped;
    configureDsp({ gain: clamped });
    try {
      localStorage.setItem(GAIN_STORAGE_KEY, String(clamped));
    } catch { /* ignore */ }
    setState(prev => ({ ...prev, inputGain: clamped }));
  }, [configureDsp]);

  /** Switch the active input device (e.g. user picks their interface).
   *  Restarts the stream if currently listening. */
  const selectDevice = useCallback(async (deviceId: number) => {
    selectedDeviceIdRef.current = deviceId;
    try { localStorage.setItem(DEVICE_STORAGE_KEY, String(deviceId)); } catch { /* ignore */ }
    if (state.isListening) {
      close();
      await init();
    }
  }, [state.isListening, close, init]);

  /** Switch which physical input channel on the current device is captured
   *  (e.g. the guitar is plugged into jack 3 instead of 1). Restarts the
   *  stream if currently listening. */
  const selectChannel = useCallback(async (channel: number) => {
    selectedChannelRef.current = channel;
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
    // Blocks sent several to a message: a reading waits for the rest of its message.
    const batchMs = batchWaitMs(messageFramesRef.current, info?.frameSize ?? 0, sr);
    return captureMs + windowMs + ipcMs + batchMs;
  }, []);

  /** getLatencyMs() for an attack time — without the window, which the
   *  processor already takes off every onset (see useAudioAnalyzer), and
   *  without the wait inside a message, which the window's stamp leaves out. */
  const getAttackLatencyMs = useCallback(() => {
    return (streamInfoRef.current?.latencyMs ?? 0) + ipcDelayEmaRef.current;
  }, []);

  const readSpectrum = useCallback(() => (spectrumRef.current ? spectrumRef.current.read() : remoteSpectrumRef.current), []);
  const readRecentAudio = useCallback(() => recentAudioRef.current?.read() ?? null, []);

  const audioRefs: AudioRefs = {
    frequencyRef, volumeRef, rawVolumeRef, noiseFloorRef, lastOnsetTimeRef,
    lastTickTimeRef, confidenceRef, readSpectrum, readRecentAudio, noteEventsRef, lastAttackMsRef, lastLowAttackMsRef, lastSoftAttackMsRef, inputTapRef, inputPeakRef,
  };

  return useMemo(() => ({
    ...state,
    init,
    close,
    audioRefs,
    getLatencyMs,
    getAttackLatencyMs,
    setInputGain,
    selectDevice,
    selectChannel,
  }), [state, init, close, audioRefs, getLatencyMs, getAttackLatencyMs, setInputGain, selectDevice, selectChannel]);
};
