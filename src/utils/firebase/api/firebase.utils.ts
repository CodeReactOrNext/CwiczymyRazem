import { AchievementList } from "assets/achievements/achievementsData";
import { StatisticsDataInterface, StatisticsTime } from "types/api.types";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { db } from "../client/firebase.utils";
import { getFirestore, runTransaction, Timestamp, where, query, getDocs } from "firebase/firestore";
import { SongStatus } from "utils/firebase/client/firebase.types";

export const firebaseGetUserData = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await getDoc(userDocRef);
  return userSnapshot.data()!.statistics;
};

export const firebaseUpdateUserStats = async (
  userAuth: string,
  statistics: StatisticsDataInterface
) => {
  const userDocRef = doc(db, "users", userAuth);
  await updateDoc(userDocRef, { statistics });
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
  newLevel: { isNewLevel: boolean; level: number }
) => {
  const logsDocRef = doc(collection(db, "logs"));
  const userDocRef = doc(db, "users", uid);
  const userSnapshot = await getDoc(userDocRef);
  const userName = userSnapshot.data()!.displayName;

  await setDoc(logsDocRef, {
    data,
    uid,
    userName,
    points,
    newAchievements,
    newLevel,
  });
};

export const updateSongStatus = async (userId: string, songId: string, status: SongStatus) => {
  const db = getFirestore();
  const userSongRef = doc(db, 'userSongs', `${userId}_${songId}`);
  const songRef = doc(db, 'songs', songId);

  try {
    await runTransaction(db, async (transaction) => {
      const userSongDoc = await transaction.get(userSongRef);
      const songDoc = await transaction.get(songRef);
      
      if (!songDoc.exists()) {
        throw new Error("Song not found");
      }

      const oldStatus = userSongDoc.exists() ? userSongDoc.data().status : null;
      const songData = songDoc.data();
      const statusCounts = songData.statusCounts || {
        wantToLearn: 0,
        learning: 0,
        learned: 0,
      };

      // Decrease old status count if it existed
      if (oldStatus) {
        statusCounts[oldStatus]--;
      }

      // Increase new status count
      statusCounts[status]++;

      // Update user's song status
      transaction.set(userSongRef, {
        userId,
        songId,
        status,
        updatedAt: Timestamp.now(),
      });

      // Update song status counts
      transaction.update(songRef, { statusCounts });
    });

    return true;
  } catch (error) {
    console.error('Error updating song status:', error);
    throw error;
  }
};

export const getUserSongStatuses = async (userId: string) => {
  const db = getFirestore();
  const userSongsRef = collection(db, 'userSongs');
  const q = query(userSongsRef, where('userId', '==', userId));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.reduce((acc, doc) => {
    const data = doc.data();
    acc[data.songId] = data.status;
    return acc;
  }, {} as Record<string, SongStatus>);
};
