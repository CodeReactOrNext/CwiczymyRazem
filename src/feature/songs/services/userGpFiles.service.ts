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
import { getIdToken } from "firebase/auth";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage, auth } from "utils/firebase/client/firebase.utils";

export interface UserGpFile {
  id: string;
  name: string;
  downloadUrl: string;
  storagePath: string;
  uploadedAt: Date;
  size: number;
}

export const uploadUserGpFile = async (
  userId: string,
  file: File,
  onProgress?: (p: { progress: number }) => void
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
    { name: file.name, downloadUrl, storagePath, uploadedAt: serverTimestamp(), size: file.size }
  );

  onProgress?.({ progress: 100 });
  return { id: docRef.id, name: file.name, downloadUrl, storagePath, uploadedAt: new Date(), size: file.size };
};

export const getUserGpFiles = async (userId: string): Promise<UserGpFile[]> => {
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
    };
  });
};

export const deleteUserGpFile = async (
  userId: string,
  fileId: string,
  storagePath: string
): Promise<void> => {
  await deleteDoc(doc(db, "users", userId, "gpFiles", fileId));
  try {
    await deleteObject(ref(storage, storagePath));
  } catch {
    // Storage file may already be gone
  }
};

/** Fetch a stored GP file as a File object for parsing (proxied via API to avoid CORS). */
export const fetchGpFileAsFile = async (
  storagePath: string,
  fileName: string
): Promise<File> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const idToken = await getIdToken(user);

  const response = await fetch("/api/get-gp-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storagePath, idToken }),
  });

  if (!response.ok) throw new Error("Failed to download GP file");
  const blob = await response.blob();
  return new File([blob], fileName, { type: "application/octet-stream" });
};
