/**
 * A video take: the tablature and the score as the player sees them, with the
 * guitar and the backing as one soundtrack.
 *
 * Picture — the window is captured whole and the board (plus the score panel)
 * is cut out of every frame onto a canvas, which is what gets encoded.
 *
 * Sound — mixed live, in a graph of its own:
 *   page capture ─ delay ─┐
 *                         ├─ MediaRecorder
 *   guitar (from the audio engine, over IPC, played from a cushion) ─┘
 * The guitar reaches this window late (batching, two process hops), so the
 * worklet plays every batch a fixed time after it reached the engine, and the
 * backing is held back by that same time. The picture is held back to match
 * the sound.
 *
 * Split — the video's soundtrack is the guitar alone, and the held-back
 * backing goes to the shell instead, from the moment the encoder starts: a WAV
 * that lines up with the video when both are dropped at zero.
 */
import type { TakeEntry } from "types/takes";

import type { TakeFramePlan } from "../utils/takeFrame";
import { findTakeRegion, fitInside, planTakeFrame, sourceBox } from "../utils/takeFrame";
import { CAPTURE_CHUNK_FRAMES } from "../utils/takeWorklets";
import type { RunningTake } from "./audioTake";
import {
  captureLatencySec,
  createTakeContext,
  ensureCaptureLatency,
  heardOffsetMs,
  keepAlive,
  openPageCapture,
  outputLatencySettled,
  stopStream,
  TAKE_VIDEO_FPS,
} from "./pageCapture";

export interface VideoTakeOptions {
  title: string;
  /** The backing as a file of its own instead of in the video's soundtrack. */
  split: boolean;
  /** The player's sync correction; positive moves the guitar later. */
  guitarTrimMs: number;
}

/** Thrown when there is no tablature on screen to film. */
export class NoBoardError extends Error {
  constructor() {
    super("There is no tablature on screen to record");
    this.name = "NoBoardError";
  }
}

/** Encoders in order of preference: MP4 plays everywhere, WebM is the fallback. */
const VIDEO_FORMATS: { mimeType: string; container: "mp4" | "webm" }[] = [
  { mimeType: 'video/mp4;codecs="avc1.640028,mp4a.40.2"', container: "mp4" },
  { mimeType: 'video/mp4;codecs="avc1.42E01F,mp4a.40.2"', container: "mp4" },
  { mimeType: "video/mp4", container: "mp4" },
  { mimeType: 'video/webm;codecs="vp9,opus"', container: "webm" },
  { mimeType: "video/webm", container: "webm" },
];
const VIDEO_BITS_PER_SECOND = 8_000_000;
const AUDIO_BITS_PER_SECOND = 192_000;

/** The board's panel colour — what shows around and between the regions. */
const FRAME_BACKGROUND = "#0f0f12";

/** How long after a batch of guitar reached the engine it is played here: room for the batch itself (43 ms), two process hops and a busy window. */
const GUITAR_TRANSIT_MS = 250;
/** Time given to the capture to settle before encoding starts. */
const PREROLL_MS = 400;
const MAX_BACKING_DELAY_SEC = 1;
/** Roughly how long a frame takes from the screen to the canvas. */
const VIDEO_PIPELINE_MS = 50;
/** The most frames the picture is held back by (400 ms at 30 fps). */
const MAX_DELAY_FRAMES = 12;
/** How long the backing's worklet gets to hand over its last chunk. */
const FLUSH_TIMEOUT_MS = 1500;

function pickFormat() {
  return VIDEO_FORMATS.find((format) => MediaRecorder.isTypeSupported(format.mimeType)) ?? null;
}

function setRecordingFlag(on: boolean) {
  if (on) document.documentElement.dataset.takeRecording = "video";
  else delete document.documentElement.dataset.takeRecording;
}

export async function startVideoTake(opts: VideoTakeOptions): Promise<RunningTake> {
  const api = window.takes;
  if (!api) throw new Error("Recording is only available in the desktop app");
  if (!findTakeRegion("board")) throw new NoBoardError();
  const format = pickFormat();
  if (!format) throw new Error("This build cannot encode video");

  const started = await api.start({ mode: "video", title: opts.title, split: opts.split, container: format.container });
  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;
  let unsubscribeGuitar: (() => void) | null = null;
  let frameCallback = 0;
  const video = document.createElement("video");

  const tearDown = () => {
    setRecordingFlag(false);
    unsubscribeGuitar?.();
    if (frameCallback) video.cancelVideoFrameCallback(frameCallback);
    video.srcObject = null;
    stopStream(stream);
    void context?.close().catch(() => {});
  };

  try {
    stream = await openPageCapture(true);
    context = await createTakeContext(started.guitar?.sampleRate);
    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) throw new Error("The page capture carried no picture");

    // ── Sound ──────────────────────────────────────────────────────────────
    const mix = context.createMediaStreamDestination();
    const backing = context.createMediaStreamSource(new MediaStream([audioTrack]));
    // Before the encoder starts: the measurement makes a sound of its own.
    await ensureCaptureLatency(context, backing);
    const backingDelay = context.createDelay(MAX_BACKING_DELAY_SEC);
    backing.connect(backingDelay);

    /** Split only: copies the held-back backing to the shell once the encoder starts. */
    let backingCapture: AudioWorkletNode | null = null;
    let resolveBackingEnd: (() => void) | null = null;
    if (opts.split) {
      backingCapture = new AudioWorkletNode(context, "take-capture", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 2,
        channelCountMode: "explicit",
        processorOptions: { chunkFrames: CAPTURE_CHUNK_FRAMES, armed: false },
      });
      backingCapture.port.onmessage = (event: MessageEvent<{ pcm?: Float32Array; done?: boolean }>) => {
        const data = event.data;
        if (data.pcm) api.pushBacking(new Uint8Array(data.pcm.buffer, data.pcm.byteOffset, data.pcm.byteLength));
        else if (data.done) resolveBackingEnd?.();
      };
      backingDelay.connect(backingCapture);
      keepAlive(context, backingCapture);
    } else {
      backingDelay.connect(mix);
    }

    const guitar = new AudioWorkletNode(context, "take-guitar", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: { transitMs: GUITAR_TRANSIT_MS },
    });
    guitar.connect(mix);
    keepAlive(context, guitar);

    unsubscribeGuitar = api.onGuitar((bytes, sampleRate, endWallMs) => {
      // The bridge hands over a view of its own; the worklet gets a copy it can keep.
      const pcm = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      guitar.port.postMessage({ pcm, sampleRate, endWallMs }, [pcm.buffer]);
    });

    // ── Picture ────────────────────────────────────────────────────────────
    setRecordingFlag(true);
    video.muted = true;
    video.playsInline = true;
    video.srcObject = new MediaStream([videoTrack]);
    await video.play();
    await new Promise((resolve) => window.setTimeout(resolve, PREROLL_MS));
    // Only now: a context reports no output latency until its stream is running.
    await outputLatencySettled(context);
    const captureLatencyMs = captureLatencySec() * 1000;
    const offsetMs = heardOffsetMs(context);
    const inputLatencyMs = started.guitar?.inputLatencyMs ?? 0;

    // Guitar: played GUITAR_TRANSIT_MS after it reached the engine, which is
    // inputLatencyMs after it was played. Backing: reaches this graph offsetMs
    // before the player heard it (offsetMs is negative). Holding the backing
    // back by the difference puts both where the player had them.
    const backingDelayMs = Math.min(
      MAX_BACKING_DELAY_SEC * 1000 - 20,
      Math.max(0, GUITAR_TRANSIT_MS + inputLatencyMs + offsetMs - opts.guitarTrimMs),
    );
    backingDelay.delayTime.value = backingDelayMs / 1000;
    /** Frames the picture is held back by, to stay with the sound. */
    const delayFrames = Math.min(
      MAX_DELAY_FRAMES,
      Math.max(0, Math.round(((backingDelayMs + captureLatencyMs - VIDEO_PIPELINE_MS) / 1000) * TAKE_VIDEO_FPS)),
    );

    let boardEl = findTakeRegion("board");
    let scoreEl = findTakeRegion("score");
    if (!boardEl || video.videoWidth === 0) throw new NoBoardError();
    const pxPerCss = video.videoWidth / window.innerWidth;
    const plan: TakeFramePlan = planTakeFrame(
      boardEl.getBoundingClientRect(),
      scoreEl ? scoreEl.getBoundingClientRect() : null,
      pxPerCss,
    );

    const canvas = document.createElement("canvas");
    canvas.width = plan.width;
    canvas.height = plan.height;
    const output = canvas.getContext("2d", { alpha: false });
    if (!output) throw new Error("Could not create the recording canvas");
    output.fillStyle = FRAME_BACKGROUND;
    output.fillRect(0, 0, plan.width, plan.height);

    /** Composed frames waiting their turn while the picture is held back. */
    const ring: (HTMLCanvasElement | undefined)[] = [];
    let written = 0;

    const drawRegion = (
      target: CanvasRenderingContext2D,
      element: HTMLElement | null,
      slot: TakeFramePlan["board"] | null,
    ) => {
      if (!element || !slot) return;
      const rect = element.getBoundingClientRect();
      const scale = video.videoWidth / window.innerWidth;
      const source = sourceBox(rect, scale, { width: video.videoWidth, height: video.videoHeight });
      if (!source) return;
      const dest = fitInside(source, slot);
      target.drawImage(video, source.x, source.y, source.width, source.height, dest.x, dest.y, dest.width, dest.height);
    };

    const compose = (target: CanvasRenderingContext2D) => {
      // The session remounts the board when the exercise changes.
      if (!boardEl?.isConnected) boardEl = findTakeRegion("board");
      if (plan.score && !scoreEl?.isConnected) scoreEl = findTakeRegion("score");
      target.fillStyle = FRAME_BACKGROUND;
      target.fillRect(0, 0, plan.width, plan.height);
      drawRegion(target, scoreEl, plan.score);
      drawRegion(target, boardEl, plan.board);
    };

    const onFrame = () => {
      frameCallback = video.requestVideoFrameCallback(onFrame);
      if (delayFrames === 0) {
        compose(output);
        return;
      }
      const size = MAX_DELAY_FRAMES + 1;
      const slot = written % size;
      let held = ring[slot];
      if (!held) {
        held = document.createElement("canvas");
        held.width = plan.width;
        held.height = plan.height;
        ring[slot] = held;
      }
      const heldContext = held.getContext("2d", { alpha: false });
      if (heldContext) compose(heldContext);
      written += 1;
      const due = ring[(written - 1 - delayFrames + size * 2) % size];
      if (due && written > delayFrames) output.drawImage(due, 0, 0);
    };
    frameCallback = video.requestVideoFrameCallback(onFrame);

    // ── Encoder ────────────────────────────────────────────────────────────
    const canvasStream = canvas.captureStream(TAKE_VIDEO_FPS);
    const recorder = new MediaRecorder(new MediaStream([canvasStream.getVideoTracks()[0], mix.stream.getAudioTracks()[0]]), {
      mimeType: format.mimeType,
      videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
      audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
    });
    // Pieces must reach the file in the order they were encoded.
    let writing: Promise<void> = Promise.resolve();
    recorder.ondataavailable = (event) => {
      if (event.data.size === 0) return;
      const blob = event.data;
      writing = writing.then(async () => {
        api.pushVideo(new Uint8Array(await blob.arrayBuffer()));
      });
    };
    const recorderStopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => resolve();
    });
    backingCapture?.port.postMessage("start");
    recorder.start(1000);
    const sampleRate = context.sampleRate;

    let stopping: Promise<TakeEntry | null> | null = null;
    return {
      guitar: started.guitar,
      stop(discard = false) {
        stopping ??= (async () => {
          if (recorder.state !== "inactive") recorder.stop();
          await recorderStopped;
          await writing.catch(() => {});
          if (backingCapture) {
            const capture = backingCapture;
            await new Promise<void>((resolve) => {
              resolveBackingEnd = resolve;
              capture.port.postMessage("stop");
              window.setTimeout(resolve, FLUSH_TIMEOUT_MS);
            });
            capture.port.onmessage = null;
          }
          canvasStream.getTracks().forEach((track) => track.stop());
          tearDown();
          return api.finish({ discard, backingSampleRate: sampleRate });
        })();
        return stopping;
      },
    };
  } catch (error) {
    tearDown();
    await api.finish({ discard: true }).catch(() => {});
    throw error;
  }
}
