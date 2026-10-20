import type {
  VstLibrary,
  VstRackSlot,
  VstRackStatus,
  VstScanProgress,
} from "types/vstHost";
import { create } from "zustand";

/**
 * Tone Studio's VST mode: the plugin library (what's installed) and the rack
 * (what the guitar plays through).
 *
 * The rack lives in the Electron audio process and outlives every React tree,
 * same as the amp itself (see ampSimStore), so this is one module-level store
 * fed by bridge events. Electron-only: every action no-ops while
 * window.vstHost is absent — the web build and older desktop shells never
 * offer VST mode.
 */

interface VstHostState {
  /** True once the bridge has been seen (desktop app on Windows / Apple Silicon Mac). */
  available: boolean;
  library: VstLibrary | null;
  /** A scan or an add is reading plugin files right now. */
  scanning: boolean;
  scanProgress: VstScanProgress | null;
  libraryError: string | null;
  rack: VstRackStatus | null;
  /** Slot whose window is being opened (may include a multi-second load). */
  openingSlotId: string | null;
  actionError: string | null;
}

const INITIAL: VstHostState = {
  available: false,
  library: null,
  scanning: false,
  scanProgress: null,
  libraryError: null,
  rack: null,
  openingSlotId: null,
  actionError: null,
};

export const useVstHostStore = create<VstHostState>()(() => INITIAL);

const set = (patch: Partial<VstHostState>) => useVstHostStore.setState(patch);
const get = () => useVstHostStore.getState();

const api = () => (window.vstHost?.isAvailable ? window.vstHost : null);

/** ipcRenderer.invoke wraps main-process errors in a long prefix. */
export const bridgeErrorMessage = (e: unknown, fallback: string) =>
  e instanceof Error && e.message
    ? e.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, "")
    : fallback;

let initialised = false;

/** Client-only: wire the bridge up once and read library + rack. */
export const initVstHost = () => {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  const host = api();
  if (!host) return;
  set({ available: true });

  host.onEvent((event) => {
    if (event.type === "status") {
      set({ rack: event.status });
    } else if (event.type === "engine-exit") {
      // A plugin crash takes the engine with it; nothing is loaded anymore.
      const { rack } = get();
      set({
        rack: rack && {
          ...rack,
          slots: rack.slots.map((s) => ({
            ...s,
            status: "idle",
            editorOpen: false,
          })),
        },
      });
    } else {
      set({ actionError: event.message });
    }
  });
  host.onScanProgress((scanProgress) => set({ scanProgress }));

  host
    .listPlugins()
    .then((library) => set({ library }))
    .catch((e) =>
      set({ libraryError: bridgeErrorMessage(e, "Could not read plugins") }),
    );
  host
    .getRack()
    .then((rack) => set({ rack }))
    .catch(() => {
      /* engine not up yet — the next status event fills it in */
    });
};

// ── Library ──────────────────────────────────────────────────────────────────

const runLibraryJob = async (job: () => Promise<VstLibrary | null>) => {
  if (get().scanning) return null;
  set({ scanning: true, libraryError: null, scanProgress: null });
  try {
    const library = await job();
    if (library) set({ library });
    return library;
  } catch (e) {
    set({ libraryError: bridgeErrorMessage(e, "Could not read plugins") });
    return null;
  } finally {
    set({ scanning: false, scanProgress: null });
  }
};

/** "Scan this computer" — only ever on the player's click. */
export const scanVstPlugins = () => {
  const host = api();
  return host ? runLibraryJob(() => host.scan()) : Promise.resolve(null);
};

export const addVstPluginFile = () => {
  const host = api();
  return host ? runLibraryJob(() => host.addFile()) : Promise.resolve(null);
};

export const addVstPluginFolder = () => {
  const host = api();
  return host ? runLibraryJob(() => host.addFolder()) : Promise.resolve(null);
};

export const removeVstSource = (sourcePath: string) => {
  const host = api();
  return host
    ? runLibraryJob(() => host.removeSource(sourcePath))
    : Promise.resolve(null);
};

// ── Rack ─────────────────────────────────────────────────────────────────────

const runRackAction = async (action: () => Promise<VstRackStatus>) => {
  set({ actionError: null });
  try {
    set({ rack: await action() });
  } catch (e) {
    set({ actionError: bridgeErrorMessage(e, "The rack could not change") });
  }
};

/** Patches the rack locally first, so dragging and toggling feel instant. */
const optimistic = (update: (slots: VstRackSlot[]) => VstRackSlot[]) => {
  const { rack } = get();
  if (rack) set({ rack: { ...rack, slots: update(rack.slots) } });
};

export const addToVstRack = (pluginId: string, index?: number) => {
  const host = api();
  if (!host) return Promise.resolve();
  return runRackAction(() => host.addToRack(pluginId, index));
};

export const removeFromVstRack = (slotId: string) => {
  const host = api();
  if (!host) return Promise.resolve();
  optimistic((slots) => slots.filter((s) => s.id !== slotId));
  return runRackAction(() => host.removeFromRack(slotId));
};

export const moveInVstRack = (slotId: string, toIndex: number) => {
  const host = api();
  if (!host) return Promise.resolve();
  optimistic((slots) => {
    const from = slots.findIndex((s) => s.id === slotId);
    if (from < 0) return slots;
    const next = slots.slice();
    const [slot] = next.splice(from, 1);
    next.splice(toIndex, 0, slot);
    return next;
  });
  return runRackAction(() => host.moveInRack(slotId, toIndex));
};

export const setVstSlotBypass = (slotId: string, bypass: boolean) => {
  const host = api();
  if (!host) return Promise.resolve();
  optimistic((slots) =>
    slots.map((s) => (s.id === slotId ? { ...s, bypass } : s)),
  );
  return runRackAction(() => host.setBypass(slotId, bypass));
};

export const openVstSlotEditor = async (slotId: string) => {
  const host = api();
  if (!host || get().openingSlotId) return;
  set({ openingSlotId: slotId });
  await runRackAction(() => host.openEditor(slotId));
  set({ openingSlotId: null });
};

export const closeVstSlotEditor = (slotId: string) => {
  const host = api();
  if (!host) return Promise.resolve();
  return runRackAction(() => host.closeEditor(slotId));
};

export const dismissVstError = () => set({ actionError: null });

/** Test seam: forget the bridge and every piece of state. */
export const resetVstHostStoreForTests = () => {
  initialised = false;
  useVstHostStore.setState(INITIAL, true);
};
