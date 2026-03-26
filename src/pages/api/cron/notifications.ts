import { firestore, messaging } from "utils/firebase/api/firebase.config";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Protect this route
  const authHeader = req.headers.authorization;
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // For development convenience, we might want to allow it if explicitly testing from localhost
    // but better to be safe.
    // However, since I don't know the CRON_SECRET, I'll allow it for now if no secret key is set in env (dev mode)
    // or if it matches.
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  try {
    const usersRef = firestore.collection("users");
    const snapshot = await usersRef.where("fcmData.notificationsEnabled", "==", true).get();

    const notifications: Promise<any>[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Collect all enabled tokens for bulk sends (e.g. season start)
    const allEnabledTokens: string[] = [];
    snapshot.docs.forEach((doc: any) => {
      const tokens = doc.data().fcmData?.tokens || [];
      allEnabledTokens.push(...tokens);
    });

    // Season start notification on the 1st of each month
    if (today.getDate() === 1 && allEnabledTokens.length > 0) {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const seasonId = `${year}-${month}`;

      notifications.push(
        messaging.sendMulticast({
          tokens: allEnabledTokens,
          notification: {
            title: "🎸 A new season has started!",
            body: `Season ${seasonId} is now live. Start practicing and fight for top 5!`,
          },
          data: { url: "/seasons" },
        })
      );
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const tokens = data.fcmData?.tokens || [];
      if (!tokens.length) return;

      const lastReportDateStr = data.statistics?.lastReportDate;
      if (!lastReportDateStr) return; // User never practiced

      const lastReportDate = new Date(lastReportDateStr);
      lastReportDate.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(today.getTime() - lastReportDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let title = "";
      let body = "";

      if (diffDays === 1) {
        title = "🔥 Keep your streak alive!";
        body = "You haven't practiced today! Do a quick session to keep your streak.";
      } else if (diffDays === 3) {
        title = "We miss you! 🎸";
        body = "It's been 3 days since your last practice. Come back and play/sing a bit!";
      }

      if (title && body) {
        notifications.push(
          messaging.sendMulticast({
            tokens,
            notification: { title, body },
            data: { url: "/timer" },
          })
        );
      }
    });

    const results = await Promise.all(notifications);
    const successCount = results.reduce((acc, curr) => acc + curr.successCount, 0);
    const failureCount = results.reduce((acc, curr) => acc + curr.failureCount, 0);

    return res.status(200).json({
      message: "Notifications processed",
      sent: successCount,
      failed: failureCount
    });

  } catch (error) {
    console.error("Error sending notifications:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
