/**
 * The one capture of the tab's own audio, shared by everything that listens.
 *
 * A YouTube video's audio lives in a cross-origin iframe: it cannot be read from
 * the page and cannot be fetched ahead of time, so the only way to know what it
 * sounds like is to listen to what is already being played. That capture is
 * expensive to obtain — in a browser it costs a permission prompt, which the
 * platform only grants off a user gesture — so it is opened once and kept for
 * the life of the page rather than per video or per screen.
 *
 * That is what makes learning passive. Held open, a video that plays during
 * ordinary practice is heard as it plays, and the waveform is simply there by
 * the time anyone opens the Align screen.
 *
 * Chromium only: Firefox ignores the audio request outright and Safari has no
 * support for it. On the desktop build the main process answers the request
 * itself (see setDisplayMediaRequestHandler), so there is no picker at all.
 */

import type { AudioBlockBatch } from "../utils/waveformWorklet";
import {
  BLOCKS_PER_BATCH,
  TONE_BIN,
  toneFrequency,
  WAVEFORM_WORKLET_CODE,
} from "../utils/waveformWorklet";

/** Bursts per calibration. The median of them is the answer, so an odd number
 *  survives one of them being masked by a cymbal. */
const CALIBRATION_BURSTS = 5;
const BURST_SEC = 0.012;
const BURST_GAP_SEC = 0.2;
const BURST_GAIN = 0.3;
/** Lead-in before the first burst, so the schedule is comfortably in the future. */
const CALIBRATION_LEAD_SEC = 0.35;
/** How long after a burst its echo may still turn up before the attempt is lost. */
const BURST_WINDOW_SEC = 0.9;

/** Absolute floor for calling a block "the burst" — below it, it is noise. */
const TONE_ABSOLUTE_FLOOR = 0.004;
/** ...and it must also stand this far above whatever the music is doing up there. */
const TONE_RELATIVE_FLOOR = 6;

/** Latencies outside this are not measurements, they are mis-detections. */
const MIN_PLAUSIBLE_LATENCY_SEC = 0;
const MAX_PLAUSIBLE_LATENCY_SEC = 1.2;

/** Arrival offsets are tracked as a windowed minimum — the least delayed
 *  message is the honest one, and a window lets the estimate follow drift. */
const OFFSET_WINDOW_BATCHES = 240;

export interface CaptureBatch extends AudioBlockBatch {
  /**
   * True when this batch overlaps a calibration burst.
   *
   * The burst is our own sound, not the video's. Recording it would put a spike
   * into the waveform at whatever moment the song happened to be at.
   */
  suppressed: boolean;
}

export interface TabAudioCapture {
  /** Wall-clock instant, on the performance clock, at which a context time was
   *  observed. Lets a block be placed against a player read on the same clock. */
  toPerformanceMs(contextTime: number): number;
  /**
   * Seconds between audio leaving the tab and reaching this graph, or null when
   * it has never been measured.
   *
   * Everything heard is late by this much. Ignoring it — which is what listening
   * used to do — shifts the entire learned waveform, and lining a tab up against
   * a waveform that is 150 ms late puts the backing track 150 ms out. At 120 bpm
   * that is most of an eighth note.
   */
  readonly latencySec: number | null;
  /** Measures the latency and returns it, or null if the burst was never heard. */
  calibrate(): Promise<number | null>;
  subscribe(listener: (batch: CaptureBatch) => void): () => void;
  /** Whether the capture is still live — the user can end it from the browser's
   *  own sharing bar at any moment. */
  isLive(): boolean;
  onEnded(listener: () => void): () => void;
}

export function isTabAudioCaptureSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;
}

/** Why listening could not start, in the terms the panel has to explain it. */
export type CaptureFailure = "unsupported" | "denied" | "no-audio" | "failed";

export class TabAudioCaptureError extends Error {
  constructor(
    message: string,
    readonly reason: CaptureFailure,
  ) {
    super(message);
    this.name = "TabAudioCaptureError";
  }
}

/** The concrete capture, with the teardown the public interface hides. */
interface OpenCapture extends TabAudioCapture {
  stop(): void;
}

let pending: Promise<TabAudioCapture> | null = null;
let live: OpenCapture | null = null;

function createCapture(parts: {
  context: AudioContext;
  stream: MediaStream;
  listener: AudioWorkletNode;
}): OpenCapture {
  const { context, stream, listener } = parts;

  const subscribers = new Set<(batch: CaptureBatch) => void>();
  const endedListeners = new Set<() => void>();
  let stopped = false;

  /** context seconds to performance ms, as a single additive offset. */
  let offsetMs = performance.now() - context.currentTime * 1000;
  let windowMin = Infinity;
  let previousWindowMin = Infinity;
  let batchesInWindow = 0;

  /** What the music is doing at the calibration frequency, so a burst can be
   *  told apart from a cymbal rather than merely from silence. */
  let toneBaseline = 0;

  /** Context-time span the running calibration occupies, if any. */
  let suppressWindow: { from: number; to: number } | null = null;
  /** Fed every block while a calibration is running. */
  let onToneBlock: ((contextTime: number, level: number) => void) | null = null;

  let latencySec: number | null = null;

  listener.port.onmessage = (event: MessageEvent<AudioBlockBatch>) => {
    const batch = event.data;
    const batchSec = batch.peak.length * batch.blockDuration;

    // The message arrives after the whole batch was measured; the least delayed
    // arrival in a window is the closest thing to the true offset.
    const observed = performance.now() - (batch.startTime + batchSec) * 1000;
    if (observed < windowMin) windowMin = observed;
    batchesInWindow += 1;
    if (batchesInWindow >= OFFSET_WINDOW_BATCHES) {
      previousWindowMin = windowMin;
      windowMin = Infinity;
      batchesInWindow = 0;
    }
    const best = Math.min(windowMin, previousWindowMin);
    if (Number.isFinite(best)) offsetMs = best;

    if (onToneBlock) {
      for (let i = 0; i < batch.tone.length; i += 1) {
        onToneBlock(batch.startTime + i * batch.blockDuration, batch.tone[i]);
      }
    } else {
      // Only tracked outside a calibration, or the burst would raise the very
      // baseline it has to stand above.
      for (let i = 0; i < batch.tone.length; i += 1) {
        toneBaseline = toneBaseline * 0.995 + batch.tone[i] * 0.005;
      }
    }

    const suppressed =
      !!suppressWindow &&
      batch.startTime + batchSec >= suppressWindow.from &&
      batch.startTime <= suppressWindow.to;

    const outgoing: CaptureBatch = {
      startTime: batch.startTime,
      blockDuration: batch.blockDuration,
      peak: batch.peak,
      hp: batch.hp,
      tone: batch.tone,
      suppressed,
    };
    subscribers.forEach((subscriber) => subscriber(outgoing));
  };

  /**
   * Plays a short burst at the calibration frequency and times how long it takes
   * to come back around.
   *
   * The burst leaves through this context's destination, joins the tab's audio
   * beside the video's, and returns through the capture — so the round trip is
   * the output path plus the capture path. Only the capture half applies to the
   * video, whose audio never went through our output, so the output latency the
   * context reports is subtracted back off.
   *
   * 15 kHz for twelve milliseconds: near the top of hearing, almost nothing in
   * music sits there, and it is over before it registers as a sound.
   */
  const calibrate = async (): Promise<number | null> => {
    if (stopped) return null;

    const frequency = toneFrequency(context.sampleRate);
    const start = context.currentTime + CALIBRATION_LEAD_SEC;
    const emittedAt: number[] = [];

    for (let i = 0; i < CALIBRATION_BURSTS; i += 1) {
      const at = start + i * BURST_GAP_SEC;
      emittedAt.push(at);

      const oscillator = context.createOscillator();
      oscillator.frequency.value = frequency;
      const gain = context.createGain();
      // Ramped rather than switched: a hard edge is broadband, and broadband is
      // an audible click that would also smear across the detector's bin.
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(BURST_GAIN, at + BURST_SEC * 0.25);
      gain.gain.setValueAtTime(BURST_GAIN, at + BURST_SEC * 0.75);
      gain.gain.linearRampToValueAtTime(0, at + BURST_SEC);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + BURST_SEC + 0.01);
    }

    const lastMoment = start + (CALIBRATION_BURSTS - 1) * BURST_GAP_SEC + BURST_WINDOW_SEC;
    suppressWindow = { from: start - 0.05, to: lastMoment };

    const threshold = Math.max(TONE_ABSOLUTE_FLOOR, toneBaseline * TONE_RELATIVE_FLOOR);
    const roundTrips: number[] = [];
    let nextBurst = 0;

    await new Promise<void>((resolve) => {
      const finish = () => {
        onToneBlock = null;
        suppressWindow = null;
        resolve();
      };
      const timer = window.setTimeout(
        finish,
        Math.max(0, (lastMoment - context.currentTime + 0.2) * 1000),
      );

      onToneBlock = (contextTime, level) => {
        if (nextBurst >= emittedAt.length) return;
        const emitted = emittedAt[nextBurst];
        // Everything before the burst was scheduled belongs to the run-up.
        if (contextTime < emitted) return;
        if (contextTime > emitted + BURST_WINDOW_SEC) {
          // This one never came back — a loud passage, or a share of something
          // that does not carry our own output. Move on to the next.
          nextBurst += 1;
          return;
        }
        if (level < threshold) return;

        roundTrips.push(contextTime - emitted);
        nextBurst += 1;
        if (nextBurst >= emittedAt.length) {
          window.clearTimeout(timer);
          finish();
        }
      };
    });

    if (roundTrips.length === 0) return null;

    roundTrips.sort((a, b) => a - b);
    const roundTrip = roundTrips[Math.floor(roundTrips.length / 2)];
    const outputLatency = context.outputLatency || context.baseLatency || 0;
    const measured = roundTrip - outputLatency;

    if (measured < MIN_PLAUSIBLE_LATENCY_SEC || measured > MAX_PLAUSIBLE_LATENCY_SEC) return null;

    latencySec = measured;
    return measured;
  };

  const capture: OpenCapture = {
    toPerformanceMs: (contextTime) => contextTime * 1000 + offsetMs,
    get latencySec() {
      return latencySec;
    },
    calibrate,
    subscribe(subscriber) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
    isLive: () => !stopped,
    onEnded(endedListener) {
      endedListeners.add(endedListener);
      return () => endedListeners.delete(endedListener);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      listener.port.onmessage = null;
      stream.getTracks().forEach((track) => track.stop());
      void context.close().catch(() => {});
      if (live === capture) {
        live = null;
        pending = null;
      }
      endedListeners.forEach((endedListener) => endedListener());
      endedListeners.clear();
      subscribers.clear();
    },
  };

  return capture;
}

async function openCapture(): Promise<OpenCapture> {
  if (!isTabAudioCaptureSupported()) {
    throw new TabAudioCaptureError(
      "This browser can't share tab audio. Chrome and Edge can; Firefox and Safari cannot.",
      "unsupported",
    );
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      // A video track is mandatory even when only the audio is wanted, so the
      // cheapest possible one is asked for and stopped immediately.
      video: { width: 1, height: 1, frameRate: 1 },
      audio: {
        // Every one of these would reshape the audio being measured. Tab capture
        // has none of them on by default; asking is belt and braces.
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      // Points the picker straight at this tab, which is the only useful answer
      // — and on browsers that honour it, reduces the prompt to a single click.
      preferCurrentTab: true,
      selfBrowserSurface: "include",
      systemAudio: "include",
    } as DisplayMediaStreamOptions);
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    if (name === "NotAllowedError" || name === "AbortError") {
      throw new TabAudioCaptureError(
        "Sharing was refused, so there is nothing to listen to.",
        "denied",
      );
    }
    throw new TabAudioCaptureError("Couldn't start listening to this tab.", "failed");
  }

  stream.getVideoTracks().forEach((track) => track.stop());
  const audioTrack = stream.getAudioTracks()[0];
  if (!audioTrack) {
    stream.getTracks().forEach((track) => track.stop());
    throw new TabAudioCaptureError(
      'That share carried no audio. Pick this tab and tick "share tab audio".',
      "no-audio",
    );
  }

  let context: AudioContext;
  try {
    context = new AudioContext({ sampleRate: 48_000, latencyHint: "interactive" });
  } catch {
    context = new AudioContext();
  }
  // A gesture spent on the permission prompt often leaves the context suspended,
  // and a suspended context never runs the worklet — no blocks, no waveform.
  if (context.state === "suspended") await context.resume().catch(() => {});

  const blobUrl = URL.createObjectURL(
    new Blob([WAVEFORM_WORKLET_CODE], { type: "application/javascript" }),
  );
  try {
    await context.audioWorklet.addModule(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }

  const source = context.createMediaStreamSource(new MediaStream([audioTrack]));
  const listener = new AudioWorkletNode(context, "waveform-listener", {
    numberOfOutputs: 1,
    processorOptions: { blocksPerBatch: BLOCKS_PER_BATCH, toneBin: TONE_BIN },
  });
  source.connect(listener);
  // Chromium only pulls nodes that reach the destination, so the worklet is
  // routed there through a muted gain. Silent is essential rather than tidy:
  // this graph is capturing the very output it would otherwise be feeding.
  const silent = context.createGain();
  silent.gain.value = 0;
  listener.connect(silent);
  silent.connect(context.destination);

  const capture = createCapture({ context, stream, listener });
  live = capture;

  // The user ending the share from the browser's bar is not an error — it is
  // them turning the feature off.
  audioTrack.addEventListener("ended", () => capture.stop());

  return capture;
}

/** The capture already open, if there is one. Never prompts. */
export function peekTabAudioCapture(): TabAudioCapture | null {
  return live?.isLive() ? live : null;
}

/**
 * Opens the capture, or hands back the one already open.
 *
 * Must be called from a user gesture the first time on the web: the platform
 * only grants display capture off transient activation. On the desktop build
 * the main process answers instead and no gesture is involved.
 */
export function acquireTabAudioCapture(): Promise<TabAudioCapture> {
  // The user can stop sharing from the browser's own bar. The handle is dead
  // after that, so the next request has to open a real one rather than resolve
  // to a corpse.
  if (live && !live.isLive()) {
    pending = null;
    live = null;
  }
  if (!pending) {
    pending = openCapture().catch((error) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}

/** Drops the capture for good — used when the user turns listening off. */
export function releaseTabAudioCapture(): void {
  live?.stop();
  pending = null;
  live = null;
}
