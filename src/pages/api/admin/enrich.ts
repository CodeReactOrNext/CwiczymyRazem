import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";
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
    const songsRef = firestore.collection("songs");
    const querySnapshot = await songsRef.where("isVerified", "!=", true).get();

    if (querySnapshot.empty) {
      return res.status(200).json({ success: true, count: 0 });
    }

    let processedCount = 0;
    
    // Process songs sequentially to respect API rate limits
    for (const doc of querySnapshot.docs) {
      try {
        const songData = doc.data();
        const enrichment = await fetchEnrichmentData(songData.artist, songData.title);

        await doc.ref.update({
          coverUrl: enrichment.coverUrl || null,
          isVerified: !!enrichment.isVerified,
          coverAttempted: true,
          genres: enrichment.genres || []
        });

        processedCount++;
        // Small delay to avoid hammering external APIs too hard
        await new Promise(r => setTimeout(r, 400));
      } catch (err: any) {
        console.error(`Failed to enrich song ${doc.id}:`, err?.message || err);
      }
    }

    return res.status(200).json({ success: true, count: processedCount });
  } catch (error: any) {
    console.error("Batch Enrichment Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
