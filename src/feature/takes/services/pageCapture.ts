/**
 * What the app window itself is playing and showing, as a stream.
 *
 * A take's backing is everything the page plays — the metronome, the tab's
 * synth, AlphaTab, a backing file in an <audio> element, a YouTube video in a
 * cross-origin iframe. Those share no audio graph, so the only place they all
 * meet is the window's own output; the desktop shell hands that over without a
 * prompt (setDisplayMediaRequestHandler in electron/main.js), picture included.
 *
 * The guitar is not in it: monitoring goes from the audio engine straight to
 * the interface and never through the page. That is what makes a take's two
 * sources separable.
 */
import {
  LATENCY_PROBE_HZ,
  TAKE_CAPTURE_WORKLET,
  TAKE_GUITAR_WORKLET,
  TAKE_LATENCY_PROBE_WORKLET,
} from "../utils/takeWorklets";

/** Frames a second a video take is captured at. */
export const TAKE_VIDEO_FPS = 30;

/**
 * How far behind the page the capture runs when it could not be measured.
 * Measured at ~130 ms in Electron 42 on Windows — three times what the track
 * itself reports as its latency, which is why it is measured and not read.
 */
const DEFAULT_CAPTURE_LATENCY_SEC = 0.13;

/** Bursts a measurement plays, far enough apart that one's echo cannot be taken for the next's. */
const PROBE_BURSTS = 2;
const PROBE_BURST_SEC = 0.012;
const PROBE_GAP_SEC = 0.45;
const PROBE_GAIN = 0.15;
const PROBE_LEAD_SEC = 0.15;
/** How long after a burst its echo may still turn up. */
const PROBE_WINDOW_SEC = 0.4;
/** Below this a block is noise, whatever the music is doing up there. */
const PROBE_ABSOLUTE_FLOOR = 0.004;
/** ...and the echo must stand this far above it. */
const PROBE_RELATIVE_FLOOR = 6;

/**
 * Seconds the running take's capture is behind the page. Measured for every
 * take: each capture that is opened settles on a latency of its own (40 ms
 * apart between two in a row, in testing), so one take's figure is only the
 * fallback for the next.
 */
let measuredCaptureLatencySec: number | null = null;

export async function openPageCapture(withVideo: boolean): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Page capture is not available");
  const stream = await navigator.mediaDevices.getDisplayMedia({
    // A video track is mandatory even when only the audio is wanted.
    video: withVideo ? { frameRate: TAKE_VIDEO_FPS } : { width: 1, height: 1, frameRate: 1 },
    // Every one of these would reshape the sound being recorded.
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    preferCurrentTab: true,
    selfBrowserSurface: "include",
    systemAudio: "include",
  } as DisplayMediaStreamOptions);
  if (!withVideo) stream.getVideoTracks().forEach((track) => track.stop());
  if (!stream.getAudioTracks()[0]) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error("The page capture carried no audio");
  }
  return stream;
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

/**
 * A context for the take's graph, at the guitar's sample rate when it is known
 * — then the two sources need no resampling to be put together.
 */
export async function createTakeContext(sampleRate: number | null | undefined): Promise<AudioContext> {
  let context: AudioContext;
  try {
    context = sampleRate ? new AudioContext({ sampleRate }) : new AudioContext();
  } catch {
    context = new AudioContext();
  }
  if (context.state === "suspended") await context.resume().catch(() => {});
  const url = URL.createObjectURL(
    new Blob([TAKE_CAPTURE_WORKLET, TAKE_GUITAR_WORKLET, TAKE_LATENCY_PROBE_WORKLET], {
      type: "application/javascript",
    }),
  );
  try {
    await context.audioWorklet.addModule(url);
  } finally {
    URL.revokeObjectURL(url);
  }
  return context;
}

/**
 * Chromium only renders nodes that reach the destination, so the take's graph
 * is tied to it through a muted gain. Silent matters: this graph is fed by the
 * very output it would otherwise be adding to. Returns the undo.
 */
export function keepAlive(context: AudioContext, node: AudioNode): () => void {
  const silent = context.createGain();
  silent.gain.value = 0;
  node.connect(silent);
  silent.connect(context.destination);
  return () => {
    node.disconnect(silent);
    silent.disconnect();
  };
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Measures how far behind the page this take's capture runs.
 *
 * Two 12 ms bursts at 15 kHz leave through this context's output, join the
 * window's audio, and come back through `source`; how much later they come
 * back, on the context's own clock, is the latency. Call it before anything
 * records `source` — the bursts are the take's own sound, not the page's.
 */
export async function ensureCaptureLatency(context: AudioContext, source: AudioNode): Promise<void> {
  const probe = new AudioWorkletNode(context, "take-latency-probe", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    processorOptions: { hz: LATENCY_PROBE_HZ },
  });
  const readings: { t: number; level: number }[] = [];
  probe.port.onmessage = (event: MessageEvent<{ t: number; level: number }>) => readings.push(event.data);
  source.connect(probe);
  const release = keepAlive(context, probe);

  const start = context.currentTime + PROBE_LEAD_SEC;
  const emittedAt: number[] = [];
  for (let i = 0; i < PROBE_BURSTS; i += 1) {
    const at = start + i * PROBE_GAP_SEC;
    emittedAt.push(at);
    const oscillator = context.createOscillator();
    oscillator.frequency.value = LATENCY_PROBE_HZ;
    const gain = context.createGain();
    // Ramped, not switched: a hard edge is a click across the whole spectrum.
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(PROBE_GAIN, at + PROBE_BURST_SEC * 0.25);
    gain.gain.setValueAtTime(PROBE_GAIN, at + PROBE_BURST_SEC * 0.75);
    gain.gain.linearRampToValueAtTime(0, at + PROBE_BURST_SEC);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + PROBE_BURST_SEC + 0.01);
  }

  const totalSec = PROBE_LEAD_SEC + (PROBE_BURSTS - 1) * PROBE_GAP_SEC + PROBE_WINDOW_SEC;
  await new Promise((resolve) => window.setTimeout(resolve, totalSec * 1000 + 60));

  probe.port.onmessage = null;
  source.disconnect(probe);
  release();

  const before = readings.filter((reading) => reading.t < start).map((reading) => reading.level);
  const baseline = before.length > 0 ? median(before) : 0;
  const threshold = Math.max(PROBE_ABSOLUTE_FLOOR, baseline * PROBE_RELATIVE_FLOOR);
  const trips: number[] = [];
  for (const at of emittedAt) {
    const echo = readings.find(
      (reading) => reading.t >= at && reading.t <= at + PROBE_WINDOW_SEC && reading.level > threshold,
    );
    if (echo) trips.push(echo.t - at);
  }
  // Nothing came back (a loud passage up there, or no output at all): the
  // last take's figure, or the default, stands for this one.
  if (trips.length > 0) measuredCaptureLatencySec = median(trips);
}

/**
 * Resolves once the context says how late its output is.
 *
 * A fresh context reports 0 until its output stream is actually running —
 * 42 ms turned up as 0 for the first moments in testing, which put a video
 * take's backing 30 ms early. Gives up after a second and a half; the base
 * latency is used then.
 */
export async function outputLatencySettled(context: AudioContext): Promise<void> {
  for (let waited = 0; waited < 1500 && !(context.outputLatency > 0); waited += 50) {
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
}

/** Seconds between the page making a sound and that sound reaching a take's graph. */
export function captureLatencySec(): number {
  return measuredCaptureLatencySec ?? DEFAULT_CAPTURE_LATENCY_SEC;
}

/**
 * Milliseconds to add to the moment a captured sample passes through the
 * take's graph to get the moment the player heard it.
 *
 * The capture taps the page's output before the sound card: a sample turns up
 * here one capture latency after the page made it, and the player hears it one
 * output latency after the page made it.
 */
export function heardOffsetMs(context: AudioContext): number {
  const outputLatency = context.outputLatency || context.baseLatency || 0;
  return (outputLatency - captureLatencySec()) * 1000;
}
