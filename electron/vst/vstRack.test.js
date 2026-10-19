import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRack } from "./vstRack";

const AMP = { id: "ABCDEF019182FAEB4E445350414A5050", name: "Archetype Petrucci", vendor: "Neural DSP", path: "C:/p.vst3" };
const EQ = { id: "F2AEE70D00DE4F4E534441613159456F", name: "Pro EQ", vendor: "Acme", path: "C:/eq.vst3" };

function fakeAddon() {
  const loaded = new Map();
  let onEvent = () => {};
  let release = null;
  return {
    loaded,
    chain: [],
    hold() { return new Promise((resolve) => { release = resolve; }); },
    emit: (type, payload) => onEvent(type, payload),
    init: vi.fn((cb) => { onEvent = cb; }),
    load: vi.fn(async function ({ slot, uid, sampleRate }) {
      if (release === null && this.blockNext) await new Promise((r) => { release = r; });
      const info = { slot, name: uid === AMP.id ? AMP.name : EQ.name, vendor: "", latencySamples: 48, sampleRate };
      loaded.set(slot, info);
      return info;
    }),
    unload: vi.fn(async (slot) => { loaded.delete(slot); return Buffer.from(`state:${slot}`); }),
    setChain: vi.fn(function (order) { this.chain = order; }),
    configure: vi.fn(async () => true),
    getState: vi.fn(async (slot) => Buffer.from(`state:${slot}`)),
    getInfo: vi.fn((slot) => loaded.get(slot) || null),
    openEditor: vi.fn(async () => true),
    closeEditor: vi.fn(async () => true),
    process: vi.fn((left, n, right) => { for (let i = 0; i < n; i++) right[i] = left[i] * 0.5; return true; }),
    shutdown: vi.fn(),
    releaseLoad: () => { release?.(); release = null; },
  };
}

function memoryStore(initialRack = []) {
  const states = new Map();
  return {
    rack: initialRack,
    states,
    findPlugin: (id) => [AMP, EQ].find((p) => p.id === String(id).toUpperCase()) || null,
    readRack() { return this.rack; },
    writeRack: vi.fn(async function (slots) { this.rack = slots; }),
    readState: (id) => states.get(id) || null,
    writeState: vi.fn(async (id, buf) => { states.set(id, buf); return true; }),
    deleteState: vi.fn(async (id) => { states.delete(id); }),
  };
}

let addon;
let store;
let ids;
let rack;

beforeEach(() => {
  addon = fakeAddon();
  store = memoryStore();
  ids = 0;
  rack = createRack({
    loadAddon: () => ({ addon, error: null }),
    store,
    newSlotId: () => String(++ids).padStart(16, "0"),
  });
  rack.init();
});

describe("vstRack", () => {
  it("adds plugins in order, loads them and hands the addon the chain", async () => {
    rack.add(AMP.id);
    rack.add(EQ.id);
    await rack.idle();
    const status = rack.getStatus();
    expect(status.slots.map((s) => [s.name, s.status])).toEqual([
      ["Archetype Petrucci", "ready"],
      ["Pro EQ", "ready"],
    ]);
    expect(addon.chain).toEqual([
      { slot: "0000000000000001", bypass: false },
      { slot: "0000000000000002", bypass: false },
    ]);
    expect(store.rack).toHaveLength(2);
    expect(status.latencyMs).toBeCloseTo(2, 5);
  });

  it("inserts at a position, reorders and bypasses — all reflected in the chain and on disk", async () => {
    rack.add(AMP.id);
    rack.add(EQ.id, 0);
    await rack.idle();
    expect(rack.getStatus().slots.map((s) => s.name)).toEqual(["Pro EQ", "Archetype Petrucci"]);

    rack.move("0000000000000002", 1);
    rack.setBypass("0000000000000002", true);
    expect(addon.chain).toEqual([
      { slot: "0000000000000001", bypass: false },
      { slot: "0000000000000002", bypass: true },
    ]);
    expect(store.rack.map((s) => [s.id, s.bypass])).toEqual([
      ["0000000000000001", false],
      ["0000000000000002", true],
    ]);
    expect(rack.getStatus().latencyMs).toBeCloseTo(1, 5); // bypassed slot adds nothing
  });

  it("removing a slot unloads it and forgets its settings", async () => {
    rack.add(AMP.id);
    await rack.idle();
    rack.remove("0000000000000001");
    await rack.idle();
    expect(addon.unload).toHaveBeenCalledWith("0000000000000001");
    expect(store.deleteState).toHaveBeenCalledWith("0000000000000001");
    expect(rack.getStatus().slots).toEqual([]);
    expect(addon.chain).toEqual([]);
  });

  it("plays silence while a plugin that should be playing is still loading", async () => {
    addon.blockNext = true;
    rack.add(AMP.id);
    await Promise.resolve();
    const left = new Float32Array([0.5, 0.5]);
    const right = new Float32Array(2);
    rack.processBlock(left, 2, right);
    expect([...left, ...right]).toEqual([0, 0, 0, 0]);
    addon.releaseLoad();
    await rack.idle();
    rack.processBlock(left.fill(0.5), 2, right);
    expect([...right]).toEqual([0.25, 0.25]);
  });

  it("restores the saved rack lazily — only once VST mode is entered", async () => {
    store.rack = [{ id: "00000000000000aa", pluginId: AMP.id, name: AMP.name, vendor: "", bypass: false }];
    store.states.set("00000000000000aa", Buffer.from("saved"));
    const restored = createRack({ loadAddon: () => ({ addon, error: null }), store });
    restored.init();
    expect(restored.getStatus().slots[0].status).toBe("idle");
    expect(addon.load).not.toHaveBeenCalled();

    restored.applyParams({ toneMode: "vst" });
    await restored.idle();
    expect(restored.isActive()).toBe(true);
    expect(addon.load).toHaveBeenCalledWith(expect.objectContaining({ slot: "00000000000000aa", state: Buffer.from("saved") }));
    expect(restored.getStatus().slots[0].status).toBe("ready");
  });

  it("saves a slot's settings when its window closes", async () => {
    rack.add(AMP.id);
    await rack.idle();
    await rack.openEditor("0000000000000001");
    expect(rack.getStatus().slots[0].editorOpen).toBe(true);
    addon.emit("editor-closed", { slot: "0000000000000001" });
    await new Promise((r) => setTimeout(r, 5));
    await rack.idle();
    expect(rack.getStatus().slots[0].editorOpen).toBe(false);
    expect(store.writeState).toHaveBeenCalledWith("0000000000000001", Buffer.from("state:0000000000000001"));
  });

  it("marks a slot whose plugin left the library instead of failing the rack", async () => {
    store.rack = [{ id: "00000000000000bb", pluginId: "0".repeat(32), name: "Gone", vendor: "", bypass: false }];
    const restored = createRack({ loadAddon: () => ({ addon, error: null }), store });
    restored.init();
    restored.applyParams({ toneMode: "vst" });
    await restored.idle();
    expect(restored.getStatus().slots[0]).toMatchObject({ name: "Gone", status: "error" });
  });

  it("reports unsupported machines without throwing on read-only calls", () => {
    const none = createRack({ loadAddon: () => ({ addon: null, error: "Windows only" }), store });
    none.init();
    expect(none.getStatus()).toMatchObject({ supported: false, error: "Windows only" });
    expect(none.isActive()).toBe(false);
    expect(() => none.add(AMP.id)).toThrow("Windows only");
  });
});
