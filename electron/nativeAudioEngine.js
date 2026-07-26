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
const toneStore = require("./toneStore");

/** Resolves a cabinet `irId` and/or a NAM `namModelId` in an amp params patch to
 *  actual file contents (Float32 samples / raw .nam JSON) before handing the patch
 *  to AmpChain (which stays fs/Electron-free on purpose — see ampSim.js). Skips the
 *  disk read entirely when an id hasn't actually changed, so live slider tweaks
 *  (which never include these ids) never trigger it, and re-selecting the same
 *  IR/model twice doesn't re-read it either. */
function resolveAmpPatch(patch, chain) {
  if (!patch || !chain) return patch;
  let resolved = patch;
  if ("irId" in patch && patch.irId !== chain.params.irId) {
    const irSamples = patch.irId ? toneStore.getIRSamples(patch.irId, chain.sr) : null;
    resolved = { ...resolved, irSamples };
  }
  if ("namModelId" in patch && patch.namModelId !== chain.params.namModelId) {
    const namModelJson = patch.namModelId ? toneStore.getNamModelJson(patch.namModelId) : null;
    resolved = { ...resolved, namModelJson };
  }
  return resolved;
}

let captureConsumer = null; // { requested: {deviceId, channel, sampleRate, frameSize}, onFrame }
let ampConsumer = null;     // { requested: {deviceId, channel, sampleRate, frameSize, outputDeviceId}, params }
let ampChain = null;
// What's actually open right now: { deviceId, deviceName, channel, sampleRate,
// requestedFrameSize, frameSize (actual negotiated), duplex, outDeviceId, outChannels,
// streamLatencyFrames } | null
let openShape = null;
let captureInfo = null;
let ampInfo = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Diagnostic-only latency instrumentation (AUDIO_LATENCY_DEBUG=1) ──────────
// electron/test-output-queue-latency.js measures audify's input/output hand-off
// in isolation (a bare RtAudio instance, trivial passthrough, no window). This
// hooks the same measurement into the REAL running app + REAL AmpChain DSP,
// because the isolated test can't see load from an actual open BrowserWindow/
// renderer, which the isolated test showed is NOT where audify's own overhead
// lives (~4ms there) — so if the real app measures much higher, the difference
// is coming from something specific to running inside the full app, not audify
// itself. Zero-cost when the env var isn't set: no timers, no arrays, no extra
// work on the audio callback.
const DEBUG_TIMING = !!process.env.AUDIO_LATENCY_DEBUG;
let debugPendingWrites = [];
let debugProcessMs = [];
let debugQueueDelaysMs = [];

function debugOnFrameOutput() {
  const tConsumed = process.hrtime.bigint();
  const tWrite = debugPendingWrites.shift();
  if (tWrite !== undefined) debugQueueDelaysMs.push(Number(tConsumed - tWrite) / 1e6);
}

function debugStats(arr) {
  if (arr.length < 10) return null;
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const max = Math.max(...arr);
  return `mean=${mean.toFixed(3)}ms max=${max.toFixed(3)}ms n=${n}`;
}

if (DEBUG_TIMING) {
  const timer = setInterval(() => {
    const processStats = debugStats(debugProcessMs);
    const queueStats = debugStats(debugQueueDelaysMs);
    if (processStats || queueStats) {
      console.log(
        `[audio-latency-debug] callback->write (DSP): ${processStats || "n/a"}  |  write->consumed (audify queue): ${queueStats || "n/a"}`
      );
    }
    debugProcessMs = [];
    debugQueueDelaysMs = [];
  }, 3000);
  if (timer.unref) timer.unref();
}

// Some ASIO drivers hand back an oversized "safe" buffer on the first open right
// after a stream teardown — before settling into their real low-latency path —
// instead of the small size we asked for. That's what makes latency read as fine
// one time the amp is turned on and audibly high (a few hundred ms) the next,
// with nothing else about the request having changed. Closing and reopening
// again (with a short pause so the driver fully releases the previous buffer)
// consistently gets the small buffer instead of carrying the inflated one for
// the rest of the session.
const MAX_OPEN_ATTEMPTS = 3;
const REOPEN_DELAY_MS = 150;
function isOversized(actualFrame, requestedFrameSize) {
  return actualFrame > requestedFrameSize * 2;
}

/** Opens the stream, retrying (close + short pause + reopen) while the driver
 *  keeps handing back a way-oversized buffer. Only starts the stream once it
 *  settles on an acceptable size or attempts run out, so a discarded oversized
 *  attempt never audibly starts. */
async function openStreamWithRetry(rt, outParams, inParams, sampleRate, requestedFrameSize) {
  let actualFrame;
  for (let attempt = 1; attempt <= MAX_OPEN_ATTEMPTS; attempt++) {
    actualFrame = rt.openStream(
      outParams,
      inParams,
      RtAudioFormat.RTAUDIO_FLOAT32,
      sampleRate,
      requestedFrameSize,
      "CwiczymyRazem-native",
      onInputBlock,
      DEBUG_TIMING ? debugOnFrameOutput : null
    );
    if (!isOversized(actualFrame, requestedFrameSize) || attempt === MAX_OPEN_ATTEMPTS) break;
    shared.closeStream();
    await sleep(REOPEN_DELAY_MS);
  }
  rt.start();
  return actualFrame;
}

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
  const tStart = DEBUG_TIMING ? process.hrtime.bigint() : null;

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

  if (DEBUG_TIMING) {
    const tWrite = process.hrtime.bigint();
    debugProcessMs.push(Number(tWrite - tStart) / 1e6);
    debugPendingWrites.push(tWrite);
  }
}

// ensureOpen() now awaits across retried opens (see openStreamWithRetry above),
// where previously it ran start-to-finish synchronously. Two overlapping callers
// (e.g. capture attaching while the amp's reopen is mid-retry-sleep) would
// otherwise both touch the single shared `rt` stream at once. Queue keeps calls
// serialized — each caller still gets its own resolution/rejection, only the
// underlying work is ordered.
let ensureOpenQueue = Promise.resolve();
function ensureOpen() {
  const result = ensureOpenQueue.then(ensureOpenInner);
  ensureOpenQueue = result.catch(() => {});
  return result;
}

/** Reconciles the live stream with whatever consumers are currently attached.
 *  Validates/resolves devices before touching anything, so a bad request throws
 *  without disturbing an already-running session. */
async function ensureOpenInner() {
  const desired = computeDesiredShape(); // may throw — nothing mutated yet if it does

  if (!desired) {
    shared.closeStream();
    if (DEBUG_TIMING) debugPendingWrites = []; // a closed stream will never consume these — don't let a future reopen dequeue stale timestamps
    openShape = null;
    ampChain = null;
    recomputeInfos();
    return;
  }

  const rt = shared.getRt();

  if (shapesEqual(openShape, desired) && shared.isStreamOpen()) {
    if (ampConsumer) {
      if (!ampChain) ampChain = new AmpChain(openShape.sampleRate);
      ampChain.setParams(resolveAmpPatch(ampConsumer.params || {}, ampChain));
    } else {
      ampChain = null;
    }
    recomputeInfos();
    return;
  }

  shared.closeStream();
  if (DEBUG_TIMING) debugPendingWrites = []; // same — the old queue is gone, don't dequeue stale entries against the new stream

  const outParams = desired.duplex ? { deviceId: desired.outDeviceId, nChannels: desired.outChannels, firstChannel: 0 } : null;
  const inParams = { deviceId: desired.deviceId, nChannels: 1, firstChannel: desired.channel };

  ampChain = desired.duplex ? new AmpChain(desired.sampleRate) : null;
  if (ampChain && ampConsumer) ampChain.setParams(resolveAmpPatch(ampConsumer.params || {}, ampChain));

  const actualFrame = await openStreamWithRetry(rt, outParams, inParams, desired.sampleRate, desired.requestedFrameSize);

  let streamLatencyFrames = 0;
  try { streamLatencyFrames = rt.getStreamLatency ? rt.getStreamLatency() : 0; } catch { /* ignore */ }

  openShape = { ...desired, frameSize: actualFrame || desired.requestedFrameSize, streamLatencyFrames };
  recomputeInfos();
}

async function attachCapture(opts, onFrame) {
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
    await ensureOpen();
  } catch (err) {
    captureConsumer = null;
    throw err;
  }
  return captureInfo;
}

async function detachCapture() {
  captureConsumer = null;
  try { await ensureOpen(); } catch { /* best-effort reconcile of whatever's left attached */ }
}

function getCaptureStatus() {
  return { isOpen: !!captureConsumer, info: captureInfo };
}

async function attachAmp(opts = {}) {
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
    await ensureOpen();
  } catch (err) {
    ampConsumer = null;
    throw err;
  }
  return ampInfo;
}

function updateAmpParams(params) {
  if (ampConsumer) ampConsumer.params = { ...ampConsumer.params, ...(params || {}) };
  if (ampChain) ampChain.setParams(resolveAmpPatch(params || {}, ampChain));
  if (ampInfo && ampChain) ampInfo.params = ampChain.params;
  return ampInfo;
}

async function detachAmp() {
  ampConsumer = null;
  try { await ensureOpen(); } catch { /* best-effort reconcile of whatever's left attached */ }
}

function getAmpStatus() {
  return { isOpen: !!ampConsumer, info: ampInfo };
}

module.exports = {
  listDevices,
  attachCapture, detachCapture, getCaptureStatus,
  attachAmp, updateAmpParams, detachAmp, getAmpStatus,
};
