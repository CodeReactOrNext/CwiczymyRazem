import { useCallback, useEffect, useRef, useState } from "react";

import type { AmpParams, AmpStreamInfo } from "types/nativeAudio";
import { readPersistedDeviceId } from "./useNativeAudioDevices";

// Electron-only amp simulator control. Talks to window.nativeAmp (preload bridge)
// which runs a duplex ASIO/WASAPI stream + DSP chain in the main process.

const PARAMS_STORAGE_KEY = "amp_sim_params";
const DEFAULT_PARAMS: AmpParams = { drive: 0.5, tone: 0.5, level: 0.6, cab: true };

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
      const streamInfo = await window.nativeAmp.start({ deviceId, params: paramsRef.current });
      setInfo(streamInfo);
      setIsOn(true);
    } catch (e: any) {
      setError(e?.message || "Nie udało się uruchomić symulatora");
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

  return { available, isOn, isBusy, error, info, params, toggle, start, stop, restart, setParams };
};
