import type { NextApiRequest, NextApiResponse } from "next";
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

  const { artist, title } = req.body;

  if (!artist || !title) {
    return res.status(400).json({ error: "Artist and title are required" });
  }

  try {
    const enrichment = await fetchEnrichmentData(artist, title);

    return res.status(200).json({
      candidates: enrichment.candidates || [],
      isVerified: enrichment.isVerified,
      source: enrichment.source
    });
  } catch (error: any) {
    console.error("Cover Search Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
