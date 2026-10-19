// Entry point of the dedicated audio process. Spawned by ./audioEngineHost as an
// Electron utilityProcess; hosts ./nativeAudioEngine (audify/RtAudio stream + the
// whole DSP chain) and exposes it over ./workerRpc on process.parentPort.
//
// Why a separate process (see audioEngineHost.js for the full story): audify
// delivers each hardware block to JS through the event loop of whichever process
// opened the stream. In the main process that loop is shared with everything
// Chromium's browser process does — IPC from the renderer, window events,
// synchronous fs work in IPC handlers, GC of the main isolate — and every stall
// longer than one block period there was an audible dropout plus one block of
// permanent extra latency. Here the loop does audio and nothing else.
const os = require("os");

const { createRpcServer } = require("./workerRpc");
const toneStore = require("./toneStore");
const vstStore = require("./vst/vstStore");
const vstRack = require("./vst/vstRack");

const port = process.parentPort;
let engine = null;

function requireEngine() {
  if (!engine) throw new Error("Audio engine not initialised (init() must be called first)");
  return engine;
}

/** Best-effort: this process is the app's "audio thread", so let the OS schedule
 *  it ahead of ordinary work (Chromium's renderer/GPU processes, other apps) the
 *  way a DAW's audio thread would be. ABOVE_NORMAL already wins against every
 *  normal-priority thread on the machine. RQ_AUDIO_PRIORITY=normal|above|high
 *  overrides it (used by test-audio-process-vs-main.js to compare). */
function raisePriority() {
  const { PRIORITY_NORMAL, PRIORITY_ABOVE_NORMAL, PRIORITY_HIGH } = os.constants.priority;
  const wanted = { normal: PRIORITY_NORMAL, above: PRIORITY_ABOVE_NORMAL, high: PRIORITY_HIGH }[process.env.RQ_AUDIO_PRIORITY] ?? PRIORITY_ABOVE_NORMAL;
  try {
    os.setPriority(wanted);
  } catch { /* not permitted on this platform/user — fine, just not prioritised */ }
}

let rpc;
const handlers = {
  init({ userDataDir }) {
    if (!userDataDir) throw new Error("init: userDataDir is required");
    toneStore.setUserDataDir(userDataDir);
    vstStore.setUserDataDir(userDataDir);
    raisePriority();
    // VST host first: its UI thread must exist before any params can ask for
    // the rack. Unsupported platform / missing binary just reports supported:false.
    vstRack.init();
    vstRack.onEvent((event) => rpc.emit("vst", event));
    engine = require("./nativeAudioEngine");
    engine.onOverload((info) => rpc.emit("overload", info));
    engine.onMeter((levels) => rpc.emit("meter", levels));
    engine.onConnectionIssue((info) => rpc.emit("connection-issue", info));
    engine.onDevicesChanged(() => rpc.emit("devices-changed"));
    // Compile the NAM WASM now, while nothing is streaming, not on first "turn on".
    engine.warmUp().catch(() => { /* NAM unavailable — the classic chain still works */ });
    let api = "unknown";
    try { api = engine.listDevices().api; } catch { /* enumeration failure isn't fatal for init */ }
    return { pid: process.pid, api };
  },

  listDevices() {
    return requireEngine().listDevices();
  },

  attachCapture(opts) {
    return requireEngine().attachCapture(opts, (buf) => {
      // Structured-cloned across the process boundary (a copy — a few hundred
      // bytes per block). The engine's own DSP has already read this buffer.
      rpc.emit("frame", buf);
    });
  },
  detachCapture() {
    return requireEngine().detachCapture();
  },
  getCaptureStatus() {
    return requireEngine().getCaptureStatus();
  },

  attachAmp(opts) {
    return requireEngine().attachAmp(opts);
  },
  updateAmpParams(params) {
    return requireEngine().updateAmpParams(params);
  },
  detachAmp() {
    return requireEngine().detachAmp();
  },
  getAmpStatus() {
    return requireEngine().getAmpStatus();
  },
  getDiagnostics() {
    return requireEngine().getDiagnostics();
  },

  recoverAfterResume() {
    requireEngine().recoverAfterResume();
  },

  // VST rack (electron/vst/vstRack.js). Every edit resolves with the new rack status.
  rackGet() {
    return vstRack.getStatus();
  },
  rackAdd(pluginId, index) {
    return vstRack.add(pluginId, index);
  },
  rackRemove(slotId) {
    return vstRack.remove(slotId);
  },
  rackMove(slotId, toIndex) {
    return vstRack.move(slotId, toIndex);
  },
  rackSetBypass(slotId, bypass) {
    return vstRack.setBypass(slotId, bypass);
  },
  rackOpenEditor(slotId) {
    return vstRack.openEditor(slotId);
  },
  rackCloseEditor(slotId) {
    return vstRack.closeEditor(slotId);
  },

  /** Closes the stream cleanly (releases the ASIO driver) and exits once the
   *  reply has gone out. */
  async shutdown() {
    if (engine) {
      try { await engine.detachCapture(); } catch { /* ignore */ }
      try { await engine.detachAmp(); } catch { /* ignore */ }
    }
    // Saves every plugin's settings and unloads them cleanly (plugins write
    // their own files on teardown too) before the process goes away.
    try { await vstRack.shutdown(); } catch { /* ignore */ }
    setTimeout(() => process.exit(0), 20);
    return true;
  },
};

rpc = createRpcServer(port, handlers);

process.on("uncaughtException", (err) => {
  // Keep the stream alive through a bug in a non-audio code path; the host still
  // gets told so it can log it. A crash in the audio callback itself would come
  // through here too — better a logged error than a silently dead process.
  console.error("[audio-process] uncaught exception:", err);
  rpc.emit("error", { message: err && err.message, stack: err && err.stack });
});
