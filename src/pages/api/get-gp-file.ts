import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "firebase-admin";
import { auth } from "utils/firebase/api/firebase.config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { storagePath, idToken } = req.body as { storagePath: string; idToken: string };

  if (!storagePath || !idToken) {
    return res.status(400).json({ error: "Missing params" });
  }

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Verify the file belongs to this user
  if (!storagePath.startsWith(`gp5-files/${userId}/`)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const bucket = admin.storage().bucket(process.env.NEXT_PUBLIC_FIREBASE_CONFIG_STORAGEBUCKET);
    const [buffer] = await bucket.file(storagePath).download();

    const fileName = storagePath.split("/").pop() ?? "file.gp5";
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error downloading GP file:", error);
    return res.status(500).json({ error: "Download failed" });
  }
}
