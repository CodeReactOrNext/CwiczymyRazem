import { useCallback, useEffect, useRef, useState } from "react";
import type { NativeAudioDevice } from "types/nativeAudio";

// Shared input/output-device discovery + selection for the native (Electron) paths.
// The chosen input device id is persisted under one key so BOTH the amp simulator
// and the note-detection capture use the same interface. Output device selection
// only matters to the amp (ASIO forces output = input device on the engine side —
// see nativeAudioEngine.js's computeDesiredShape — so it only takes effect on
// WASAPI/other APIs where input and output can genuinely differ).

export const DEVICE_STORAGE_KEY = "native_audio_device_id";
export const OUTPUT_DEVICE_STORAGE_KEY = "native_amp_output_device_id";
// Which physical channel to use on the chosen device — matters for interfaces
// with more than one input/output pair (e.g. an 8-in ASIO unit where the guitar
// is plugged into jack 3 instead of 1). 0-based; persisted separately from the
// device id since the valid range depends on which device is selected.
export const CHANNEL_STORAGE_KEY = "native_audio_channel_id";
export const OUTPUT_CHANNEL_STORAGE_KEY = "native_amp_output_channel_id";

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

export function readPersistedChannel(): number {
  try {
    const raw = localStorage.getItem(CHANNEL_STORAGE_KEY);
    if (raw !== null) {
      const v = parseInt(raw, 10);
      if (!isNaN(v) && v >= 0) return v;
    }
  } catch { /* ignore */ }
  return 0;
}

export function readPersistedOutputChannel(): number {
  try {
    const raw = localStorage.getItem(OUTPUT_CHANNEL_STORAGE_KEY);
    if (raw !== null) {
      const v = parseInt(raw, 10);
      if (!isNaN(v) && v >= 0) return v;
    }
  } catch { /* ignore */ }
  return 0;
}

export function useNativeAudioDevices() {
  const [devices, setDevices] = useState<NativeAudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<NativeAudioDevice[]>([]);
  const [api, setApi] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedOutputId, setSelectedOutputId] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<number>(0);
  const [selectedOutputChannel, setSelectedOutputChannel] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Mirror the id state in refs so `refresh` can read the *current* selection
  // (to preserve a live choice across a hot-plug re-list) without needing the
  // state values in its own dependency array — keeps `refresh`'s identity
  // stable instead of re-triggering the mount effect below on every resolve.
  const selectedIdRef = useRef<number | null>(null);
  const selectedOutputIdRef = useRef<number | null>(null);

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
      const resolvedId = (() => {
        const persisted = selectedIdRef.current ?? readPersistedDeviceId();
        if (persisted != null && inputs.some((d) => d.id === persisted)) return persisted;
        return (inputs.find((d) => d.isDefaultInput) || inputs[0])?.id ?? null;
      })();
      selectedIdRef.current = resolvedId;
      setSelectedId(resolvedId);
      const resolvedOutputId = (() => {
        const persisted = selectedOutputIdRef.current ?? readPersistedOutputDeviceId();
        return persisted != null && outputs.some((d) => d.id === persisted) ? persisted : null;
      })();
      selectedOutputIdRef.current = resolvedOutputId;
      setSelectedOutputId(resolvedOutputId);

      // Clamp the persisted channel to whatever the resolved device actually
      // offers — a choice made against a different (bigger) interface must not
      // silently point past the end of a smaller one's channel count.
      const inDev = inputs.find((d) => d.id === resolvedId);
      setSelectedChannel(Math.max(0, Math.min(readPersistedChannel(), Math.max(0, (inDev?.inputChannels || 1) - 1))));
      const outDev = outputs.find((d) => d.id === resolvedOutputId) ?? outputs[0];
      setSelectedOutputChannel(Math.max(0, Math.min(readPersistedOutputChannel(), Math.max(0, (outDev?.outputChannels || 1) - 1))));
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
    selectedIdRef.current = id;
    setSelectedId(id);
    try { localStorage.setItem(DEVICE_STORAGE_KEY, String(id)); } catch { /* ignore */ }
  }, []);

  /** Pass null to clear the explicit choice and go back to the engine's default. */
  const selectOutput = useCallback((id: number | null) => {
    selectedOutputIdRef.current = id;
    setSelectedOutputId(id);
    try {
      if (id == null) localStorage.removeItem(OUTPUT_DEVICE_STORAGE_KEY);
      else localStorage.setItem(OUTPUT_DEVICE_STORAGE_KEY, String(id));
    } catch { /* ignore */ }
  }, []);

  /** 0-based input channel on the selected device — e.g. for an 8-in interface
   *  with the guitar plugged into jack 3 instead of 1. */
  const selectChannel = useCallback((channel: number) => {
    setSelectedChannel(channel);
    try { localStorage.setItem(CHANNEL_STORAGE_KEY, String(channel)); } catch { /* ignore */ }
  }, []);

  /** 0-based first output channel on the selected output device (amp monitoring
   *  only) — e.g. 2 routes to outputs 3/4 instead of 1/2. */
  const selectOutputChannel = useCallback((channel: number) => {
    setSelectedOutputChannel(channel);
    try { localStorage.setItem(OUTPUT_CHANNEL_STORAGE_KEY, String(channel)); } catch { /* ignore */ }
  }, []);

  return {
    devices, outputDevices, api,
    selectedId, selectedOutputId, selectedChannel, selectedOutputChannel,
    loading, refresh, select, selectOutput, selectChannel, selectOutputChannel,
  };
}
