import type {
  QuestLogType,
  QuestReportField,
  ScaledQuest,
} from "feature/guilds/data/guildQuests";
import {
  activeChapterOf,
  GUILD_LAP_SIZE,
  GUILD_QUEST_CHAPTERS,
  guildLevelOf,
  msToHours,
  questAskOfEach,
  questsOfChapter,
  questUnit,
  scaleQuest,
} from "feature/guilds/data/guildQuests";
import type {
  GuildMember,
  GuildMemberEffort,
  GuildQuestBoard,
  GuildQuestProgress,
} from "feature/guilds/types/guild.types";
import {
  chapterOf,
  claimableQuests,
  questDoneList,
  readDoneQuests,
} from "feature/guilds/utils/guildQuest.utils";
import { readTreasury } from "feature/guilds/utils/guildTreasury.utils";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { AggregateField, FieldValue } from "firebase-admin/firestore";
import { syncGuildBadges } from "lib/guild/guildBadge";
import { awardFame } from "lib/support/fameWallet";
import type { PlayerSession } from "lib/support/supporterAuth";
import { userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The guild's quests: measured out of what the roster has already done, banked
 * the first time they are seen cleared, and paid out one member at a time.
 *
 * Nothing here is incremented. A quest is a question asked of data the app
 * writes anyway — how many practice reports since the guild was founded, how
 * many songs marked learned, how many members are on a streak this morning —
 * and the answer is worked out on read, over the roster as it stands. The
 * moment the answer crosses the target the quest is written to the guild
 * document with the roster frozen beside it, and from then on it is history:
 * a member leaving cannot un-clear it, and a member arriving cannot claim it.
 *
 * Reading is lazy and so is banking — no cron. Each read measures only the
 * chapter the guild is on, five quests, and the queries behind them are
 * memoised for a couple of minutes per guild because a guild page is opened far
 * more often than a guild clears anything. Which lap those five are on changes
 * their numbers and their keys, and nothing else about how they are measured.
 */

const guildRef = (id: string): DocumentReference =>
  firestore.collection("guilds").doc(id);

/** Report fields summed for the time metrics; sessions are a count, points a sum. */
const REPORT_TIME_FIELDS: Record<
  Exclude<QuestReportField, "sessions" | "points">,
  string
> = {
  time: "timeSumary.sumTime",
  technique: "timeSumary.techniqueTime",
  theory: "timeSumary.theoryTime",
  hearing: "timeSumary.hearingTime",
  creativity: "timeSumary.creativityTime",
};

const REPORT_POINTS_FIELD = "totalPoints";

const isTimeField = (field: QuestReportField): boolean =>
  field !== "sessions" && field !== "points";

/** Raw per-member report tallies: counts and points as they are, time in milliseconds. */
type RawReports = Record<QuestReportField, number>;

const EMPTY_REPORTS: RawReports = {
  sessions: 0,
  time: 0,
  technique: 0,
  theory: 0,
  hearing: 0,
  creativity: 0,
  points: 0,
};

/** What a member's own document says about them, for the streak quests. */
interface MemberStanding {
  streak: number;
}

/**
 * The per-member counts, every one an aggregation behind equality filters —
 * one document read each, whatever the member has done. Anything that would
 * have to read documents one by one, or range-filter two fields at once and
 * so need a composite index, is deliberately not on this list.
 */
type CountKind =
  | "songsLearned"
  | "recordings"
  | "submissions"
  | `logs:${QuestLogType}`;

/**
 * Every query a quest can need, per member, each run at most once per read and
 * only when a quest on the open chapter actually asks for it.
 *
 * One unreadable member never takes the board down: a query that fails logs
 * and reads as nothing, which under-counts rather than blocks.
 */
interface Measurer {
  reports(): Promise<Record<string, RawReports>>;
  standing(): Promise<Record<string, MemberStanding>>;
  count(kind: CountKind): Promise<Record<string, number>>;
}

const num = (value: unknown): number => Number(value) || 0;

/**
 * Whether a stored streak is still alive. `streakDays` is written on every
 * report and never cleared by silence, so a member who stopped a fortnight ago
 * still carries the number — the day of their last practice says whether it
 * still counts. Two days of grace covers the time zones the day key is kept in.
 */
const liveStreak = (
  statistics: Record<string, any> | undefined,
  now: Date,
): number => {
  const days = Math.max(
    0,
    Math.floor(
      num(statistics?.streakDays ?? statistics?.actualDayWithoutBreak),
    ),
  );
  if (days === 0) return 0;

  const lastDay = statistics?.lastPracticeLocalDay;
  if (typeof lastDay !== "string") return days;

  const cutoff = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return lastDay >= cutoff ? days : 0;
};

const createMeasurer = (
  members: GuildMember[],
  since: Date,
  now: Date,
): Measurer => {
  const memo = new Map<string, Promise<Record<string, unknown>>>();

  const perMember = <T>(
    key: string,
    empty: T,
    fetchOne: (uid: string) => Promise<T>,
  ): Promise<Record<string, T>> => {
    const hit = memo.get(key);
    if (hit) return hit as Promise<Record<string, T>>;

    const run = Promise.all(
      members.map(async (member) => {
        try {
          return [member.uid, await fetchOne(member.uid)] as const;
        } catch (error) {
          console.error(`[guildQuests] ${key} failed`, member.uid, error);
          return [member.uid, empty] as const;
        }
      }),
    ).then((entries) => Object.fromEntries(entries));

    memo.set(key, run);
    return run;
  };

  const reportsOf = (uid: string) =>
    firestore
      .collection("users")
      .doc(uid)
      .collection("exerciseData")
      .where("reportDate", ">=", since);

  const countOf = async (query: {
    aggregate: (spec: any) => { get: () => Promise<{ data: () => any }> };
  }): Promise<number> => {
    const snap = await query.aggregate({ n: AggregateField.count() }).get();
    return Math.max(0, Math.floor(num(snap.data().n)));
  };

  const fetchCount = (kind: CountKind, uid: string): Promise<number> => {
    switch (kind) {
      case "songsLearned":
        return countOf(
          firestore
            .collection("users")
            .doc(uid)
            .collection("userSongs")
            .where("status", "==", "learned"),
        );
      case "recordings":
        return countOf(
          firestore.collection("recordings").where("userId", "==", uid),
        );
      case "submissions":
        return countOf(
          firestore
            .collection("challengeSubmissions")
            .where("userId", "==", uid),
        );
      default:
        return countOf(
          firestore
            .collection("logs")
            .where("uid", "==", uid)
            .where("type", "==", kind.slice("logs:".length)),
        );
    }
  };

  return {
    // Firestore allows five aggregations per query, so the seven come in two —
    // two document reads per member, however many quests read them.
    reports: () =>
      perMember<RawReports>("reports", EMPTY_REPORTS, async (uid) => {
        const window = reportsOf(uid);
        const [first, second] = await Promise.all([
          window
            .aggregate({
              sessions: AggregateField.count(),
              time: AggregateField.sum(REPORT_TIME_FIELDS.time),
              technique: AggregateField.sum(REPORT_TIME_FIELDS.technique),
              theory: AggregateField.sum(REPORT_TIME_FIELDS.theory),
              hearing: AggregateField.sum(REPORT_TIME_FIELDS.hearing),
            } as any)
            .get(),
          window
            .aggregate({
              creativity: AggregateField.sum(REPORT_TIME_FIELDS.creativity),
              points: AggregateField.sum(REPORT_POINTS_FIELD),
            } as any)
            .get(),
        ]);
        const data = { ...first.data(), ...second.data() } as Record<
          string,
          unknown
        >;
        return {
          sessions: num(data.sessions),
          time: num(data.time),
          technique: num(data.technique),
          theory: num(data.theory),
          hearing: num(data.hearing),
          creativity: num(data.creativity),
          points: num(data.points),
        };
      }),

    standing: () =>
      perMember<MemberStanding>("standing", { streak: 0 }, async (uid) => {
        const snap = await userRef(uid).get();
        const statistics = snap.data()?.statistics as
          | Record<string, any>
          | undefined;
        return { streak: liveStreak(statistics, now) };
      }),

    count: (kind) => perMember<number>(kind, 0, (uid) => fetchCount(kind, uid)),
  };
};

const sum = (values: Record<string, number>): number =>
  Object.values(values).reduce((total, value) => total + value, 0);

/** A raw report value in the unit its quest is stated in. */
const inUnit = (field: QuestReportField, raw: number): number =>
  isTimeField(field) ? msToHours(raw) : Math.max(0, Math.floor(raw));

/**
 * Measures one quest — already scaled to its lap — over the roster, from the
 * caller's seat.
 */
async function measureQuest(
  quest: ScaledQuest,
  measurer: Measurer,
  members: GuildMember[],
  uid: string,
  data: Record<string, any>,
): Promise<Omit<GuildQuestProgress, "doneAt">> {
  const { measure, target } = quest;
  const unit = questUnit(quest);
  const ask = questAskOfEach(quest) ?? "";

  let progress = 0;
  let mine: number | null = null;
  let each: GuildQuestProgress["each"] = null;

  /** A guild total out of per-member numbers, with the caller's own share. */
  const total = (values: Record<string, number>) => {
    progress = sum(values);
    mine = values[uid] ?? 0;
  };

  /**
   * How many members clear a per-member bar, with the caller against it. The
   * target is the handful the catalog asked for, never the roster — see the
   * catalog for why.
   */
  const everyone = (
    values: Record<string, number>,
    bar: number,
    measureOf: (value: number) => number = (value) => value,
  ) => {
    const cleared = members.filter(
      (member) => measureOf(values[member.uid] ?? 0) >= bar,
    ).length;
    const own = measureOf(values[uid] ?? 0);
    progress = cleared;
    each = { ask, mine: own, target: bar, done: own >= bar };
  };

  switch (measure.kind) {
    case "reports": {
      const { field } = measure;
      const raw: Record<string, number> = Object.fromEntries(
        Object.entries(await measurer.reports()).map(([member, tally]) => [
          member,
          tally[field],
        ]),
      );

      if (measure.scope === "guild") {
        // Summed raw and converted once, so nobody's part-hour is rounded
        // away before it has been added to anybody else's.
        progress = inUnit(field, sum(raw));
        mine = inUnit(field, raw[uid] ?? 0);
      } else {
        everyone(raw, measure.each, (value) => inUnit(field, value));
      }
      break;
    }
    case "allCategoriesEach": {
      const reports = await measurer.reports();
      // How many of the four categories each member has the bar in; the quest
      // asks for all four.
      const categories = Object.fromEntries(
        Object.entries(reports).map(([member, tally]) => [
          member,
          [
            tally.technique,
            tally.theory,
            tally.hearing,
            tally.creativity,
          ].filter((ms) => msToHours(ms) >= measure.hoursEach).length,
        ]),
      );
      everyone(categories, 4);
      break;
    }
    case "treasury":
      total(readTreasury(data).deposits);
      break;
    case "streak": {
      const standing = await measurer.standing();
      everyone(
        Object.fromEntries(
          Object.entries(standing).map(([member, s]) => [member, s.streak]),
        ),
        measure.days,
      );
      break;
    }
    case "songsLearned":
      total(await measurer.count("songsLearned"));
      break;
    case "recordings":
      total(await measurer.count("recordings"));
      break;
    case "submissions":
      total(await measurer.count("submissions"));
      break;
    case "logs":
      total(await measurer.count(`logs:${measure.type}`));
      break;
  }

  return {
    id: quest.key,
    questId: quest.id,
    lap: quest.lap,
    chapter: quest.chapter,
    name: quest.name,
    blurb: quest.blurb,
    unit,
    target,
    progress,
    isComplete: progress >= target,
    reward: quest.reward,
    mine,
    each,
  };
}

/** Measuring is queries per member, so it is memoised per guild and roster. */
const CACHE_TTL_MS = 2 * 60_000;
const measurerCache = new Map<string, { at: number; measurer: Measurer }>();

/** Drops the memo. Exists so tests can move the underlying data between cases. */
export const resetQuestCache = (): void => measurerCache.clear();

const measurerFor = (
  guildId: string,
  members: GuildMember[],
  since: Date,
  now: Date,
): Measurer => {
  const key = `${guildId}:${members
    .map((member) => member.uid)
    .sort()
    .join(",")}`;
  const hit = measurerCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.measurer;

  const measurer = createMeasurer(members, since, now);
  measurerCache.set(key, { at: Date.now(), measurer });
  return measurer;
};

/** The day counting starts: when the guild was founded, or forever for a document without one. */
const sinceOf = (data: Record<string, any>): Date => {
  const created = data.createdAt?.toDate?.();
  return created instanceof Date && !Number.isNaN(created.getTime())
    ? created
    : new Date(0);
};

/**
 * How many chapters one read may close in a row. Two laps' worth: a guild
 * founded on three veterans should see the level it has already earned rather
 * than click through it a page load at a time, and nothing real clears more
 * than that at once.
 */
const CHAPTERS_PER_READ = 2 * GUILD_QUEST_CHAPTERS.length;

/**
 * Reads the board, and banks whatever the guild has just cleared.
 *
 * Only the open chapter is measured. If measuring it closes it, the next one
 * opens in the same read and is measured too — across the lap boundary as
 * well, since a finished lap is only the next chapter with bigger numbers.
 */
export async function readQuestBoard(
  guildId: string,
  data: Record<string, any>,
  uid: string,
  now: Date = new Date(),
): Promise<GuildQuestBoard> {
  const members = (data.members ?? []) as GuildMember[];
  const since = sinceOf(data);
  const measurer = measurerFor(guildId, members, since, now);

  // The ledger, kept up to date locally as quests are banked below, so the
  // board handed back is the one the document now says without a re-read.
  let ledger: Record<string, any> = data;
  const doneKeys = new Set(readDoneQuests(data).map((quest) => quest.key));
  const rosterNow = members.map((member) => member.uid);
  let banked = false;

  let active: GuildQuestProgress[] = [];
  let at = activeChapterOf([...doneKeys]);

  for (let guard = 0; guard < CHAPTERS_PER_READ; guard++) {
    at = activeChapterOf([...doneKeys]);
    const quests = questsOfChapter(at.chapter).map((quest) =>
      scaleQuest(quest, at.lap),
    );

    const measured = await Promise.all(
      quests.map((quest) =>
        measureQuest(quest, measurer, members, uid, ledger),
      ),
    );

    const newlyDone = measured.filter(
      (quest) => quest.isComplete && !doneKeys.has(quest.id),
    );

    if (newlyDone.length > 0) {
      const when = now.toISOString();
      const entries = newlyDone.map(
        (quest) => [quest.id, { at: when, roster: rosterNow }] as const,
      );

      try {
        await guildRef(guildId).update(
          Object.fromEntries(
            entries.map(([key, clear]) => [`quests.${key}`, clear]),
          ),
        );
        banked = true;
        ledger = {
          ...ledger,
          quests: { ...(ledger.quests ?? {}), ...Object.fromEntries(entries) },
        };
        for (const [key] of entries) doneKeys.add(key);
      } catch (error) {
        console.error("[guildQuests] could not bank", guildId, error);
      }
    }

    const stored = readDoneQuests(ledger);
    active = measured.map((quest) => ({
      ...quest,
      doneAt: stored.find((entry) => entry.key === quest.id)?.at ?? null,
    }));

    // Every quest banked: the next chapter is open, measure it in this read.
    const allBanked = measured.every((quest) => doneKeys.has(quest.id));
    if (!allBanked) break;
  }

  // The level rides on every member's badge, so a clear re-stamps the roster.
  if (banked) await syncGuildBadges(guildId);

  const reports = await measurer.reports();
  const perMember: Record<string, GuildMemberEffort> = Object.fromEntries(
    members.map((member) => {
      const tally = reports[member.uid] ?? EMPTY_REPORTS;
      return [
        member.uid,
        {
          sessions: Math.max(0, Math.floor(tally.sessions)),
          hours: msToHours(tally.time),
        },
      ];
    }),
  );

  const done = questDoneList(ledger, uid);
  const claimable = claimableQuests(ledger, uid);
  const chapter = chapterOf(at.chapter, at.lap) ?? {
    index: 0,
    ...GUILD_QUEST_CHAPTERS[0],
  };

  return {
    level: guildLevelOf([...doneKeys]),
    lap: at.lap,
    lapSize: GUILD_LAP_SIZE,
    lapCleared: done.filter((quest) => quest.lap === at.lap).length,
    chapter,
    chaptersTotal: GUILD_QUEST_CHAPTERS.length,
    active,
    done,
    claimable: { fame: claimable.fame, quests: claimable.keys.length },
    perMember,
    since: since.toISOString(),
  };
}

export type ClaimResult =
  | { ok: true; fame: number; quests: number }
  | { ok: false; status: 400 | 404 | 409; error: string };

/**
 * Takes every quest reward this member has waiting, in one go.
 *
 * Everything is decided from the stored document inside the transaction: which
 * quests are cleared, whether this member was on the roster when each was, and
 * which they have already taken. Nothing from the request body is trusted and
 * nothing needs measuring — banking happened on the read that showed them the
 * button.
 */
export async function claimQuestRewards(
  session: PlayerSession,
): Promise<ClaimResult> {
  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    const user = await tx.get(userRef(session.uid));
    const guildId = user.data()?.guildId as string | undefined;
    if (!guildId) return { state: "not-in-one" as const };

    const guild = await tx.get(guildRef(guildId));
    if (!guild.exists) return { state: "missing" as const };

    const { keys, fame } = claimableQuests(guild.data() ?? {}, session.uid);
    if (keys.length === 0 || fame <= 0) return { state: "nothing" as const };

    tx.update(guildRef(guildId), {
      [`questClaims.${session.uid}`]: FieldValue.arrayUnion(...keys),
    });
    awardFame(tx, user, fame);

    return { state: "ok" as const, fame, quests: keys.length };
  });

  if (outcome.state === "not-in-one") {
    return { ok: false, status: 400, error: "You are not in a guild" };
  }
  if (outcome.state === "missing") {
    return { ok: false, status: 404, error: "That guild is gone" };
  }
  if (outcome.state === "nothing") {
    return { ok: false, status: 409, error: "Nothing to take right now" };
  }

  return { ok: true, fame: outcome.fame, quests: outcome.quests };
}
