// Note detection next to the capture, instead of in the window.
//
// The window used to get every captured block and run the detectors itself.
// Even with those in a worker, each block was a message on the thread that
// draws the practice session — hundreds a second. Here the blocks stop in the
// main process: a worker thread cuts them into analysis windows, runs the
// detectors (the web app's own, bundled — see scripts/buildGuitarDspEngine.mjs)
// and the window gets one message per window, ~23 a second, with the readings
// and the window's samples.
//
// A thread of the MAIN process on purpose, not of the audio process: that one's
// event loop carries the amp's audio, and nothing may compete with it there
// (see audioEngineHost.js).
//
// Everything here is optional. start() resolves false — and the caller keeps
// sending blocks to the window, as before — when the web app was built with
// other detectors than this shell ships (the hash), or the thread can't start.
const path = require("path");
const { Worker } = require("worker_threads");

/** A thread that hasn't built its detectors by now is given up on. */
const READY_TIMEOUT_MS = 5000;

/** The running thread and whether its detectors are built; null when off. */
let active = null;

function shippedHash() {
  try {
    return require("./generated/guitarDspEngineHash");
  } catch {
    return null;
  }
}

function dispose(entry) {
  if (active === entry) active = null;
  // Whoever is still waiting for it to start gets its answer now.
  if (entry.cancel) entry.cancel();
  entry.worker.removeAllListeners();
  // A thread that fails while it is being stopped has nobody left to tell.
  entry.worker.on("error", () => {});
  entry.worker.terminate().catch(() => {});
}

/**
 * @param {object} opts
 * @param {string} opts.hash  the detectors the web app was built with
 * @param {number} opts.sampleRate
 * @param {number} opts.blockFrames  the driver's block size (0 = unknown)
 * @param {{gain: number, bass: boolean, strum: boolean}} opts.settings
 * @param {(readings: object) => void} opts.onMessage  one per analysis window
 * @param {() => void} opts.onLost  the thread died after it had started
 * @returns {Promise<boolean>} whether the detectors run here now
 */
function start({ hash, sampleRate, blockFrames, settings, onMessage, onLost }) {
  stop();
  if (!hash || hash !== shippedHash()) return Promise.resolve(false);
  let worker;
  try {
    worker = new Worker(path.join(__dirname, "captureDspWorker.js"));
  } catch {
    return Promise.resolve(false);
  }
  const entry = { worker, ready: false };
  active = entry;

  return new Promise((resolve) => {
    let settled = false;
    const settle = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const fail = () => {
      const wasRunning = entry.ready && active === entry;
      dispose(entry);
      settle(false);
      if (wasRunning) onLost();
    };
    const timer = setTimeout(fail, READY_TIMEOUT_MS);
    entry.cancel = () => settle(false);

    worker.on("error", fail);
    worker.on("exit", fail);
    worker.on("message", (message) => {
      if (message.type === "readings") {
        if (active === entry) onMessage(message);
        return;
      }
      if (message.type === "failed") { fail(); return; }
      if (message.type !== "ready") return;
      // Stopped, or replaced by a newer start(), while the detectors were built.
      if (active !== entry) { settle(false); return; }
      entry.ready = true;
      settle(true);
    });
    worker.postMessage({
      type: "init",
      init: {
        sampleRate,
        blockFrames: blockFrames || 0,
        gain: settings && typeof settings.gain === "number" ? settings.gain : 3,
        bass: !!(settings && settings.bass),
        strum: !!(settings && settings.strum),
      },
    });
  });
}

/**
 * Hands a captured block to the detectors. False when they aren't running —
 * the block is then the caller's to send on.
 * @param {Uint8Array} buf  FLOAT32 mono PCM
 * @param {number} [at]  when the block arrived (Date.now()) — now, unless given
 */
function push(buf, at = Date.now()) {
  const entry = active;
  if (!entry || !entry.ready) return false;
  // A buffer of its own, so it can be handed over rather than copied again —
  // and so its first sample sits at the buffer's start.
  const bytes = new Uint8Array(buf);
  entry.worker.postMessage({ type: "block", bytes, at }, [bytes.buffer]);
  return true;
}

/** @param {{gain?: number, bass?: boolean, strum?: boolean}} patch */
function configure(patch) {
  if (active && patch && typeof patch === "object") active.worker.postMessage({ type: "config", patch });
}

function stop() {
  if (active) dispose(active);
}

module.exports = { start, push, configure, stop, shippedHash };
