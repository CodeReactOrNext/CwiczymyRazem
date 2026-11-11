
import { useCallback,useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Spectrum } from "utils/audio/chordTones";
import { spectrumFromAnalyser } from "utils/audio/chordTones";
import type { RecentAudio, RecentAudioSnapshot } from "utils/audio/recentAudio";
import { createRecentAudio, RECENT_AUDIO_SECONDS } from "utils/audio/recentAudio";

import type { DetectedNoteEvent, InputTap } from "./guitarBufferProcessor";
import { createGuitarBufferProcessor, createGuitarDetectors } from "./guitarBufferProcessor";
import type { GuitarDspHandle } from "./guitarDspClient";
import { startGuitarDsp } from "./guitarDspClient";
import { getDecimationFactor, GUITAR_INPUT_WORKLET_CODE, type GuitarInputChannelsMessage, type GuitarInputSamplesMessage } from "./guitarInputWorklet";

/** Why the input could not be opened — what the setup wizard explains to the player. */
export type AudioInitFailure =
  /** The browser (or the player) refused microphone access. */
  | "denied"
  /** No audio input on this computer. */
  | "no_device"
  /** The device exists but can't be read — usually another program holds it. */
  | "busy"
  /** No getUserMedia here: an old browser or a page not served over https. */
  | "unsupported"
  | "unknown";

/** A superseded call (a newer init() or a close() landed first) reports ok — the newer one owns the outcome. */
export type AudioInitResult = { ok: true } | { ok: false; reason: AudioInitFailure };

export interface WebInputDevice {
  deviceId: string;
  label: string;
}

/** The browser path's input picker: which device is open and which of its jacks is read. */
export interface WebAudioInput {
  /** Inputs the browser lists — empty until microphone access is granted. */
  devices: WebInputDevice[];
  /** The open device's id, as it appears in `devices`. */
  deviceId: string | null;
  /** The open device's name, even when it is missing from `devices`. */
  deviceLabel: string | null;
  /** Channels the open device delivers (one per jack). */
  channelCount: number;
  /** 0-based channel being read right now. */
  activeChannel: number;
  /** The channel the player pinned, or null to follow the one carrying signal. */
  channel: number | null;
  selectDevice: (deviceId: string) => Promise<AudioInitResult>;
  selectChannel: (channel: number | null) => void;
}

interface AudioAnalyzerState {
  isListening: boolean;
  error: string | null;
  /** `error` as a reason; "disconnected" when an open input went away. */
  errorReason: AudioInitFailure | "disconnected" | null;
  inputGain: number;
  devices: WebInputDevice[];
  deviceId: string | null;
  deviceLabel: string | null;
  channelCount: number;
  activeChannel: number;
  channel: number | null;
}

export interface AudioRefs {
  frequencyRef: React.MutableRefObject<number>;
  volumeRef: React.MutableRefObject<number>;
  /** RMS-based volume without gain applied — use this for silence detection
   *  so the threshold is independent of the user's sensitivity setting. */
  rawVolumeRef: React.MutableRefObject<number>;
  lastOnsetTimeRef: React.MutableRefObject<number>;
  /** Timestamp of the most recent *percussive* onset (muted/dead-note friendly:
   *  fires on broadband transients like tick/thud even when pitch is absent). */
  lastTickTimeRef: React.MutableRefObject<number>;
  confidenceRef: React.MutableRefObject<number>;
  /** The input's live magnitude spectrum (~170 ms), or null with nothing to
   *  read — what chords are graded on (utils/audio/chordTones.ts). The web path
   *  reads its AnalyserNode, the native one computes it from its own PCM. */
  readSpectrum?: () => Spectrum | null;
  /** The last ~2.5 s of raw input with the time its newest sample arrived —
   *  what the note-onset model reads (utils/audio/noteOnsetModel.ts). */
  readRecentAudio?: () => RecentAudioSnapshot | null;
  /** Measured ambient noise floor (see guitarBufferProcessor.ts), same 0–1 scale
   *  as rawVolumeRef. 0 means "not measured yet this session". */
  noiseFloorRef: React.MutableRefObject<number>;
  /** Attacks with the pitch each one turned out to have, oldest first. Unlike
   *  frequencyRef (a "what is ringing now" readout, which necessarily lags the
   *  attack), each entry carries the timestamp of its own onset — so a consumer
   *  can attribute a late-arriving pitch to the note that actually produced it. */
  noteEventsRef: React.MutableRefObject<DetectedNoteEvent[]>;
  /** Precise time of the most recent attack (see guitarBufferProcessor) — what
   *  note timing is graded against. 0 until the first attack. */
  lastAttackMsRef?: React.MutableRefObject<number>;
  /** When (Date.now(), block end) the low-band detector last heard a low string
   *  struck — an attack too soft or dark for the onset detector (see
   *  guitarBufferProcessor LOW_ATTACK_*). 0 until the first one. */
  lastLowAttackMsRef?: React.MutableRefObject<number>;
  /** The spectral-flux detector's latest attack, dated like lastAttackMsRef —
   *  hears more strums than it, and more that aren't (see guitarBufferProcessor). */
  lastSoftAttackMsRef?: React.MutableRefObject<number>;
  /** Set by whoever wants the raw input itself (see InputTap) — today the
   *  check for the app's own playback leaking into the mic. */
  inputTapRef?: React.MutableRefObject<InputTap | null>;
  /** The latest window's loudest raw (ungained) sample, 0–1 — near 1 the input
   *  is clipping before it reaches us (see guitarBufferProcessor). */
  inputPeakRef?: React.MutableRefObject<number>;
}

const GAIN_STORAGE_KEY = "audio_input_gain";
const DEVICE_STORAGE_KEY = "web_audio_input_device_id";
const CHANNEL_STORAGE_KEY = "web_audio_input_channel";
const DEFAULT_GAIN = 3.0;

const INPUT_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
};

function loadPersistedDeviceId(): string | null {
  try { return localStorage.getItem(DEVICE_STORAGE_KEY) || null; } catch { return null; }
}

function loadPersistedChannel(): number | null {
  try {
    const stored = localStorage.getItem(CHANNEL_STORAGE_KEY);
    if (stored === null) return null;
    const val = parseInt(stored, 10);
    return !isNaN(val) && val >= 0 ? val : null;
  } catch { return null; }
}

/** getUserMedia's DOMException names, sorted into what the player can do about them. */
export function classifyInputError(err: unknown): AudioInitFailure {
  const name = (err as { name?: string } | null)?.name;
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError") return "no_device";
  if (name === "NotReadableError" || name === "AbortError" || name === "TrackStartError") return "busy";
  return "unknown";
}


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

export interface GuitarAudioInputOptions {
  /** The player is on bass — listens down to a five-string's low B (see
   *  guitarBufferProcessor BASS_*). Read live, so it can change mid-session. */
  bass?: boolean;
  /** A strumming exercise is on — the only reader of lastSoftAttackMsRef, whose
   *  detector is otherwise left idle. Read live, like `bass`. */
  strum?: boolean;
}

export const useAudioAnalyzer = ({ bass = false, strum = false }: GuitarAudioInputOptions = {}) => {
  const [state, setState] = useState<AudioAnalyzerState>({
    isListening: false,
    error: null,
    errorReason: null,
    inputGain: loadPersistedGain(),
    devices: [],
    deviceId: null,
    deviceLabel: null,
    channelCount: 0,
    activeChannel: 0,
    channel: loadPersistedChannel(),
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  /** The DSP worker, while it is the one running the detectors (see guitarDspClient). */
  const dspRef = useRef<GuitarDspHandle | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const recentAudioRef = useRef<RecentAudio | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const inputGainRef = useRef<number>(loadPersistedGain());
  const pitchDetectorRef = useRef<any>(null);
  const onsetDetectorRef = useRef<any>(null);
  const tickDetectorRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resumeHandlerRef = useRef<(() => void) | null>(null);
  const manualChannelRef = useRef<number | null>(loadPersistedChannel());
  /** Something asked for the input and has not closed it — what a replugged interface reopens for. */
  const wantsInputRef = useRef(false);
  const initRef = useRef<(() => Promise<AudioInitResult>) | null>(null);

  // Real-time refs for fast access without triggering re-renders.
  // (Smoothing/throttle state now lives inside the shared buffer processor.)
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
  const inputTapRef = useRef<InputTap | null>(null);
  const inputPeakRef = useRef<number>(0);
  const bassRef = useRef(bass);
  const strumRef = useRef(strum);
  useEffect(() => {
    bassRef.current = bass;
    strumRef.current = strum;
    dspRef.current?.configure({ bass, strum });
  }, [bass, strum]);

  /** Bumped by every init() and close() — see init(). */
  const generationRef = useRef(0);

  /** Disconnects and closes whatever input is open; leaves the readings alone. */
  const releaseResources = useCallback(() => {
    if (resumeHandlerRef.current) {
      document.removeEventListener("pointerdown", resumeHandlerRef.current);
      document.removeEventListener("keydown", resumeHandlerRef.current);
      document.removeEventListener("visibilitychange", resumeHandlerRef.current);
      resumeHandlerRef.current = null;
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.port.onmessage = null;
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    dspRef.current?.close();
    dspRef.current = null;
    if (analyserNodeRef.current) {
      analyserNodeRef.current.disconnect();
      analyserNodeRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") audioContextRef.current.close().catch(() => { /* already closing */ });
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  /** Reads the browser's input list. Labels are only there once access is granted. */
  const refreshDevices = useCallback(async () => {
    const mediaDevices = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!mediaDevices?.enumerateDevices) return;
    try {
      const all = await mediaDevices.enumerateDevices();
      // Chrome lists the Windows "communications" device as a second alias of
      // one of the real ones — noise in a picker for a guitar.
      const devices = all
        .filter((d) => d.kind === "audioinput" && d.label && d.deviceId !== "communications")
        .map((d) => ({ deviceId: d.deviceId, label: d.label }));
      setState(prev => ({ ...prev, devices }));
    } catch { /* the list just stays as it was */ }
  }, []);

  const init = useCallback(async (): Promise<AudioInitResult> => {
    wantsInputRef.current = true;
    // Same guard as useNativeAudioAnalyzer's: init() awaits getUserMedia, the
    // aubio wasm and the worklet, and a close() — switching exercises — or a
    // second init() can land in between. Without it the stale call finished
    // anyway: a stream left open after close(), or two worklets writing the same
    // refs, which only a page reload cleared. A newer call or close() bumps the
    // generation; a stale call closes what it opened itself and leaves the rest.
    const myGeneration = ++generationRef.current;
    // An input already open (init() again without close()) goes first.
    releaseResources();
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    const isStale = () => {
      if (myGeneration === generationRef.current) return false;
      stream?.getTracks().forEach(track => track.stop());
      if (audioContext && audioContext.state !== "closed") audioContext.close().catch(() => { /* already closing */ });
      return true;
    };
    const fail = (reason: AudioInitFailure, message: string): AudioInitResult => {
      setState(prev => ({ ...prev, isListening: false, error: message, errorReason: reason }));
      return { ok: false, reason };
    };
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return fail("unsupported", "This browser can't open an audio input");
    }
    try {
      // The device the player picked last time, else whatever the system calls
      // its default — which is often a webcam, hence the picker.
      const wantedDeviceId = loadPersistedDeviceId();
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: wantedDeviceId ? { ...INPUT_CONSTRAINTS, deviceId: { exact: wantedDeviceId } } : INPUT_CONSTRAINTS,
        });
      } catch (err) {
        // The saved device is unplugged or held by another program — not a
        // reason to fail while the system default may still work. A refusal
        // is: asking again would only be refused again.
        if (!wantedDeviceId || classifyInputError(err) === "denied" || myGeneration !== generationRef.current) throw err;
        stream = await navigator.mediaDevices.getUserMedia({ audio: INPUT_CONSTRAINTS });
      }
      if (isStale()) return { ok: true };
      streamRef.current = stream;

      const track = stream.getTracks()[0] as MediaStreamTrack | undefined;
      const settings = track?.getSettings?.() ?? {};
      setState(prev => ({
        ...prev,
        deviceId: settings.deviceId ?? wantedDeviceId,
        deviceLabel: track?.label || null,
        channelCount: settings.channelCount ?? 0,
        activeChannel: 0,
      }));
      void refreshDevices();
      // Unplugged mid-session: the track ends and the worklet just goes quiet,
      // which looked exactly like a guitar nobody was playing.
      track?.addEventListener?.("ended", () => {
        if (myGeneration !== generationRef.current) return;
        releaseResources();
        setState(prev => ({ ...prev, isListening: false, error: "Audio input disconnected", errorReason: "disconnected" }));
        toast.warning("Audio input disconnected. Plug it back in to keep going.");
      });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      // The context runs at the device's own rate — never a requested one, which
      // browsers don't reliably resample the mic into (see getDecimationFactor).
      // Interfaces running at 96/176.4/192 kHz are brought down to ~48 kHz by the
      // worklet instead, so aubio's 2048-sample window still holds enough
      // periods of low E.
      audioContext = new AudioContextClass() as AudioContext;
      audioContextRef.current = audioContext;
      const decimation = getDecimationFactor(audioContext.sampleRate);
      const analysisRate = audioContext.sampleRate / decimation;

      // After `await getUserMedia` the browser often considers the user gesture
      // consumed, so the freshly-created AudioContext starts in "suspended" state.
      // A suspended context never runs the AudioWorklet's process() → no buffers
      // are posted → volume/frequency stay 0 (mic appears dead even though
      // permission was granted). Resume it explicitly, like every other audio
      // path in the app does. This is why the issue was intermittent and only
      // cleared up after switching browsers (fresh autoplay/activation state).
      if (audioContext.state === "suspended") {
        try { await audioContext.resume(); } catch { /* ignore */ }
        if (isStale()) return { ok: true };
      }

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioContext.createAnalyser();
      // 8192 at 44.1/48 kHz (~170 ms); scaled up with the device rate so the
      // chord grading keeps the same bin resolution at 96/192 kHz.
      analyser.fftSize = Math.min(32768, 2 ** Math.round(Math.log2(8192 * decimation)));
      analyser.smoothingTimeConstant = 0.1; // fast decay → a fresh chord reads as itself
      source.connect(analyser);
      analyserNodeRef.current = analyser;

      // AudioWorklet: accumulates 128-sample quanta → 2048-sample buffers, each
      // stamped with the time it was captured.
      const blob = new Blob([GUITAR_INPUT_WORKLET_CODE], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      await audioContext.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);
      if (isStale()) return { ok: true };

      const workletNode = new AudioWorkletNode(audioContext, "guitar-input-processor", {
        processorOptions: { decimation },
      });
      workletNodeRef.current = workletNode;

      const recentAudio = createRecentAudio(analysisRate, RECENT_AUDIO_SECONDS);
      recentAudioRef.current = recentAudio;

      const targets = {
        frequencyRef, volumeRef, rawVolumeRef, noiseFloorRef, confidenceRef,
        lastOnsetTimeRef, lastTickTimeRef, noteEventsRef, lastAttackMsRef, lastLowAttackMsRef, lastSoftAttackMsRef, inputPeakRef,
      };
      const onActive = () => {
        setState(prev =>
          prev.isListening === true && prev.error === null
            ? prev
            : { ...prev, isListening: true, error: null, errorReason: null }
        );
      };

      // The detectors on this thread — only where the worker below can't run,
      // or once it has died. A phone a few years old spends most of every
      // window in them, which is what the worker is for.
      let processHere: ((samples: Float32Array, timeMs: number) => void) | null = null;
      const runDspHere = async () => {
        // @ts-ignore
        const AubioModule = await import("aubiojs");
        const Aubio = AubioModule.default || AubioModule;
        const aubio = await Aubio();
        if (myGeneration !== generationRef.current) return;
        const detectors = createGuitarDetectors(aubio, analysisRate);
        pitchDetectorRef.current = detectors.pitch;
        onsetDetectorRef.current = detectors.onset;
        tickDetectorRef.current = detectors.tick;
        processHere = createGuitarBufferProcessor({
          detectors,
          getGain: () => inputGainRef.current,
          sampleRate: analysisRate,
          recentAudio,
          isBass: () => bassRef.current,
          isStrumWanted: () => strumRef.current,
          targets: { ...targets, inputTapRef },
          onActive,
        });
      };

      const dsp = await startGuitarDsp({
        sampleRate: analysisRate,
        gain: inputGainRef.current,
        bass: bassRef.current,
        strum: strumRef.current,
        targets,
        onActive,
        onLost: () => {
          if (myGeneration !== generationRef.current) return;
          dspRef.current = null;
          runDspHere().catch((err) => console.error("Guitar DSP fallback failed:", err));
        },
      });
      if (isStale()) { dsp?.close(); return { ok: true }; }
      if (dsp) {
        dspRef.current = dsp;
        // Whatever changed while the worker was starting up.
        dsp.configure({ gain: inputGainRef.current, bass: bassRef.current, strum: strumRef.current });
      } else {
        await runDspHere();
        if (isStale()) return { ok: true };
      }

      workletNode.port.onmessage = (event: MessageEvent<GuitarInputSamplesMessage | GuitarInputChannelsMessage>) => {
        const data = event.data;
        if (data?.type === "samples") {
          const worker = dspRef.current;
          if (!worker) { processHere?.(data.samples, data.timeMs); return; }
          // What stays on this thread: the model's look back and the raw tap —
          // both before the buffer leaves with the window.
          recentAudio.push(data.samples, data.timeMs);
          inputTapRef.current?.(data.samples, analysisRate);
          worker.push(data.samples, data.timeMs);
          return;
        }
        if (data?.type !== "channels") return;
        setState(prev =>
          prev.channelCount === data.count && prev.activeChannel === data.active
            ? prev
            : { ...prev, channelCount: data.count, activeChannel: data.active }
        );
      };
      if (manualChannelRef.current !== null) workletNode.port.postMessage?.({ channel: manualChannelRef.current });

      source.connect(workletNode);
      // Route through a silent gain node to keep the audio graph active
      // without feeding the microphone signal back to the speakers.
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      workletNode.connect(silentGain);
      silentGain.connect(audioContext.destination);

      // Safety net: the context can be re-suspended mid-session (tab backgrounded,
      // OS audio-device switch, autoplay policy) — which silently kills the mic
      // signal until the page is reloaded. Resume it on the next user interaction
      // or when the tab becomes visible again.
      const resumeIfSuspended = () => {
        const ctx = audioContextRef.current;
        if (ctx && ctx.state === "suspended") ctx.resume().catch(() => { /* ignore */ });
      };
      resumeHandlerRef.current = resumeIfSuspended;
      document.addEventListener("pointerdown", resumeIfSuspended);
      document.addEventListener("keydown", resumeIfSuspended);
      document.addEventListener("visibilitychange", resumeIfSuspended);

      setState(prev => ({ ...prev, isListening: true, error: null, errorReason: null }));
      return { ok: true };

    } catch (err: any) {
      if (isStale()) return { ok: true }; // a newer call owns the outcome now
      console.error("Error initializing audio analyzer:", err);
      // Whatever was opened before the failure must not stay open behind an error.
      releaseResources();
      return fail(classifyInputError(err), err?.message || "Microphone access denied");
    }
  }, [releaseResources, refreshDevices]);
  useEffect(() => { initRef.current = init; }, [init]);

  // Plugging an interface in or out: keep the picker current, and reopen the
  // input if it was lost while something still wants it.
  useEffect(() => {
    const mediaDevices = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!mediaDevices?.addEventListener) return undefined;
    const onDeviceChange = () => {
      if (!wantsInputRef.current) return;
      void refreshDevices();
      if (!streamRef.current) void initRef.current?.();
    };
    mediaDevices.addEventListener("devicechange", onDeviceChange);
    return () => mediaDevices.removeEventListener("devicechange", onDeviceChange);
  }, [refreshDevices]);

  const close = useCallback(() => {
    wantsInputRef.current = false;
    generationRef.current++; // invalidate any in-flight init() (see init above)
    releaseResources();

    recentAudioRef.current = null;
    pitchDetectorRef.current = null;
    onsetDetectorRef.current = null;
    tickDetectorRef.current = null;
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

    setState(prev => ({ ...prev, isListening: false, error: null, errorReason: null }));
  }, [releaseResources]);

  /** Opens another input device and remembers it; reopens the stream if one is live or was wanted. */
  const selectDevice = useCallback(async (deviceId: string): Promise<AudioInitResult> => {
    try { localStorage.setItem(DEVICE_STORAGE_KEY, deviceId); } catch { /* ignore */ }
    setState(prev => ({ ...prev, deviceId }));
    if (!wantsInputRef.current) return { ok: true };
    return init();
  }, [init]);

  /** Pins the jack to read (0-based), or null to follow the one carrying signal. */
  const selectChannel = useCallback((channel: number | null) => {
    manualChannelRef.current = channel;
    try {
      if (channel === null) localStorage.removeItem(CHANNEL_STORAGE_KEY);
      else localStorage.setItem(CHANNEL_STORAGE_KEY, String(channel));
    } catch { /* ignore */ }
    workletNodeRef.current?.port.postMessage?.({ channel: channel ?? -1 });
    setState(prev => ({ ...prev, channel }));
  }, []);

  useEffect(() => {
    return () => {
      close();
    };
  }, [close]);

  const setInputGain = useCallback((value: number) => {
    const clamped = Math.max(0.5, Math.min(10.0, value));
    inputGainRef.current = clamped;
    dspRef.current?.configure({ gain: clamped });
    try {
      localStorage.setItem(GAIN_STORAGE_KEY, String(clamped));
    } catch { /* ignore */ }
    setState(prev => ({ ...prev, inputGain: clamped }));
  }, []);

  const getLatencyMs = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return 120;
    const analysisRate = ctx.sampleRate / getDecimationFactor(ctx.sampleRate);
    const bufferLatency = (2048 / analysisRate) * 1000; // ~46ms at 44100Hz
    const baseLatency = ((ctx as any).baseLatency || 0) * 1000;
    const outputLatency = ((ctx as any).outputLatency || 0) * 1000;
    return baseLatency + outputLatency + bufferLatency + 30;
  }, []);

  /** getLatencyMs() for an attack time (onsetMs / lastAttackMsRef): those are
   *  already dated back by the analysis window (guitarBufferProcessor's
   *  ONSET_REPORT_LAG_MS), so counting the window again made every attack look
   *  ~45 ms early — a player had to play late to be graded on time. */
  const getAttackLatencyMs = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return getLatencyMs();
    const analysisRate = ctx.sampleRate / getDecimationFactor(ctx.sampleRate);
    return getLatencyMs() - (2048 / analysisRate) * 1000;
  }, [getLatencyMs]);

  const readSpectrum = useCallback(
    () => (analyserNodeRef.current ? spectrumFromAnalyser(analyserNodeRef.current) : null),
    [],
  );

  const readRecentAudio = useCallback(() => recentAudioRef.current?.read() ?? null, []);

  const audioRefs: AudioRefs = { frequencyRef, volumeRef, rawVolumeRef, noiseFloorRef, lastOnsetTimeRef, lastTickTimeRef, confidenceRef, readSpectrum, readRecentAudio, noteEventsRef, lastAttackMsRef, lastLowAttackMsRef, lastSoftAttackMsRef, inputTapRef, inputPeakRef };

  const webInput = useMemo<WebAudioInput>(() => ({
    devices: state.devices,
    deviceId: state.deviceId,
    deviceLabel: state.deviceLabel,
    channelCount: state.channelCount,
    activeChannel: state.activeChannel,
    channel: state.channel,
    selectDevice,
    selectChannel,
  }), [state.devices, state.deviceId, state.deviceLabel, state.channelCount, state.activeChannel, state.channel, selectDevice, selectChannel]);

  return useMemo(() => ({
    ...state,
    webInput,
    init,
    close,
    audioRefs,
    getLatencyMs,
    getAttackLatencyMs,
    setInputGain,
  }), [state, webInput, init, close, audioRefs, getLatencyMs, getAttackLatencyMs, setInputGain]);
};
