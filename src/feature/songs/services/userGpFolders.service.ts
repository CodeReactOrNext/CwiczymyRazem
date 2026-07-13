import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

/** Folders can only be nested one level deep: root -> folder -> subfolder. */
export const MAX_FOLDER_DEPTH = 2;

export interface GpFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

export const getUserGpFolders = async (userId: string): Promise<GpFolder[]> => {
  const q = query(
    collection(db, "users", userId, "gpFolders"),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      parentId: data.parentId ?? null,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    };
  });
};

export const createGpFolder = async (
  userId: string,
  name: string,
  parentId: string | null
): Promise<GpFolder> => {
  const docRef = await addDoc(collection(db, "users", userId, "gpFolders"), {
    name,
    parentId,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, name, parentId, createdAt: new Date() };
};

export const deleteGpFolder = async (
  userId: string,
  folderId: string
): Promise<void> => {
  await deleteDoc(doc(db, "users", userId, "gpFolders", folderId));
};

/** Folder depth: 1 for a top-level folder, 2 for a folder nested inside one. */
export const getFolderDepth = (
  folder: GpFolder,
  allFolders: GpFolder[]
): number => {
  let depth = 1;
  let current = folder;
  while (current.parentId) {
    const parent = allFolders.find((f) => f.id === current.parentId);
    if (!parent) break;
    depth += 1;
    current = parent;
  }
  return depth;
};
