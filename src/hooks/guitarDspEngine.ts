// The guitar DSP as the desktop shell runs it: the same session the web worker
// runs (guitarDspSession.ts), fed captured blocks instead of ready windows.
//
// In the shell the detectors sit next to the capture, in a thread of the main
// process (electron/captureDspHost.js), so the window that draws the session
// gets one message of readings per analysis window instead of every captured
// block. This file is bundled into electron/generated/guitarDspEngine.js by
// scripts/buildGuitarDspEngine.mjs — the shell ships that bundle, and uses it
// only while its hash is the one the web app was built with
// (generated/guitarDspEngineHash.ts): a shell older than the detectors hands
// the blocks to the window as it always did, and the window's own worker runs
// today's detectors on them.
// @ts-ignore — aubiojs has no types
import aubioModule from "aubiojs";

import type { DspReadingsMessage, DspSettings } from "./guitarDspSession";
import { createDspSession } from "./guitarDspSession";
import { createCaptureWindower } from "./nativeCaptureWindows";

/** aubio's analysis window — must match createGuitarDetectors. */
const WINDOW_SIZE = 2048;

export interface EngineDspInit extends DspSettings {
  sampleRate: number;
  /** The driver's block size, 0 when unknown (see nativeCaptureWindows.ts). */
  blockFrames: number;
}

/** One analysis window's worth: the readings, and the window they were read from. */
export interface EngineDspMessage extends DspReadingsMessage {
  /** When the window's last sample reached the shell (its Date.now()). */
  timeMs: number;
  /** The window itself, for what the session keeps of the raw input. */
  samples: Float32Array;
  /** Frames in the capture message the shell last received (added by the shell). */
  messageFrames?: number;
}

/** What the shell tells the window on the readings' channel. */
export type EngineDspEvent = EngineDspMessage | { type: "lost" };

export async function createEngineDsp({ sampleRate, blockFrames, gain, bass, strum }: EngineDspInit) {
  const loadAubio = (aubioModule as { default?: unknown }).default ?? aubioModule;
  const aubio = await (loadAubio as () => Promise<unknown>)();
  const session = createDspSession(aubio, sampleRate, { gain, bass, strum, spectrum: true });
  let out: EngineDspMessage[] = [];
  const windower = createCaptureWindower(WINDOW_SIZE, (samples, timeMs) => {
    out.push({ ...session.push(samples, timeMs), timeMs, samples });
    return true;
  });

  return {
    /** A captured message (FLOAT32 mono, its buffer starting at the first sample)
     *  and when it arrived; returns the windows it completed. */
    push(bytes: Uint8Array, arrivalMs: number): EngineDspMessage[] {
      const samples = new Float32Array(bytes.buffer as ArrayBuffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4));
      windower.push(samples, arrivalMs, sampleRate, blockFrames);
      const done = out;
      out = [];
      return done;
    },
    configure(patch: Partial<DspSettings>) {
      session.configure(patch);
    },
  };
}
