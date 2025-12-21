import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";
import { collection, query, getDocs, orderBy, Timestamp } from "firebase/firestore";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const password = req.headers["x-admin-password"] || req.body.password;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }));

    // Calculate some basic stats
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentUsersCount = users.filter((u: any) => {
      const d = new Date(u.createdAt);
      return d > last7Days;
    }).length;

    // Registration trend (last 30 days)
    const trendData: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      trendData[dateKey] = 0;
    }

    users.forEach((u: any) => {
      const d = new Date(u.createdAt);
      if (d > last30Days) {
        const dateKey = d.toISOString().split('T')[0];
        if (trendData[dateKey] !== undefined) {
          trendData[dateKey]++;
        }
      }
    });

    const registrationTrend = Object.entries(trendData)
      .map(([date, count]) => ({
        date,
        name: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        users: count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return res.status(200).json({
      users,
      stats: {
        totalUsers: users.length,
        recentUsers: recentUsersCount,
        registrationTrend
      }
    });
  } catch (error: any) {
    console.error("Fetch Users Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
