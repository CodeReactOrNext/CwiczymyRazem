import {
  getAmpSimState,
  getServerAmpSimState,
  loadAmpPreset,
  restartAmp,
  setActiveAmpPresetId,
  setAmpBufferSize,
  setAmpParams,
  startAmp,
  stopAmp,
  subscribeAmpSim,
  toggleAmp,
} from "feature/toneStudio/services/ampSimStore";
import { useSyncExternalStore } from "react";

/**
 * Read/control the amp simulator from anywhere in the app.
 *
 * All the state lives in feature/toneStudio/services/ampSimStore — one store
 * for the whole renderer, matching the single stream the Electron main process
 * actually runs. Every control that mounts this hook (the header button, the
 * in-session popover, Tone Studio) sees the same amp, and unmounting one never
 * stops it: the amp stays on until someone turns it off.
 *
 * Electron-only. On the web build `available` stays false and every action is
 * a no-op, so callers can render unconditionally and gate on `available`.
 */
export const useAmpSim = () => {
  const state = useSyncExternalStore(
    subscribeAmpSim,
    getAmpSimState,
    getServerAmpSimState,
  );

  return {
    ...state,
    toggle: toggleAmp,
    start: startAmp,
    stop: stopAmp,
    restart: restartAmp,
    setParams: setAmpParams,
    setBufferSize: setAmpBufferSize,
    setActivePresetId: setActiveAmpPresetId,
    loadPreset: loadAmpPreset,
  };
};
