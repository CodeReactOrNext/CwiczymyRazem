import { SEASON_FAME_REWARDS } from "constants/seasonRewards";
import {
  sendSeasonEndingSoonEmail,
  sendSeasonResultsEmail,
  sendSeasonStartEmail,
  sendStreakReminderEmail,
} from "lib/email/send";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore, messaging } from "utils/firebase/api/firebase.config";

interface CronState {
  lastStreakSentDate?: string;
  lastSeasonStartFor?: string;
  lastSeasonEndingFor?: string;
  lastSeasonResultsFor?: string;
}

interface RankedParticipant {
  uid: string;
  place: number;
  points: number;
  displayName: string;
  email: string;
}

function diffInDays(today: Date, other: Date): number {
  return Math.ceil(
    Math.abs(today.getTime() - other.getTime()) / (1000 * 60 * 60 * 24)
  );
}

async function getSeasonParticipants(seasonId: string): Promise<RankedParticipant[]> {
  const usersSnap = await firestore
    .collection("seasons")
    .doc(seasonId)
    .collection("users")
    .orderBy("points", "desc")
    .get();

  if (usersSnap.empty) return [];

  type RankedBase = { uid: string; place: number; points: number; displayName: string };
  const ranked: RankedBase[] = usersSnap.docs.map((doc: any, idx: number) => ({
    uid: doc.id as string,
    place: idx + 1,
    points: (doc.data().points as number) || 0,
    displayName: (doc.data().displayName as string) || "",
  }));

  const userRefs = ranked.map((p: RankedBase) =>
    firestore.collection("users").doc(p.uid)
  );
  const userDocs = await firestore.getAll(...userRefs);

  return ranked
    .map((p: RankedBase, idx: number) => ({
      ...p,
      email: (userDocs[idx].data()?.email as string) ?? "",
    }))
    .filter((p: RankedParticipant) => !!p.email);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().slice(0, 10);

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const currentSeasonId = `${year}-${month}`;
  const lastDayOfMonth = new Date(year, today.getMonth() + 1, 0);
  const daysLeftInSeason = Math.round(
    (lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const cronStateRef = firestore.collection("cronState").doc("notifications");
  let cronState: CronState = {};
  try {
    const snap = await cronStateRef.get();
    if (snap.exists) cronState = (snap.data() as CronState) ?? {};
  } catch (err: any) {
    console.error("[cron] failed to read cronState", err?.message ?? err);
  }

  let pushSent = 0;
  let pushFailed = 0;
  let streakSent = 0;
  let streakFailed = 0;
  let streakSkipped = false;
  let seasonStartSent = 0;
  let seasonStartFailed = 0;
  let seasonEndingSent = 0;
  let seasonEndingFailed = 0;
  let seasonEndingSkipped = false;
  let seasonResultsSent = 0;
  let seasonResultsFailed = 0;
  let seasonResultsSkipped = false;
  let seasonStartSkipped = false;
  const errors: string[] = [];

  // ── 1. Push notifications ─────────────────────────────────────────────────
  try {
    const snapshot = await firestore
      .collection("users")
      .where("fcmData.notificationsEnabled", "==", true)
      .get();

    const pushJobs: Promise<any>[] = [];
    const allEnabledTokens: string[] = [];
    snapshot.docs.forEach((doc: any) => {
      const tokens = doc.data().fcmData?.tokens || [];
      allEnabledTokens.push(...tokens);
    });

    if (today.getDate() === 1 && allEnabledTokens.length > 0) {
      pushJobs.push(
        messaging.sendEachForMulticast({
          tokens: allEnabledTokens,
          notification: {
            title: "🎸 A new season has started!",
            body: `Season ${currentSeasonId} is now live. Start practicing and fight for top 5!`,
          },
          data: { url: "/seasons" },
        })
      );
    }

    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const tokens = data.fcmData?.tokens || [];
      if (!tokens.length) return;

      const lastReportDateStr = data.statistics?.lastReportDate;
      if (!lastReportDateStr) return;

      const lastReportDate = new Date(lastReportDateStr);
      if (isNaN(lastReportDate.getTime())) return;
      lastReportDate.setHours(0, 0, 0, 0);

      const diffDays = diffInDays(today, lastReportDate);

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
        pushJobs.push(
          messaging.sendEachForMulticast({
            tokens,
            notification: { title, body },
            data: { url: "/timer" },
          })
        );
      }
    });

    const settled = await Promise.allSettled(pushJobs);
    settled.forEach((r) => {
      if (r.status === "fulfilled") {
        pushSent += r.value.successCount ?? 0;
        pushFailed += r.value.failureCount ?? 0;
      } else {
        pushFailed += 1;
        errors.push(`push: ${r.reason?.message ?? String(r.reason)}`);
      }
    });
  } catch (err: any) {
    errors.push(`push-block: ${err?.message ?? String(err)}`);
    console.error("[cron] push block failed", err);
  }

  // ── 2. Streak reminder emails (idempotent per day) ────────────────────────
  if (cronState.lastStreakSentDate === todayKey) {
    streakSkipped = true;
  } else {
    try {
      const emailUsersSnapshot = await firestore
        .collection("users")
        .where("email", "!=", null)
        .get();

      const streakJobs: Promise<unknown>[] = [];

      emailUsersSnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        const email: string | null = data.email ?? null;
        if (!email) return;

        const lastReportDateStr = data.statistics?.lastReportDate;
        if (!lastReportDateStr) return;

        const lastReportDate = new Date(lastReportDateStr);
        if (isNaN(lastReportDate.getTime())) return;
        lastReportDate.setHours(0, 0, 0, 0);

        const diffDays = diffInDays(today, lastReportDate);
        if (diffDays !== 1 && diffDays !== 3) return;

        const streakDays: number = data.statistics?.actualDayWithoutBreak ?? 0;
        const userName: string = data.displayName ?? "";
        const variant = diffDays === 1 ? "d1" : "d3";

        streakJobs.push(
          sendStreakReminderEmail({ to: email, userName, streakDays, variant })
        );
      });

      const settled = await Promise.allSettled(streakJobs);
      settled.forEach((r) => {
        if (r.status === "fulfilled") streakSent += 1;
        else {
          streakFailed += 1;
          errors.push(`streak: ${r.reason?.message ?? String(r.reason)}`);
        }
      });

      await cronStateRef.set({ lastStreakSentDate: todayKey }, { merge: true });
    } catch (err: any) {
      errors.push(`streak-block: ${err?.message ?? String(err)}`);
      console.error("[cron] streak block failed", err);
    }
  }

  // ── 3. Season emails on day 1 of month ────────────────────────────────────
  if (today.getDate() === 1) {
    const prevDate = new Date(year, today.getMonth() - 1, 1);
    const prevSeasonId = `${prevDate.getFullYear()}-${String(
      prevDate.getMonth() + 1
    ).padStart(2, "0")}`;
    const prevSeasonName = `Season ${prevSeasonId}`;
    const currentSeasonName = `Season ${currentSeasonId}`;
    const daysInCurrentSeason = lastDayOfMonth.getDate();

    // 3a. Season results (for previous season)
    if (cronState.lastSeasonResultsFor === prevSeasonId) {
      seasonResultsSkipped = true;
    } else {
      try {
        const prevParticipants = await getSeasonParticipants(prevSeasonId);
        const top3 = prevParticipants.slice(0, 3).map((p) => ({
          displayName: p.displayName,
          points: p.points,
        }));

        const jobs = prevParticipants.map((p) => {
          const fameEarned =
            p.place <= 5 ? SEASON_FAME_REWARDS[p.place - 1] : null;
          return sendSeasonResultsEmail({
            to: p.email,
            userName: p.displayName,
            seasonName: prevSeasonName,
            userPlace: p.place,
            userPoints: p.points,
            fameEarned,
            top3,
          });
        });

        const settled = await Promise.allSettled(jobs);
        settled.forEach((r) => {
          if (r.status === "fulfilled") seasonResultsSent += 1;
          else {
            seasonResultsFailed += 1;
            errors.push(
              `season-results: ${r.reason?.message ?? String(r.reason)}`
            );
          }
        });

        await cronStateRef.set(
          { lastSeasonResultsFor: prevSeasonId },
          { merge: true }
        );
      } catch (err: any) {
        errors.push(`season-results-block: ${err?.message ?? String(err)}`);
        console.error("[cron] season-results block failed", err);
      }
    }

    // 3b. Season start (for current season)
    if (cronState.lastSeasonStartFor === currentSeasonId) {
      seasonStartSkipped = true;
    } else {
      try {
        const prevParticipants = await getSeasonParticipants(prevSeasonId);

        const jobs = prevParticipants.map((p) =>
          sendSeasonStartEmail({
            to: p.email,
            userName: p.displayName,
            seasonName: currentSeasonName,
            daysInSeason: daysInCurrentSeason,
          })
        );

        const settled = await Promise.allSettled(jobs);
        settled.forEach((r) => {
          if (r.status === "fulfilled") seasonStartSent += 1;
          else {
            seasonStartFailed += 1;
            errors.push(
              `season-start: ${r.reason?.message ?? String(r.reason)}`
            );
          }
        });

        await cronStateRef.set(
          { lastSeasonStartFor: currentSeasonId },
          { merge: true }
        );
      } catch (err: any) {
        errors.push(`season-start-block: ${err?.message ?? String(err)}`);
        console.error("[cron] season-start block failed", err);
      }
    }
  }

  // ── 4. Season ending soon (7 days before end of current season) ──────────
  if (daysLeftInSeason === 7) {
    if (cronState.lastSeasonEndingFor === currentSeasonId) {
      seasonEndingSkipped = true;
    } else {
      try {
        const currentParticipants = await getSeasonParticipants(currentSeasonId);
        const top3 = currentParticipants.slice(0, 3).map((p) => ({
          displayName: p.displayName,
          points: p.points,
        }));
        const seasonName = `Season ${currentSeasonId}`;

        const jobs = currentParticipants.map((p) =>
          sendSeasonEndingSoonEmail({
            to: p.email,
            userName: p.displayName,
            seasonName,
            top3,
          })
        );

        const settled = await Promise.allSettled(jobs);
        settled.forEach((r) => {
          if (r.status === "fulfilled") seasonEndingSent += 1;
          else {
            seasonEndingFailed += 1;
            errors.push(
              `season-ending: ${r.reason?.message ?? String(r.reason)}`
            );
          }
        });

        await cronStateRef.set(
          { lastSeasonEndingFor: currentSeasonId },
          { merge: true }
        );
      } catch (err: any) {
        errors.push(`season-ending-block: ${err?.message ?? String(err)}`);
        console.error("[cron] season-ending block failed", err);
      }
    }
  }

  return res.status(200).json({
    pushSent,
    pushFailed,
    streakSent,
    streakFailed,
    streakSkipped,
    seasonStartSent,
    seasonStartFailed,
    seasonStartSkipped,
    seasonEndingSent,
    seasonEndingFailed,
    seasonEndingSkipped,
    seasonResultsSent,
    seasonResultsFailed,
    seasonResultsSkipped,
    errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
  });
}
