import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

const statisticsInitial = {
  time: { technique: 0, theory: 0, hearing: 0, creativity: 0, longestSession: 0 },
  lvl: 1,
  points: 0,
  currentLevelMaxPoints: 35,
  sessionCount: 0,
  habitsCount: 0,
  dayWithoutBreak: 0,
  maxPoints: 0,
  achievements: [],
  actualDayWithoutBreak: 0,
  lastReportDate: "",
  songLists: { wantToLearn: [], learned: [], learning: [] },
  guitarStartDate: new Date(),
  fame: 0,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      if (!req.body.user) {
        return res.status(401).json({ error: "Please include user object." });
      }
      const user = req.body.user;
      const uid: string = user.uid;

      if (!uid) {
        return res.status(401).json({ error: "Invalid user object: missing uid." });
      }

      const userDocRef = firestore.collection("users").doc(uid);
      const userSnapshot = await userDocRef.get();

      if (!userSnapshot.exists) {
        await userDocRef.set({
          displayName: user.displayName ?? null,
          avatar: user.photoURL ?? null,
          createdAt: new Date(),
          statistics: statisticsInitial,
        });
      }

      const userData = (await userDocRef.get()).data();

      return res.status(200).json({
        userInfo: {
          displayName: userData?.displayName ?? null,
          avatar: userData?.avatar ?? null,
          youTubeLink: userData?.youTubeLink ?? null,
          soundCloudLink: userData?.soundCloudLink ?? null,
          band: userData?.band ?? null,
          guitarStartDate: userData?.guitarStartDate ?? null,
          selectedFrame: userData?.selectedFrame ?? null,
          selectedGuitar: userData?.selectedGuitar ?? null,
          role: userData?.role ?? null,
        },
        userAuth: uid,
        currentUserStats: {
          ...userData?.statistics,
          skills: userData?.skills || { unlockedSkills: {} },
        },
      });
    } catch (error) {
      return res.status(500).json({ error: String(error) });
    }
  }
  return res.status(400).end();
}
