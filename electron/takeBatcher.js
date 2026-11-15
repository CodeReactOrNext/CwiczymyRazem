// The guitar of a take on its way out of the audio process, a few dozen
// milliseconds to a message.
//
// The engine hands the tap one hardware block at a time (64–512 frames, mono or
// two sides). Sending each on its own would be up to 750 messages a second from
// the one loop that must never fall behind, so they are gathered here into
// stereo batches. Every batch carries the wall-clock moment its last sample
// arrived, which is what lets the recorder line the guitar up with the backing
// (recorded by the window, on another clock) afterwards.
//
// A pure module, like frameBatcher.js, so it can be unit-tested outside the
// audio process.

/** Frames a message carries: 43 ms at 48 kHz. */
const TAKE_BATCH_FRAMES = 2048;

/**
 * @param {(chunk: { pcm: Uint8Array, frames: number, sampleRate: number, wet: boolean, endWallMs: number }) => void} emit
 *   receives each batch — `pcm` is interleaved stereo FLOAT32 in a buffer of its own
 * @param {number} [batchFrames]
 */
function createTakeBatcher(emit, batchFrames = TAKE_BATCH_FRAMES) {
  const held = new Float32Array(batchFrames * 2);
  let fill = 0;
  let rate = 0;
  let wet = false;
  /** When the last sample held arrived. */
  let heldEndMs = 0;

  function flush() {
    if (fill === 0) return;
    // A buffer of its own, exactly as long as the batch: the structured clone
    // on the way out copies a view's whole underlying buffer.
    const out = new Float32Array(fill * 2);
    out.set(held.subarray(0, fill * 2));
    const chunk = { pcm: new Uint8Array(out.buffer), frames: fill, sampleRate: rate, wet, endWallMs: heldEndMs };
    fill = 0;
    emit(chunk);
  }

  return {
    /** One block from the engine's tap. `right` is null for a mono source. */
    push(left, right, n, sampleRate, isWet, arrivedAtMs) {
      // A stream that reopened at another rate starts a batch of its own.
      if (fill > 0 && sampleRate !== rate) flush();
      rate = sampleRate;
      wet = isWet;
      let i = 0;
      while (i < n) {
        const take = Math.min(n - i, batchFrames - fill);
        for (let k = 0; k < take; k++) {
          const l = left[i + k];
          held[(fill + k) * 2] = l;
          held[(fill + k) * 2 + 1] = right ? right[i + k] : l;
        }
        fill += take;
        i += take;
        // The block's last sample arrived at arrivedAtMs; what is held ends
        // (n - i) frames before that.
        heldEndMs = arrivedAtMs - ((n - i) / sampleRate) * 1000;
        if (fill === batchFrames) flush();
      }
    },
    /** Sends what is waiting — the take is over. */
    flush,
    /** Drops what is waiting. */
    reset() {
      fill = 0;
    },
  };
}

module.exports = { createTakeBatcher, TAKE_BATCH_FRAMES };
