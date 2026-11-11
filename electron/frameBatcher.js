// Captured blocks on their way to the renderer, several to a message.
//
// Every block crosses two process boundaries (engine → main → renderer), and at
// the amp's 64-frame buffer that is 750 messages a second landing on the thread
// that draws the practice session. Note detection reads 2048-sample windows and
// has no use for blocks that small, so short blocks are sent together: a few
// hundred messages a second fewer, for at most a few ms of wait on a reading
// (the renderer stamps each window as if its blocks had arrived one by one —
// see nativeCaptureWindows.ts — so attack times are unchanged).
//
// A pure module, like streamShape.js, so it can be unit-tested outside the
// audio process.

/** Frames a message carries at least: 5.3 ms at 48 kHz. A 256-frame stream
 *  (capture on its own) is sent as it always was, one block a message. */
const BATCH_FRAMES = 256;
const BYTES_PER_FRAME = 4; // FLOAT32 mono

/**
 * @param {(buf: Uint8Array) => void} emit  receives each message's bytes
 * @param {number} [batchFrames]
 * @returns {{ push(buf: Uint8Array): void, reset(): void }}
 */
function createFrameBatcher(emit, batchFrames = BATCH_FRAMES) {
  const targetBytes = batchFrames * BYTES_PER_FRAME;
  /** Blocks waiting for the rest of their message. */
  let held = [];
  let heldBytes = 0;

  return {
    push(buf) {
      if (heldBytes === 0 && buf.length >= targetBytes) {
        emit(buf);
        return;
      }
      // The block's buffer belongs to the engine, which may fill it again
      // before the message goes out; what waits here is a copy.
      held.push(new Uint8Array(buf));
      heldBytes += buf.length;
      if (heldBytes < targetBytes) return;
      // A buffer of its own, exactly as long as the message: the structured
      // clone on the way out copies a view's whole underlying buffer.
      const out = new Uint8Array(heldBytes);
      let offset = 0;
      for (const block of held) {
        out.set(block, offset);
        offset += block.length;
      }
      held = [];
      heldBytes = 0;
      emit(out);
    },
    /** Drops what is waiting — the stream it came from is gone. */
    reset() {
      held = [];
      heldBytes = 0;
    },
  };
}

module.exports = { createFrameBatcher, BATCH_FRAMES };
