import { getIdToken } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import type { GpLibraryApi, LocalGpFileMeta } from "types/gpLibrary";
import { auth,db, storage } from "utils/firebase/client/firebase.utils";

/** Maximum number of GP files a user may keep in their cloud library (root + all folders combined). */
export const MAX_USER_GP_FILES = 50;

/** Maximum size (bytes) allowed for a single GP file upload to the cloud. */
export const MAX_GP_FILE_SIZE_BYTES = 1.5 * 1024 * 1024;

/**
 * Where a file lives. "local" files are saved by the desktop app on the user's
 * computer (electron/gpFileStore.js): no size or count cap, but they never sync,
 * so they don't exist on the web or on another machine.
 */
export type GpFileLocation = "cloud" | "local";

export interface UserGpFile {
  id: string;
  name: string;
  downloadUrl: string;
  storagePath: string;
  uploadedAt: Date;
  size: number;
  folderId: string | null;
  location: GpFileLocation;
}

export interface UploadUserGpFileOptions {
  folderId?: string | null;
  onProgress?: (p: { progress: number }) => void;
}

/** Stands in for a downloadUrl on local files, so everything that passes urls around keeps working. */
const LOCAL_GP_URL_PREFIX = "local-gp://";

const getGpLibraryApi = (): GpLibraryApi | null => {
  if (typeof window === "undefined") return null;
  return window.gpLibrary?.isAvailable ? window.gpLibrary : null;
};

/** True in a desktop build that saves GP files locally (and so without the cloud caps). */
export const isLocalGpLibraryAvailable = (): boolean => getGpLibraryApi() !== null;

/** Ids minted by electron/gpFileStore.js — recognisable even on the web, where the file can't be read. */
export const isLocalGpFileId = (id: string | null | undefined): boolean => !!id?.startsWith("gpl_");

const fromLocalMeta = (meta: LocalGpFileMeta): UserGpFile => ({
  id: meta.id,
  name: meta.name,
  downloadUrl: `${LOCAL_GP_URL_PREFIX}${meta.id}`,
  storagePath: "",
  uploadedAt: new Date(meta.savedAt),
  size: meta.size,
  folderId: meta.folderId ?? null,
  location: "local",
});

/**
 * Always uploads to Firebase Storage. Use this where the file must be reachable
 * from anywhere — e.g. a custom exercise, which can be shared with others.
 */
export const uploadUserGpFile = async (
  userId: string,
  file: File,
  { folderId = null, onProgress }: UploadUserGpFileOptions = {}
): Promise<UserGpFile> => {
  const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const storagePath = `gp5-files/${userId}/${fileId}/${file.name}`;
  const fileRef = ref(storage, storagePath);

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(fileRef, file);
    task.on(
      "state_changed",
      (snap) => onProgress?.({ progress: Math.round((snap.bytesTransferred / snap.totalBytes) * 90) }),
      reject,
      () => resolve()
    );
  });

  onProgress?.({ progress: 95 });
  const downloadUrl = await getDownloadURL(fileRef);

  const docRef = await addDoc(
    collection(db, "users", userId, "gpFiles"),
    { name: file.name, downloadUrl, storagePath, uploadedAt: serverTimestamp(), size: file.size, folderId }
  );

  onProgress?.({ progress: 100 });
  return { id: docRef.id, name: file.name, downloadUrl, storagePath, uploadedAt: new Date(), size: file.size, folderId, location: "cloud" };
};

/**
 * Adds a file to the player's GP library: on this computer in the desktop app,
 * in the cloud everywhere else.
 */
export const saveUserGpFile = async (
  userId: string,
  file: File,
  options: UploadUserGpFileOptions = {}
): Promise<UserGpFile> => {
  const api = getGpLibraryApi();
  if (!api) return uploadUserGpFile(userId, file, options);

  options.onProgress?.({ progress: 10 });
  const meta = await api.saveFile(file.name, await file.arrayBuffer(), options.folderId ?? null);
  options.onProgress?.({ progress: 100 });
  return fromLocalMeta(meta);
};

const getCloudGpFiles = async (userId: string): Promise<UserGpFile[]> => {
  const q = query(
    collection(db, "users", userId, "gpFiles"),
    orderBy("uploadedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      downloadUrl: data.downloadUrl,
      storagePath: data.storagePath,
      uploadedAt: data.uploadedAt?.toDate?.() ?? new Date(),
      size: data.size ?? 0,
      folderId: data.folderId ?? null,
      location: "cloud" as const,
    };
  });
};

const getLocalGpFiles = async (): Promise<UserGpFile[]> => {
  const api = getGpLibraryApi();
  if (!api) return [];
  try {
    return (await api.listFiles()).map(fromLocalMeta);
  } catch {
    return [];
  }
};

/** Cloud files plus, in the desktop app, the ones saved on this computer — newest first. */
export const getUserGpFiles = async (userId: string): Promise<UserGpFile[]> => {
  const [cloud, local] = await Promise.all([getCloudGpFiles(userId), getLocalGpFiles()]);
  return [...cloud, ...local].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
};

export const moveUserGpFile = async (
  userId: string,
  file: UserGpFile,
  folderId: string | null
): Promise<void> => {
  if (file.location === "local") {
    const api = getGpLibraryApi();
    if (!api) throw new Error("Local GP library unavailable");
    await api.moveFile(file.id, folderId);
    return;
  }
  await updateDoc(doc(db, "users", userId, "gpFiles", file.id), { folderId });
};

export const deleteUserGpFile = async (
  userId: string,
  file: UserGpFile
): Promise<void> => {
  if (file.location === "local") {
    const api = getGpLibraryApi();
    if (!api) throw new Error("Local GP library unavailable");
    await api.deleteFile(file.id);
    return;
  }
  await deleteDoc(doc(db, "users", userId, "gpFiles", file.id));
  try {
    await deleteObject(ref(storage, file.storagePath));
  } catch {
    // Storage file may already be gone
  }
};

/**
 * The url to load a library file by id (what a song's progress stores), or null
 * when it is gone — or is a desktop-only file and this isn't that desktop app.
 */
export const resolveUserGpFileUrl = async (
  userId: string,
  gpFileId: string
): Promise<string | null> => {
  if (isLocalGpFileId(gpFileId)) {
    const files = await getLocalGpFiles();
    return files.find((f) => f.id === gpFileId)?.downloadUrl ?? null;
  }

  const gpFileSnap = await getDoc(doc(db, "users", userId, "gpFiles", gpFileId));
  if (!gpFileSnap.exists()) return null;
  const { downloadUrl } = gpFileSnap.data() as { downloadUrl?: string };
  return downloadUrl ?? null;
};

const readLocalGpFile = async (id: string, fileName: string): Promise<File> => {
  const api = getGpLibraryApi();
  if (!api) throw new Error("This file is only available in the desktop app");
  const stored = await api.readFile(id);
  if (!stored) throw new Error("Local GP file not found");
  // Copy into a fresh buffer: the IPC payload can be a view into a larger pooled one.
  return new File([new Uint8Array(stored.data)], fileName, { type: "application/octet-stream" });
};

/** Fetch a stored GP file — off disk for local files, via a server-side proxy (CORS) for cloud ones. */
export const fetchGpFileAsFile = async (
  downloadUrl: string,
  fileName: string
): Promise<File> => {
  if (downloadUrl.startsWith(LOCAL_GP_URL_PREFIX)) {
    return readLocalGpFile(downloadUrl.slice(LOCAL_GP_URL_PREFIX.length), fileName);
  }

  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const idToken = await getIdToken(user);

  const response = await fetch("/api/get-gp-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ downloadUrl, idToken }),
  });

  if (!response.ok) throw new Error("Failed to download GP file");
  const blob = await response.blob();
  return new File([blob], fileName, { type: "application/octet-stream" });
};
