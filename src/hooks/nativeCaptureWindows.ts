// Native capture arrives in messages of one or several driver blocks; the
// detectors want fixed analysis windows, each with the time its last sample
// arrived. This cuts the one into the other.

export interface CaptureWindower {
  /**
   * Adds a message's samples. `arrivalMs` is when the message reached this
   * thread, `blockFrames` the driver's block size (0 = unknown).
   */
  push(samples: Float32Array, arrivalMs: number, sampleRate: number, blockFrames: number): void;
  /** Drops the window being filled — after a gap in the stream. */
  reset(): void;
}

/**
 * How long before the message arrived the block holding sample `index` did,
 * had every driver block been sent on its own: the whole blocks that follow it
 * in the message. A message that is one block (or whose block size is unknown,
 * or doesn't divide it) gives 0 — the stamp a block-per-message stream always got.
 */
export function blockArrivalLeadMs(index: number, messageFrames: number, blockFrames: number, sampleRate: number): number {
  if (blockFrames <= 0 || sampleRate <= 0 || messageFrames % blockFrames !== 0) return 0;
  const blocksAfter = Math.floor((messageFrames - 1 - index) / blockFrames);
  return (blocksAfter * blockFrames * 1000) / sampleRate;
}

/**
 * The average extra wait a reading picks up from blocks being sent several to
 * a message: a window ends in any of the message's blocks alike, and waits for
 * the ones after it.
 */
export function batchWaitMs(messageFrames: number, blockFrames: number, sampleRate: number): number {
  if (blockFrames <= 0 || sampleRate <= 0 || messageFrames <= blockFrames || messageFrames % blockFrames !== 0) return 0;
  return (((messageFrames / blockFrames - 1) / 2) * blockFrames * 1000) / sampleRate;
}

/**
 * `onWindow` gets each full window and the time its last sample arrived. It
 * returns true when it kept the buffer (handed it to a worker), and the next
 * window is then filled into a new one.
 */
export function createCaptureWindower(windowSize: number, onWindow: (window: Float32Array, timeMs: number) => boolean): CaptureWindower {
  let buffer = new Float32Array(windowSize);
  let pos = 0;
  return {
    push(samples, arrivalMs, sampleRate, blockFrames) {
      for (let i = 0; i < samples.length; i++) {
        buffer[pos++] = samples[i];
        if (pos === windowSize) {
          pos = 0;
          const kept = onWindow(buffer, arrivalMs - blockArrivalLeadMs(i, samples.length, blockFrames, sampleRate));
          if (kept) buffer = new Float32Array(windowSize);
        }
      }
    },
    reset() {
      pos = 0;
    },
  };
}
