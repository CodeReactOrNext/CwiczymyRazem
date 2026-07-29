import { useCallback, useEffect, useState } from "react";
import type { NativeAudioDevice } from "types/nativeAudio";

// Shared input/output-device discovery + selection for the native (Electron) paths.
// The chosen input device id is persisted under one key so BOTH the amp simulator
// and the note-detection capture use the same interface. Output device selection
// only matters to the amp (ASIO forces output = input device on the engine side —
// see nativeAudioEngine.js's computeDesiredShape — so it only takes effect on
// WASAPI/other APIs where input and output can genuinely differ).

export const DEVICE_STORAGE_KEY = "native_audio_device_id";
export const OUTPUT_DEVICE_STORAGE_KEY = "native_amp_output_device_id";

export function readPersistedDeviceId(): number | null {
  try {
    const raw = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (raw !== null) {
      const v = parseInt(raw, 10);
      if (!isNaN(v)) return v;
    }
  } catch { /* ignore */ }
  return null;
}

/** null means "no explicit choice" — the engine picks (ASIO: same as input;
 *  WASAPI/other: system default output). */
export function readPersistedOutputDeviceId(): number | null {
  try {
    const raw = localStorage.getItem(OUTPUT_DEVICE_STORAGE_KEY);
    if (raw !== null) {
      const v = parseInt(raw, 10);
      if (!isNaN(v)) return v;
    }
  } catch { /* ignore */ }
  return null;
}

export function useNativeAudioDevices() {
  const [devices, setDevices] = useState<NativeAudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<NativeAudioDevice[]>([]);
  const [api, setApi] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedOutputId, setSelectedOutputId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const bridge = (typeof window !== "undefined" && (window.nativeAudio || window.nativeAmp)) || null;
    if (!bridge) return;
    setLoading(true);
    try {
      const { api: apiName, devices: all } = await bridge.listDevices();
      const inputs = all.filter((d) => d.inputChannels > 0);
      const outputs = all.filter((d) => d.outputChannels > 0);
      setApi(apiName);
      setDevices(inputs);
      setOutputDevices(outputs);
      setSelectedId((prev) => {
        const persisted = prev ?? readPersistedDeviceId();
        if (persisted != null && inputs.some((d) => d.id === persisted)) return persisted;
        return (inputs.find((d) => d.isDefaultInput) || inputs[0])?.id ?? null;
      });
      setSelectedOutputId((prev) => {
        const persisted = prev ?? readPersistedOutputDeviceId();
        return persisted != null && outputs.some((d) => d.id === persisted) ? persisted : null;
      });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Hot-plug: the main process diffs the device list on a background poll and
  // notifies on any change (see nativeAudioEngine.js) — without this, a newly
  // plugged-in interface only shows up after the user manually clicks refresh.
  useEffect(() => {
    const bridge = (typeof window !== "undefined" && (window.nativeAudio || window.nativeAmp)) || null;
    if (!bridge) return undefined;
    return bridge.onDevicesChanged(() => refresh());
  }, [refresh]);

  const select = useCallback((id: number) => {
    setSelectedId(id);
    try { localStorage.setItem(DEVICE_STORAGE_KEY, String(id)); } catch { /* ignore */ }
  }, []);

  /** Pass null to clear the explicit choice and go back to the engine's default. */
  const selectOutput = useCallback((id: number | null) => {
    setSelectedOutputId(id);
    try {
      if (id == null) localStorage.removeItem(OUTPUT_DEVICE_STORAGE_KEY);
      else localStorage.setItem(OUTPUT_DEVICE_STORAGE_KEY, String(id));
    } catch { /* ignore */ }
  }, []);

  return { devices, outputDevices, api, selectedId, selectedOutputId, loading, refresh, select, selectOutput };
}
