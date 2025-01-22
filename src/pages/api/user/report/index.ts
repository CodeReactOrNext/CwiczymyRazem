import type { NextApiRequest, NextApiResponse } from "next";
import type { StatisticsDataInterface } from "types/api.types";
import { auth } from "utils/firebase/api/firebase.config";
import {
  firebaseAddLogReport,
  firebaseGetUserData,
  firebaseSetUserExerciseRaprot,
  firebaseUpdateUserStats,
} from "utils/firebase/api/firebase.utils";
import { reportUpdateUserStats } from "utils/gameLogic/reportUpdateUserState";

interface SkillPointsGained {
  technique: number;
  theory: number;
  hearing: number;
  creativity: number;
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
    const currentUserStats = (await firebaseGetUserData(
      userUid
    )) as StatisticsDataInterface;
    const report = reportUpdateUserStats({
      currentUserStats,
      inputData,
    });

    const skillPointsGained: SkillPointsGained = {
      technique: Math.floor(report.timeSummary.techniqueTime / 1800000),
      theory: Math.floor(report.timeSummary.theoryTime / 1800000),
      hearing: Math.floor(report.timeSummary.hearingTime / 1800000),
      creativity: Math.floor(report.timeSummary.creativityTime / 1800000),
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
      { ...report.raitingData, ...report.reportDate, skillPointsGained },
      report.reportDate,
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
        report.timeSummary
      );
    }

    res.status(200).json({
      ...report,
      skillPointsGained,
    });
  }
  res.status(400);
}
