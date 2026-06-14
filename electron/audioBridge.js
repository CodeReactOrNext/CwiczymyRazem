// Native low-latency audio bridge (DAW-style capture) using audify → RtAudio.
// Runs in the Electron main process. Talks directly to ASIO / WASAPI drivers,
// bypassing the browser's getUserMedia + WASAPI-shared path entirely.
const { RtAudioFormat, RtAudioApi } = require("audify");
const shared = require("./rtaudio");

let isOpen = false;
let currentInfo = null;

const getRt = shared.getRt;

function listDevices() {
  const rt = getRt();
  const devices = rt.getDevices();
  let apiName = "unknown";
  try {
    const api = rt.getApi();
    apiName = RtAudioApi ? Object.keys(RtAudioApi).find((k) => RtAudioApi[k] === api) || String(api) : String(api);
  } catch { /* ignore */ }
  return {
    api: apiName,
    devices: devices.map((d, idx) => ({
      id: typeof d.id === "number" ? d.id : idx,
      name: d.name,
      inputChannels: d.inputChannels,
      outputChannels: d.outputChannels,
      isDefaultInput: !!d.isDefaultInput,
      preferredSampleRate: d.preferredSampleRate,
      sampleRates: d.sampleRates,
    })),
  };
}

/**
 * Open an input-only stream and forward each captured block to `onFrame`.
 * @param {object} opts
 * @param {number} opts.deviceId      RtAudio device id (from listDevices)
 * @param {number} [opts.channel]     which hardware input channel to capture (0-based)
 * @param {number} [opts.sampleRate]  e.g. 48000
 * @param {number} [opts.frameSize]   frames per block — smaller = lower latency (e.g. 256)
 * @param {(buf: Buffer) => void} onFrame  called with interleaved FLOAT32 mono PCM
 */
function start(opts, onFrame) {
  const rt = getRt();
  shared.closeStream(); // free any stream the amp (or a prior capture) left open
  isOpen = false;

  const deviceId = opts.deviceId;
  const device = rt.getDevices().find((d, idx) => (typeof d.id === "number" ? d.id : idx) === deviceId);
  if (!device) throw new Error(`Audio device ${deviceId} not found`);

  const sampleRate = opts.sampleRate || device.preferredSampleRate || 48000;
  const frameSize = opts.frameSize || 256;
  const channel = Math.max(0, Math.min(opts.channel || 0, Math.max(0, device.inputChannels - 1)));

  rt.openStream(
    null,                                  // no output (we only listen)
    { deviceId, nChannels: 1, firstChannel: channel }, // mono input from chosen channel
    RtAudioFormat.RTAUDIO_FLOAT32,         // matches the app's Float32 DSP path
    sampleRate,
    frameSize,
    "CwiczymyRazem-input",
    (inputBuffer) => { onFrame(inputBuffer); }, // input callback (main thread, thread-safe)
    null
  );
  rt.start();
  isOpen = true;

  // RtAudio may negotiate a different latency; report what we actually got.
  let streamLatencyFrames = 0;
  try { streamLatencyFrames = rt.getStreamLatency ? rt.getStreamLatency() : 0; } catch { /* ignore */ }

  currentInfo = {
    deviceId,
    deviceName: device.name,
    channel,
    sampleRate,
    frameSize,
    streamLatencyFrames,
    // capture latency ≈ stream latency + one block, in ms
    latencyMs: ((streamLatencyFrames + frameSize) / sampleRate) * 1000,
  };
  return currentInfo;
}

function stop() {
  shared.closeStream();
  isOpen = false;
  currentInfo = null;
}

function getStatus() {
  return { isOpen, info: currentInfo };
}

module.exports = { listDevices, start, stop, getStatus };
