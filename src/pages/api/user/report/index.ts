import { firebaseAddLogReport } from "feature/logs/services/addLogReport.service";
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


    const currentUserStats = userData?.statistics as StatisticsDataInterface;
    const currentUserSongLists = userSongLists as unknown as SongListInterface;


    const report = reportUpdateUserStats({
      currentUserStats,
      inputData,
      currentUserSongLists
    });


    const skillPointsGained: SkillPointsGained = {
      technique: Math.floor(report.timeSummary.techniqueTime / 3600000),
      theory: Math.floor(report.timeSummary.theoryTime / 3600000),
      hearing: Math.floor(report.timeSummary.hearingTime / 3600000),
      creativity: Math.floor(report.timeSummary.creativityTime / 3600000),
    };

    const updatedStats = {
      ...report.currentUserStats,
      availablePoints: {
        technique:
          (currentUserStats.availablePoints?.technique || 0) +
          skillPointsGained.technique,
        theory:
          (currentUserStats.availablePoints?.theory || 0) +
          skillPointsGained.theory,
        hearing:
          (currentUserStats.availablePoints?.hearing || 0) +
          skillPointsGained.hearing,
        creativity:
          (currentUserStats.availablePoints?.creativity || 0) +
          skillPointsGained.creativity,
      },
    };

    // Calculate points gained in this session - use the points from current report only
    const pointsGained = report.raitingData.totalPoints || 0; // Use points from current session only

    await firebaseUpdateUserStats(
      userUid,
      updatedStats,
      report.timeSummary,
      pointsGained
    );



    await firebaseSetUserExerciseRaprot(
      userUid,
      { ...report.raitingData, skillPointsGained },
      inputData.reportTitle,
      report.isDateBackReport,
      report.timeSummary
    );

    if (!report.isDateBackReport) {
      await firebaseAddLogReport(
        userUid,
        report.currentUserStats.lastReportDate,
        report.raitingData.totalPoints,
        report.newAchievements,
        {
          isNewLevel: report.isNewLevel,
          level: report.currentUserStats.lvl,
        },
        report.timeSummary,
        inputData.avatarUrl ?? null
      );
    }

    res.status(200).json({
      ...report,
      skillPointsGained,
    });
  }
  res.status(400);
}
