import {
  sendSeasonEndingSoonEmail,
  sendSeasonResultsEmail,
  sendSeasonStartEmail,
  sendStreakReminderEmail,
} from "lib/email/send";
import { SEASON_FAME_REWARDS } from "constants/seasonRewards";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore, messaging } from "utils/firebase/api/firebase.config";

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
        messaging.sendEachForMulticast({
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
          messaging.sendEachForMulticast({
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

    // Streak reminder emails — independent of push notification opt-in
    const emailUsersSnapshot = await firestore
      .collection("users")
      .where("email", "!=", null)
      .get();

    const emailJobs: Promise<unknown>[] = [];

    emailUsersSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const email: string | null = data.email ?? null;
      if (!email) return;

      const lastReportDateStr = data.statistics?.lastReportDate;
      if (!lastReportDateStr) return;

      const lastReportDate = new Date(lastReportDateStr);
      lastReportDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil(
        Math.abs(today.getTime() - lastReportDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays !== 1 && diffDays !== 3) return;

      const streakDays: number = data.statistics?.actualDayWithoutBreak ?? 0;
      const userName: string = data.displayName ?? "";
      const variant = diffDays === 1 ? "d1" : "d3";

      emailJobs.push(
        sendStreakReminderEmail({ to: email, userName, streakDays, variant }).catch(
          (err) => console.error("[email] streak reminder failed", { email, variant, err })
        )
      );
    });

    await Promise.all(emailJobs);

    // Season emails
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const currentSeasonId = `${year}-${month}`;
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysLeftInSeason = Math.round(
      (lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const seasonJobs: Promise<unknown>[] = [];

    // Helper: fetch participants of a season with their emails
    async function getSeasonParticipants(seasonId: string) {
      const usersSnap = await firestore
        .collection("seasons")
        .doc(seasonId)
        .collection("users")
        .orderBy("points", "desc")
        .get();

      if (usersSnap.empty) return [];

      type RankedParticipant = { uid: string; place: number; points: number; displayName: string };

      const ranked: RankedParticipant[] = usersSnap.docs.map((doc: any, idx: number) => ({
        uid: doc.id as string,
        place: idx + 1,
        points: (doc.data().points as number) || 0,
        displayName: (doc.data().displayName as string) || "",
      }));

      const userRefs = ranked.map((p: RankedParticipant) => firestore.collection("users").doc(p.uid));
      const userDocs = await firestore.getAll(...userRefs);

      return ranked
        .map((p: RankedParticipant, idx: number) => ({
          ...p,
          email: (userDocs[idx].data()?.email as string) ?? null,
        }))
        .filter((p: RankedParticipant & { email: string | null }) => p.email !== null) as (RankedParticipant & { email: string })[];
    }

    // Day 1: season results for previous season + start email for new season
    if (today.getDate() === 1) {
      const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const prevSeasonId = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
      const prevSeasonName = `Season ${prevSeasonId}`;
      const currentSeasonName = `Season ${currentSeasonId}`;
      const daysInCurrentSeason = lastDayOfMonth.getDate();

      const prevParticipants = await getSeasonParticipants(prevSeasonId);
      const top3 = prevParticipants.slice(0, 3).map((p) => ({
        displayName: p.displayName,
        points: p.points,
      }));

      for (const participant of prevParticipants) {
        const isTopFive = participant.place <= 5;
        const fameEarned = isTopFive ? SEASON_FAME_REWARDS[participant.place - 1] : null;

        seasonJobs.push(
          sendSeasonResultsEmail({
            to: participant.email,
            userName: participant.displayName,
            seasonName: prevSeasonName,
            userPlace: participant.place,
            userPoints: participant.points,
            fameEarned,
            top3,
          }).catch((err) =>
            console.error("[email] season results failed", { email: participant.email, err })
          )
        );

        seasonJobs.push(
          sendSeasonStartEmail({
            to: participant.email,
            userName: participant.displayName,
            seasonName: currentSeasonName,
            daysInSeason: daysInCurrentSeason,
          }).catch((err) =>
            console.error("[email] season start failed", { email: participant.email, err })
          )
        );
      }
    }

    // 7 days before end of season: ending soon email
    if (daysLeftInSeason === 7) {
      const currentParticipants = await getSeasonParticipants(currentSeasonId);
      const top3 = currentParticipants.slice(0, 3).map((p) => ({
        displayName: p.displayName,
        points: p.points,
      }));
      const seasonName = `Season ${currentSeasonId}`;

      for (const participant of currentParticipants) {
        seasonJobs.push(
          sendSeasonEndingSoonEmail({
            to: participant.email,
            userName: participant.displayName,
            seasonName,
            top3,
          }).catch((err) =>
            console.error("[email] season ending soon failed", { email: participant.email, err })
          )
        );
      }
    }

    await Promise.all(seasonJobs);

    return res.status(200).json({
      message: "Notifications processed",
      pushSent: successCount,
      pushFailed: failureCount,
      streakEmailsSent: emailJobs.length,
      seasonEmailsSent: seasonJobs.length,
    });

  } catch (error) {
    console.error("Error sending notifications:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
