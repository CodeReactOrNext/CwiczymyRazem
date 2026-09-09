import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  AmpDiagnostics,
  AmpOverloadInfo,
  AmpParams,
  AmpStreamInfo,
  ConnectionIssueInfo,
} from "types/nativeAudio";

import {
  readPersistedChannel,
  readPersistedDeviceId,
  readPersistedOutputChannel,
  readPersistedOutputDeviceId,
} from "./useNativeAudioDevices";

// Electron-only amp simulator control. Talks to window.nativeAmp (preload bridge)
// which runs a duplex ASIO/WASAPI stream + DSP chain in the main process.

const BUFFER_SIZE_STORAGE_KEY = "amp_sim_buffer_size";
const DEFAULT_BUFFER_SIZE = 256;

function readPersistedBufferSize(): number {
  try {
    const raw = localStorage.getItem(BUFFER_SIZE_STORAGE_KEY);
    if (raw !== null) {
      const v = parseInt(raw, 10);
      if (!isNaN(v) && v > 0) return v;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_BUFFER_SIZE;
}

const PARAMS_STORAGE_KEY = "amp_sim_params";
const DEFAULT_PARAMS: AmpParams = {
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

// Which saved preset the current params came from. Lives in localStorage (not
// hook state) so the Tone Studio page and the in-session amp popover — each
// with its own hook instance — agree on what is selected; a custom event lets
// instances mounted at the same time follow each other too.
const ACTIVE_PRESET_STORAGE_KEY = "amp_sim_active_preset";
const ACTIVE_PRESET_EVENT = "amp-sim-active-preset-change";

function readPersistedActivePresetId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PRESET_STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribeActivePresetId(onChange: () => void) {
  window.addEventListener(ACTIVE_PRESET_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(ACTIVE_PRESET_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const getServerActivePresetId = () => null;

function loadParams(): AmpParams {
  try {
    const raw = localStorage.getItem(PARAMS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_PARAMS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_PARAMS;
}

export const useAmpSim = () => {
  // Detect the bridge on the client only (avoids SSR/hydration returning null
  // and never re-rendering once window.nativeAmp appears in Electron).
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(!!window.nativeAmp);
  }, []);

  const [isOn, setIsOn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<AmpStreamInfo | null>(null);
  const [params, setParamsState] = useState<AmpParams>(DEFAULT_PARAMS);
  useEffect(() => {
    setParamsState(loadParams());
  }, []);
  const [bufferSize, setBufferSizeState] =
    useState<number>(DEFAULT_BUFFER_SIZE);
  useEffect(() => {
    setBufferSizeState(readPersistedBufferSize());
  }, []);
  const activePresetId = useSyncExternalStore(
    subscribeActivePresetId,
    readPersistedActivePresetId,
    getServerActivePresetId,
  );

  // Surfaces nativeAudioEngine's overload-recovery events (a real audible click
  // just happened because the DSP chain — usually a NAM model — fell behind
  // real time) so the user gets an explanation instead of an unexplained
  // glitch. Auto-clears after a few seconds so it reads as a toast, not a
  // permanent banner.
  const [overload, setOverload] = useState<
    (AmpOverloadInfo & { at: number }) | null
  >(null);
  useEffect(() => {
    // Same version-skew guard as onConnectionIssue below: an older desktop
    // build's preload.js may not expose onOverload yet even though
    // window.nativeAmp itself is present.
    if (!window.nativeAmp || typeof window.nativeAmp.onOverload !== "function")
      return undefined;
    return window.nativeAmp.onOverload((event) =>
      setOverload({ ...event, at: Date.now() }),
    );
  }, []);
  useEffect(() => {
    if (!overload) return undefined;
    const timer = setTimeout(() => setOverload(null), 6000);
    return () => clearTimeout(timer);
  }, [overload]);

  // Live stream health (underruns = audible gaps, dropped blocks, DSP load),
  // polled while monitoring is on. Shown next to the latency estimate so "it
  // crackles at 128" can be reported — and triaged — with actual counts.
  const [diagnostics, setDiagnostics] = useState<AmpDiagnostics | null>(null);
  useEffect(() => {
    if (!isOn) return undefined;
    // Same version-skew guard as the listeners above: older desktop shells don't
    // expose getDiagnostics yet.
    const getDiagnostics = window.nativeAmp?.getDiagnostics;
    if (typeof getDiagnostics !== "function") return undefined;
    const poll = () => {
      getDiagnostics()
        .then((d) => setDiagnostics(d))
        .catch(() => {
          /* ignore */
        });
    };
    poll();
    const timer = setInterval(poll, 1000);
    return () => clearInterval(timer);
  }, [isOn]);

  // Surfaces nativeAudioEngine's stream-loss/recovery (device disconnected, driver
  // reset from its own control panel, system resume) — the amp shares the one
  // underlying stream with capture, so it can be knocked out the same way. "failed"
  // (retries exhausted) turns monitoring off for real, since the stream really is
  // gone; "lost"/"retrying" just show a banner while the engine keeps trying in the
  // background, and "recovered" refreshes the displayed stream info (frameSize/
  // latency can shift slightly on reopen) and self-clears like the overload banner.
  const [connectionIssue, setConnectionIssue] =
    useState<ConnectionIssueInfo | null>(null);
  useEffect(() => {
    // onConnectionIssue landed after some already-installed desktop builds — the
    // web bundle updates instantly but the Electron shell only on its own update
    // cycle, so an older preload.js may not expose it yet. Skip instead of crashing.
    if (
      !window.nativeAmp ||
      typeof window.nativeAmp.onConnectionIssue !== "function"
    )
      return undefined;
    return window.nativeAmp.onConnectionIssue((event) => {
      setConnectionIssue(event);
      if (event.status === "failed") {
        setIsOn(false);
        setError(event.message || "Audio interface disconnected");
      } else if (event.status === "recovered") {
        window.nativeAmp
          ?.getStatus()
          .then((s) => {
            if (s.info) setInfo(s.info);
          })
          .catch(() => {
            /* ignore */
          });
      }
    });
  }, []);
  useEffect(() => {
    if (
      !connectionIssue ||
      connectionIssue.status === "lost" ||
      connectionIssue.status === "retrying"
    )
      return undefined;
    const timer = setTimeout(() => setConnectionIssue(null), 6000);
    return () => clearTimeout(timer);
  }, [connectionIssue]);

  const paramsRef = useRef(params);
  paramsRef.current = params;
  const isOnRef = useRef(isOn);
  isOnRef.current = isOn;

  const start = useCallback(async () => {
    if (!window.nativeAmp || isBusy) return;
    setIsBusy(true);
    setError(null);
    try {
      const deviceId = readPersistedDeviceId() ?? undefined;
      const channel = readPersistedChannel();
      const outputDeviceId = readPersistedOutputDeviceId() ?? undefined;
      const outputChannel = readPersistedOutputChannel();
      const frameSize = readPersistedBufferSize();
      const streamInfo = await window.nativeAmp.start({
        deviceId,
        channel,
        outputDeviceId,
        outputChannel,
        frameSize,
        params: paramsRef.current,
      });
      setInfo(streamInfo);
      setIsOn(true);
    } catch (e: any) {
      setError(e?.message || "Failed to start the simulator");
      setIsOn(false);
    } finally {
      setIsBusy(false);
    }
  }, [isBusy]);

  const stop = useCallback(async () => {
    if (!window.nativeAmp) return;
    try {
      await window.nativeAmp.stop();
    } catch {
      /* ignore */
    }
    setIsOn(false);
    setInfo(null);
    setDiagnostics(null);
  }, []);

  const toggle = useCallback(() => {
    isOn ? stop() : start();
  }, [isOn, start, stop]);

  /** Re-open the stream on the currently persisted device (e.g. after the user
   *  switches their audio interface). No-op if not currently running. */
  const restart = useCallback(async () => {
    if (!isOnRef.current) return;
    await stop();
    await start();
  }, [stop, start]);

  /** Change the requested ASIO/WASAPI buffer size (in frames). Persists and, if
   *  currently running, reopens the stream so it takes effect immediately — the
   *  driver may still hand back something else (see nativeAudioEngine's retry).
   *  The amp's size also wins when note-detection capture shares the stream
   *  (capture works at any block size — see electron/streamShape.js), so
   *  toggling Pitch Detect during a session never changes the amp's latency. */
  const setBufferSize = useCallback(
    async (size: number) => {
      setBufferSizeState(size);
      try {
        localStorage.setItem(BUFFER_SIZE_STORAGE_KEY, String(size));
      } catch {
        /* ignore */
      }
      await restart();
    },
    [restart],
  );

  const setParams = useCallback((patch: Partial<AmpParams>) => {
    setParamsState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    window.nativeAmp?.setParams(patch).catch(() => {
      /* ignore */
    });
  }, []);

  const setActivePresetId = useCallback((id: string | null) => {
    try {
      if (id === null) localStorage.removeItem(ACTIVE_PRESET_STORAGE_KEY);
      else localStorage.setItem(ACTIVE_PRESET_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(ACTIVE_PRESET_EVENT));
  }, []);

  /** Apply a saved preset and remember it as the selected one. */
  const loadPreset = useCallback(
    (id: string, presetParams: AmpParams) => {
      setParams(presetParams);
      setActivePresetId(id);
    },
    [setParams, setActivePresetId],
  );

  // Stop the stream if the component using this hook unmounts.
  useEffect(() => {
    return () => {
      window.nativeAmp?.stop().catch(() => {
        /* ignore */
      });
    };
  }, []);

  return {
    available,
    isOn,
    isBusy,
    error,
    info,
    params,
    bufferSize,
    overload,
    connectionIssue,
    diagnostics,
    activePresetId,
    toggle,
    start,
    stop,
    restart,
    setParams,
    setBufferSize,
    setActivePresetId,
    loadPreset,
  };
};
