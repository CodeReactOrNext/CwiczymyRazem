import { SEASON_FAME_REWARDS } from "constants/seasonRewards";
import { isOnEmailCooldown, todayKey } from "lib/email/cooldown";
import {
  fetchCooldown,
  fetchCooldownsMap,
  markCooldown,
} from "lib/email/cooldownStore";
import {
  sendSeasonEndingSoonEmail,
  sendSeasonResultsEmail,
  sendSeasonStartEmail,
  sendStreakReminderEmail,
  sendWelcomeEmail,
} from "lib/email/send";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

export type AdminEmailType =
  | "welcome"
  | "streak_d1"
  | "streak_d3"
  | "season_start"
  | "season_ending_soon"
  | "season_results";

const EMAIL_TYPES: AdminEmailType[] = [
  "welcome",
  "streak_d1",
  "streak_d3",
  "season_start",
  "season_ending_soon",
  "season_results",
];

interface TopPlayer {
  displayName: string;
  points: number;
}

export interface AdminEmailRecipient {
  uid: string;
  email: string;
  displayName: string;
  extras?: Record<string, unknown>;
}

export interface AdminEmailContext {
  seasonName?: string;
  daysInSeason?: number;
  daysLeft?: number;
  top3?: TopPlayer[];
}

interface RecipientsResponse {
  type: AdminEmailType;
  recipients: AdminEmailRecipient[];
  cooldownExcluded: number;
  context?: AdminEmailContext;
  description: string;
}

function isAuthorized(req: NextApiRequest): boolean {
  const password = req.headers["x-admin-password"] ?? req.body?.password;
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

function getSeasonIds(now: Date) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const currentSeasonId = `${year}-${month}`;

  const prev = new Date(year, now.getMonth() - 1, 1);
  const prevSeasonId = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  const lastDayOfMonth = new Date(year, now.getMonth() + 1, 0);
  const daysInCurrentSeason = lastDayOfMonth.getDate();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const daysLeftInSeason = Math.max(
    0,
    Math.round((lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  return { currentSeasonId, prevSeasonId, daysInCurrentSeason, daysLeftInSeason };
}

interface RankedParticipant {
  uid: string;
  place: number;
  points: number;
  displayName: string;
  email: string;
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
    .filter((p) => !!p.email);
}

async function getStreakCandidates(diffTarget: 1 | 3): Promise<
  { uid: string; email: string; displayName: string; streakDays: number }[]
> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const snap = await firestore.collection("users").where("email", "!=", null).get();

  const list: {
    uid: string;
    email: string;
    displayName: string;
    streakDays: number;
  }[] = [];
  snap.docs.forEach((doc: any) => {
    const data = doc.data();
    const email: string | undefined = data.email;
    if (!email) return;

    const lastReportDateStr = data.statistics?.lastReportDate;
    if (!lastReportDateStr) return;

    const lastReportDate = new Date(lastReportDateStr);
    if (isNaN(lastReportDate.getTime())) return;
    lastReportDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      Math.abs(today.getTime() - lastReportDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays !== diffTarget) return;

    list.push({
      uid: doc.id,
      email,
      displayName: data.displayName ?? "",
      streakDays: data.statistics?.actualDayWithoutBreak ?? 0,
    });
  });

  return list;
}

async function buildRecipientsResponse(type: AdminEmailType): Promise<RecipientsResponse> {
  const now = new Date();
  const { currentSeasonId, prevSeasonId, daysInCurrentSeason, daysLeftInSeason } =
    getSeasonIds(now);

  if (type === "streak_d1" || type === "streak_d3") {
    const diff = type === "streak_d1" ? 1 : 3;
    const list = await getStreakCandidates(diff);
    const cooldowns = await fetchCooldownsMap(list.map((u) => u.uid));

    const eligible = list.filter(
      (u) => !isOnEmailCooldown(cooldowns.get(u.uid) ?? null, type, now)
    );
    const excluded = list.length - eligible.length;

    return {
      type,
      recipients: eligible.map((u) => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        extras: { streakDays: u.streakDays },
      })),
      cooldownExcluded: excluded,
      description: `Users whose last practice was exactly ${diff} day${diff > 1 ? "s" : ""} ago.`,
    };
  }

  if (type === "season_start") {
    const participants = await getSeasonParticipants(prevSeasonId);
    const cooldowns = await fetchCooldownsMap(participants.map((p) => p.uid));
    const eligible = participants.filter(
      (p) => !isOnEmailCooldown(cooldowns.get(p.uid) ?? null, type, now)
    );
    const excluded = participants.length - eligible.length;
    return {
      type,
      recipients: eligible.map((p) => ({
        uid: p.uid,
        email: p.email,
        displayName: p.displayName,
      })),
      cooldownExcluded: excluded,
      context: {
        seasonName: `Season ${currentSeasonId}`,
        daysInSeason: daysInCurrentSeason,
      },
      description: `Participants of previous season (${prevSeasonId}). They will be invited to the new season ${currentSeasonId}.`,
    };
  }

  if (type === "season_ending_soon") {
    const participants = await getSeasonParticipants(currentSeasonId);
    const cooldowns = await fetchCooldownsMap(participants.map((p) => p.uid));
    const top3 = participants.slice(0, 3).map((p) => ({
      displayName: p.displayName,
      points: p.points,
    }));
    const eligible = participants.filter(
      (p) => !isOnEmailCooldown(cooldowns.get(p.uid) ?? null, type, now)
    );
    const excluded = participants.length - eligible.length;
    return {
      type,
      recipients: eligible.map((p) => ({
        uid: p.uid,
        email: p.email,
        displayName: p.displayName,
      })),
      cooldownExcluded: excluded,
      context: {
        seasonName: `Season ${currentSeasonId}`,
        daysLeft: daysLeftInSeason,
        top3,
      },
      description: `Current season (${currentSeasonId}) participants — ${daysLeftInSeason} day${daysLeftInSeason === 1 ? "" : "s"} left.`,
    };
  }

  if (type === "season_results") {
    const participants = await getSeasonParticipants(prevSeasonId);
    const cooldowns = await fetchCooldownsMap(participants.map((p) => p.uid));
    const top3 = participants.slice(0, 3).map((p) => ({
      displayName: p.displayName,
      points: p.points,
    }));
    const eligible = participants.filter(
      (p) => !isOnEmailCooldown(cooldowns.get(p.uid) ?? null, type, now)
    );
    const excluded = participants.length - eligible.length;
    return {
      type,
      recipients: eligible.map((p) => ({
        uid: p.uid,
        email: p.email,
        displayName: p.displayName,
        extras: {
          place: p.place,
          points: p.points,
          fameEarned: p.place <= 5 ? SEASON_FAME_REWARDS[p.place - 1] : null,
        },
      })),
      cooldownExcluded: excluded,
      context: {
        seasonName: `Season ${prevSeasonId}`,
        top3,
      },
      description: `Final results for previous season (${prevSeasonId}).`,
    };
  }

  if (type === "welcome") {
    const snap = await firestore.collection("users").where("email", "!=", null).get();
    type Row = { uid: string; email: string; displayName: string };
    const all: Row[] = [];
    snap.docs.forEach((doc: any) => {
      const data = doc.data();
      if (!data.email) return;
      all.push({
        uid: doc.id,
        email: data.email,
        displayName: data.displayName ?? "",
      });
    });
    const cooldowns = await fetchCooldownsMap(all.map((u) => u.uid));
    const eligible = all.filter(
      (u) => !isOnEmailCooldown(cooldowns.get(u.uid) ?? null, type, now)
    );
    const excluded = all.length - eligible.length;
    return {
      type,
      recipients: eligible.map((u) => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
      })),
      cooldownExcluded: excluded,
      description:
        "All users with an email address. Use carefully — welcome is normally sent automatically on signup.",
    };
  }

  throw new Error(`Unknown email type: ${type}`);
}

async function sendOne(
  type: AdminEmailType,
  recipient: AdminEmailRecipient,
  context: AdminEmailContext | undefined
): Promise<void> {
  if (type === "welcome") {
    await sendWelcomeEmail({ to: recipient.email, userName: recipient.displayName });
    return;
  }

  if (type === "streak_d1" || type === "streak_d3") {
    const variant = type === "streak_d1" ? "d1" : "d3";
    const streakDays = Number(recipient.extras?.streakDays ?? 0);
    await sendStreakReminderEmail({
      to: recipient.email,
      userName: recipient.displayName,
      streakDays,
      variant,
    });
    return;
  }

  if (type === "season_start") {
    if (!context?.seasonName || context.daysInSeason == null) {
      throw new Error("season_start requires context.seasonName and context.daysInSeason");
    }
    await sendSeasonStartEmail({
      to: recipient.email,
      userName: recipient.displayName,
      seasonName: context.seasonName,
      daysInSeason: context.daysInSeason,
    });
    return;
  }

  if (type === "season_ending_soon") {
    if (!context?.seasonName || !context.top3 || context.daysLeft == null) {
      throw new Error(
        "season_ending_soon requires context.seasonName, context.top3 and context.daysLeft"
      );
    }
    await sendSeasonEndingSoonEmail({
      to: recipient.email,
      userName: recipient.displayName,
      seasonName: context.seasonName,
      daysLeft: context.daysLeft,
      top3: context.top3,
    });
    return;
  }

  if (type === "season_results") {
    if (!context?.seasonName || !context.top3) {
      throw new Error("season_results requires context.seasonName and context.top3");
    }
    const place = recipient.extras?.place as number | null | undefined;
    const points = Number(recipient.extras?.points ?? 0);
    const fameEarned = (recipient.extras?.fameEarned as number | null | undefined) ?? null;
    await sendSeasonResultsEmail({
      to: recipient.email,
      userName: recipient.displayName,
      seasonName: context.seasonName,
      userPlace: place ?? null,
      userPoints: points,
      fameEarned,
      top3: context.top3,
    });
    return;
  }

  throw new Error(`Unknown email type: ${type}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const type = req.query.type as AdminEmailType | undefined;
    if (!type || !EMAIL_TYPES.includes(type)) {
      return res.status(400).json({ error: "Invalid or missing 'type' query param" });
    }
    try {
      const response = await buildRecipientsResponse(type);
      return res.status(200).json(response);
    } catch (err: any) {
      console.error("[admin/emails] GET failed", { type, err });
      return res.status(500).json({ error: err.message ?? "Failed to load recipients" });
    }
  }

  if (req.method === "POST") {
    const { type, recipients, context } = req.body as {
      type?: AdminEmailType;
      recipients?: AdminEmailRecipient[];
      context?: AdminEmailContext;
    };

    if (!type || !EMAIL_TYPES.includes(type)) {
      return res.status(400).json({ error: "Invalid or missing 'type'" });
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "'recipients' must be a non-empty array" });
    }

    const now = new Date();
    const dateKey = todayKey(now);

    const results = await Promise.all(
      recipients.map(async (r) => {
        try {
          if (!r.email) {
            return { uid: r.uid, email: r.email, ok: false, error: "Missing email" };
          }

          const cd = await fetchCooldown(r.uid);
          if (isOnEmailCooldown(cd, type, now)) {
            return {
              uid: r.uid,
              email: r.email,
              ok: false,
              error: "Cooldown — same email sent within last 7 days",
              cooldown: true,
            };
          }

          await sendOne(type, r, context);
          await markCooldown(r.uid, type, dateKey);
          return { uid: r.uid, email: r.email, ok: true };
        } catch (err: any) {
          const errorMsg = err?.message ?? err?.toString() ?? "Send failed";
          console.error("[admin/emails] send failed", { uid: r.uid, email: r.email, errorMsg });
          return { uid: r.uid, email: r.email, ok: false, error: errorMsg };
        }
      })
    );

    const sent = results.filter((r) => r.ok).length;
    const failed = results.length - sent;
    const cooldownSkipped = results.filter((r) => !r.ok && (r as any).cooldown).length;

    return res.status(200).json({ sent, failed, cooldownSkipped, results });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
