export const GUITAR_PLAYBACK_KEY = "guitar_playback_enabled";
/** The same toggle, flipped while a backing plays — the tab's guitar on top of a
 *  band is a separate choice from the guitar on its own. */
export const GUITAR_WITH_BACKING_KEY = "guitar_playback_with_backing";

const keyFor = (withBacking: boolean) => (withBacking ? GUITAR_WITH_BACKING_KEY : GUITAR_PLAYBACK_KEY);

export function loadGuitarPlaybackPreference(withBacking = false): boolean | null {
  try {
    const raw = localStorage.getItem(keyFor(withBacking));
    if (raw === null) return null;
    return raw === "true";
  } catch { return null; }
}

export function saveGuitarPlaybackPreference(enabled: boolean, withBacking = false): void {
  try { localStorage.setItem(keyFor(withBacking), String(enabled)); } catch {}
}
