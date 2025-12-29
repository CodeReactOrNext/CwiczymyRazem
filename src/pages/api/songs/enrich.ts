import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";
import { fetchEnrichmentData } from "utils/enrichment/enrichment.util";
import { FieldValue } from "firebase-admin/firestore";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { artist, title, songId } = req.body;

  if (!artist || !title || !songId) {
    return res.status(400).json({ error: "Artist, Title and songId are required" });
  }

  try {
    const data = await fetchEnrichmentData(artist, title);

    // Perform database update on the server using Admin SDK
    const songRef = firestore.collection("songs").doc(songId);
    const genres = data.genres || [];

    await songRef.update({
      coverUrl: data.coverUrl || null,
      isVerified: !!data.isVerified,
      coverAttempted: true,
      genres,
    });

    // Maintain global unique genres list
    if (genres.length > 0) {
      const globalMetaRef = firestore.collection("metadata").doc("global");
      await globalMetaRef.set({
        genres: FieldValue.arrayUnion(...genres)
      }, { merge: true }).catch((err: any) => console.error("Error updating global genres:", err));
    }

    if (!data.isVerified && data.source === "none") {
      return res.status(200).json({ ...data, message: "No enrichment data found" });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Enrichment Error:", error.message);
    return res.status(500).json({
      error: "Failed to enrich song",
      details: error.message
    });
  }
}
