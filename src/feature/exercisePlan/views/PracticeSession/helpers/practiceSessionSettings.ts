const STORAGE_KEY = "practice_session_settings";

export interface PracticeSessionSettings {
  isAudioMuted?: boolean;
  isMetronomeMuted?: boolean;
  metronomeBpm?: number;
  metronomeVolume?: number;
  speedMultiplier?: number;
  isMicEnabled?: boolean;
}

type StoredSettings = Record<string, PracticeSessionSettings>;

function readAll(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function loadPracticeSessionSettings(exerciseId: string): PracticeSessionSettings | null {
  if (!exerciseId) return null;
  return readAll()[exerciseId] ?? null;
}

export function savePracticeSessionSettings(exerciseId: string, settings: PracticeSessionSettings): void {
  if (!exerciseId) return;
  try {
    const all = readAll();
    all[exerciseId] = { ...all[exerciseId], ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* localStorage unavailable (e.g. private mode) — settings just won't persist */ }
}
