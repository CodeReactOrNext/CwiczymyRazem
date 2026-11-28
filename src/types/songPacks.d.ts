// Injected by the Electron preload (electron/preload.js) as window.songPacks.
// Unpacks a song package (.psarc) into the two local libraries: its tab next to
// the Guitar Pro files, its recording next to the backing tracks. Desktop only,
// and nothing it produces ever leaves the computer — see feature/songPack.
import type { LocalGpFileMeta } from "types/gpLibrary";

export type SongPackImportResult =
  | {
      ok: true;
      /** The tab, as an entry of the local GP library. */
      file: LocalGpFileMeta;
      /** Why the package's recording is missing, when it is. */
      audioError: string | null;
    }
  | { ok: false; message: string };

export interface SongPacksApi {
  isAvailable: true;
  importPack: (name: string, data: ArrayBuffer) => Promise<SongPackImportResult>;
}

declare global {
  interface Window {
    songPacks?: SongPacksApi;
  }
}

export {};
