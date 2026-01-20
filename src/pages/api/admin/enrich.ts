import { collection, doc, getDocs, query, updateDoc,where } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { fetchEnrichmentData } from "utils/enrichment/enrichment.util";
import { db } from "utils/firebase/client/firebase.utils";

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

  const { onlyMissingSpotify } = req.body;

  try {
    const songsRef = collection(db, "songs");
    let q = query(songsRef);
    
    if (onlyMissingSpotify) {
        // This is a bit tricky in Firestore (querying for undefined/null)
        // For simplicity, we'll fetch all or verified and filter in memory if needed,
        // or just let the script handle targetting better.
        // For now, let's keep the isVerified check as the standard deep scan.
        q = query(songsRef, where("isVerified", "!=", true));
    } else {
        q = query(songsRef, where("isVerified", "!=", true));
    }
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(200).json({ success: true, count: 0 });
    }

    let processedCount = 0;
    
    // Process songs sequentially to respect API rate limits
    for (const songDoc of querySnapshot.docs) {
      try {
        const songData = songDoc.data();
        const enrichment = await fetchEnrichmentData(songData.artist, songData.title);

        await updateDoc(doc(db, "songs", songDoc.id), {
          coverUrl: enrichment.coverUrl || null,
          isVerified: !!enrichment.isVerified,
          coverAttempted: true,
          genres: enrichment.genres || [],
          spotifyId: enrichment.spotifyId || null,
        });

        processedCount++;
        // Small delay to avoid hammering external APIs too hard
        await new Promise(r => setTimeout(r, 400));
      } catch (err: any) {
        console.error(`Failed to enrich song ${songDoc.id}:`, err?.message || err);
      }
    }

    return res.status(200).json({ success: true, count: processedCount });
  } catch (error: any) {
    console.error("Batch Enrichment Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
