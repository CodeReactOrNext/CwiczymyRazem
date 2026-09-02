import {
  getSeasonFameReward,
  SEASON_REWARD_PLACES,
} from "constants/seasonRewards";
import { DEFAULT_REMINDER_HOUR_UTC } from "constants/streakReminder";
import { isOnEmailCooldown, todayKey } from "lib/email/cooldown";
import {
  batchMarkCooldown,
  fetchCooldownsMap,
} from "lib/email/cooldownStore";
import {
  sendSeasonEndingSoonEmail,
  sendSeasonResultsEmail,
  sendSeasonStartEmail,
  sendStreakReminderEmail,
} from "lib/email/send";
import type { StreakEmailType } from "lib/email/streakCandidate";
import { evaluateStreakReminder } from "lib/email/streakCandidate";
import { sendThrottled } from "lib/email/throttle";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore, messaging } from "utils/firebase/api/firebase.config";

interface RankedParticipant {
  uid: string;
  place: number;
  points: number;
  displayName: string;
  email: string;
  seasonUpdates: boolean;
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
      // Opt-in by default: only an explicit `false` disables season emails.
      // Kept on every participant (not filtered out here) so places and the
      // top-3 list shown in other users' emails stay accurate.
      seasonUpdates:
        userDocs[idx].data()?.emailNotifications?.seasonUpdates !== false,
    }))
    .filter((p) => !!p.email);
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

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const dateKey = todayKey(now);

  // The cron fires hourly so streak reminders can land in each user's own
  // evening (see the streak block below). Everything else here is a once-a-day
  // job and would otherwise go out 24 times, so it stays pinned to one hour —
  // the same one the pre-hourly cron ran on.
  const currentHourUtc = now.getUTCHours();
  const isDailyBlockHour = currentHourUtc === DEFAULT_REMINDER_HOUR_UTC;

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const currentSeasonId = `${year}-${month}`;
  const lastDayOfMonth = new Date(year, today.getMonth() + 1, 0);
  const daysLeftInSeason = Math.round(
    (lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  let pushSent = 0;
  let pushFailed = 0;
  let streakSent = 0;
  let streakFailed = 0;
  let streakCooldown = 0;
  let seasonStartSent = 0;
  let seasonStartFailed = 0;
  let seasonStartCooldown = 0;
  let seasonEndingSent = 0;
  let seasonEndingFailed = 0;
  let seasonEndingCooldown = 0;
  let seasonResultsSent = 0;
  let seasonResultsFailed = 0;
  let seasonResultsCooldown = 0;
  const errors: string[] = [];

  // ── 1. Push notifications ────────────────────────────────────────────────
  if (isDailyBlockHour) {
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
              body: `Season ${currentSeasonId} is now live. Start practicing and fight for the top ${SEASON_REWARD_PLACES}!`,
            },
            data: { url: "/seasons" },
          })
        );
      }

      snapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        const tokens = data.fcmData?.tokens || [];
        if (!tokens.length) return;

        // Same "1 or 3 days since practice" rule the emails use, so a user never
        // gets a push and an email that disagree about whether they lapsed.
        const target = evaluateStreakReminder(data.statistics, now);
        if (!target) return;

        const { title, body } =
          target.daysSincePractice === 1
            ? {
                title: "🔥 Keep your streak alive!",
                body: "You haven't practiced today! Do a quick session to keep your streak.",
              }
            : {
                title: "We miss you! 🎸",
                body: "It's been 3 days since your last practice. Come back and play/sing a bit!",
              };

        pushJobs.push(
          messaging.sendEachForMulticast({
            tokens,
            notification: { title, body },
            data: { url: "/timer" },
          })
        );
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
  }

  // ── 2. Streak reminder emails (with 7-day per-user cooldown) ──────────────
  // Runs on every hourly tick, but each user is only ever *considered* on the
  // one tick matching their own evening (`statistics.reminderHourUtc`, written
  // on every report). That is an indexed equality query, not a scan — the daily
  // read budget is unchanged, just spread across the day instead of dumping
  // "your streak ends at midnight" on people at 11am local while they're at work.
  try {
    const scheduledSnapshot = await firestore
      .collection("users")
      .where("statistics.reminderHourUtc", "==", currentHourUtc)
      .get();

    const docsByUid = new Map<string, any>();
    scheduledSnapshot.docs.forEach((doc: any) => docsByUid.set(doc.id, doc.data()));

    // Accounts that have not reported since per-user scheduling shipped carry no
    // `reminderHourUtc`, and Firestore cannot query for a missing field — so the
    // pre-existing full scan survives, once a day, on the hour the cron used to
    // run. They keep exactly their old behaviour and migrate off this path by
    // themselves the first time they log a session. No backfill needed.
    if (isDailyBlockHour) {
      const legacySnapshot = await firestore
        .collection("users")
        .where("email", "!=", null)
        .get();

      legacySnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        if (typeof data.statistics?.reminderHourUtc === "number") return;
        docsByUid.set(doc.id, data);
      });
    }

    interface StreakCandidate {
      uid: string;
      email: string;
      displayName: string;
      streakDays: number;
      hoursLeft: number | null;
      variant: "d1" | "d3";
      type: StreakEmailType;
    }
    const candidates: StreakCandidate[] = [];

    docsByUid.forEach((data, uid) => {
      const email: string | null = data.email ?? null;
      if (!email) return;

      // Respect opt-out: only an explicit `false` disables streak emails.
      if (data.emailNotifications?.streakReminders === false) return;

      const target = evaluateStreakReminder(data.statistics, now);
      if (!target) return;

      candidates.push({
        uid,
        email,
        displayName: data.displayName ?? "",
        streakDays: target.streakDays,
        hoursLeft: target.hoursLeft,
        variant: target.variant,
        type: target.type,
      });
    });

    const cooldowns = await fetchCooldownsMap(candidates.map((c) => c.uid));

    interface StreakJob {
      uid: string;
      type: StreakEmailType;
      run: () => Promise<unknown>;
    }
    const jobs: StreakJob[] = [];

    candidates.forEach((c) => {
      const cd = cooldowns.get(c.uid) ?? null;
      if (isOnEmailCooldown(cd, c.type, now)) {
        streakCooldown += 1;
        return;
      }
      jobs.push({
        uid: c.uid,
        type: c.type,
        run: () =>
          sendStreakReminderEmail({
            to: c.email,
            userName: c.displayName,
            streakDays: c.streakDays,
            hoursLeft: c.hoursLeft,
            variant: c.variant,
          }),
      });
    });

    const settled = await sendThrottled(jobs, (j) => j.run());
    const succeeded: { uid: string; type: StreakEmailType }[] = [];
    settled.forEach((r, idx) => {
      if (r.status === "fulfilled") {
        streakSent += 1;
        succeeded.push({ uid: jobs[idx].uid, type: jobs[idx].type });
      } else {
        streakFailed += 1;
        errors.push(`streak: ${r.reason?.message ?? String(r.reason)}`);
      }
    });

    await batchMarkCooldown(succeeded, dateKey);
  } catch (err: any) {
    errors.push(`streak-block: ${err?.message ?? String(err)}`);
    console.error("[cron] streak block failed", err);
  }

  // ── 3. Season emails on day 1 of month ────────────────────────────────────
  if (isDailyBlockHour && today.getDate() === 1) {
    const prevDate = new Date(year, today.getMonth() - 1, 1);
    const prevSeasonId = `${prevDate.getFullYear()}-${String(
      prevDate.getMonth() + 1
    ).padStart(2, "0")}`;
    const prevSeasonName = `Season ${prevSeasonId}`;
    const currentSeasonName = `Season ${currentSeasonId}`;
    const daysInCurrentSeason = lastDayOfMonth.getDate();

    let prevParticipants: RankedParticipant[] = [];
    let prevCooldowns: Map<string, any> = new Map();
    try {
      prevParticipants = await getSeasonParticipants(prevSeasonId);
      prevCooldowns = await fetchCooldownsMap(prevParticipants.map((p) => p.uid));
    } catch (err: any) {
      errors.push(`season-prev-fetch: ${err?.message ?? String(err)}`);
      console.error("[cron] season previous fetch failed", err);
    }

    // 3a. Season results (for previous season)
    try {
      const top3 = prevParticipants.slice(0, 3).map((p) => ({
        displayName: p.displayName,
        points: p.points,
      }));

      const jobs: { uid: string; run: () => Promise<unknown> }[] = [];
      prevParticipants.forEach((p) => {
        if (!p.seasonUpdates) return;
        if (isOnEmailCooldown(prevCooldowns.get(p.uid) ?? null, "season_results", now)) {
          seasonResultsCooldown += 1;
          return;
        }
        const fameEarned = getSeasonFameReward(p.place);
        jobs.push({
          uid: p.uid,
          run: () =>
            sendSeasonResultsEmail({
              to: p.email,
              userName: p.displayName,
              seasonName: prevSeasonName,
              userPlace: p.place,
              userPoints: p.points,
              fameEarned,
              top3,
            }),
        });
      });

      const settled = await sendThrottled(jobs, (j) => j.run());
      const succeeded: { uid: string; type: "season_results" }[] = [];
      settled.forEach((r, idx) => {
        if (r.status === "fulfilled") {
          seasonResultsSent += 1;
          succeeded.push({ uid: jobs[idx].uid, type: "season_results" });
        } else {
          seasonResultsFailed += 1;
          errors.push(
            `season-results: ${r.reason?.message ?? String(r.reason)}`
          );
        }
      });

      await batchMarkCooldown(succeeded, dateKey);
    } catch (err: any) {
      errors.push(`season-results-block: ${err?.message ?? String(err)}`);
      console.error("[cron] season-results block failed", err);
    }

    // 3b. Season start (for current season — invites previous participants)
    try {
      const jobs: { uid: string; run: () => Promise<unknown> }[] = [];
      prevParticipants.forEach((p) => {
        if (!p.seasonUpdates) return;
        if (isOnEmailCooldown(prevCooldowns.get(p.uid) ?? null, "season_start", now)) {
          seasonStartCooldown += 1;
          return;
        }
        jobs.push({
          uid: p.uid,
          run: () =>
            sendSeasonStartEmail({
              to: p.email,
              userName: p.displayName,
              seasonName: currentSeasonName,
              daysInSeason: daysInCurrentSeason,
            }),
        });
      });

      const settled = await sendThrottled(jobs, (j) => j.run());
      const succeeded: { uid: string; type: "season_start" }[] = [];
      settled.forEach((r, idx) => {
        if (r.status === "fulfilled") {
          seasonStartSent += 1;
          succeeded.push({ uid: jobs[idx].uid, type: "season_start" });
        } else {
          seasonStartFailed += 1;
          errors.push(
            `season-start: ${r.reason?.message ?? String(r.reason)}`
          );
        }
      });

      await batchMarkCooldown(succeeded, dateKey);
    } catch (err: any) {
      errors.push(`season-start-block: ${err?.message ?? String(err)}`);
      console.error("[cron] season-start block failed", err);
    }
  }

  // ── 4. Season ending soon (7 days before end of current season) ──────────
  if (isDailyBlockHour && daysLeftInSeason === 7) {
    try {
      const currentParticipants = await getSeasonParticipants(currentSeasonId);
      const cooldowns = await fetchCooldownsMap(
        currentParticipants.map((p) => p.uid)
      );
      const seasonName = `Season ${currentSeasonId}`;

      const jobs: { uid: string; run: () => Promise<unknown> }[] = [];
      currentParticipants.forEach((p) => {
        if (!p.seasonUpdates) return;
        if (isOnEmailCooldown(cooldowns.get(p.uid) ?? null, "season_ending_soon", now)) {
          seasonEndingCooldown += 1;
          return;
        }
        jobs.push({
          uid: p.uid,
          run: () =>
            sendSeasonEndingSoonEmail({
              to: p.email,
              userName: p.displayName,
              seasonName,
              daysLeft: daysLeftInSeason,
            }),
        });
      });

      const settled = await sendThrottled(jobs, (j) => j.run());
      const succeeded: { uid: string; type: "season_ending_soon" }[] = [];
      settled.forEach((r, idx) => {
        if (r.status === "fulfilled") {
          seasonEndingSent += 1;
          succeeded.push({ uid: jobs[idx].uid, type: "season_ending_soon" });
        } else {
          seasonEndingFailed += 1;
          errors.push(
            `season-ending: ${r.reason?.message ?? String(r.reason)}`
          );
        }
      });

      await batchMarkCooldown(succeeded, dateKey);
    } catch (err: any) {
      errors.push(`season-ending-block: ${err?.message ?? String(err)}`);
      console.error("[cron] season-ending block failed", err);
    }
  }

  return res.status(200).json({
    hourUtc: currentHourUtc,
    ranDailyBlocks: isDailyBlockHour,
    pushSent,
    pushFailed,
    streakSent,
    streakFailed,
    streakCooldown,
    seasonStartSent,
    seasonStartFailed,
    seasonStartCooldown,
    seasonEndingSent,
    seasonEndingFailed,
    seasonEndingCooldown,
    seasonResultsSent,
    seasonResultsFailed,
    seasonResultsCooldown,
    errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
  });
}
