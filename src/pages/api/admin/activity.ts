import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";

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
    const logsRef = collection(db, "logs");
    const q = query(logsRef, orderBy("data", "desc"), limit(50));
    const querySnapshot = await getDocs(q);

    const logs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const timestamp = data.data ? new Date(data.data).getTime() : Date.now();

      let type = "misc";
      if (data.exceriseTitle || data.timeSumary) type = "exercise";
      else if (data.songTitle || ["learned", "wantToLearn", "learning", "added"].includes(data.status)) type = "song";
      else if (data.newAchievements || data.achievements) type = "achievement";
      else if (data.newLevel?.isNewLevel || data.lvl) type = "level";
      else if (data.type === "top_players_update") type = "system";

      return {
        id: doc.id,
        ...data,
        type,
        timestamp,
      };
    });

    return res.status(200).json({
      logs,
      activityTrend: [],
      featureUsage: [],
      skillDistribution: [],
      stats: {
        totalEvents: logs.length,
        totalPoints: 0,
        totalTimeMinutes: 0,
        activeUsers30d: 0
      }
    });
  } catch (error: any) {
    console.error("Fetch Activity Logs Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
