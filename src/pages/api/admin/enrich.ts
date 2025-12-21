import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { fetchEnrichmentData } from "utils/enrichment/enrichment.util";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const password = req.headers["x-admin-password"] || req.body.password;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const songsRef = collection(db, "songs");
    const q = query(songsRef, where("isVerified", "!=", true)); // Non-verified songs
    const querySnapshot = await getDocs(q);

    const unverifiedSongs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    if (unverifiedSongs.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    let processedCount = 0;
    // We process in a loop on the server, but with a timeout safety
    // For a larger database, we'd use a background worker (e.g., Firebase Functions)
    for (const song of unverifiedSongs) {
      try {
        const enrichment = await fetchEnrichmentData(song.artist, song.title);

        const songRef = doc(db, "songs", song.id);
        await updateDoc(songRef, {
          coverUrl: enrichment.coverUrl || null,
          isVerified: !!enrichment.isVerified,
          coverAttempted: true,
        });

        processedCount++;
        // Small delay to avoid hammering external APIs too hard
        await new Promise(r => setTimeout(r, 400));
      } catch (err) {
        console.error(`Failed to enrich song ${song.id}:`, err);
      }
    }

    return res.status(200).json({ success: true, count: processedCount });
  } catch (error: any) {
    console.error("Batch Enrichment Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
