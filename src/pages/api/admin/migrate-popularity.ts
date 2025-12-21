import type { NextApiRequest, NextApiResponse } from "next";
import { migrateSongPopularity } from "feature/songs/services/migrateSongPopularity";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const totalUpdated = await migrateSongPopularity();
    return res.status(200).json({
      success: true,
      message: `Successfully migrated popularity for ${totalUpdated} songs.`
    });
  } catch (error: any) {
    console.error("Migration Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
