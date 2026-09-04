import { summarizeArsenal } from "feature/arsenal/data/arsenalSummary";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import { getChainFameRate } from "feature/arsenal/data/signalChain";
import {
  buildRigTraitContext,
  getRigTraitPayout,
} from "feature/arsenal/data/traitEval";
import { getCurrentSeason } from "feature/leadboard/services/getCurrentSeason";
import { firebaseAddLogReport } from "feature/logs/services/addLogReport.service";
import { invalidateActivityLogsCache } from "feature/logs/services/getUserRaprotsLogs.service";
import {
  firebaseGetUserData,
  firebaseSetUserExerciseRaprot,
} from "feature/report/services/setUserExerciseRaport";
import { firebaseUpdateUserStats } from "feature/report/services/updateUserStats";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { FieldValue } from "firebase-admin/firestore";
import { ACHIEVEMENT_STATS_PATH, countsAsPlayer } from "lib/achievements/achievementStats";
import type { NextApiRequest, NextApiResponse } from "next";
import type { StatisticsDataInterface } from "types/api.types";
import { auth, firestore } from "utils/firebase/api/firebase.config";
import { calculateSessionFame } from "utils/gameLogic/calculateSessionFame";
import { reportUpdateUserStats } from "utils/gameLogic/reportUpdateUserState";

interface SkillPointsGained {
  technique: number;
  theory: number;
  hearing: number;
  creativity: number;
}

export interface SongListInterface {
  wantToLearn: string[];
  learned: string[];
  learning: string[];
}

/** Matches `MAX_SESSION_SONGS` in the form — keeps one report doc a sane size. */
const MAX_REPORT_SONGS = 20;
const MAX_SONG_TEXT_LENGTH = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The per-song breakdown of a multi-song session comes straight from the
 * client, so it is rebuilt field by field before it can reach Firestore.
 */
const sanitizeReportSongs = (value: unknown) => {
  if (!Array.isArray(value)) return undefined;

  const songs = value
    .filter(
      (entry): entry is Record<string, unknown> =>
        !!entry && typeof entry === "object"
    )
    .map((entry) => ({
      songId: typeof entry.songId === "string" ? entry.songId : "",
      songTitle:
        typeof entry.songTitle === "string"
          ? entry.songTitle.slice(0, MAX_SONG_TEXT_LENGTH)
          : "",
      songArtist:
        typeof entry.songArtist === "string"
          ? entry.songArtist.slice(0, MAX_SONG_TEXT_LENGTH)
          : "",
      practiceMs:
        typeof entry.practiceMs === "number" && Number.isFinite(entry.practiceMs)
          ? Math.min(Math.max(Math.round(entry.practiceMs), 0), DAY_MS)
          : 0,
    }))
    .filter((song) => song.songId && song.practiceMs > 0)
    .slice(0, MAX_REPORT_SONGS);

  return songs.length > 0 ? songs : undefined;
};

/**
 * The server day this report is being filed on — the bucket the daily Fame
 * counter belongs to. Always "now", even for a back-dated report: that report's
 * own day is long closed, and pointing the counter at it would hand the user a
 * fresh allowance for today.
 *
 * Read from the server clock rather than the client's `clientTodayISO`, because
 * the daily Fame allowance is an economy limit, not a personal habit. Taking it
 * from the browser meant the cap rolled over at a different instant for every
 * player — and that a client claiming to be in Kiritimati got a second day's
 * worth of Fame ten hours before anyone else. The streak still uses the client's
 * local day (see `reportUpdateUserStats`), which is why that field stays.
 */
const getReportDayKey = (): string => new Date().toISOString().slice(0, 10);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    if (!req.body.token) {
      return res.status(401).json("Please include id token");
    }
    const { uid } = await auth.verifyIdToken(req.body.token.token);
    const userUid = uid;
    const { inputData } = req.body;

    const userData = (await firebaseGetUserData(
      userUid
    ))
    const userSongLists = await getUserSongs(userUid);

    const currentUserStats: StatisticsDataInterface = {
      lvl: 1,
      points: 0,
      sessionCount: 0,
      habitsCount: 0,
      dayWithoutBreak: 0,
      actualDayWithoutBreak: 0,
      maxPoints: 0,
      currentLevelMaxPoints: 100,
      lastReportDate: new Date().toISOString(),
      guitarStartDate: null,
      achievements: [],
      time: {
        technique: 0,
        theory: 0,
        hearing: 0,
        creativity: 0,
        longestSession: 0
      },
      ...(userData?.statistics || {}),
      skills: userData?.skills || { unlockedSkills: {} }
    };
    const currentUserSongLists = (userSongLists || {
      wantToLearn: [],
      learned: [],
      learning: []
    }) as unknown as SongListInterface;

    let report;
    try {
      report = reportUpdateUserStats({
        currentUserStats,
        inputData,
        currentUserSongLists,
        // The gear half of the achievement context. Same stored arsenal the Fame
        // bonuses above are priced from, so a badge can never disagree with the
        // rate the session paid.
        arsenalSummary: summarizeArsenal(userData?.arsenal)
      });
    } catch (error) {
      console.error("reportUpdateUserStats failed:", error);
      return res.status(500).json({ error: "Game logic processing failed", details: error instanceof Error ? error.message : String(error) });
    }


    // Calculate points gained in this session - use the points from current report only
    const pointsGained = report.raitingData.totalPoints || 0;

    // Recomputed from the stored arsenal rather than read off the denormalized
    // `rigLevel` field: that field is only refreshed by arsenal writes, so a
    // stale one would pay the wrong rate. The arsenal is already in memory from
    // `firebaseGetUserData`, so this costs no extra read. Never trust the
    // request body for it — the payload is client-controlled.
    const rigLevel = userData?.arsenal
      ? getRigLevel(userData.arsenal)
      : (typeof userData?.rigLevel === "number" ? userData.rigLevel : 0);

    // Traits read the shape of this one session — per-category minutes and the
    // skills it trained — which is why they are resolved here rather than inside
    // `calculateSessionFame`, which only ever sees a total. Same rule as the rig
    // level above: the arsenal comes from the stored document, never the body.
    // Same rule as the rig level: scored off the stored board, never off the
    // request body. The wiring bonus is worth real Fame, so a client must not be
    // able to claim a by-the-book chain it has not actually arranged.
    const chainRate = getChainFameRate(userData?.arsenal);

    const traitPayout = getRigTraitPayout(
      buildRigTraitContext(userData?.arsenal),
      {
        minutes: {
          technique: report.timeSummary.techniqueTime / 60000,
          theory: report.timeSummary.theoryTime / 60000,
          hearing: report.timeSummary.hearingTime / 60000,
          creativity: report.timeSummary.creativityTime / 60000,
        },
        skills: Object.entries(inputData.skillPointsGained ?? {})
          .filter(([, points]) => Number(points) > 0)
          .map(([skillId]) => skillId),
      },
    );

    // Fame no longer mirrors points: it pays out on a concave curve over the
    // user's daily practice total, so short daily sessions beat marathons and
    // the shop economy can't be inflated by one very long (self-reported) day.
    const fameResult = calculateSessionFame({
      sessionTimeMs: report.timeSummary.sumTime,
      dayKey: getReportDayKey(),
      streak: report.currentUserStats.actualDayWithoutBreak,
      fameDay: currentUserStats.fameDay,
      accuracy: inputData.micPerformance?.accuracy,
      isDateBackReport: report.isDateBackReport,
      rigLevel,
      traitFame: traitPayout.fame,
      traitRate: traitPayout.rate,
      chainRate,
    });
    const fameEarned = fameResult.fame;

    const season = await getCurrentSeason();

    // `songId`/`songTitle`/`songArtist` stay the session's primary song so every
    // older consumer keeps working; `songs` carries the full per-song breakdown.
    const reportSongs = sanitizeReportSongs(inputData.songs);
    const songDetails =
      inputData.songId || inputData.songTitle || inputData.songArtist || reportSongs
        ? {
            ...(inputData.songId && { songId: inputData.songId }),
            ...(inputData.songTitle && { songTitle: inputData.songTitle }),
            ...(inputData.songArtist && { songArtist: inputData.songArtist }),
            ...(reportSongs && { songs: reportSongs }),
          }
        : undefined;

    const writePromises = [];

    // Keep `config/achievementStats` live, so the collection screen can show
    // how many players hold each badge without counting accounts per request.
    //
    // Written with the Admin SDK rather than through `firebaseUpdateUserStats`,
    // which still goes out over the client SDK: a counter every visitor could
    // write is a counter nobody can trust. Increments rather than absolute
    // writes, so two players finishing at once cannot clobber each other.
    //
    // Drifts over time — a failed write here, a badge granted by hand — which
    // is what `npm run backfill-achievement-stats` exists to repair.
    const isFirstEverSession =
      (report.previousUserStats?.sessionCount ?? 0) === 0 &&
      countsAsPlayer(report.currentUserStats);

    if (report.newAchievements.length > 0 || isFirstEverSession) {
      const [statsCollection, statsDoc] = ACHIEVEMENT_STATS_PATH.split("/");
      const statsUpdate: Record<string, FirebaseFirestore.FieldValue> = {};

      for (const achievementId of report.newAchievements) {
        statsUpdate[`counts.${achievementId}`] = FieldValue.increment(1);
      }
      if (isFirstEverSession) {
        statsUpdate.totalPlayers = FieldValue.increment(1);
      }

      writePromises.push(
        firestore
          .collection(statsCollection)
          .doc(statsDoc)
          // `set(..., { merge: true })` so the very first report of a fresh
          // deployment creates the document instead of failing on a missing one.
          .set(statsUpdate, { merge: true })
          .catch((error: unknown) => {
            // A lost count must never cost a player their session.
            console.error("achievement stats increment failed:", error);
          })
      );
    }

    writePromises.push(firebaseUpdateUserStats(
      userUid,
      report.currentUserStats,
      report.timeSummary,
      pointsGained,
      season.seasonId,
      fameEarned,
      fameResult.fameDay
    ));

    writePromises.push(firebaseSetUserExerciseRaprot(
      userUid,
      report.raitingData,
      inputData.reportTitle,
      report.isDateBackReport,
      report.timeSummary,
      season.seasonId,
      inputData.planId ?? null,
      songDetails
    ));

    if (!report.isDateBackReport) {
      // `streakDays` is the activity-log-derived streak the client sent — the same
      // number the header widget shows, already validated and persisted by
      // reportUpdateUserStats. The stored `actualDayWithoutBreak` counter behind
      // `bonusPoints.streak` drifts after a timezone slip, so it is only a fallback.
      const discordStreak =
        report.currentUserStats.streakDays ??
        report.raitingData.bonusPoints.streak;

      writePromises.push(firebaseAddLogReport(
        userUid,
        report.currentUserStats.lastReportDate,
        report.raitingData.totalPoints,
        report.newAchievements,
        {
          isNewLevel: report.isNewLevel,
          level: report.currentUserStats.lvl,
        },
        report.timeSummary,
        inputData.avatarUrl ?? null,
        inputData.planId ?? null,
        songDetails,
        discordStreak,
        inputData.skillPointsGained,
        report.newRecords,
        inputData.exerciseRecords,
        inputData.reportTitle,
        inputData.micPerformance,
        inputData.earTrainingPerformance
      ));
    }

    await Promise.all(writePromises);

    invalidateActivityLogsCache(userUid);

    res.status(200).json({
      ...report,
      raitingData: {
        ...report.raitingData,
        fameEarned,
        fameStreakBonus: fameResult.streakBonus,
        fameAccuracyBonus: fameResult.accuracyBonusApplied,
        fameRigBonus: fameResult.rigFame,
        fameChainBonus: fameResult.chainFame,
        fameTraitBonus: fameResult.traitFame,
      },
    });
  }
  res.status(400);
}
