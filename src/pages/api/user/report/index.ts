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
    const pointsGained = report.raitingData.totalPoints || 0; // Use points from current session only

    const writePromises = [];

    writePromises.push(firebaseUpdateUserStats(
      userUid,
      report.currentUserStats,
      report.timeSummary,
      pointsGained
    ));

    writePromises.push(firebaseSetUserExerciseRaprot(
      userUid,
      report.raitingData,
      inputData.reportTitle,
      report.isDateBackReport,
      report.timeSummary,
      inputData.planId ?? null,
      inputData.songId || inputData.songTitle || inputData.songArtist ? {
        songId: inputData.songId,
        songTitle: inputData.songTitle,
        songArtist: inputData.songArtist
      } : undefined
    ));

    if (!report.isDateBackReport) {
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
        inputData.songId || inputData.songTitle || inputData.songArtist ? {
          songId: inputData.songId,
          songTitle: inputData.songTitle,
          songArtist: inputData.songArtist
        } : undefined,
        report.raitingData.bonusPoints.streak
      ));
    }

    await Promise.all(writePromises);

    invalidateActivityLogsCache(userUid);

    res.status(200).json({
      ...report,
    });
  }
  res.status(400);
}
