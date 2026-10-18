// @vitest-environment jsdom
import type {
  VstHostApi,
  VstHostEvent,
  VstLibrary,
  VstRackSlot,
  VstRackStatus,
} from "types/vstHost";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  initVstHost,
  moveInVstRack,
  openVstSlotEditor,
  resetVstHostStoreForTests,
  scanVstPlugins,
  setVstSlotBypass,
  useVstHostStore,
} from "./vstHostStore";

const slot = (id: string, name: string): VstRackSlot => ({
  id,
  pluginId: "ABCDEF019182FAEB4E445350414A5050",
  name,
  vendor: "Neural DSP",
  bypass: false,
  status: "ready",
  error: null,
  latencyMs: 1.6,
  editorOpen: false,
});

const RACK: VstRackStatus = {
  supported: true,
  error: null,
  toneMode: "vst",
  slots: [slot("0000000000000001", "Amp"), slot("0000000000000002", "Verb")],
  latencyMs: 3.2,
};

const LIBRARY: VstLibrary = {
  scannedAt: 1,
  plugins: [
    {
      id: "ABCDEF019182FAEB4E445350414A5050",
      name: "Archetype Petrucci",
      vendor: "Neural DSP",
      subCategories: "Fx|Distortion",
      version: "1.0.0",
      source: "system",
    },
  ],
  failed: [],
  sources: { folders: [], files: [] },
};

let emit: (event: VstHostEvent) => void = () => {};

const installBridge = (overrides: Partial<VstHostApi> = {}) => {
  const api: VstHostApi = {
    isAvailable: true,
    listPlugins: vi.fn().mockResolvedValue({ ...LIBRARY, scannedAt: null }),
    scan: vi.fn().mockResolvedValue(LIBRARY),
    addFile: vi.fn().mockResolvedValue(null),
    addFolder: vi.fn().mockResolvedValue(null),
    removeSource: vi.fn().mockResolvedValue(LIBRARY),
    getRack: vi.fn().mockResolvedValue(RACK),
    addToRack: vi.fn().mockResolvedValue(RACK),
    removeFromRack: vi.fn().mockResolvedValue(RACK),
    moveInRack: vi.fn(() => new Promise<VstRackStatus>(() => {})),
    setBypass: vi.fn(() => new Promise<VstRackStatus>(() => {})),
    openEditor: vi.fn().mockResolvedValue(RACK),
    closeEditor: vi.fn().mockResolvedValue(RACK),
    onEvent: vi.fn((cb) => {
      emit = cb;
      return () => {};
    }),
    onScanProgress: vi.fn(() => () => {}),
    ...overrides,
  };
  window.vstHost = api;
  return api;
};

beforeEach(() => {
  resetVstHostStoreForTests();
});

afterEach(() => {
  delete window.vstHost;
});

describe("vstHostStore", () => {
  it("stays unavailable and inert without the desktop bridge", async () => {
    initVstHost();
    await scanVstPlugins();
    expect(useVstHostStore.getState()).toMatchObject({
      available: false,
      library: null,
      rack: null,
    });
  });

  it("reads library and rack on init, but never scans on its own", async () => {
    const api = installBridge();
    initVstHost();
    await vi.waitFor(() =>
      expect(useVstHostStore.getState().rack?.slots).toHaveLength(2),
    );
    expect(useVstHostStore.getState().library?.scannedAt).toBeNull();
    expect(api.scan).not.toHaveBeenCalled();
  });

  it("scans on request and flags the scan while it runs", async () => {
    let resolve: (value: VstLibrary) => void = () => {};
    installBridge({
      scan: vi.fn(() => new Promise<VstLibrary>((r) => (resolve = r))),
    });
    initVstHost();
    const pending = scanVstPlugins();
    expect(useVstHostStore.getState().scanning).toBe(true);
    resolve(LIBRARY);
    await pending;
    expect(useVstHostStore.getState()).toMatchObject({
      scanning: false,
      library: LIBRARY,
    });
  });

  it("reorders and bypasses optimistically, before the engine answers", async () => {
    installBridge();
    initVstHost();
    await vi.waitFor(() =>
      expect(useVstHostStore.getState().rack).not.toBeNull(),
    );

    moveInVstRack("0000000000000002", 0);
    expect(useVstHostStore.getState().rack?.slots.map((s) => s.name)).toEqual([
      "Verb",
      "Amp",
    ]);
    setVstSlotBypass("0000000000000001", true);
    expect(
      useVstHostStore.getState().rack?.slots.find((s) => s.name === "Amp")
        ?.bypass,
    ).toBe(true);
  });

  it("follows rack events and drops loaded state when the engine dies", () => {
    installBridge();
    initVstHost();
    emit({
      type: "status",
      status: { ...RACK, slots: [{ ...RACK.slots[0], editorOpen: true }] },
    });
    expect(useVstHostStore.getState().rack?.slots[0].editorOpen).toBe(true);
    emit({ type: "engine-exit", code: 1 });
    expect(useVstHostStore.getState().rack?.slots[0]).toMatchObject({
      status: "idle",
      editorOpen: false,
    });
  });

  it("shows the main-process reason, not Electron's IPC wrapper, when a window can't open", async () => {
    installBridge({
      openEditor: vi
        .fn()
        .mockRejectedValue(
          new Error(
            "Error invoking remote method 'vst:open-editor': Error: The plugin is not loaded",
          ),
        ),
    });
    initVstHost();
    await openVstSlotEditor("0000000000000001");
    expect(useVstHostStore.getState()).toMatchObject({
      openingSlotId: null,
      actionError: "The plugin is not loaded",
    });
  });
});
