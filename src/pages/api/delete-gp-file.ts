import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "firebase-admin";
import { firestore, auth } from "utils/firebase/api/firebase.config";

interface DeleteBody {
  fileId: string;
  storagePath: string;
  idToken: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileId, storagePath, idToken } = req.body as DeleteBody;

  if (!fileId || !storagePath || !idToken) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Verify the storagePath belongs to this user
  if (!storagePath.startsWith(`gp5-files/${userId}/`)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    // Delete Firestore metadata
    await firestore
      .collection("users")
      .doc(userId)
      .collection("gpFiles")
      .doc(fileId)
      .delete();

    // Delete from Storage
    try {
      const bucket = admin.storage().bucket(process.env.NEXT_PUBLIC_FIREBASE_CONFIG_STORAGEBUCKET);
      await bucket.file(storagePath).delete();
    } catch {
      // Storage file may already be gone
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error deleting GP file:", error);
    return res.status(500).json({ error: "Delete failed" });
  }
}
