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
const { RtAudioFormat, RtAudioApi, RtAudioErrorType } = require("audify");
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
// Some ASIO wrappers (observed with "Realtek ASIO") report a preferredSampleRate
// that they then refuse to actually switch to — probeDeviceOpen fails instead of
// negotiating. Once we've found a rate a given device will actually open at,
// remember it (per device id) so we ask for that rate directly next time instead
// of re-triggering the same failed attempt + retry dance.
const negotiatedSampleRateByDevice = new Map();
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

const MAX_SAMPLE_RATE_CANDIDATES = 5;

/** Builds an ordered list of sample rates to try opening at: the desired rate
 *  first, then the usual suspects, then whatever else the driver claims to
 *  support. Exists because some ASIO drivers report a rate as supported
 *  (preferredSampleRate, or even in their own `sampleRates` list) and then
 *  fail probeDeviceOpen for that exact rate — the only reliable way to know
 *  what a given driver will actually open at is to try. */
function buildSampleRateCandidates(desiredRate, supportedRates) {
  const ordered = [desiredRate, 44100, 48000, ...(supportedRates || [])];
  const candidates = [];
  for (const rate of ordered) {
    if (rate && !candidates.includes(rate)) candidates.push(rate);
    if (candidates.length >= MAX_SAMPLE_RATE_CANDIDATES) break;
  }
  return candidates;
}

/** Opens the stream, first across sample-rate candidates (falling through to the
 *  next one if the driver throws opening at the previous one — see
 *  buildSampleRateCandidates), then within the winning rate retrying (close +
 *  short pause + reopen) while the driver keeps handing back a way-oversized
 *  buffer. Only starts the stream once it settles on an acceptable size or
 *  attempts run out, so a discarded oversized attempt never audibly starts. */
async function openStreamWithRetry(rt, outParams, inParams, sampleRateCandidates, requestedFrameSize) {
  let lastErr;
  for (const sampleRate of sampleRateCandidates) {
    let actualFrame;
    try {
      for (let attempt = 1; attempt <= MAX_OPEN_ATTEMPTS; attempt++) {
        actualFrame = rt.openStream(
          outParams,
          inParams,
          RtAudioFormat.RTAUDIO_FLOAT32,
          sampleRate,
          requestedFrameSize,
          "CwiczymyRazem-native",
          onInputBlock,
          DEBUG_TIMING ? debugOnFrameOutput : null,
          0,
          onStreamError
        );
        if (!isOversized(actualFrame, requestedFrameSize) || attempt === MAX_OPEN_ATTEMPTS) break;
        shared.closeStream();
        await sleep(REOPEN_DELAY_MS);
      }
    } catch (err) {
      lastErr = err;
      shared.closeStream(); // defensive: make sure a failed open never blocks the next candidate's attempt
      continue;
    }
    if (isOversized(actualFrame, requestedFrameSize)) {
      // All MAX_OPEN_ATTEMPTS retries came back oversized — the driver is stuck
      // in its "safe" mode for this open and we're giving up rather than retry
      // forever. This is exactly what makes latency feel random session-to-
      // session with nothing else changed: usually a retry or two shakes the
      // driver loose, but not always, and the caller only ever sees the final
      // (possibly still-oversized) frameSize/roundTripMs — silently. Log it so
      // "why does it feel different this time" has a real answer to check
      // against, instead of being invisible.
      console.warn(
        `[audio] Stream opened with an oversized buffer after ${MAX_OPEN_ATTEMPTS} attempts: got ${actualFrame} frames, asked for ${requestedFrameSize} — this session's latency will be noticeably higher than usual until the amp is restarted (and may or may not shake loose next time).`
      );
    }
    rt.start();
    return { frame: actualFrame, sampleRate };
  }
  throw lastErr;
}

// ── Connection loss / hot-plug recovery ──────────────────────────────────────
// RtAudio's own ASIO backend closes the stream out from under us, from an internal
// thread, whenever: the driver's control panel buffer/sample rate is changed while
// the stream is open, the interface is physically disconnected, or (in practice) a
// laptop resumes from sleep with a USB interface that came back in a different state
// (see vendor/rtaudio/RtAudio.cpp's asioMessages/sampleRateChanged → asioStopStream →
// closeStream()). None of that reaches our onInputBlock callback — the only way to
// notice is the errorCallback wired into openStreamWithRetry below (for the cases
// RtAudio does surface one) and the periodic isStreamOpen() health check further down
// (for when it just closes silently, which is what ASIO actually does above).
const RECOVERY_DELAYS_MS = [300, 800, 2000, 5000];
const MAX_RECOVERY_ATTEMPTS = 6; // beyond this, stop retrying and tell the user instead

let connectionListener = null; // single BrowserWindow, same shape as onOverload below
function onConnectionIssue(fn) {
  connectionListener = fn;
}
function notifyConnectionIssue(info) {
  try { connectionListener?.(info); } catch { /* ignore */ }
}

let devicesChangedListener = null;
function onDevicesChanged(fn) {
  devicesChangedListener = fn;
}

let recoveryTimer = null;
let recoveryAttempt = 0;
// Stops the health poll from re-triggering a "lost" notification every tick forever
// after MAX_RECOVERY_ATTEMPTS gives up — otherwise a genuinely-gone device (user
// closed the interface on purpose) would spam recovery cycles indefinitely. Cleared
// by whatever gives a reopen a real chance of succeeding: a fresh attach, the device
// list actually changing (hot-plug), or a resume-from-sleep.
let recoveryGaveUp = false;

/** ASIO drivers only allow one client — the most common real cause of an open
 *  failure is something else (a DAW, Discord/OBS set to ASIO) already holding the
 *  device, but RtAudio doesn't give us a distinguishable error code for that on
 *  Windows, so this is a best-effort hint rather than a definitive diagnosis. */
function decorateOpenError(err) {
  try {
    if (err && /asio/i.test(shared.getRt().getApi())) {
      err.message = `${err.message} — if another app (a DAW, Discord, OBS, ...) has this ASIO device open, close it and try again.`;
    }
  } catch { /* best-effort hint only */ }
  return err;
}

/** Debounced to one recovery cycle at a time. Each attempt is just a normal
 *  ensureOpen() — computeDesiredShape() re-resolves the device from a fresh
 *  getDevices() every call, so a replugged/rebooted interface is picked up for
 *  free, and a still-missing one fails exactly like a first attach would. */
function scheduleRecovery(reason) {
  if (recoveryTimer || recoveryGaveUp) return; // already scheduled/in flight, or already gave up
  if (!captureConsumer && !ampConsumer) return; // nothing to recover for

  recoveryAttempt++;
  notifyConnectionIssue({
    status: recoveryAttempt === 1 ? "lost" : "retrying",
    message: reason,
    attempt: recoveryAttempt,
  });

  if (recoveryAttempt > MAX_RECOVERY_ATTEMPTS) {
    recoveryAttempt = 0;
    recoveryGaveUp = true;
    notifyConnectionIssue({ status: "failed", message: decorateOpenError(new Error(reason || "Audio stream lost")).message });
    return;
  }

  const delay = RECOVERY_DELAYS_MS[Math.min(recoveryAttempt - 1, RECOVERY_DELAYS_MS.length - 1)];
  recoveryTimer = setTimeout(async () => {
    recoveryTimer = null;
    try { await ensureOpen(); } catch { /* checked via isStreamOpen() below either way */ }
    if (shared.isStreamOpen()) {
      recoveryAttempt = 0;
      notifyConnectionIssue({ status: "recovered" });
    } else {
      scheduleRecovery(reason);
    }
  }, delay);
}

/** Called from main.js on Electron's powerMonitor "resume". A USB interface commonly
 *  comes back in a state isStreamOpen() still (wrongly) reports as fine, so this forces
 *  a clean close+reopen unconditionally instead of waiting for the health poll to notice. */
function recoverAfterResume() {
  if (!captureConsumer && !ampConsumer) return;
  recoveryGaveUp = false;
  shared.closeStream();
  scheduleRecovery("System resumed from sleep");
}

function devicesKey(devices) {
  return devices.map((d) => `${d.id}:${d.name}:${d.inputChannels}:${d.outputChannels}`).join("|");
}

let lastDevicesKey = null;
const HEALTH_POLL_MS = 2000;
const healthPollTimer = setInterval(() => {
  shared.maybeUpgradeToAsio();

  try {
    const key = devicesKey(shared.getRt().getDevices());
    if (lastDevicesKey !== null && key !== lastDevicesKey) {
      recoveryGaveUp = false; // device list changed — worth another shot even after giving up
      try { devicesChangedListener?.(); } catch { /* ignore */ }
    }
    lastDevicesKey = key;
  } catch { /* device enumeration itself failing isn't fatal here */ }

  // openShape says the stream should be open, but it isn't anymore — RtAudio closed
  // it out from under us (see comment above) without ever reaching our error callback.
  if (openShape && (captureConsumer || ampConsumer) && !shared.isStreamOpen()) {
    scheduleRecovery("Audio stream closed unexpectedly (device disconnected or driver reset)");
  }
}, HEALTH_POLL_MS);
if (healthPollTimer.unref) healthPollTimer.unref();

function onStreamError(type, msg) {
  if (type === RtAudioErrorType.WARNING || type === RtAudioErrorType.DEBUG_WARNING) return;
  console.warn(`[audio] RtAudio error (type=${type}): ${msg}`);
  scheduleRecovery(msg);
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
      isDefaultOutput: !!d.isDefaultOutput,
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

  const sampleRate =
    primary.sampleRate || negotiatedSampleRateByDevice.get(inDev.id) || inDev.preferredSampleRate || 48000;
  const requestedFrameSize = primary.frameSize || 256;
  const channel = Math.max(0, Math.min(primary.channel || 0, Math.max(0, inDev.inputChannels - 1)));

  const duplex = !!ampConsumer;
  let outDeviceId = null;
  let outDeviceName = null;
  let outFirstChannel = 0;
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
    outDeviceName = outDev.name;
    outFirstChannel = Math.max(0, Math.min(ampConsumer.requested.outputChannel || 0, Math.max(0, (outDev.outputChannels || 1) - 1)));
    outChannels = Math.min(2, Math.max(1, (outDev.outputChannels || 2) - outFirstChannel));
  }

  return {
    deviceId: inDev.id,
    deviceName: inDev.name,
    channel,
    sampleRate,
    sampleRates: inDev.sampleRates,
    requestedFrameSize,
    duplex,
    outDeviceId,
    outDeviceName,
    outFirstChannel,
    outChannels,
  };
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
    open.outFirstChannel === desired.outFirstChannel &&
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
    outDeviceName: openShape.outDeviceName,
    sampleRate: openShape.sampleRate,
    frameSize: openShape.frameSize,
    outChannels: openShape.outChannels,
    outFirstChannel: openShape.outFirstChannel,
    inChannel: openShape.channel,
    roundTripMs: ((openShape.streamLatencyFrames + openShape.frameSize * 2) / openShape.sampleRate) * 1000,
    params: ampChain ? ampChain.params : ampConsumer.params,
  };
}

// Reused output block for onInputBlock, keyed by (n, outChannels) — avoids a
// fresh Float32Array + Buffer allocation on every single callback (750+/sec at
// a 64-sample buffer). Those were previously garbage the very next callback;
// harmless individually, but at that rate they add real GC churn to the same
// process that's also running Chromium/IPC/rendering work, which shows up as
// exactly the kind of sporadic multi-ms callback spike the overrun watchdog
// below flags — indistinguishable from DSP being slow unless you stop
// allocating and check whether the spikes go away.
let outBufCache = { n: 0, outChannels: 0, out: null, outBytes: null };
function getOutBuffer(n, outChannels) {
  if (outBufCache.n !== n || outBufCache.outChannels !== outChannels) {
    const out = new Float32Array(n * outChannels);
    outBufCache = { n, outChannels, out, outBytes: Buffer.from(out.buffer, out.byteOffset, out.byteLength) };
  } else {
    outBufCache.out.fill(0);
  }
  return outBufCache;
}

// Overrun watchdog: a block whose DSP work (e.g. a heavy NAM model) takes
// longer than its own real-time budget makes rt.write()'s output queue fall
// further behind on every such block — and it never catches back up on its
// own (only a stream reopen or the namEnabled-off flush in updateAmpParams
// clears it). This is always-on (not gated behind AUDIO_LATENCY_DEBUG) because
// it's just two hrtime reads + a comparison — negligible next to the DSP work
// already happening in this callback — and a silently-growing perceived
// latency with no console trace is much worse to debug than one log line.
const OVERLOAD_WARN_INTERVAL_MS = 2000;
let lastOverloadWarnAt = 0;

// Bounded auto-recovery: a single slow block (JIT warmup, a GC pause) isn't
// worth an audible glitch to fix — it'll be reabsorbed if the model has any
// real-time headroom at all. But a client on hardware too weak for their
// loaded model would otherwise drift further behind forever with nothing but
// a console warning nobody sees. Track net drift (over budget adds, under
// budget forgives) and only flush the queue once it crosses a threshold
// clearly past normal jitter — trading one small click for capping how much
// latency this stream can ever silently accumulate.
const MAX_DRIFT_MS = 80;
let driftMs = 0;

// main.js registers this to forward recovery events to the renderer (a console
// warning is invisible to a real client) — kept as a plain settable callback
// rather than a full EventEmitter since there's only ever one subscriber (the
// single BrowserWindow) and one event.
let overloadListener = null;
function onOverload(fn) {
  overloadListener = fn;
}

/** Shared input callback for the one open stream — forwards to capture, runs the amp
 *  DSP chain and writes output (or silence, if amp isn't attached but the stream is
 *  duplex anyway) when duplex. Reads live module state on every call so attach/detach
 *  that doesn't change the stream's shape needs no new callback. */
function onInputBlock(inputBuffer) {
  const tStart = process.hrtime.bigint();

  if (captureConsumer) {
    try { captureConsumer.onFrame(inputBuffer); } catch { /* isolate: a bad consumer must not break amp output */ }
  }
  const tCapture = process.hrtime.bigint();

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
  const { out, outBytes } = getOutBuffer(n, outChannels); // .out zero-filled = silence by default

  const activeChain = ampChain;
  if (ampConsumer && activeChain) {
    for (let i = 0; i < n; i++) {
      const y = activeChain.process(inF[i]);
      for (let ch = 0; ch < outChannels; ch++) out[i * outChannels + ch] = y;
    }
  }
  const tDsp = process.hrtime.bigint();

  try { rt.write(outBytes); }
  catch { /* stream closing — drop this block */ }

  const tWrite = process.hrtime.bigint();
  const elapsedMs = Number(tWrite - tStart) / 1e6;
  const budgetMs = (n / openShape.sampleRate) * 1000;
  const now = Date.now();
  if (elapsedMs > budgetMs * 1.5 && now - lastOverloadWarnAt > OVERLOAD_WARN_INTERVAL_MS) {
    // Split so a future overrun tells us WHERE the time went instead of just
    // that it went somewhere: captureMs is note-detection (aubio) forwarding,
    // dspMs is our own per-sample chain (incl. NAM), writeMs is audify's
    // native write() — which synchronously memcpy's + locks a mutex against
    // the real-time audio thread (see node_modules/audify/src/rt_audio.cpp),
    // so it's a real, separate place time can go missing that isn't "our" DSP.
    const captureMs = Number(tCapture - tStart) / 1e6;
    const dspMs = Number(tDsp - tCapture) / 1e6;
    const writeMs = Number(tWrite - tDsp) / 1e6;
    console.warn(
      `[audio] Block overrun: total ${elapsedMs.toFixed(2)}ms for a ${budgetMs.toFixed(2)}ms block (${(elapsedMs / budgetMs).toFixed(1)}x budget) — capture=${captureMs.toFixed(2)}ms dsp=${dspMs.toFixed(2)}ms write=${writeMs.toFixed(2)}ms — output is falling behind real time.`
    );
    lastOverloadWarnAt = now;
  }

  driftMs = Math.max(0, driftMs + (elapsedMs - budgetMs));
  if (driftMs >= MAX_DRIFT_MS) {
    try { rt.clearOutputQueue(); } catch { /* ignore */ }
    console.warn(`[audio] Recovered from ${driftMs.toFixed(0)}ms of accumulated drift by clearing the output queue (expect a brief click).`);
    try { overloadListener?.({ driftMs, namEnabled: !!(ampChain && ampChain.params.namEnabled) }); } catch { /* ignore */ }
    driftMs = 0;
  }

  if (DEBUG_TIMING) {
    debugProcessMs.push(elapsedMs);
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
    driftMs = 0;
    if (recoveryTimer) { clearTimeout(recoveryTimer); recoveryTimer = null; } // nothing left to recover for
    recoveryAttempt = 0;
    recoveryGaveUp = false;
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
  driftMs = 0; // fresh stream — nothing queued yet, so no drift carried over from the last one

  const outParams = desired.duplex ? { deviceId: desired.outDeviceId, nChannels: desired.outChannels, firstChannel: desired.outFirstChannel } : null;
  const inParams = { deviceId: desired.deviceId, nChannels: 1, firstChannel: desired.channel };

  const sampleRateCandidates = buildSampleRateCandidates(desired.sampleRate, desired.sampleRates);
  const { frame: actualFrame, sampleRate: actualSampleRate } = await openStreamWithRetry(
    rt,
    outParams,
    inParams,
    sampleRateCandidates,
    desired.requestedFrameSize
  );
  negotiatedSampleRateByDevice.set(desired.deviceId, actualSampleRate);

  // Built from the rate that actually opened, not the (possibly wrong) guess in
  // desired.sampleRate — AmpChain's filters/delay lines are tuned to it.
  ampChain = desired.duplex ? new AmpChain(actualSampleRate) : null;
  if (ampChain && ampConsumer) ampChain.setParams(resolveAmpPatch(ampConsumer.params || {}, ampChain));

  let streamLatencyFrames = 0;
  try { streamLatencyFrames = rt.getStreamLatency ? rt.getStreamLatency() : 0; } catch { /* ignore */ }

  openShape = {
    ...desired,
    sampleRate: actualSampleRate,
    frameSize: actualFrame || desired.requestedFrameSize,
    streamLatencyFrames,
  };
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
  recoveryGaveUp = false; // a fresh attach always deserves a real attempt
  try {
    await ensureOpen();
  } catch (err) {
    captureConsumer = null;
    throw decorateOpenError(err);
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
      outputChannel: opts.outputChannel || 0,
    },
    params: opts.params || {},
  };
  recoveryGaveUp = false; // a fresh attach always deserves a real attempt
  try {
    await ensureOpen();
  } catch (err) {
    ampConsumer = null;
    throw decorateOpenError(err);
  }
  return ampInfo;
}

function updateAmpParams(params) {
  const wasNamEnabled = !!(ampChain && ampChain.params.namEnabled);
  if (ampConsumer) ampConsumer.params = { ...ampConsumer.params, ...(params || {}) };
  if (ampChain) ampChain.setParams(resolveAmpPatch(params || {}, ampChain));
  if (ampInfo && ampChain) ampInfo.params = ampChain.params;

  // A heavy NAM model can occasionally take longer to infer a block than that
  // block's real-time budget (see dsp/nam.js) — when that happens, rt.write()'s
  // internal output queue just keeps growing (a late block is still appended,
  // never dropped), so the whole stream drifts further behind real time and
  // stays behind: nothing about disabling NAM removes what's already queued.
  // Flush it here so turning NAM off actually restores low latency right away
  // instead of requiring a full amp restart to get a fresh (cleared) stream.
  if (params && params.namEnabled === false && wasNamEnabled) {
    try { shared.getRt().clearOutputQueue(); } catch { /* ignore */ }
    driftMs = 0; // matches the watchdog's own recovery accounting in onInputBlock
  }
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
  onOverload,
  onConnectionIssue, onDevicesChanged, recoverAfterResume,
};
