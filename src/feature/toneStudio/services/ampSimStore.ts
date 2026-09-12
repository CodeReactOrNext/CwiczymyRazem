import {
  readPersistedChannel,
  readPersistedDeviceId,
  readPersistedOutputChannel,
  readPersistedOutputDeviceId,
} from "hooks/useNativeAudioDevices";
import type {
  AmpDiagnostics,
  AmpOverloadInfo,
  AmpParams,
  AmpStreamInfo,
  ConnectionIssueInfo,
} from "types/nativeAudio";

/**
 * The amp simulator's state, owned by the module rather than by whichever
 * component happens to be showing it.
 *
 * The stream itself lives in the Electron main process and outlives every
 * React tree the renderer builds — so the renderer's model of it has to as
 * well. When this was per-hook state, each mounted control had its own idea of
 * whether the amp was on, and unmounting any of them stopped the stream: the
 * amp went silent the moment you navigated away from Tone Studio. One store,
 * one set of bridge listeners, no teardown on unmount.
 *
 * Electron-only: every action no-ops when window.nativeAmp is absent, so the
 * web build renders the same components with a permanently "unavailable" amp.
 */

const BUFFER_SIZE_STORAGE_KEY = "amp_sim_buffer_size";
const PARAMS_STORAGE_KEY = "amp_sim_params";
const ACTIVE_PRESET_STORAGE_KEY = "amp_sim_active_preset";

const DEFAULT_BUFFER_SIZE = 256;

export const DEFAULT_PARAMS: AmpParams = {
  preampGain: 0.3,
  drive: 0.5,
  bass: 0.5,
  mid: 0.5,
  treble: 0.5,
  level: 0.6,
  cab: true,
  gate: true,
  overdriveEnabled: false,
  overdriveDrive: 0.35,
  overdriveTone: 0.5,
  overdriveLevel: 0.5,
  delayEnabled: false,
  delayMs: 300,
  delayFeedback: 0.35,
  delayMix: 0.25,
  irId: null,
  namEnabled: false,
  namModelId: null,
};

export interface AmpSimState {
  /** True once the Electron bridge has been seen — false during SSR and on web. */
  available: boolean;
  isOn: boolean;
  isBusy: boolean;
  error: string | null;
  info: AmpStreamInfo | null;
  params: AmpParams;
  bufferSize: number;
  overload: (AmpOverloadInfo & { at: number }) | null;
  connectionIssue: ConnectionIssueInfo | null;
  diagnostics: AmpDiagnostics | null;
  /** Which saved preset the current params came from. */
  activePresetId: string | null;
}

/** Snapshot handed to SSR and to the hydration render — a stable identity, so
 *  useSyncExternalStore never sees a "changed" server snapshot. */
const INITIAL_STATE: AmpSimState = {
  available: false,
  isOn: false,
  isBusy: false,
  error: null,
  info: null,
  params: DEFAULT_PARAMS,
  bufferSize: DEFAULT_BUFFER_SIZE,
  overload: null,
  connectionIssue: null,
  diagnostics: null,
  activePresetId: null,
};

let state: AmpSimState = INITIAL_STATE;
const listeners = new Set<() => void>();

const setState = (patch: Partial<AmpSimState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

export const getAmpSimState = (): AmpSimState => state;
export const getServerAmpSimState = (): AmpSimState => INITIAL_STATE;

// ── Persistence ──────────────────────────────────────────────────────────────

function readPersistedBufferSize(): number {
  try {
    const raw = localStorage.getItem(BUFFER_SIZE_STORAGE_KEY);
    if (raw !== null) {
      const value = parseInt(raw, 10);
      if (!isNaN(value) && value > 0) return value;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_BUFFER_SIZE;
}

function readPersistedParams(): AmpParams {
  try {
    const raw = localStorage.getItem(PARAMS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_PARAMS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_PARAMS;
}

function readPersistedActivePresetId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PRESET_STORAGE_KEY);
  } catch {
    return null;
  }
}

// ── Live stream health ───────────────────────────────────────────────────────

/** Live stream health (underruns = audible gaps, dropped blocks, DSP load),
 *  polled only while monitoring is on. */
let diagnosticsTimer: ReturnType<typeof setInterval> | null = null;

const stopDiagnosticsPolling = () => {
  if (diagnosticsTimer === null) return;
  clearInterval(diagnosticsTimer);
  diagnosticsTimer = null;
};

const startDiagnosticsPolling = () => {
  stopDiagnosticsPolling();
  // Version-skew guard: an older desktop shell's preload.js may not expose
  // getDiagnostics even though window.nativeAmp itself is present.
  const getDiagnostics = window.nativeAmp?.getDiagnostics;
  if (typeof getDiagnostics !== "function") return;
  const poll = () => {
    getDiagnostics()
      .then((diagnostics) => setState({ diagnostics }))
      .catch(() => {
        /* ignore */
      });
  };
  poll();
  diagnosticsTimer = setInterval(poll, 1000);
};

/** Banners that read as toasts rather than permanent state. */
let overloadTimer: ReturnType<typeof setTimeout> | null = null;
let connectionTimer: ReturnType<typeof setTimeout> | null = null;

const BANNER_MS = 6000;

// ── Bridge wiring, done once for the app's lifetime ──────────────────────────

const attachBridgeListeners = () => {
  // Each guard covers the same version skew: the web bundle updates instantly
  // but the Electron shell only on its own cycle, so an older preload.js may
  // expose window.nativeAmp without these newer channels.
  if (typeof window.nativeAmp?.onOverload === "function") {
    window.nativeAmp.onOverload((event) => {
      setState({ overload: { ...event, at: Date.now() } });
      if (overloadTimer) clearTimeout(overloadTimer);
      overloadTimer = setTimeout(() => setState({ overload: null }), BANNER_MS);
    });
  }

  // Stream loss/recovery (device unplugged, driver reset from its own control
  // panel, system resume) — the amp shares the one underlying stream with
  // capture, so it can be knocked out the same way. "failed" means retries are
  // exhausted and the stream really is gone, so monitoring goes off for real.
  if (typeof window.nativeAmp?.onConnectionIssue === "function") {
    window.nativeAmp.onConnectionIssue((event) => {
      setState({ connectionIssue: event });
      if (event.status === "failed") {
        stopDiagnosticsPolling();
        setState({
          isOn: false,
          error: event.message || "Audio interface disconnected",
        });
      } else if (event.status === "recovered") {
        // frameSize/latency can shift slightly when the stream reopens.
        window.nativeAmp
          ?.getStatus()
          .then((status) => {
            if (status.info) setState({ info: status.info });
          })
          .catch(() => {
            /* ignore */
          });
      }
      if (connectionTimer) clearTimeout(connectionTimer);
      if (event.status === "lost" || event.status === "retrying") return;
      connectionTimer = setTimeout(
        () => setState({ connectionIssue: null }),
        BANNER_MS,
      );
    });
  }

  // Another window of the same app changing the selected preset.
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== ACTIVE_PRESET_STORAGE_KEY) return;
    setState({ activePresetId: readPersistedActivePresetId() });
  });
};

/**
 * Adopt a stream the main process is already running. The engine outlives the
 * renderer, so after a reload (or a dev hot refresh) the amp can be live while
 * this store still says "off" — without this, the UI would offer to start a
 * stream that is already playing.
 */
const syncFromEngine = () => {
  window.nativeAmp
    ?.getStatus()
    .then((status) => {
      if (!status.isOpen || !status.info) return;
      setState({ isOn: true, info: status.info });
      // The engine kept the params it was started with; the persisted ones are
      // what the user last saw, so make the two agree on the stored version.
      window.nativeAmp?.setParams(state.params).catch(() => {
        /* ignore */
      });
      startDiagnosticsPolling();
    })
    .catch(() => {
      /* ignore */
    });
};

let hydrated = false;

/** Client-only: pull persisted settings in and wire the bridge up, once. */
const hydrate = () => {
  if (hydrated) return;
  hydrated = true;
  setState({
    available: !!window.nativeAmp,
    params: readPersistedParams(),
    bufferSize: readPersistedBufferSize(),
    activePresetId: readPersistedActivePresetId(),
  });
  if (!window.nativeAmp) return;
  attachBridgeListeners();
  syncFromEngine();
};

export const subscribeAmpSim = (listener: () => void) => {
  // Before the listener joins: the first subscriber's hydration is picked up by
  // useSyncExternalStore's own post-subscribe snapshot check, so nobody needs
  // to be notified mid-subscribe.
  hydrate();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// ── Actions ──────────────────────────────────────────────────────────────────

export const startAmp = async () => {
  if (!window.nativeAmp || state.isBusy) return;
  setState({ isBusy: true, error: null });
  try {
    const info = await window.nativeAmp.start({
      deviceId: readPersistedDeviceId() ?? undefined,
      channel: readPersistedChannel(),
      outputDeviceId: readPersistedOutputDeviceId() ?? undefined,
      outputChannel: readPersistedOutputChannel(),
      frameSize: readPersistedBufferSize(),
      params: state.params,
    });
    setState({ info, isOn: true });
    startDiagnosticsPolling();
  } catch (e) {
    setState({
      isOn: false,
      error:
        (e instanceof Error && e.message) || "Failed to start the simulator",
    });
  } finally {
    setState({ isBusy: false });
  }
};

export const stopAmp = async () => {
  if (!window.nativeAmp) return;
  stopDiagnosticsPolling();
  try {
    await window.nativeAmp.stop();
  } catch {
    /* ignore */
  }
  setState({ isOn: false, info: null, diagnostics: null });
};

export const toggleAmp = () => (state.isOn ? stopAmp() : startAmp());

/** Re-open the stream on the currently persisted device (e.g. after switching
 *  audio interface). No-op when the amp isn't running. */
export const restartAmp = async () => {
  if (!state.isOn) return;
  await stopAmp();
  await startAmp();
};

export const setAmpParams = (patch: Partial<AmpParams>) => {
  const params = { ...state.params, ...patch };
  setState({ params });
  try {
    localStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(params));
  } catch {
    /* ignore */
  }
  window.nativeAmp?.setParams(patch).catch(() => {
    /* ignore */
  });
};

/** Change the requested ASIO/WASAPI buffer size (in frames). Persists and, if
 *  currently running, reopens the stream so it takes effect immediately — the
 *  driver may still hand back something else (see nativeAudioEngine's retry).
 *  The amp's size also wins when note-detection capture shares the stream
 *  (capture works at any block size — see electron/streamShape.js), so
 *  toggling Pitch Detect during a session never changes the amp's latency. */
export const setAmpBufferSize = async (size: number) => {
  setState({ bufferSize: size });
  try {
    localStorage.setItem(BUFFER_SIZE_STORAGE_KEY, String(size));
  } catch {
    /* ignore */
  }
  await restartAmp();
};

export const setActiveAmpPresetId = (id: string | null) => {
  setState({ activePresetId: id });
  try {
    if (id === null) localStorage.removeItem(ACTIVE_PRESET_STORAGE_KEY);
    else localStorage.setItem(ACTIVE_PRESET_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
};

/** Apply a saved preset and remember it as the selected one. */
export const loadAmpPreset = (id: string, presetParams: AmpParams) => {
  setAmpParams(presetParams);
  setActiveAmpPresetId(id);
};

/** Test seam: drops every listener, timer and hydration flag so each test file
 *  starts from a store that has never seen a bridge. */
export const resetAmpSimStoreForTests = () => {
  stopDiagnosticsPolling();
  if (overloadTimer) clearTimeout(overloadTimer);
  if (connectionTimer) clearTimeout(connectionTimer);
  overloadTimer = null;
  connectionTimer = null;
  listeners.clear();
  hydrated = false;
  state = INITIAL_STATE;
};
