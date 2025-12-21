import type { NextApiRequest, NextApiResponse } from "next";
import { fetchEnrichmentData } from "utils/enrichment/enrichment.util";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { artist, title } = req.body;

  if (!artist || !title) {
    return res.status(400).json({ error: "Artist and Title are required" });
  }

  try {
    const data = await fetchEnrichmentData(artist, title);

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
