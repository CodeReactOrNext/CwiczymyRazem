import { 
  deleteDoc, 
  doc, 
  getDoc, 
  serverTimestamp, 
  setDoc, 
  updateDoc} from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
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

  const { sourceId, targetId } = req.body;

  if (!sourceId || !targetId) {
    return res.status(400).json({ error: "Missing sourceId or targetId" });
  }

  if (sourceId === targetId) {
    return res.status(400).json({ error: "Source and target IDs must be different" });
  }

  try {
    const sourceSongRef = doc(db, "songs", sourceId);
    const targetSongRef = doc(db, "songs", targetId);

    const [sourceSnap, targetSnap] = await Promise.all([
      getDoc(sourceSongRef),
      getDoc(targetSongRef)
    ]);

    if (!sourceSnap.exists() || !targetSnap.exists()) {
      return res.status(404).json({ error: "One or both songs not found" });
    }

    const sourceData = sourceSnap.data() || {};
    const practicingUsers = sourceData.practicingUsers || [];

    console.log(`Merging ${practicingUsers.length} users from ${sourceId} to ${targetId}`);

    // Process user assignment migration
    for (const userId of practicingUsers) {
      const sourceUserSongRef = doc(db, "users", userId, "userSongs", sourceId);
      const targetUserSongRef = doc(db, "users", userId, "userSongs", targetId);

      const [sUserSnap, tUserSnap] = await Promise.all([
        getDoc(sourceUserSongRef),
        getDoc(targetUserSongRef)
      ]);

      if (sUserSnap.exists()) {
        const sData = sUserSnap.data();
        
        if (!tUserSnap.exists()) {
          await setDoc(targetUserSongRef, {
            ...sData,
            songId: targetId,
            lastUpdated: serverTimestamp()
          });
        } 
        else {
          const tData = tUserSnap.data() || {};
          const statusOrder = { 'learned': 3, 'learning': 2, 'wantToLearn': 1 };
          const sStatus = sData?.status as keyof typeof statusOrder || 'wantToLearn';
          const tStatus = tData?.status as keyof typeof statusOrder || 'wantToLearn';

          if ((statusOrder[sStatus] || 0) > (statusOrder[tStatus] || 0)) {
            await updateDoc(targetUserSongRef, {
              status: sStatus,
              lastUpdated: serverTimestamp()
            });
          }
        }

        await deleteDoc(sourceUserSongRef);
      }
    }

    const targetData = targetSnap.data() || {};
    const existingUsers = targetData.practicingUsers || [];
    const combinedUsers = Array.from(new Set([...existingUsers, ...practicingUsers]));

    await updateDoc(targetSongRef, {
      practicingUsers: combinedUsers,
      popularity: combinedUsers.length
    });

    await deleteDoc(sourceSongRef);

    return res.status(200).json({ 
      success: true, 
      count: practicingUsers.length,
      message: `Successfully merged ${practicingUsers.length} users and deleted duplicate song.`
    });

  } catch (error: any) {
    console.error("Merge Songs API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

