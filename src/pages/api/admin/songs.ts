import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check password in headers (GET) or body (POST)
  const password = req.headers["x-admin-password"] || req.body.password;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const songsRef = collection(db, "songs");
      const q = query(songsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const songs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.status(200).json(songs);
    }

    if (req.method === "POST") {
      const { songId, data } = req.body;
      if (!songId || !data) {
        return res.status(400).json({ error: "Missing songId or data" });
      }

      const songRef = doc(db, "songs", songId);
      await updateDoc(songRef, data);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Admin Songs API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
