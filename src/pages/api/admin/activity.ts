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
    // Fetch last 500 logs for better analytical sample
    const q = query(logsRef, orderBy("data", "desc"), limit(500));
    const querySnapshot = await getDocs(q);

    const logs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const timestamp = data.data ? new Date(data.data).getTime() : Date.now();

      // Categorize log type
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

    // Calculate 30-day trends
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const trendData: Record<string, any> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      trendData[dateKey] = {
        date: dateKey,
        total: 0,
        exercises: 0,
        songs: 0,
        achievements: 0,
        levels: 0,
        users: new Set()
      };
    }

    let totalPoints = 0;
    let totalTime = 0;
    const skillTime = { technique: 0, theory: 0, hearing: 0, creativity: 0 };

    logs.forEach((log: any) => {
      const d = new Date(log.timestamp);
      const dateKey = d.toISOString().split('T')[0];

      if (trendData[dateKey]) {
        trendData[dateKey].total++;
        if (log.type === "exercise") trendData[dateKey].exercises++;
        if (log.type === "song") trendData[dateKey].songs++;
        if (log.type === "achievement") trendData[dateKey].achievements++;
        if (log.type === "level") trendData[dateKey].levels++;
        if ((log as any).uid) trendData[dateKey].users.add((log as any).uid);
      }

      // Aggregate global stats from logs
      if (log.newLevel?.points) totalPoints += log.newLevel.points;
      if (log.totalPoints) totalPoints += log.totalPoints;

      if (log.timeSumary) {
        totalTime += log.timeSumary.sumTime || 0;
        skillTime.technique += log.timeSumary.techniqueTime || 0;
        skillTime.theory += log.timeSumary.theoryTime || 0;
        skillTime.hearing += log.timeSumary.hearingTime || 0;
        skillTime.creativity += log.timeSumary.creativityTime || 0;
      }
    });

    const activityTrend = Object.values(trendData).map((day: any) => ({
      name: new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      date: day.date,
      count: day.total,
      exercises: day.exercises,
      songs: day.songs,
      achievements: day.achievements,
      levels: day.levels,
      activeUsers: day.users.size
    }));

    const featureUsage = [
      { name: "Exercises", value: logs.filter(l => l.type === "exercise").length },
      { name: "Songs", value: logs.filter(l => l.type === "song").length },
      { name: "Achievements", value: logs.filter(l => l.type === "achievement").length },
      { name: "Levels", value: logs.filter(l => l.type === "level").length },
    ];

    return res.status(200).json({
      logs: logs.slice(0, 50), // Send fewer logs for the feed to save BW
      activityTrend,
      featureUsage,
      skillDistribution: [
        { name: "Technique", value: skillTime.technique },
        { name: "Theory", value: skillTime.theory },
        { name: "Hearing", value: skillTime.hearing },
        { name: "Creativity", value: skillTime.creativity },
      ],
      stats: {
        totalEvents: logs.length,
        totalPoints,
        totalTimeMinutes: Math.floor(totalTime / 60),
        activeUsers30d: new Set(logs.map(l => (l as any).uid)).size
      }
    });
  } catch (error: any) {
    console.error("Fetch Activity Logs Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
