import type { NextApiRequest, NextApiResponse } from "next";
import { searchSpotifyTracks } from "utils/enrichment/enrichment.util";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { q } = req.query;

  if (!q || typeof q !== "string" || q.trim().length < 2) {
    return res.status(200).json({ tracks: [] });
  }

  try {
    const tracks = await searchSpotifyTracks(q.trim(), 5);
    return res.status(200).json({ tracks });
  } catch (error: any) {
    // Don't break the "add song" flow if Spotify is unavailable/unconfigured —
    // the modal falls back to the plain manual-entry form.
    console.error("Spotify search error:", error.response?.data || error.message);
    return res.status(200).json({ tracks: [] });
  }
}
