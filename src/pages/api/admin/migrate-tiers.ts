import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

const getTierFromDifficulty = (difficulty: number): string => {
  if (difficulty >= 9) return "S";
  if (difficulty >= 7.5) return "A";
  if (difficulty >= 6) return "B";
  if (difficulty >= 4) return "C";
  return "D";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const password = req.headers["x-admin-password"] || req.body.password;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const adminDb = firestore;
    const songsRef = adminDb.collection("songs");
    const snapshot = await songsRef.get();

    let updated = 0;
    const batchSize = 50;
    let batch = adminDb.batch();

    for (let i = 0; i < snapshot.docs.length; i++) {
        const doc = snapshot.docs[i];
        const data = doc.data();
        const avgDifficulty = data.avgDifficulty || 0;
        const tier = getTierFromDifficulty(avgDifficulty);

        batch.update(doc.ref, { tier });
        updated++;

        if (updated % batchSize === 0) {
            await batch.commit();
            batch = adminDb.batch();
        }
    }

    if (updated % batchSize !== 0) {
        await batch.commit();
    }

    return res.status(200).json({ 
        success: true, 
        message: `Migrated ${updated} songs with tier field.` 
    });
  } catch (error: any) {
    console.error("Migration Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
