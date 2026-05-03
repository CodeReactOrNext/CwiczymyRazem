export const GUITAR_PLAYBACK_KEY = "guitar_playback_enabled";

export function loadGuitarPlaybackPreference(): boolean | null {
  try {
    const raw = localStorage.getItem(GUITAR_PLAYBACK_KEY);
    if (raw === null) return null;
    return raw === "true";
  } catch { return null; }
}

export function saveGuitarPlaybackPreference(enabled: boolean): void {
  try { localStorage.setItem(GUITAR_PLAYBACK_KEY, String(enabled)); } catch {}
}
