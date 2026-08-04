import { useCallback, useEffect, useRef, useState } from "react";
import type { AmpOverloadInfo, AmpParams, AmpStreamInfo, ConnectionIssueInfo } from "types/nativeAudio";

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
  } catch { /* ignore */ }
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

function loadParams(): AmpParams {
  try {
    const raw = localStorage.getItem(PARAMS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_PARAMS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_PARAMS;
}

export const useAmpSim = () => {
  // Detect the bridge on the client only (avoids SSR/hydration returning null
  // and never re-rendering once window.nativeAmp appears in Electron).
  const [available, setAvailable] = useState(false);
  useEffect(() => { setAvailable(!!window.nativeAmp); }, []);

  const [isOn, setIsOn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<AmpStreamInfo | null>(null);
  const [params, setParamsState] = useState<AmpParams>(DEFAULT_PARAMS);
  useEffect(() => { setParamsState(loadParams()); }, []);
  const [bufferSize, setBufferSizeState] = useState<number>(DEFAULT_BUFFER_SIZE);
  useEffect(() => { setBufferSizeState(readPersistedBufferSize()); }, []);

  // Surfaces nativeAudioEngine's overload-recovery events (a real audible click
  // just happened because the DSP chain — usually a NAM model — fell behind
  // real time) so the user gets an explanation instead of an unexplained
  // glitch. Auto-clears after a few seconds so it reads as a toast, not a
  // permanent banner.
  const [overload, setOverload] = useState<(AmpOverloadInfo & { at: number }) | null>(null);
  useEffect(() => {
    // Same version-skew guard as onConnectionIssue below: an older desktop
    // build's preload.js may not expose onOverload yet even though
    // window.nativeAmp itself is present.
    if (!window.nativeAmp || typeof window.nativeAmp.onOverload !== "function") return undefined;
    return window.nativeAmp.onOverload((event) => setOverload({ ...event, at: Date.now() }));
  }, []);
  useEffect(() => {
    if (!overload) return undefined;
    const timer = setTimeout(() => setOverload(null), 6000);
    return () => clearTimeout(timer);
  }, [overload]);

  // Surfaces nativeAudioEngine's stream-loss/recovery (device disconnected, driver
  // reset from its own control panel, system resume) — the amp shares the one
  // underlying stream with capture, so it can be knocked out the same way. "failed"
  // (retries exhausted) turns monitoring off for real, since the stream really is
  // gone; "lost"/"retrying" just show a banner while the engine keeps trying in the
  // background, and "recovered" refreshes the displayed stream info (frameSize/
  // latency can shift slightly on reopen) and self-clears like the overload banner.
  const [connectionIssue, setConnectionIssue] = useState<ConnectionIssueInfo | null>(null);
  useEffect(() => {
    // onConnectionIssue landed after some already-installed desktop builds — the
    // web bundle updates instantly but the Electron shell only on its own update
    // cycle, so an older preload.js may not expose it yet. Skip instead of crashing.
    if (!window.nativeAmp || typeof window.nativeAmp.onConnectionIssue !== "function") return undefined;
    return window.nativeAmp.onConnectionIssue((event) => {
      setConnectionIssue(event);
      if (event.status === "failed") {
        setIsOn(false);
        setError(event.message || "Audio interface disconnected");
      } else if (event.status === "recovered") {
        window.nativeAmp?.getStatus().then((s) => { if (s.info) setInfo(s.info); }).catch(() => { /* ignore */ });
      }
    });
  }, []);
  useEffect(() => {
    if (!connectionIssue || connectionIssue.status === "lost" || connectionIssue.status === "retrying") return undefined;
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
        deviceId, channel, outputDeviceId, outputChannel, frameSize, params: paramsRef.current,
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
    try { await window.nativeAmp.stop(); } catch { /* ignore */ }
    setIsOn(false);
    setInfo(null);
  }, []);

  const toggle = useCallback(() => { (isOn ? stop() : start()); }, [isOn, start, stop]);

  /** Re-open the stream on the currently persisted device (e.g. after the user
   *  switches their audio interface). No-op if not currently running. */
  const restart = useCallback(async () => {
    if (!isOnRef.current) return;
    await stop();
    await start();
  }, [stop, start]);

  /** Change the requested ASIO/WASAPI buffer size (in frames). Persists and, if
   *  currently running, reopens the stream so it takes effect immediately — the
   *  driver may still hand back something else (see nativeAudioEngine's retry),
   *  and if note-detection capture is attached at the same time it wins the
   *  shared stream's frame size regardless (it's the timing-critical side), so
   *  this only reliably applies when the amp runs standalone. */
  const setBufferSize = useCallback(async (size: number) => {
    setBufferSizeState(size);
    try { localStorage.setItem(BUFFER_SIZE_STORAGE_KEY, String(size)); } catch { /* ignore */ }
    await restart();
  }, [restart]);

  const setParams = useCallback((patch: Partial<AmpParams>) => {
    setParamsState((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    window.nativeAmp?.setParams(patch).catch(() => { /* ignore */ });
  }, []);

  // Stop the stream if the component using this hook unmounts.
  useEffect(() => {
    return () => { window.nativeAmp?.stop().catch(() => { /* ignore */ }); };
  }, []);

  return {
    available, isOn, isBusy, error, info, params, bufferSize, overload, connectionIssue,
    toggle, start, stop, restart, setParams, setBufferSize,
  };
};
