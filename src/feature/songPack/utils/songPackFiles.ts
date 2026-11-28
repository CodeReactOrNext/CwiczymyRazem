import type { SongPackTab } from "../types/songPack.types";

/** A song package as it is downloaded. Opened by the desktop app only. */
export const SONG_PACK_SOURCE_EXTENSION = ".psarc";

/** The tab the desktop app makes out of one and keeps in its local library. */
export const SONG_PACK_TAB_EXTENSION = ".rqpack";

export const isSongPackSource = (fileName: string | null | undefined): boolean =>
  !!fileName?.toLowerCase().endsWith(SONG_PACK_SOURCE_EXTENSION);

export const isSongPackTab = (fileName: string | null | undefined): boolean =>
  !!fileName?.toLowerCase().endsWith(SONG_PACK_TAB_EXTENSION);

/**
 * Anything that came out of a song package.
 *
 * A package carries the released recording of a song, so the tab made from it
 * and that recording stay on the computer that imported it: nothing answering
 * true here may be uploaded, published or attached to something shareable.
 */
export const isSongPackFile = (fileName: string | null | undefined): boolean =>
  isSongPackSource(fileName) || isSongPackTab(fileName);

/** Thrown where a song package is about to leave the computer it was imported on. */
export class SongPackLocalOnlyError extends Error {
  constructor() {
    super("A song package stays on this computer and can't be uploaded or shared.");
    this.name = "SongPackLocalOnlyError";
  }
}

export async function readSongPackTab(file: File): Promise<SongPackTab> {
  const tab = JSON.parse(await file.text()) as Partial<SongPackTab> | null;
  if (!tab || !Array.isArray(tab.parts) || tab.parts.length === 0) {
    throw new Error("Not a song package tab");
  }
  return {
    format: tab.format ?? 1,
    title: tab.title ?? "",
    artist: tab.artist ?? "",
    lengthSec: tab.lengthSec ?? 0,
    parts: tab.parts,
    audioTrackId: typeof tab.audioTrackId === "string" ? tab.audioTrackId : null,
  };
}
