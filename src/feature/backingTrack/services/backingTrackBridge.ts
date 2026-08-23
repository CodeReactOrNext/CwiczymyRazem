import type { BackingTracksApi } from "types/backingTracks";

/**
 * Access to the desktop-only backing-track library (electron/preload.js).
 * Returns null on the web build, where the file source is simply unavailable.
 */
export const getBackingTrackApi = (): BackingTracksApi | null => {
  if (typeof window === "undefined") return null;
  return window.backingTracks?.isAvailable ? window.backingTracks : null;
};

export const isDesktopBackingAvailable = (): boolean => getBackingTrackApi() !== null;

/**
 * Reads one track off disk and wraps it in an object URL.
 *
 * The renderer is served from https://riff.quest even inside Electron, so it
 * can't load a file:// source — the bytes come across IPC and become a Blob
 * instead. Callers own the returned URL and must revokeObjectURL it.
 */
export const createTrackObjectUrl = async (trackId: string): Promise<string | null> => {
  const api = getBackingTrackApi();
  if (!api) return null;

  const track = await api.readTrack(trackId);
  if (!track) return null;

  // Copy into a fresh ArrayBuffer: the IPC payload can be a view into a larger
  // pooled buffer, and Blob would otherwise take the whole thing.
  const bytes = new Uint8Array(track.data);
  return URL.createObjectURL(new Blob([bytes], { type: track.mimeType }));
};
