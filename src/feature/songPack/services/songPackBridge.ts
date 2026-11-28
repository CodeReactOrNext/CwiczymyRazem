import { getBackingTrackApi } from "feature/backingTrack/services/backingTrackBridge";
import { DEFAULT_ALIGNMENT, DEFAULT_STEM } from "feature/backingTrack/types/backingTrack.types";
import type { LocalGpFileMeta } from "types/gpLibrary";
import type { SongPacksApi } from "types/songPacks";

import { packToTab } from "../utils/packToTab";
import { isSongPackSource, readSongPackTab } from "../utils/songPackFiles";

/**
 * Access to the desktop app's song-package importer (electron/preload.js).
 * Null on the web build: a package is only ever opened on the desktop, where
 * its tab and recording can stay on the player's own computer.
 */
export const getSongPackApi = (): SongPacksApi | null => {
  if (typeof window === "undefined") return null;
  return window.songPacks?.isAvailable ? window.songPacks : null;
};

export const isSongPackImportAvailable = (): boolean => getSongPackApi() !== null;

export interface ImportedSongPack {
  /** The tab, as an entry of the local GP library — attach it like a GP file. */
  file: LocalGpFileMeta;
  /** Why the package's recording is missing, when it is. */
  audioError: string | null;
}

/** Unpacks a package into the local libraries. Throws with the reason when it can't. */
export async function importSongPack(source: File): Promise<ImportedSongPack> {
  const api = getSongPackApi();
  if (!api) throw new Error("Song packages only open in the desktop app.");
  if (!isSongPackSource(source.name)) throw new Error("Not a song package.");

  const result = await api.importPack(source.name, await source.arrayBuffer());
  if (!result.ok) throw new Error(result.message);
  return { file: result.file, audioError: result.audioError };
}

/**
 * Puts a package's recording under its tab for one song, already lined up.
 *
 * A package times every beat against its own recording, so the alignment a
 * player would otherwise find by ear on the Align screen is simply read off the
 * tab. Returns false when there is no recording to place — the tab still plays.
 */
export async function alignSongPackRecording(tabFile: File, songId: string): Promise<boolean> {
  const backing = getBackingTrackApi();
  if (!backing) return false;

  const pack = await readSongPackTab(tabFile);
  if (!pack.audioTrackId) return false;
  // The recording may have been deleted from the library since the import.
  const tracks = await backing.listTracks();
  if (!tracks.some((track) => track.id === pack.audioTrackId)) return false;

  const { alignment } = packToTab(pack);
  const stored = await backing.saveAssignment(songId, {
    stems: [{ trackId: pack.audioTrackId, ...DEFAULT_STEM }],
    ...alignment,
    volume: DEFAULT_ALIGNMENT.volume,
    muted: false,
  });
  return !!stored;
}
