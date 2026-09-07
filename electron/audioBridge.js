// Native low-latency audio bridge (DAW-style capture) using audify → RtAudio.
// Talks directly to ASIO / WASAPI drivers, bypassing the browser's getUserMedia +
// WASAPI-shared path entirely.
//
// The actual stream lives in ./nativeAudioEngine, which runs inside a dedicated
// audio process (see ./audioEngineHost for why it's no longer in the Electron main
// process) and is shared with the amp simulator (ampSim.js) so both can run at once
// on ASIO's single allowed stream — this module is a thin adapter presenting the
// same listDevices/start/stop/getStatus API it always has, so callers
// (electron/main.js) don't need to change. Everything is async now that it
// crosses a process boundary.
const engine = require("./audioEngineHost");

function listDevices() {
  return engine.listDevices();
}

/**
 * Open (or attach to) the shared stream and forward each captured block to `onFrame`.
 * @param {object} opts
 * @param {number} opts.deviceId      RtAudio device id (from listDevices)
 * @param {number} [opts.channel]     which hardware input channel to capture (0-based)
 * @param {number} [opts.sampleRate]  e.g. 48000
 * @param {number} [opts.frameSize]   frames per block — smaller = lower latency (e.g. 256)
 * @param {(buf: Uint8Array) => void} onFrame  called with interleaved FLOAT32 mono PCM
 */
function start(opts, onFrame) {
  return engine.attachCapture(opts, onFrame);
}

function stop() {
  return engine.detachCapture();
}

function getStatus() {
  return engine.getCaptureStatus();
}

module.exports = { listDevices, start, stop, getStatus };
