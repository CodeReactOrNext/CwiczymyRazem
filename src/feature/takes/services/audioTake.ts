/**
 * An audio take: the guitar and the backing, written by the desktop shell.
 *
 * The shell records the guitar itself, straight from the audio engine. This
 * side supplies the other half — what the page plays — by copying the window's
 * own output to the shell as it goes, and telling it at the end when that copy
 * started, so the two can be lined up (electron/takeRender.js).
 */
import type { TakeEntry, TakeGuitarSource } from "types/takes";

import { CAPTURE_CHUNK_FRAMES } from "../utils/takeWorklets";
import {
  createTakeContext,
  ensureCaptureLatency,
  heardOffsetMs,
  keepAlive,
  openPageCapture,
  stopStream,
} from "./pageCapture";

export interface RunningTake {
  /** What the audio engine is recording as the guitar; null when no stream was open at the start. */
  guitar: TakeGuitarSource | null;
  /** Ends the take; resolves what was saved (null when discarded or empty). */
  stop: (discard?: boolean) => Promise<TakeEntry | null>;
}

export interface AudioTakeOptions {
  title: string;
  split: boolean;
  /** The player's sync correction; positive moves the guitar later. */
  guitarTrimMs: number;
}

/** How long the worklet gets to hand over its last chunk before the take ends without it. */
const FLUSH_TIMEOUT_MS = 1500;

interface CaptureEnd {
  frames: number;
  startMs: number;
}

export async function startAudioTake(opts: AudioTakeOptions): Promise<RunningTake> {
  const api = window.takes;
  if (!api) throw new Error("Recording is only available in the desktop app");

  const started = await api.start({ mode: "audio", title: opts.title, split: opts.split });
  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;

  try {
    stream = await openPageCapture(false);
    context = await createTakeContext(started.guitar?.sampleRate);
    const audioTrack = stream.getAudioTracks()[0];
    const source = context.createMediaStreamSource(new MediaStream([audioTrack]));
    // Before anything records: the measurement makes a sound of its own.
    await ensureCaptureLatency(context, source);
    const capture = new AudioWorkletNode(context, "take-capture", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: "explicit",
      processorOptions: { chunkFrames: CAPTURE_CHUNK_FRAMES },
    });

    let resolveEnd: ((end: CaptureEnd | null) => void) | null = null;
    capture.port.onmessage = (event: MessageEvent<{ pcm?: Float32Array; done?: boolean; frames: number; startMs?: number }>) => {
      const data = event.data;
      if (data.pcm) {
        api.pushBacking(new Uint8Array(data.pcm.buffer, data.pcm.byteOffset, data.pcm.byteLength));
      } else if (data.done) {
        resolveEnd?.({ frames: data.frames, startMs: data.startMs ?? NaN });
      }
    };
    source.connect(capture);
    keepAlive(context, capture);

    const liveContext = context;
    const liveStream = stream;
    let stopping: Promise<TakeEntry | null> | null = null;

    return {
      guitar: started.guitar,
      stop(discard = false) {
        stopping ??= (async () => {
          const end = await new Promise<CaptureEnd | null>((resolve) => {
            resolveEnd = resolve;
            capture.port.postMessage("stop");
            window.setTimeout(() => resolve(null), FLUSH_TIMEOUT_MS);
          });
          // Read at the end: by now the context knows its real output latency.
          const offsetMs = heardOffsetMs(liveContext);
          const sampleRate = liveContext.sampleRate;
          capture.port.onmessage = null;
          stopStream(liveStream);
          void liveContext.close().catch(() => {});
          return api.finish({
            discard,
            backingStartMs: end && Number.isFinite(end.startMs) ? end.startMs + offsetMs : undefined,
            backingSampleRate: sampleRate,
            guitarTrimMs: opts.guitarTrimMs,
          });
        })();
        return stopping;
      },
    };
  } catch (error) {
    stopStream(stream);
    void context?.close().catch(() => {});
    await api.finish({ discard: true }).catch(() => {});
    throw error;
  }
}
