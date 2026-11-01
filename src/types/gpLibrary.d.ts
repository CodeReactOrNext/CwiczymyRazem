// Injected by the Electron preload (electron/preload.js) as window.gpLibrary.
// Guitar Pro files saved on this computer instead of Firebase Storage — no size
// or count cap, but no sync either. Desktop only; older desktop builds without
// it keep using the cloud library.

/** One file in the local library, as stored by electron/gpFileStore.js. */
export interface LocalGpFileMeta {
  id: string;
  name: string;
  ext: string;
  size: number;
  /** ms since epoch */
  savedAt: number;
  /** Id of a (Firestore) GP folder, or null for the library root. */
  folderId: string | null;
}

export interface LocalGpFileData {
  id: string;
  name: string;
  /** Node Buffer on the main-process side; arrives as a Uint8Array in the renderer. */
  data: Uint8Array;
}

export interface GpLibraryApi {
  isAvailable: true;
  listFiles: () => Promise<LocalGpFileMeta[]>;
  saveFile: (name: string, data: ArrayBuffer, folderId?: string | null) => Promise<LocalGpFileMeta>;
  readFile: (id: string) => Promise<LocalGpFileData | null>;
  moveFile: (id: string, folderId: string | null) => Promise<LocalGpFileMeta | null>;
  deleteFile: (id: string) => Promise<void>;
}

declare global {
  interface Window {
    gpLibrary?: GpLibraryApi;
  }
}

export {};
