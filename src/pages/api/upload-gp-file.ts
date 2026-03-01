import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "firebase-admin";
import { firestore, auth } from "utils/firebase/api/firebase.config";

// Increase body size limit for GP5 files (up to 20MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

interface UploadBody {
  fileName: string;
  fileBase64: string; // base64-encoded file bytes
  fileSize: number;
  idToken: string;   // Firebase ID token for auth
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileName, fileBase64, fileSize, idToken } = req.body as UploadBody;

  if (!fileName || !fileBase64 || !idToken) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Verify the user's ID token
  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const bucket = admin.storage().bucket(process.env.NEXT_PUBLIC_FIREBASE_CONFIG_STORAGEBUCKET);
    const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const storagePath = `gp5-files/${userId}/${fileId}/${fileName}`;

    const fileBuffer = Buffer.from(fileBase64, "base64");

    const file = bucket.file(storagePath);
    await file.save(fileBuffer, {
      metadata: { contentType: "application/octet-stream" },
    });

    // Make the file publicly readable so client can download it via GCS URL
    await file.makePublic();
    const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
    const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${encodedPath}`;

    // Save metadata in Firestore
    const docRef = await firestore
      .collection("users")
      .doc(userId)
      .collection("gpFiles")
      .add({
        name: fileName,
        downloadUrl,
        storagePath,
        uploadedAt: admin.firestore.Timestamp.now(),
        size: fileSize,
      });

    return res.status(200).json({
      id: docRef.id,
      name: fileName,
      downloadUrl,
      storagePath,
      size: fileSize,
    });
  } catch (error) {
    console.error("Error uploading GP file:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
}
