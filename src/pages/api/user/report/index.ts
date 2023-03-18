import { NextApiRequest, NextApiResponse } from "next";

import { auth } from "utils/firebase/api/firebase.config";
import { StatisticsDataInterface } from "types/api.types";
import { reportUpdateUserStats } from "utils/gameLogic/reportUpdateUserState";
import {
  firebaseGetUserData,
  firebaseUpdateUserStats,
  firebaseSetUserExerciseRaprot,
  firebaseAddLogReport,
} from "utils/firebase/api/firebase.utils";

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

    await firebaseSetUserExerciseRaprot(
      userUid,
      { ...report.raitingData, ...report.reportDate },
      report.reportDate,
      inputData.reportTitle,
      report.isDateBackReport,
      report.timeSummary
    );
    await firebaseUpdateUserStats(userUid, report.currentUserStats);

    if (!report.isDateBackReport) {
      await firebaseAddLogReport(
        userUid,
        report.currentUserStats.lastReportDate,
        report.raitingData.totalPoints,
        report.newAchievements,
        {
          isNewLevel: report.isNewLevel,
          level: report.currentUserStats.lvl,
        }
      );
    }
    res.status(200).json(report);
  }
  res.status(400);
}
