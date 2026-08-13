import { getCurrentSeason } from "feature/leadboard/services/getCurrentSeason";
import { firebaseAddLogReport } from "feature/logs/services/addLogReport.service";
import { invalidateActivityLogsCache } from "feature/logs/services/getUserRaprotsLogs.service";
import {
  firebaseGetUserData,
  firebaseSetUserExerciseRaprot,
} from "feature/report/services/setUserExerciseRaport";
import { firebaseUpdateUserStats } from "feature/report/services/updateUserStats";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { NextApiRequest, NextApiResponse } from "next";
import type { StatisticsDataInterface } from "types/api.types";
import { auth } from "utils/firebase/api/firebase.config";
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

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

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
 * The user's local calendar day this report is being filed on — the bucket the
 * daily fame counter belongs to. Always the client's "today", even for a
 * back-dated report: that report's own day is long closed, and pointing the
 * counter at it would hand the user a fresh allowance for today.
 */
const getReportDayKey = (clientTodayISO?: string): string => {
  if (clientTodayISO && ISO_DAY.test(clientTodayISO)) return clientTodayISO;

  // Legacy clients sent a full ISO timestamp; reportUpdateUserStats normalizes
  // those to UTC midnight, so bucket them by their UTC day the same way.
  const parsed = clientTodayISO ? new Date(clientTodayISO) : new Date();
  const date = isNaN(parsed.getTime()) ? new Date() : parsed;

  return date.toISOString().slice(0, 10);
};

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
        currentUserSongLists
      });
    } catch (error) {
      console.error("reportUpdateUserStats failed:", error);
      return res.status(500).json({ error: "Game logic processing failed", details: error instanceof Error ? error.message : String(error) });
    }


    // Calculate points gained in this session - use the points from current report only
    const pointsGained = report.raitingData.totalPoints || 0;

    // Fame no longer mirrors points: it pays out on a concave curve over the
    // user's daily practice total, so short daily sessions beat marathons and
    // the shop economy can't be inflated by one very long (self-reported) day.
    const fameResult = calculateSessionFame({
      sessionTimeMs: report.timeSummary.sumTime,
      dayKey: getReportDayKey(inputData.clientTodayISO),
      streak: report.currentUserStats.actualDayWithoutBreak,
      fameDay: currentUserStats.fameDay,
      accuracy: inputData.micPerformance?.accuracy,
      isDateBackReport: report.isDateBackReport,
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
      // The stored `actualDayWithoutBreak` counter can drift from reality after a
      // timezone slip, while the client's activity-log-derived streak (same source
      // of truth as the header widget) self-heals. Prefer it for the Discord log
      // when the client sent a sane value.
      const discordStreak =
        typeof inputData.clientDisplayStreak === "number" &&
        Number.isInteger(inputData.clientDisplayStreak) &&
        inputData.clientDisplayStreak >= 0
          ? inputData.clientDisplayStreak
          : report.raitingData.bonusPoints.streak;

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
      },
    });
  }
  res.status(400);
}
