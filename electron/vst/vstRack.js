// The player's VST rack, inside the audio process (see ../audioProcess.js): an
// ordered chain of plugins that replaces the whole built-in chain when the
// amp's toneMode is "vst". AmpChain calls processBlock() from the audio
// callback; every edit (add, remove, reorder, bypass) and every plugin
// window goes through the addon's own UI thread, never the callback.
//
// The rack is saved to disk as it changes (./vstStore) and comes back as it was
// on the next launch. Plugins load lazily — the first time the rack is actually
// wanted (switching to VST mode, or editing the rack) — and then stay loaded,
// so flipping between the built-in chain and the rack is instant.
const crypto = require("crypto");

// Bigger than any buffer Tone Studio offers; the addon splits larger blocks.
const MAX_BLOCK = 1024;
// "edited" fires on the first knob move after a save; settle before writing.
const PERSIST_DEBOUNCE_MS = 3000;

function createRack({ loadAddon, store, newSlotId = () => crypto.randomBytes(8).toString("hex") }) {
  let addon = null;
  let addonError = null;
  let initialised = false;

  let slots = []; // [{ id, pluginId, name, vendor, bypass }] — the saved rack
  const runtime = new Map(); // slot id -> { status, info, error, editorOpen }
  let toneMode = "builtin";
  let sampleRate = 48000;
  const persistTimers = new Map();

  let listener = null;
  let queue = Promise.resolve();

  const emit = (type, payload = {}) => {
    try { listener?.({ type, ...payload }); } catch { /* a bad listener must not break the rack */ }
  };

  const rt = (id) => {
    if (!runtime.has(id)) runtime.set(id, { status: "idle", info: null, error: null, editorOpen: false });
    return runtime.get(id);
  };

  function getStatus() {
    let totalLatencyMs = 0;
    const view = slots.map((s) => {
      const r = rt(s.id);
      const latencyMs = r.info ? (r.info.latencySamples / r.info.sampleRate) * 1000 : 0;
      if (!s.bypass && r.status === "ready") totalLatencyMs += latencyMs;
      return {
        id: s.id,
        pluginId: s.pluginId,
        name: (r.info && r.info.name) || s.name,
        vendor: (r.info && r.info.vendor) || s.vendor,
        bypass: s.bypass,
        status: r.status,
        error: r.error,
        latencyMs,
        editorOpen: r.editorOpen,
      };
    });
    return {
      supported: !!addon,
      error: addon ? null : addonError,
      toneMode,
      slots: view,
      latencyMs: totalLatencyMs,
    };
  }

  const emitStatus = () => emit("status", { status: getStatus() });

  /** Serialises loads/unloads — a second edit during a 3 s plugin load waits
   *  its turn instead of racing it. */
  function enqueue(fn) {
    const run = queue.then(fn);
    queue = run.catch(() => {});
    return run;
  }

  function syncChain() {
    if (!addon) return;
    addon.setChain(slots.filter((s) => rt(s.id).status === "ready").map((s) => ({ slot: s.id, bypass: s.bypass })));
  }

  function persistRack() {
    store.writeRack(slots).catch((err) => console.warn("[vst] could not save the rack:", err && err.message));
  }

  // ── Plugin settings ────────────────────────────────────────────────────────

  async function persistState(id) {
    const timer = persistTimers.get(id);
    if (timer) { clearTimeout(timer); persistTimers.delete(id); }
    if (!addon || rt(id).status !== "ready") return;
    try {
      const state = await addon.getState(id);
      if (state) await store.writeState(id, state);
    } catch (err) {
      console.warn("[vst] could not save plugin settings:", err && err.message);
    }
  }

  function persistSoon(id, delayMs) {
    const old = persistTimers.get(id);
    if (old) clearTimeout(old);
    persistTimers.set(id, setTimeout(() => {
      persistTimers.delete(id);
      enqueue(() => persistState(id));
    }, delayMs));
  }

  function onAddonEvent(type, payload) {
    const id = payload && payload.slot;
    if (type === "editor-closed" && id) {
      rt(id).editorOpen = false;
      persistSoon(id, 0);
      emitStatus();
    } else if (type === "edited" && id) {
      persistSoon(id, PERSIST_DEBOUNCE_MS);
    } else if (type === "restart" && id) {
      const info = addon.getInfo(id);
      if (info) rt(id).info = info;
      emitStatus();
    } else if (type === "warning" || type === "error") {
      emit(type, { slotId: id || null, message: payload && payload.message });
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  async function loadSlot(slot) {
    const r = rt(slot.id);
    if (r.status === "ready" || r.status === "loading" || !slots.includes(slot)) return;
    const entry = store.findPlugin(slot.pluginId);
    if (!entry) {
      r.status = "error";
      r.error = "Not in your plugin library anymore — scan again or add the file.";
      emitStatus();
      return;
    }
    r.status = "loading";
    r.error = null;
    emitStatus();
    try {
      r.info = await addon.load({
        slot: slot.id,
        path: entry.path,
        uid: entry.id,
        sampleRate,
        maxBlock: MAX_BLOCK,
        state: store.readState(slot.id),
      });
      r.status = "ready";
    } catch (err) {
      r.status = "error";
      r.error = (err && err.message) || "Could not load the plugin";
    }
    if (!slots.includes(slot)) {
      // Removed while it was loading.
      if (r.status === "ready") await addon.unload(slot.id).catch(() => {});
      runtime.delete(slot.id);
    }
    syncChain();
    emitStatus();
  }

  /** Loads every slot that isn't loaded yet, in rack order. */
  function loadAll() {
    if (!addon) return Promise.resolve();
    return enqueue(async () => {
      for (const slot of slots.slice()) await loadSlot(slot);
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init() {
    if (initialised) return getStatus();
    initialised = true;
    ({ addon, error: addonError } = loadAddon());
    if (addon) {
      try {
        addon.init(onAddonEvent);
      } catch (err) {
        addonError = `VST host failed to start: ${err && err.message}`;
        addon = null;
      }
    }
    slots = store.readRack();
    return getStatus();
  }

  function onEvent(fn) {
    listener = fn;
  }

  /** Picks up toneMode from any amp params patch; entering VST mode loads the rack. */
  function applyParams(patch) {
    if (!patch || !("toneMode" in patch)) return;
    toneMode = patch.toneMode === "vst" ? "vst" : "builtin";
    if (toneMode === "vst") loadAll();
    emitStatus();
  }

  /** Re-tunes every loaded plugin to a (re)opened stream before its first callback. */
  function configure(rate) {
    if (!rate) return Promise.resolve();
    const changed = rate !== sampleRate;
    sampleRate = rate;
    if (!addon || !changed) return Promise.resolve();
    return enqueue(async () => {
      try {
        await addon.configure(rate, MAX_BLOCK);
      } catch (err) {
        emit("error", { slotId: null, message: `Plugins could not switch to ${rate} Hz: ${err && err.message}` });
      }
      for (const s of slots) {
        const info = addon.getInfo(s.id);
        if (info) rt(s.id).info = info;
      }
      emitStatus();
    });
  }

  function isActive() {
    return !!addon && toneMode === "vst";
  }

  /** Mono guitar in \`left\`, stereo out in left/right. Silence while a plugin
   *  that should be playing is still loading, or the chain is busy (a state
   *  swap or restart) — the raw DI at full level would be far worse. */
  function processBlock(left, n, right) {
    const loading = slots.some((s) => !s.bypass && rt(s.id).status === "loading");
    if (!loading && addon.process(left, n, right)) return;
    left.fill(0, 0, n);
    if (right) right.fill(0, 0, n);
  }

  function requireAddon() {
    if (!addon) throw new Error(addonError || "VST plugins are unavailable");
  }

  function add(pluginId, index) {
    requireAddon();
    const entry = store.findPlugin(pluginId);
    if (!entry) throw new Error("That plugin isn't in your library");
    const slot = {
      id: newSlotId(),
      pluginId: String(entry.id).toUpperCase(),
      name: entry.name,
      vendor: entry.vendor || "",
      bypass: false,
    };
    const at = Number.isInteger(index) ? Math.max(0, Math.min(index, slots.length)) : slots.length;
    slots = [...slots.slice(0, at), slot, ...slots.slice(at)];
    persistRack();
    rt(slot.id);
    enqueue(() => loadSlot(slot));
    emitStatus();
    return getStatus();
  }

  function remove(slotId) {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return getStatus();
    slots = slots.filter((s) => s !== slot);
    persistRack();
    syncChain();
    const timer = persistTimers.get(slotId);
    if (timer) { clearTimeout(timer); persistTimers.delete(slotId); }
    const wasLoaded = rt(slotId).status === "ready";
    runtime.delete(slotId);
    enqueue(async () => {
      if (addon && wasLoaded) await addon.unload(slotId).catch(() => {});
      await store.deleteState(slotId);
    });
    emitStatus();
    return getStatus();
  }

  function move(slotId, toIndex) {
    const from = slots.findIndex((s) => s.id === slotId);
    if (from < 0) return getStatus();
    const next = slots.slice();
    const [slot] = next.splice(from, 1);
    next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, slot);
    slots = next;
    persistRack();
    syncChain();
    emitStatus();
    return getStatus();
  }

  function setBypass(slotId, bypass) {
    slots = slots.map((s) => (s.id === slotId ? { ...s, bypass: !!bypass } : s));
    persistRack();
    syncChain();
    emitStatus();
    return getStatus();
  }

  async function openEditor(slotId) {
    requireAddon();
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) throw new Error("That slot isn't in the rack");
    await enqueue(() => loadSlot(slot));
    const r = rt(slotId);
    if (r.status !== "ready") throw new Error(r.error || "The plugin is not loaded");
    await addon.openEditor(slotId);
    r.editorOpen = true;
    emitStatus();
    return getStatus();
  }

  async function closeEditor(slotId) {
    if (addon && rt(slotId).status === "ready") await addon.closeEditor(slotId);
    return getStatus();
  }

  async function shutdown() {
    if (!addon) return;
    await enqueue(async () => {
      for (const s of slots) {
        if (rt(s.id).status !== "ready") continue;
        try {
          const state = await addon.unload(s.id);
          if (state) await store.writeState(s.id, state);
        } catch { /* exiting anyway */ }
        rt(s.id).status = "idle";
      }
    });
    try { addon.shutdown(); } catch { /* exiting anyway */ }
  }

  return {
    init,
    onEvent,
    getStatus,
    applyParams,
    configure,
    isActive,
    processBlock,
    add,
    remove,
    move,
    setBypass,
    openEditor,
    closeEditor,
    shutdown,
    /** Test seam: wait for queued loads/unloads. */
    idle: () => queue,
  };
}

const rack = createRack({ loadAddon: require("./vstAddon").load, store: require("./vstStore") });

module.exports = { ...rack, createRack };
