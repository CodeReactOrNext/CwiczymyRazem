// macOS: the rack's plugins live in the Electron main process, not next to the
// rack in the audio process. AppKit — and every JUCE plugin's message loop —
// only runs on a process's main thread, and the audio process's main thread is
// the JS thread that carries every audio block: a plugin window drawing there
// would crackle. The main process's main thread runs NSApplication anyway.
//
// So on macOS ./vstRack (still in the audio process, unchanged) drives a
// stand-in with the addon's own API (createRemoteAddon): every call goes over
// the engine's utilityProcess port to createHost() in the main process, which
// drives the real addon there; process() goes through shared memory to the
// chain thread the main-process addon runs (see `bridge` in src/vsthost.cpp).
//
// Wire (on the same port as ./workerRpc's engine protocol, the other way round):
//   audio process → main: call vstInit / vstLoad / vstUnload / vstSetChain /
//                         vstConfigure / vstGetState / vstSetState /
//                         vstOpenEditor / vstCloseEditor / vstShutdown
//   main → audio process: event "vst-host" { type, payload } — the addon's own
//                         events, a "restart" carrying the slot's fresh info
const { createRpcClient, createRpcServer } = require("../workerRpc");

const EVENT = "vst-host";

/** Structured clone hands a Buffer over as a plain Uint8Array. */
function toBuffer(bytes) {
  if (!bytes) return null;
  return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

// ── Audio process side ───────────────────────────────────────────────────────

/** `call(method, ...args)` reaches createHost()'s handlers; `native` is this
 *  process's own addon, used only for connectAudio() + process(). */
function createRemoteAddon({ call, native }) {
  const infos = new Map(); // slot -> last info, for the rack's synchronous getInfo()
  let listener = null;
  let ready = null;
  let connected = false;

  const emit = (type, payload) => {
    try { listener?.(type, payload); } catch { /* a bad listener must not break the host */ }
  };
  // Everything waits for vstInit, in call order (one port, FIFO both ways).
  const send = (method, ...args) => ready.then(() => call(method, ...args));

  return {
    init(onEvent) {
      listener = onEvent;
      ready = call("vstInit").then(({ bridgeName }) => {
        native.connectAudio(bridgeName);
        connected = true;
      });
      ready.catch((err) => emit("error", { message: `VST host failed to start: ${err && err.message}` }));
    },
    /** A "vst-host" event from the main process. */
    handleEvent({ type, payload } = {}) {
      if (type === "restart" && payload && payload.info) infos.set(payload.slot, payload.info);
      emit(type, payload);
    },
    async load(opts) {
      const info = await send("vstLoad", opts);
      if (info) infos.set(opts.slot, info);
      return info;
    },
    async unload(slot) {
      infos.delete(slot);
      return toBuffer(await send("vstUnload", slot));
    },
    setChain(chain) {
      send("vstSetChain", chain).catch(() => { /* reported by the next load/edit */ });
    },
    async configure(sampleRate, maxBlock) {
      const { infos: next, error } = await send("vstConfigure", sampleRate, maxBlock);
      for (const [slot, info] of Object.entries(next || {})) infos.set(slot, info);
      if (error) throw new Error(error);
      return true;
    },
    async getState(slot) {
      return toBuffer(await send("vstGetState", slot));
    },
    setState(slot, state) {
      return send("vstSetState", slot, state);
    },
    openEditor(slot) {
      return send("vstOpenEditor", slot);
    },
    closeEditor(slot) {
      return send("vstCloseEditor", slot);
    },
    getInfo(slot) {
      return infos.get(slot) || null;
    },
    /** Audio callback: false (= silence) until the bridge is up. */
    process(left, n, right) {
      return connected && native.process(left, n, right);
    },
    shutdown() {
      if (ready) send("vstShutdown").catch(() => {});
    },
  };
}

/** The rack's addon inside the audio process (a utilityProcess). */
function connectAudioProcess(native, port = process.parentPort) {
  let remote = null;
  const rpc = createRpcClient(port, {
    onEvent: (name, payload) => {
      if (name === EVENT) remote?.handleEvent(payload);
    },
  });
  remote = createRemoteAddon({ call: rpc.call, native });
  return remote;
}

// ── Main process side ────────────────────────────────────────────────────────

/** Owns the real addon. One per main process: it outlives engine respawns. */
function createHost({ loadAddon }) {
  let addon = null;
  let bridgeName = null;
  let emit = () => {};
  const loaded = new Set();
  let resetting = Promise.resolve();

  function start() {
    if (addon) return;
    const { addon: a, error } = loadAddon();
    if (!a) throw new Error(error || "VST plugins are unavailable");
    a.init((type, payload) => {
      const slot = payload && payload.slot;
      const info = type === "restart" && slot ? a.getInfo(slot) : null;
      emit(EVENT, { type, payload: info ? { ...payload, info } : payload });
    });
    bridgeName = a.serveAudio();
    addon = a;
  }

  function started() {
    if (!addon) throw new Error("VST host not started");
    return addon;
  }

  /** Unloads every plugin (closing its window) without saving — for when the
   *  rack that owned them is gone. One at a time: a respawned engine's rack
   *  reuses the slot ids, so its loads must not start while an older reset is
   *  still unloading them. */
  function reset() {
    resetting = resetting.then(async () => {
      if (!addon) return;
      const slots = [...loaded];
      loaded.clear();
      addon.setChain([]);
      for (const slot of slots) await addon.unload(slot).catch(() => {});
    });
    return resetting;
  }

  const handlers = {
    /** A (re)started engine's rack: starts from an empty chain. */
    async vstInit() {
      start();
      await reset();
      return { bridgeName };
    },
    async vstLoad(opts) {
      loaded.delete(opts.slot); // load() replaces whatever the slot held, even when it fails
      const info = await started().load(opts);
      loaded.add(opts.slot);
      return info;
    },
    vstUnload(slot) {
      loaded.delete(slot);
      return started().unload(slot);
    },
    vstSetChain(chain) {
      started().setChain(chain);
    },
    async vstConfigure(sampleRate, maxBlock) {
      const a = started();
      let error = null;
      try {
        await a.configure(sampleRate, maxBlock);
      } catch (err) {
        error = (err && err.message) || "configure failed";
      }
      const infos = {};
      for (const slot of loaded) {
        const info = a.getInfo(slot);
        if (info) infos[slot] = info;
      }
      return { infos, error };
    },
    vstGetState(slot) {
      return started().getState(slot);
    },
    vstSetState(slot, state) {
      return started().setState(slot, state);
    },
    vstOpenEditor(slot) {
      return started().openEditor(slot);
    },
    vstCloseEditor(slot) {
      return started().closeEditor(slot);
    },
    /** The rack has unloaded (and saved) its plugins already. */
    vstShutdown() {
      return reset();
    },
  };

  return {
    handlers,
    reset,
    setEmitter(fn) { emit = fn; },
  };
}

let host = null;

/** Main process: answer the rack of the engine process `proc` (a utilityProcess). */
function serveEngine(proc) {
  if (!host) host = createHost({ loadAddon: require("./vstAddon").load });
  const server = createRpcServer(proc, host.handlers);
  host.setEmitter(server.emit);
  // The engine died (or quit): its plugins must not linger in open windows.
  proc.on("exit", () => { host.reset().catch(() => {}); });
}

module.exports = { createRemoteAddon, connectAudioProcess, createHost, serveEngine, toBuffer };
