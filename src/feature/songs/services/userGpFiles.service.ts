import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { getIdToken } from "firebase/auth";
import { db, auth } from "utils/firebase/client/firebase.utils";

export interface UserGpFile {
  id: string;
  name: string;
  downloadUrl: string;
  storagePath: string;
  uploadedAt: Date;
  size: number;
}

/** Convert File → base64 string */
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // result is "data:...;base64,<data>" — we only want the data part
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Upload a GP file via the Next.js API route (avoids Firebase Storage CORS).
 * Progress is approximated since it's a single fetch call.
 */
export const uploadUserGpFile = async (
  userId: string,
  file: File,
  onProgress?: (p: { progress: number }) => void
): Promise<UserGpFile> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  onProgress?.({ progress: 10 });
  const idToken = await getIdToken(user);

  onProgress?.({ progress: 20 });
  const fileBase64 = await fileToBase64(file);

  onProgress?.({ progress: 50 });

  const res = await fetch("/api/upload-gp-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileBase64,
      fileSize: file.size,
      idToken,
    }),
  });

  onProgress?.({ progress: 90 });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Upload failed");
  }

  const data = await res.json();
  onProgress?.({ progress: 100 });

  return {
    id: data.id,
    name: data.name,
    downloadUrl: data.downloadUrl,
    storagePath: data.storagePath,
    uploadedAt: new Date(),
    size: data.size,
  };
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
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const idToken = await getIdToken(user);

  const res = await fetch("/api/delete-gp-file", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId, storagePath, idToken }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Delete failed");
  }
};

/** Fetch a stored GP file as a File object for parsing. */
export const fetchGpFileAsFile = async (
  downloadUrl: string,
  fileName: string
): Promise<File> => {
  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error("Nie udało się pobrać pliku GP");
  const blob = await response.blob();
  return new File([blob], fileName, { type: "application/octet-stream" });
};
