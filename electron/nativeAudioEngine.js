// Coordinates the single shared ASIO/WASAPI stream (see ./rtaudio) between the two
// features that want it: note-detection capture (audioBridge.js) and the amp
// simulator (ampSim.js). ASIO allows only one open stream on the device — previously
// each feature's start() unconditionally closed whatever the other had open, so
// turning the amp on permanently killed capture (and vice versa) for the rest of the
// session. Here both attach as "consumers" of one duplex stream: capture always gets
// forwarded the raw input block, and the amp DSP chain runs on the same block and
// writes the output — so both work at once. The stream only reopens when its actual
// shape (device/channel/rate/frameSize/duplex) needs to change, not on every
// attach/detach — attaching a second consumer onto an already-correctly-shaped
// stream is free.
const { RtAudioFormat, RtAudioApi } = require("audify");
const { AmpChain } = require("./ampSim");
const shared = require("./rtaudio");

let captureConsumer = null; // { requested: {deviceId, channel, sampleRate, frameSize}, onFrame }
let ampConsumer = null;     // { requested: {deviceId, channel, sampleRate, frameSize, outputDeviceId}, params }
let ampChain = null;
// What's actually open right now: { deviceId, deviceName, channel, sampleRate,
// requestedFrameSize, frameSize (actual negotiated), duplex, outDeviceId, outChannels,
// streamLatencyFrames } | null
let openShape = null;
let captureInfo = null;
let ampInfo = null;

function listDevices() {
  const rt = shared.getRt();
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

// Matches audioBridge.js's original lookup (falls back to array index when a device
// has no numeric id) — capture's device match stays strict either way.
function findDeviceStrict(devices, deviceId) {
  return devices.find((d, idx) => (typeof d.id === "number" ? d.id : idx) === deviceId);
}

/** Resolves the one stream shape that satisfies whichever consumers are attached.
 *  Throws (without touching the live stream) if a requested device can't be found —
 *  callers must resolve/validate before mutating any state. */
function computeDesiredShape() {
  if (!captureConsumer && !ampConsumer) return null;

  const rt = shared.getRt();
  const devices = rt.getDevices();

  // Capture wins the shared input config when both are attached — it's the
  // timing-sensitive side. In practice both already agree (same persisted device).
  let inDev;
  let primary;
  if (captureConsumer) {
    primary = captureConsumer.requested;
    inDev = findDeviceStrict(devices, primary.deviceId);
    if (!inDev) throw new Error(`Audio device ${primary.deviceId} not found`);
  } else {
    primary = ampConsumer.requested;
    // Amp's original fallback chain (no idx-fallback matching — matches ampSim.js as it was).
    inDev =
      devices.find((d) => d.id === primary.deviceId && d.inputChannels > 0) ||
      devices.find((d) => d.isDefaultInput && d.inputChannels > 0) ||
      devices.find((d) => d.inputChannels > 0);
    if (!inDev) throw new Error("No suitable input device for amp sim");
  }

  const sampleRate = primary.sampleRate || inDev.preferredSampleRate || 48000;
  const requestedFrameSize = primary.frameSize || 256;
  const channel = Math.max(0, Math.min(primary.channel || 0, Math.max(0, inDev.inputChannels - 1)));

  const duplex = !!ampConsumer;
  let outDeviceId = null;
  let outChannels = 0;

  if (duplex) {
    const api = (() => { try { return rt.getApi(); } catch { return ""; } })();
    const isAsio = /asio/i.test(api);
    const requestedOutId = ampConsumer.requested.outputDeviceId;

    // ASIO is one driver for both directions → output = input device. WASAPI/CoreAudio/DS:
    // input (mic/interface) has no output, so route to the default render device
    // (or the explicitly chosen output) instead. (verbatim from ampSim.js)
    let outDev;
    if (isAsio) {
      outDev = inDev;
    } else if (requestedOutId != null) {
      outDev = devices.find((d) => d.id === requestedOutId && d.outputChannels > 0);
    }
    if (!outDev) {
      const defOutId = (() => { try { return rt.getDefaultOutputDevice(); } catch { return undefined; } })();
      outDev =
        devices.find((d) => d.id === defOutId && d.outputChannels > 0) ||
        devices.find((d) => d.outputChannels > 0);
    }
    if (!outDev) throw new Error("No output device available for amp monitoring");
    outDeviceId = outDev.id;
    outChannels = Math.min(2, outDev.outputChannels || 2) || 1;
  }

  return { deviceId: inDev.id, deviceName: inDev.name, channel, sampleRate, requestedFrameSize, duplex, outDeviceId, outChannels };
}

function shapesEqual(open, desired) {
  if (!open || !desired) return false;
  return (
    open.deviceId === desired.deviceId &&
    open.channel === desired.channel &&
    open.sampleRate === desired.sampleRate &&
    open.requestedFrameSize === desired.requestedFrameSize &&
    open.duplex === desired.duplex &&
    open.outDeviceId === desired.outDeviceId &&
    open.outChannels === desired.outChannels
  );
}

function recomputeInfos() {
  captureInfo = !captureConsumer || !openShape ? null : {
    deviceId: openShape.deviceId,
    deviceName: openShape.deviceName,
    channel: openShape.channel,
    sampleRate: openShape.sampleRate,
    frameSize: openShape.frameSize,
    streamLatencyFrames: openShape.streamLatencyFrames,
    // capture latency ≈ stream latency + one block, in ms
    latencyMs: ((openShape.streamLatencyFrames + openShape.frameSize) / openShape.sampleRate) * 1000,
  };

  ampInfo = !ampConsumer || !openShape ? null : {
    deviceName: openShape.deviceName,
    sampleRate: openShape.sampleRate,
    frameSize: openShape.frameSize,
    outChannels: openShape.outChannels,
    inChannel: openShape.channel,
    roundTripMs: ((openShape.streamLatencyFrames + openShape.frameSize * 2) / openShape.sampleRate) * 1000,
    params: ampChain ? ampChain.params : ampConsumer.params,
  };
}

/** Shared input callback for the one open stream — forwards to capture, runs the amp
 *  DSP chain and writes output (or silence, if amp isn't attached but the stream is
 *  duplex anyway) when duplex. Reads live module state on every call so attach/detach
 *  that doesn't change the stream's shape needs no new callback. */
function onInputBlock(inputBuffer) {
  if (captureConsumer) {
    try { captureConsumer.onFrame(inputBuffer); } catch { /* isolate: a bad consumer must not break amp output */ }
  }

  if (!openShape || !openShape.duplex) return;

  const rt = shared.getRt();
  const n = Math.floor(inputBuffer.byteLength / 4);
  let inF;
  if (inputBuffer.byteOffset % 4 === 0) {
    inF = new Float32Array(inputBuffer.buffer, inputBuffer.byteOffset, n);
  } else {
    const c = Buffer.from(inputBuffer); inF = new Float32Array(c.buffer, c.byteOffset, n);
  }

  const outChannels = openShape.outChannels;
  const out = new Float32Array(n * outChannels); // zero-filled = silence by default

  const activeChain = ampChain;
  if (ampConsumer && activeChain) {
    for (let i = 0; i < n; i++) {
      const y = activeChain.process(inF[i]);
      for (let ch = 0; ch < outChannels; ch++) out[i * outChannels + ch] = y;
    }
  }

  try { rt.write(Buffer.from(out.buffer, out.byteOffset, out.byteLength)); }
  catch { /* stream closing — drop this block */ }
}

/** Reconciles the live stream with whatever consumers are currently attached.
 *  Validates/resolves devices before touching anything, so a bad request throws
 *  without disturbing an already-running session. */
function ensureOpen() {
  const desired = computeDesiredShape(); // may throw — nothing mutated yet if it does

  if (!desired) {
    shared.closeStream();
    openShape = null;
    ampChain = null;
    recomputeInfos();
    return;
  }

  const rt = shared.getRt();

  if (shapesEqual(openShape, desired) && shared.isStreamOpen()) {
    if (ampConsumer) {
      if (!ampChain) ampChain = new AmpChain(openShape.sampleRate);
      ampChain.setParams(ampConsumer.params || {});
    } else {
      ampChain = null;
    }
    recomputeInfos();
    return;
  }

  shared.closeStream();

  const outParams = desired.duplex ? { deviceId: desired.outDeviceId, nChannels: desired.outChannels, firstChannel: 0 } : null;
  const inParams = { deviceId: desired.deviceId, nChannels: 1, firstChannel: desired.channel };

  ampChain = desired.duplex ? new AmpChain(desired.sampleRate) : null;
  if (ampChain && ampConsumer) ampChain.setParams(ampConsumer.params || {});

  const actualFrame = rt.openStream(
    outParams,
    inParams,
    RtAudioFormat.RTAUDIO_FLOAT32,
    desired.sampleRate,
    desired.requestedFrameSize,
    "CwiczymyRazem-native",
    onInputBlock,
    null
  );
  rt.start();

  let streamLatencyFrames = 0;
  try { streamLatencyFrames = rt.getStreamLatency ? rt.getStreamLatency() : 0; } catch { /* ignore */ }

  openShape = { ...desired, frameSize: actualFrame || desired.requestedFrameSize, streamLatencyFrames };
  recomputeInfos();
}

function attachCapture(opts, onFrame) {
  captureConsumer = {
    requested: {
      deviceId: opts.deviceId,
      channel: opts.channel || 0,
      sampleRate: opts.sampleRate,
      frameSize: opts.frameSize || 256,
    },
    onFrame,
  };
  try {
    ensureOpen();
  } catch (err) {
    captureConsumer = null;
    throw err;
  }
  return captureInfo;
}

function detachCapture() {
  captureConsumer = null;
  try { ensureOpen(); } catch { /* best-effort reconcile of whatever's left attached */ }
}

function getCaptureStatus() {
  return { isOpen: !!captureConsumer, info: captureInfo };
}

function attachAmp(opts = {}) {
  ampConsumer = {
    requested: {
      deviceId: opts.deviceId,
      channel: opts.channel || 0,
      sampleRate: opts.sampleRate,
      frameSize: opts.frameSize || 256,
      outputDeviceId: opts.outputDeviceId,
    },
    params: opts.params || {},
  };
  try {
    ensureOpen();
  } catch (err) {
    ampConsumer = null;
    throw err;
  }
  return ampInfo;
}

function updateAmpParams(params) {
  if (ampConsumer) ampConsumer.params = { ...ampConsumer.params, ...(params || {}) };
  if (ampChain) ampChain.setParams(params || {});
  if (ampInfo && ampChain) ampInfo.params = ampChain.params;
  return ampInfo;
}

function detachAmp() {
  ampConsumer = null;
  try { ensureOpen(); } catch { /* best-effort reconcile of whatever's left attached */ }
}

function getAmpStatus() {
  return { isOpen: !!ampConsumer, info: ampInfo };
}

module.exports = {
  listDevices,
  attachCapture, detachCapture, getCaptureStatus,
  attachAmp, updateAmpParams, detachAmp, getAmpStatus,
};
