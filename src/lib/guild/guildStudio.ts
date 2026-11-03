import {
  STUDIO_ITEMS,
  STUDIO_MAX_ITEM_LEVEL,
  STUDIO_MAX_ROOM_LEVEL,
} from "feature/guilds/data/guildStudio";
import type { GuildMember } from "feature/guilds/types/guild.types";
import type {
  GuildStudio,
  GuildStudioView,
  WeeklyMemberStats,
} from "feature/guilds/utils/guildStudio.utils";
import {
  EMPTY_STUDIO,
  itemCap,
  upgradeItem,
  upgradeRoom,
} from "feature/guilds/utils/guildStudio.utils";
import { readTreasury } from "feature/guilds/utils/guildTreasury.utils";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { AggregateField, FieldValue } from "firebase-admin/firestore";
import {
  liveStreak,
  REPORT_POINTS_FIELD,
  REPORT_TIME_FIELDS,
} from "lib/guild/guildQuests";
import type { PlayerSession } from "lib/support/supporterAuth";
import { userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The guild studio on the server: reading it off the guild document, the
 * week the weekly board ranks, and paying for a step out of the treasury.
 *
 * Any member may spend, the same way any member may put Fame in — the room is
 * the guild's, and the treasury is what it saved up for it. What a step costs
 * and whether the room allows it are the same pure rules the client draws
 * with (`guildStudio.utils.ts`), run here inside the transaction against the
 * stored studio and the stored balance, so a stale screen can never buy twice
 * or overdraw. Which guild is the caller's own `guildId`, an Admin-SDK-written
 * field, never anything in the request.
 */

const guildRef = (id: string): DocumentReference =>
  firestore.collection("guilds").doc(id);

const num = (value: unknown): number => Number(value) || 0;

/**
 * The stored studio, made safe to draw: a room level inside the ladder, only
 * pieces the catalog knows, and no piece above what its room allows. A guild
 * that has never bought anything reads as the empty garage.
 */
export const readStudio = (
  data: Record<string, any> | undefined,
): GuildStudio => {
  const stored = data?.studio ?? {};
  const roomLevel = Math.min(
    STUDIO_MAX_ROOM_LEVEL,
    Math.max(1, Math.floor(num(stored.roomLevel)) || 1),
  );
  const cap = Math.min(itemCap(roomLevel), STUDIO_MAX_ITEM_LEVEL);
  const items: Record<string, number> = {};
  for (const item of STUDIO_ITEMS) {
    const level = Math.min(
      cap,
      Math.max(0, Math.floor(num(stored.items?.[item.id]))),
    );
    if (level > 0) items[item.id] = level;
  }
  return { ...EMPTY_STUDIO, roomLevel, items };
};

/**
 * Monday 00:00 UTC of the week `now` is in — the board's week. UTC rather than
 * each member's own midnight because the board is one list for everybody; the
 * few hours either side are not worth a second definition of "this week".
 */
export const weekStartOf = (now: Date): Date => {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const sinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - sinceMonday);
  return start;
};

const msToHours = (ms: number): number =>
  Math.round((Math.max(0, ms) / 3_600_000) * 10) / 10;

/**
 * One member's week: a single aggregation over their reports since Monday
 * (sessions, practice time, points) plus their own document for the streak.
 * A member whose numbers cannot be read shows as zeros rather than taking the
 * board down.
 */
const memberWeek = async (
  member: GuildMember,
  since: Date,
  now: Date,
): Promise<WeeklyMemberStats<GuildMember>> => {
  try {
    const [reports, user] = await Promise.all([
      firestore
        .collection("users")
        .doc(member.uid)
        .collection("exerciseData")
        .where("reportDate", ">=", since)
        .aggregate({
          sessions: AggregateField.count(),
          time: AggregateField.sum(REPORT_TIME_FIELDS.time),
          points: AggregateField.sum(REPORT_POINTS_FIELD),
        } as any)
        .get(),
      userRef(member.uid).get(),
    ]);
    const tally = reports.data() as Record<string, unknown>;
    return {
      member,
      sessions: Math.max(0, Math.floor(num(tally.sessions))),
      hours: msToHours(num(tally.time)),
      points: Math.max(0, Math.floor(num(tally.points))),
      streak: liveStreak(user.data()?.statistics, now),
    };
  } catch (error) {
    console.error("[guildStudio] week failed", member.uid, error);
    return { member, sessions: 0, hours: 0, points: 0, streak: 0 };
  }
};

/** The week is two reads per member, so it is memoised per guild for a while. */
const WEEK_TTL_MS = 2 * 60_000;
const weekCache = new Map<
  string,
  { at: number; week: Promise<WeeklyMemberStats<GuildMember>[]> }
>();

/** Drops the memo. Exists so tests can move the underlying data between cases. */
export const resetStudioCache = (): void => weekCache.clear();

const readWeek = (
  guildId: string,
  members: GuildMember[],
  now: Date,
): Promise<WeeklyMemberStats<GuildMember>[]> => {
  const since = weekStartOf(now);
  const key = `${guildId}:${since.toISOString()}:${members
    .map((member) => member.uid)
    .sort()
    .join(",")}`;
  const hit = weekCache.get(key);
  if (hit && Date.now() - hit.at < WEEK_TTL_MS) return hit.week;

  const week = Promise.all(
    members.map((member) => memberWeek(member, since, now)),
  );
  weekCache.set(key, { at: Date.now(), week });
  return week;
};

export type StudioResult<T> =
  | ({ ok: true } & T)
  | { ok: false; status: 400 | 402 | 404 | 409; error: string };

/** The caller's guild's studio, its treasury and the week so far. */
export async function readGuildStudio(
  session: PlayerSession,
  now = new Date(),
): Promise<StudioResult<GuildStudioView>> {
  const user = await userRef(session.uid).get();
  const guildId = user.data()?.guildId as string | undefined;
  if (!guildId)
    return { ok: false, status: 400, error: "You are not in a guild" };

  const guild = await guildRef(guildId).get();
  if (!guild.exists)
    return { ok: false, status: 404, error: "That guild is gone" };

  const data = guild.data() ?? {};
  const members = (data.members ?? []) as GuildMember[];
  return {
    ok: true,
    studio: readStudio(data),
    bank: readTreasury(data).fame,
    week: await readWeek(guildId, members, now),
    weekStart: weekStartOf(now).toISOString(),
  };
}

/** What a member asks to buy: the next level of one piece, or of the room. */
export type StudioPurchase = { kind: "item"; id: string } | { kind: "room" };

export const readPurchase = (
  body: Record<string, unknown>,
): StudioPurchase | null => {
  if (body.kind === "room") return { kind: "room" };
  if (
    body.kind === "item" &&
    typeof body.id === "string" &&
    STUDIO_ITEMS.some((item) => item.id === body.id)
  )
    return { kind: "item", id: body.id };
  return null;
};

/**
 * Pays for one step out of the treasury. Everything is decided inside the
 * transaction from what is stored: the studio as it is now, the price of its
 * next step and whether the treasury covers it. The Fame leaves the treasury
 * as `spent`, so the deposits the quests count are left alone.
 */
export async function buyStudioStep(
  session: PlayerSession,
  purchase: StudioPurchase,
): Promise<StudioResult<{ paid: number; level: number }>> {
  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    const user = await tx.get(userRef(session.uid));
    const guildId = user.data()?.guildId as string | undefined;
    if (!guildId) return { state: "not-in-one" as const };

    const guild = await tx.get(guildRef(guildId));
    if (!guild.exists) return { state: "missing" as const };

    const data = guild.data() ?? {};
    const studio = readStudio(data);
    const bank = readTreasury(data).fame;
    const result =
      purchase.kind === "room"
        ? upgradeRoom(studio, bank)
        : upgradeItem(studio, purchase.id, bank);
    if (!result) return { state: "refused" as const, studio, bank };

    const paid = bank - result.bank;
    const level =
      purchase.kind === "room"
        ? result.studio.roomLevel
        : (result.studio.items[purchase.id] ?? 0);
    tx.update(guildRef(guildId), {
      studio: {
        roomLevel: result.studio.roomLevel,
        items: result.studio.items,
      },
      "treasury.fame": FieldValue.increment(-paid),
      "treasury.spent": FieldValue.increment(paid),
    });
    return { state: "ok" as const, paid, level };
  });

  if (outcome.state === "not-in-one")
    return { ok: false, status: 400, error: "You are not in a guild" };
  if (outcome.state === "missing")
    return { ok: false, status: 404, error: "That guild is gone" };
  if (outcome.state === "refused") {
    // Either the step is not there to buy (maxed, or the room caps it) or the
    // treasury cannot cover it; the two want different answers.
    const short =
      purchase.kind === "room"
        ? upgradeRoom(outcome.studio, Infinity) !== null
        : upgradeItem(outcome.studio, purchase.id, Infinity) !== null;
    return short
      ? { ok: false, status: 402, error: "The treasury is short" }
      : { ok: false, status: 409, error: "That cannot be bought yet" };
  }
  return { ok: true, paid: outcome.paid, level: outcome.level };
}
