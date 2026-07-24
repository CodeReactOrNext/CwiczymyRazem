const STORAGE_KEY = "practice_session_settings";
const GLOBAL_METRONOME_VOLUME_KEY = "practice_metronome_volume";
const GLOBAL_MASTER_VOLUME_KEY = "practice_master_volume";
const GLOBAL_TRACK_VOLUME_KEY = "practice_track_volume";

export interface PracticeSessionSettings {
  isAudioMuted?: boolean;
  isMetronomeMuted?: boolean;
  metronomeBpm?: number;
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

// Metronome volume is a device-wide preference (not tied to a single exercise),
// so it's stored under its own key instead of inside the per-exercise settings.
export function loadGlobalMetronomeVolume(): number | null {
  try {
    const raw = localStorage.getItem(GLOBAL_METRONOME_VOLUME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGlobalMetronomeVolume(volume: number): void {
  try {
    localStorage.setItem(GLOBAL_METRONOME_VOLUME_KEY, JSON.stringify(volume));
  } catch { /* localStorage unavailable (e.g. private mode) — settings just won't persist */ }
}

// Master volume boosts the Guitar Pro (MIDI) playback above its normal 100% level —
// also a device-wide preference, stored the same way as the metronome volume.
export function loadGlobalMasterVolume(): number | null {
  try {
    const raw = localStorage.getItem(GLOBAL_MASTER_VOLUME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGlobalMasterVolume(volume: number): void {
  try {
    localStorage.setItem(GLOBAL_MASTER_VOLUME_KEY, JSON.stringify(volume));
  } catch { /* localStorage unavailable (e.g. private mode) — settings just won't persist */ }
}

type TrackVolumeRole = "main" | "backing";
type StoredTrackVolumes = Partial<Record<TrackVolumeRole, number>>;

// The main instrument track and any extra backing tracks (drums/bass/etc. from a
// Guitar Pro file, or a plan's own backingTracks) each keep their own remembered
// level — also a device-wide preference, restored as the starting point for every
// new exercise instead of the hardcoded 100%/80% defaults.
function readTrackVolumes(): StoredTrackVolumes {
  try {
    const raw = localStorage.getItem(GLOBAL_TRACK_VOLUME_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function loadGlobalTrackVolume(role: TrackVolumeRole): number | null {
  return readTrackVolumes()[role] ?? null;
}

export function saveGlobalTrackVolume(role: TrackVolumeRole, volume: number): void {
  try {
    const all = readTrackVolumes();
    all[role] = volume;
    localStorage.setItem(GLOBAL_TRACK_VOLUME_KEY, JSON.stringify(all));
  } catch { /* localStorage unavailable (e.g. private mode) — settings just won't persist */ }
}
