import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";
import { collection, query, getDocs, orderBy, Timestamp, getCountFromServer, limit, where } from "firebase/firestore";

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
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Get Total Users Count (Efficient Aggregation)
    const totalSnapshot = await getCountFromServer(usersRef);
    const totalUsers = totalSnapshot.data().count;

    // 2. Get Only Last 7 Days Users (for admin panel)
    const recentUsersQuery = query(
      usersRef,
      where("createdAt", ">", Timestamp.fromDate(last7Days)),
      orderBy("createdAt", "desc")
    );
    const recentSnapshot = await getDocs(recentUsersQuery);

    const users = recentSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }));

    return res.status(200).json({
      users,
      stats: {
        totalUsers,
        recentUsers: users.length,
        registrationTrend: []
      }
    });
  } catch (error: any) {
    console.error("Fetch Users Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
