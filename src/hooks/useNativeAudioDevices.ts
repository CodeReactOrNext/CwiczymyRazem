import { useCallback, useEffect, useState } from "react";

import type { NativeAudioDevice } from "types/nativeAudio";

// Shared input-device discovery + selection for the native (Electron) paths.
// The chosen device id is persisted under one key so BOTH the amp simulator and
// the note-detection capture use the same interface.

export const DEVICE_STORAGE_KEY = "native_audio_device_id";

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

export function useNativeAudioDevices() {
  const [devices, setDevices] = useState<NativeAudioDevice[]>([]);
  const [api, setApi] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const bridge = (typeof window !== "undefined" && (window.nativeAudio || window.nativeAmp)) || null;
    if (!bridge) return;
    setLoading(true);
    try {
      const { api: apiName, devices: all } = await bridge.listDevices();
      const inputs = all.filter((d) => d.inputChannels > 0);
      setApi(apiName);
      setDevices(inputs);
      setSelectedId((prev) => {
        const persisted = prev ?? readPersistedDeviceId();
        if (persisted != null && inputs.some((d) => d.id === persisted)) return persisted;
        return (inputs.find((d) => d.isDefaultInput) || inputs[0])?.id ?? null;
      });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const select = useCallback((id: number) => {
    setSelectedId(id);
    try { localStorage.setItem(DEVICE_STORAGE_KEY, String(id)); } catch { /* ignore */ }
  }, []);

  return { devices, api, selectedId, loading, refresh, select };
}
