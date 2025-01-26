import type { AchievementList } from "assets/achievements/achievementsData";
import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDocs, runTransaction, Timestamp } from "firebase/firestore";
import type { StatisticsDataInterface } from "types/api.types";
import type { SongStatus } from "utils/firebase/client/firebase.types";

import { db, updateSeasonalStats } from "../client/firebase.utils";
import { formatDiscordMessage } from "feature/discordBot/formatters";
import { sendDiscordMessage } from "feature/discordBot/utils/discord.utils";

export const firebaseGetUserData = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await getDoc(userDocRef);
  return userSnapshot.data()!.statistics;
};

export const firebaseUpdateUserStats = async (
  userAuth: string,
  statistics: StatisticsDataInterface,
  sessionTime: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  },
  pointsGained: number
) => {
  const userDocRef = doc(db, "users", userAuth);
  await Promise.all([
    updateDoc(userDocRef, { statistics }),
    updateSeasonalStats(userAuth, statistics, sessionTime, pointsGained),
  ]);
};

export const firebaseSetUserExerciseRaprot = async (
  userAuth: string,
  raport: ReportDataInterface,
  date: Date,
  exceriseTitle: string,
  isDateBackReport: number,
  timeSumary: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  }
) => {
  const dateString = date.toISOString();
  const dataRaport = { ...raport, exceriseTitle, timeSumary, isDateBackReport };
  const userDocRef = doc(db, "users", userAuth, "exerciseData", dateString);
  await setDoc(userDocRef, dataRaport);
};

export const firebaseAddLogReport = async (
  uid: string,
  data: string,
  points: number,
  newAchievements: AchievementList[],
  newLevel: { isNewLevel: boolean; level: number },
  timeSumary: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  }
) => {
  const logsDocRef = doc(collection(db, "logs"));
  const userDocRef = doc(db, "users", uid);
  const userSnapshot = await getDoc(userDocRef);
  const userName = userSnapshot.data()!.displayName;

  const logData = {
    data,
    uid,
    userName,
    points,
    newAchievements,
    newLevel,
    timestamp: new Date().toISOString(),
    timeSumary,
  };

  await setDoc(logsDocRef, logData);

  // Add Discord notification
  try {
    const discordMessage = await formatDiscordMessage(logData);
    await sendDiscordMessage(discordMessage as any);
  } catch (error) {
    console.error("Error sending Discord notification:", error);
  }
};

export const updateSongStatus = async (
  userId: string,
  songId: string,
  status: SongStatus
) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const songDocRef = doc(collection(userDocRef, "songs"), songId);
    const songRef = doc(db, "songs", songId);

    await runTransaction(db, async (transaction) => {
      const songDoc = await transaction.get(songRef);

      if (!songDoc.exists()) {
        throw new Error("Song not found");
      }

      const songData = songDoc.data();

      // Update or create user's song document
      await transaction.set(songDocRef, {
        ...songData,
        id: songId,
        status,
        lastUpdated: Timestamp.now(),
      });
    });

    return true;
  } catch (error) {
    console.error("Error updating song status:", error);
    throw error;
  }
};

export const getUserSongStatuses = async (userId: string) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const songsCollectionRef = collection(userDocRef, "songs");
    const querySnapshot = await getDocs(songsCollectionRef);

    return querySnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = doc.data().status;
      return acc;
    }, {} as Record<string, SongStatus>);
  } catch (error) {
    console.error("Error getting user song statuses:", error);
    throw error;
  }
};
