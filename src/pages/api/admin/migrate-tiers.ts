import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";

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
  try {
    const songsRef = collection(db, "songs");
    const snapshot = await getDocs(songsRef);

    let updated = 0;
    const batchSize = 50;
    let batch = writeBatch(db);

    for (let i = 0; i < snapshot.docs.length; i++) {
        const docSnap = snapshot.docs[i];
        const data = docSnap.data();
        const avgDifficulty = data.avgDifficulty || 0;
        const tier = getTierFromDifficulty(avgDifficulty);

        batch.update(docSnap.ref, { tier });
        updated++;

        if (updated % batchSize === 0) {
            await batch.commit();
            batch = writeBatch(db);
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
