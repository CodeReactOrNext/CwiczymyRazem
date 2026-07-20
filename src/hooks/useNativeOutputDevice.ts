import { useCallback, useEffect, useState } from "react";

// Output-device counterpart to useNativeAudioDevices.ts (native ASIO INPUT
// selection). This one picks which navigator.mediaDevices "audiooutput" the app's
// own Web Audio playback (metronome, tab-along synth, AlphaTab, backing tracks)
// renders to — so it can be pointed at the same physical interface as ASIO capture
// and stop the driver "takeover" conflict. Electron-only: no-ops on the web build.

export const OUTPUT_DEVICE_STORAGE_KEY = "native_output_device_id";
const OUTPUT_DEVICE_CHANGE_EVENT = "cr:native-output-device-change";

export function readPersistedOutputDeviceId(): string | null {
  try {
    return localStorage.getItem(OUTPUT_DEVICE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Notified whenever the selection changes (e.g. from the Setup step), so every
 *  already-open AudioContext / AlphaTab instance can move live. localStorage's own
 *  `storage` event doesn't fire in the tab that wrote it, hence a custom event. */
export function onOutputDeviceChange(cb: (deviceId: string | null) => void): () => void {
  const listener = (e: Event) => cb((e as CustomEvent<string | null>).detail);
  window.addEventListener(OUTPUT_DEVICE_CHANGE_EVENT, listener);
  return () => window.removeEventListener(OUTPUT_DEVICE_CHANGE_EVENT, listener);
}

// Generic words that show up in almost every audio device name — matching on these
// alone would false-positive constantly (e.g. every device says "USB"/"Audio").
const NOISE_TOKENS = new Set([
  "usb", "audio", "device", "driver", "interface", "digital", "asio",
  "input", "output", "microphone", "speaker", "speakers", "hd", "high", "definition",
]);

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !NOISE_TOKENS.has(t));
}

/** Best-effort default: pick the output device whose label shares a distinctive
 *  token (brand/model) with the given ASIO input device name (e.g. both mention
 *  "Audient"). Returns null when nothing distinctive overlaps — callers should fall
 *  back to no selection (system default), not force a guess. */
export function fuzzyMatchOutputDevice(hintName: string | null | undefined, candidates: MediaDeviceInfo[]): MediaDeviceInfo | null {
  const hintTokens = tokenize(hintName || "");
  if (hintTokens.length === 0) return null;

  let best: MediaDeviceInfo | null = null;
  let bestScore = 0;
  for (const d of candidates) {
    const labelTokens = new Set(tokenize(d.label));
    let score = 0;
    for (const t of hintTokens) if (labelTokens.has(t)) score += t.length;
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
}

export function useNativeOutputDevice(inputDeviceName?: string | null) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autoMatched, setAutoMatched] = useState(false);
  const [loading, setLoading] = useState(false);

  const isNative = typeof window !== "undefined" && !!window.nativeAudio;

  const refresh = useCallback(async () => {
    if (!isNative || typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    setLoading(true);
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const outputs = all.filter((d) => d.kind === "audiooutput");
      setDevices(outputs);

      const persisted = readPersistedOutputDeviceId();
      if (persisted && outputs.some((d) => d.deviceId === persisted)) {
        setSelectedId(persisted);
        setAutoMatched(false);
        return;
      }

      const match = fuzzyMatchOutputDevice(inputDeviceName, outputs);
      if (match) {
        setSelectedId(match.deviceId);
        setAutoMatched(true);
        try { localStorage.setItem(OUTPUT_DEVICE_STORAGE_KEY, match.deviceId); } catch { /* ignore */ }
      } else {
        setSelectedId(null);
        setAutoMatched(false);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [isNative, inputDeviceName]);

  useEffect(() => { refresh(); }, [refresh]);

  const select = useCallback((deviceId: string) => {
    setSelectedId(deviceId);
    setAutoMatched(false);
    try { localStorage.setItem(OUTPUT_DEVICE_STORAGE_KEY, deviceId); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent(OUTPUT_DEVICE_CHANGE_EVENT, { detail: deviceId }));
  }, []);

  return { devices, selectedId, autoMatched, loading, refresh, select };
}
