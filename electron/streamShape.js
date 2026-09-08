// Which consumer's requested block size the one shared ASIO/WASAPI stream opens
// with — see nativeAudioEngine.js's computeDesiredShape. Kept as a pure module so
// the rule can be unit-tested: the engine itself can't be required outside the
// Electron audio process (audify loads a native binary and probes drivers at
// module load).
const DEFAULT_FRAME_SIZE = 256;

/**
 * The amp's request wins whenever the amp is attached: the block size IS the
 * amp's monitoring latency (a user-facing 64/128/256 choice in Tone Studio),
 * while note-detection capture accumulates blocks into fixed 2048-sample
 * analysis windows and behaves identically at any block size. Capture's own
 * request only applies when it runs alone. This is what makes attaching or
 * detaching capture onto a running amp stream a no-reopen no-op — the opposite
 * ("capture wins") forced a close + reopen of the ASIO stream on every Pitch
 * Detect toggle during a live amp session, which drivers routinely refuse right
 * after a close.
 * @param {{frameSize?: number} | null | undefined} captureRequested
 * @param {{frameSize?: number} | null | undefined} ampRequested
 * @returns {number}
 */
function pickRequestedFrameSize(captureRequested, ampRequested) {
  if (ampRequested && ampRequested.frameSize > 0) return ampRequested.frameSize;
  if (captureRequested && captureRequested.frameSize > 0) return captureRequested.frameSize;
  return DEFAULT_FRAME_SIZE;
}

module.exports = { pickRequestedFrameSize, DEFAULT_FRAME_SIZE };
