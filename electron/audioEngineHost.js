// Main-process side of the audio engine: spawns ./audioProcess.js as an Electron
// utilityProcess and presents ./nativeAudioEngine's API over it, so audioBridge.js
// / ampSim.js / main.js keep the same call shape they always had (now all async).
//
// Why the engine left the main process. audify (RtAudio) hands each hardware
// block to JS through a ThreadSafeFunction — i.e. through the event loop of the
// process that opened the stream — and takes output back through an internal
// queue that its next hardware callback pops from. So every block's DSP has to be
// scheduled, run, and written back within ONE block period (2.7ms at 128 frames,
// 1.3ms at 64) of that event loop. In the Electron main process that loop is
// shared with the whole browser process: every renderer IPC, window event,
// synchronous fs read in an IPC handler, and GC of the main isolate competes
// with it. Each time something there runs longer than a block period, the
// hardware callback finds nothing queued and plays silence (the crackle), and
// the late block is then appended anyway — permanently adding one block of
// latency (see outputQueueMonitor.js). That's why "128 crackles, 256 is fine but
// too laggy" was the typical field report, and why it got worse with a NAM model
// (less headroom per block, so smaller stalls tip it over).
//
// A utilityProcess gives the engine an event loop that does nothing else, its
// own isolate (no GC coupling), and its own OS process (so audioProcess.js can
// raise its scheduling priority without touching the browser process). The
// renderer-facing IPC in main.js is unchanged — it just awaits the RPC now.
const path = require("path");

const { createRpcClient } = require("./workerRpc");

let child = null;
let rpc = null;
let readyPromise = null;
let userDataDirOverride = null;

let frameListener = null;
let overloadListener = null;
let connectionListener = null;
let devicesChangedListener = null;
// Whether a consumer is (as far as the host knows) attached — used to decide
// if an unexpected process exit should surface to the user as a lost stream.
let captureAttached = false;
let ampAttached = false;

/** Test/CLI seam: where presets/IRs/NAM models live. Defaults to app.getPath("userData"). */
function configure({ userDataDir } = {}) {
  if (userDataDir) userDataDirOverride = userDataDir;
}

function safeCall(fn, ...args) {
  try { fn?.(...args); } catch { /* a bad listener must not break the host */ }
}

function handleEvent(name, payload) {
  switch (name) {
    case "frame": safeCall(frameListener, payload); break;
    case "overload": safeCall(overloadListener, payload); break;
    case "connection-issue": safeCall(connectionListener, payload); break;
    case "devices-changed": safeCall(devicesChangedListener); break;
    case "error": console.error("[audio] engine process error:", payload && payload.message); break;
    default: break;
  }
}

function spawn() {
  const { utilityProcess, app } = require("electron");
  const userDataDir = userDataDirOverride || app.getPath("userData");

  const proc = utilityProcess.fork(path.join(__dirname, "audioProcess.js"), [], {
    serviceName: "riff.quest audio engine",
    stdio: "inherit", // engine console.warn/log lines stay visible in the terminal in dev
  });
  child = proc;
  rpc = createRpcClient(proc, { onEvent: handleEvent });

  proc.on("exit", (code) => {
    if (child !== proc) return; // an older instance we already replaced
    const hadConsumers = captureAttached || ampAttached;
    rpc.failAll(new Error(`Audio engine process exited (code ${code})`));
    child = null;
    rpc = null;
    readyPromise = null;
    captureAttached = false;
    ampAttached = false;
    console.warn(`[audio] engine process exited with code ${code}${hadConsumers ? " while a stream was open" : ""}`);
    if (hadConsumers) {
      safeCall(connectionListener, {
        status: "failed",
        message: "The audio engine stopped unexpectedly — turn monitoring back on to restart it.",
      });
    }
  });

  readyPromise = new Promise((resolve, reject) => {
    proc.once("spawn", () => {
      rpc.call("init", { userDataDir })
        .then((info) => {
          console.log(`[audio] engine process ready (pid ${info.pid}, api ${info.api})`);
          resolve(info);
        })
        .catch(reject);
    });
  });
  readyPromise.catch((err) => console.error("[audio] engine process failed to initialise:", err && err.message));
  return readyPromise;
}

async function call(method, ...args) {
  if (!child) spawn();
  await readyPromise;
  return rpc.call(method, ...args);
}

/** Spawn the engine process ahead of time (app ready) so the first "turn on"
 *  doesn't pay process start + audify/WASM load on top of the ASIO open. */
function warmUp() {
  if (!child) spawn();
  return readyPromise;
}

function listDevices() {
  return call("listDevices");
}

async function attachCapture(opts, onFrame) {
  frameListener = onFrame;
  captureAttached = true;
  try {
    return await call("attachCapture", opts);
  } catch (err) {
    frameListener = null;
    captureAttached = false;
    throw err;
  }
}

async function detachCapture() {
  frameListener = null;
  captureAttached = false;
  if (!child) return;
  try { await call("detachCapture"); } catch { /* process gone — nothing to detach */ }
}

function getCaptureStatus() {
  if (!child) return Promise.resolve({ isOpen: false, info: null });
  return call("getCaptureStatus");
}

async function attachAmp(opts) {
  ampAttached = true;
  try {
    return await call("attachAmp", opts);
  } catch (err) {
    ampAttached = false;
    throw err;
  }
}

function updateAmpParams(params) {
  return call("updateAmpParams", params);
}

async function detachAmp() {
  ampAttached = false;
  if (!child) return;
  try { await call("detachAmp"); } catch { /* process gone — nothing to detach */ }
}

function getAmpStatus() {
  if (!child) return Promise.resolve({ isOpen: false, info: null });
  return call("getAmpStatus");
}

function getDiagnostics() {
  if (!child) return Promise.resolve(null);
  return call("getDiagnostics");
}

function recoverAfterResume() {
  if (!child) return Promise.resolve();
  return call("recoverAfterResume").catch(() => {});
}

function onOverload(fn) { overloadListener = fn; }
function onConnectionIssue(fn) { connectionListener = fn; }
function onDevicesChanged(fn) { devicesChangedListener = fn; }

const SHUTDOWN_TIMEOUT_MS = 700;

/** Ask the engine process to close its stream (releases the ASIO driver) and exit;
 *  kills it if it doesn't within a short grace period. Safe to call repeatedly. */
async function shutdown() {
  const proc = child;
  if (!proc) return;
  captureAttached = false;
  ampAttached = false;
  frameListener = null;
  const exited = new Promise((resolve) => proc.once("exit", resolve));
  try {
    await Promise.race([
      readyPromise.then(() => rpc.call("shutdown")),
      new Promise((_, reject) => setTimeout(() => reject(new Error("shutdown timeout")), SHUTDOWN_TIMEOUT_MS)),
    ]);
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, SHUTDOWN_TIMEOUT_MS))]);
  } catch { /* fall through to kill */ }
  if (child === proc) {
    try { proc.kill(); } catch { /* already gone */ }
  }
}

module.exports = {
  configure, warmUp, shutdown,
  listDevices,
  attachCapture, detachCapture, getCaptureStatus,
  attachAmp, updateAmpParams, detachAmp, getAmpStatus, getDiagnostics,
  onOverload, onConnectionIssue, onDevicesChanged, recoverAfterResume,
};
