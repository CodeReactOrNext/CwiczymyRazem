import { useResponsiveStore } from "store/useResponsiveStore";

/** How the guitar reaches the browser: an audio interface or a microphone. */
export type InputSource = "interface" | "microphone";

export const INPUT_SOURCE_STORAGE_KEY = "mic_setup_input_source";

/**
 * The answer given on the setup's first step, kept so the setup opened again
 * later (to switch device, or from Settings) doesn't have to ask it again.
 * Never answered: a phone can only listen through its microphone.
 */
export function loadInputSource(): InputSource {
  try {
    const stored = localStorage.getItem(INPUT_SOURCE_STORAGE_KEY);
    if (stored === "interface" || stored === "microphone") return stored;
  } catch { /* fall through to the guess */ }
  return useResponsiveStore.getState().isMobile ? "microphone" : "interface";
}

/**
 * Whether the guitar reaches the app through the air — where the app's own
 * sound from the speakers reaches it too. The desktop app and a player who
 * said "interface" take the signal by cable. A player who was never asked
 * counts as a microphone: better one note too many than a leak nobody named.
 */
export function usesMicrophone(): boolean {
  if (typeof window === "undefined" || window.nativeAudio) return false;
  try {
    return localStorage.getItem(INPUT_SOURCE_STORAGE_KEY) !== "interface";
  } catch {
    return true;
  }
}

export function saveInputSource(source: InputSource): void {
  try {
    localStorage.setItem(INPUT_SOURCE_STORAGE_KEY, source);
  } catch { /* the setup just asks again next time */ }
}
