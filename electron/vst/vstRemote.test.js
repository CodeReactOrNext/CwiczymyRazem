import { describe, expect, it, vi } from "vitest";

import { createRpcServer } from "../workerRpc";
import { createRack } from "./vstRack";
import { connectAudioProcess, createHost } from "./vstRemote";

const AMP = { id: "ABCDEF019182FAEB4E445350414A5050", name: "Archetype Petrucci", vendor: "Neural DSP", path: "/Library/Audio/Plug-Ins/VST3/P.vst3" };

/** Like Electron's utilityProcess port pair: async, structured-cloned (a
 *  Buffer arrives as a plain Uint8Array), the child side wrapped in { data }. */
function makePortPair() {
  const listenersA = [];
  const listenersB = [];
  const a = {
    postMessage: (msg) => { const copy = structuredClone(msg); setTimeout(() => listenersB.forEach((l) => l({ data: copy })), 0); },
    on: (_ev, l) => listenersA.push(l),
  };
  const b = {
    postMessage: (msg) => { const copy = structuredClone(msg); setTimeout(() => listenersA.forEach((l) => l(copy)), 0); },
    on: (_ev, l) => listenersB.push(l),
  };
  return { a, b };
}

/** The real addon as the main process would drive it. */
function fakeMainAddon() {
  const loaded = new Map();
  let onEvent = () => {};
  return {
    loaded,
    chain: [],
    emit: (type, payload) => onEvent(type, payload),
    init: vi.fn((cb) => { onEvent = cb; }),
    serveAudio: vi.fn(() => "/rq.vst.test"),
    load: vi.fn(async ({ slot, sampleRate, state }) => {
      const info = { slot, name: AMP.name, vendor: AMP.vendor, latencySamples: 48, sampleRate, restored: state ? Buffer.from(state).toString() : null };
      loaded.set(slot, info);
      return info;
    }),
    unload: vi.fn(async (slot) => { loaded.delete(slot); return Buffer.from(`state:${slot}`); }),
    setChain: vi.fn(function (order) { this.chain = order; }),
    configure: vi.fn(async (sampleRate) => { for (const info of loaded.values()) info.sampleRate = sampleRate; return true; }),
    getState: vi.fn(async (slot) => Buffer.from(`state:${slot}`)),
    setState: vi.fn(async () => true),
    getInfo: vi.fn((slot) => (loaded.has(slot) ? { ...loaded.get(slot) } : null)),
    openEditor: vi.fn(async () => true),
    closeEditor: vi.fn(async () => true),
  };
}

/** The audio process's own copy of the addon: only the bridge end. */
function fakeNative() {
  return {
    connectAudio: vi.fn(),
    process: vi.fn((left, n, right) => { for (let i = 0; i < n; i++) right[i] = -left[i]; return true; }),
  };
}

function memoryStore() {
  const states = new Map();
  return {
    rack: [],
    states,
    findPlugin: (id) => (String(id).toUpperCase() === AMP.id ? AMP : null),
    readRack() { return this.rack; },
    writeRack: vi.fn(async function (slots) { this.rack = slots; }),
    readState: (id) => states.get(id) || null,
    writeState: vi.fn(async (id, buf) => { states.set(id, buf); return true; }),
    deleteState: vi.fn(async (id) => { states.delete(id); }),
  };
}

const flush = () => new Promise((r) => setTimeout(r, 10));

function setup() {
  const { a, b } = makePortPair();
  const main = fakeMainAddon();
  const host = createHost({ loadAddon: () => ({ addon: main, error: null }) });
  const server = createRpcServer(a, host.handlers);
  host.setEmitter(server.emit);
  const native = fakeNative();
  const remote = connectAudioProcess(native, b);
  const store = memoryStore();
  let n = 0;
  const rack = createRack({ loadAddon: () => ({ addon: remote, error: null }), store, newSlotId: () => `slot${++n}` });
  return { main, host, native, remote, store, rack };
}

describe("vstRemote (macOS: rack in the audio process, plugins in main)", () => {
  it("starts the main-process host and connects the audio bridge on init", async () => {
    const { main, native, rack } = setup();
    expect(rack.init().supported).toBe(true);
    await flush();
    expect(main.init).toHaveBeenCalledTimes(1);
    expect(main.serveAudio).toHaveBeenCalledTimes(1);
    expect(native.connectAudio).toHaveBeenCalledWith("/rq.vst.test");
  });

  it("plays silence until the bridge is up, then processes through it", async () => {
    const { native, remote } = setup();
    remote.init(() => {});
    const left = new Float32Array([1, 1]);
    const right = new Float32Array(2);
    expect(remote.process(left, 2, right)).toBe(false);
    expect(native.process).not.toHaveBeenCalled();
    await flush();
    expect(remote.process(left, 2, right)).toBe(true);
    expect(Array.from(right)).toEqual([-1, -1]);
  });

  it("loads, chains and unloads a slot in the main process, with settings as Buffers both ways", async () => {
    const { main, rack, store } = setup();
    rack.init();
    store.states.set("slot1", Buffer.from("saved"));
    rack.add(AMP.id);
    rack.applyParams({ toneMode: "vst" });
    await rack.idle();
    await flush();

    expect(main.loaded.get("slot1")).toMatchObject({ restored: "saved" });
    expect(rack.getStatus().slots[0]).toMatchObject({ status: "ready", name: AMP.name });
    expect(main.chain).toEqual([{ slot: "slot1", bypass: false }]);

    await rack.shutdown();
    await flush();
    expect(main.unload).toHaveBeenCalledWith("slot1");
    const saved = store.writeState.mock.calls.at(-1);
    expect(saved[0]).toBe("slot1");
    expect(Buffer.isBuffer(saved[1])).toBe(true);
    expect(saved[1].toString()).toBe("state:slot1");
  });

  it("keeps getInfo() synchronous: restart events and configure() refresh the cache", async () => {
    const { main, rack, remote } = setup();
    rack.init();
    rack.add(AMP.id);
    rack.applyParams({ toneMode: "vst" });
    await rack.idle();
    await flush();

    main.loaded.get("slot1").latencySamples = 480;
    main.emit("restart", { slot: "slot1" });
    await flush();
    expect(remote.getInfo("slot1").latencySamples).toBe(480);
    expect(rack.getStatus().slots[0].latencyMs).toBeCloseTo(10);

    await rack.configure(44100);
    expect(remote.getInfo("slot1").sampleRate).toBe(44100);
  });

  it("forwards editor events from the main process to the rack", async () => {
    const { main, rack } = setup();
    rack.init();
    rack.add(AMP.id);
    await rack.idle();
    await flush();
    await rack.openEditor("slot1");
    expect(main.openEditor).toHaveBeenCalledWith("slot1");
    expect(rack.getStatus().slots[0].editorOpen).toBe(true);

    main.emit("editor-closed", { slot: "slot1" });
    await flush();
    expect(rack.getStatus().slots[0].editorOpen).toBe(false);
  });

  it("drops a previous engine's plugins when a respawned engine starts its rack", async () => {
    const { main, host, rack } = setup();
    rack.init();
    rack.add(AMP.id);
    await rack.idle();
    await flush();
    expect(main.loaded.has("slot1")).toBe(true);

    await host.handlers.vstInit();
    expect(main.loaded.size).toBe(0);
    expect(main.init).toHaveBeenCalledTimes(1); // the addon itself starts once
  });

  it("reports a configure failure after refreshing what did change", async () => {
    const { main, rack, remote } = setup();
    rack.init();
    rack.add(AMP.id);
    await rack.idle();
    await flush();
    main.configure.mockImplementationOnce(async (rate) => {
      main.loaded.get("slot1").sampleRate = rate;
      throw new Error("Pro EQ: setupProcessing failed");
    });
    const events = [];
    rack.onEvent((e) => events.push(e));
    await rack.configure(96000);
    expect(remote.getInfo("slot1").sampleRate).toBe(96000);
    expect(events.find((e) => e.type === "error").message).toMatch(/setupProcessing failed/);
  });

  it("fails loads with the host's own error when it cannot start", async () => {
    const { a, b } = makePortPair();
    const host = createHost({ loadAddon: () => ({ addon: null, error: "VST host failed to load: nope" }) });
    host.setEmitter(createRpcServer(a, host.handlers).emit);
    const remote = connectAudioProcess(fakeNative(), b);
    const events = [];
    remote.init((type, payload) => events.push({ type, ...payload }));
    await expect(remote.load({ slot: "s", path: "/x.vst3" })).rejects.toThrow(/nope/);
    expect(events[0]).toMatchObject({ type: "error", message: expect.stringMatching(/failed to start: VST host failed to load: nope/) });
  });
});
