import { AchievementList } from "assets/achievements/achievementsData";
import { StatisticsDataInterface, StatisticsTime } from "types/api.types";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { db } from "../client/firebase.utils";

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
  date: Date
) => {
  const dateString = date.toISOString();
  const userDocRef = doc(db, "users", userAuth, "exerciseData", dateString);
  await setDoc(userDocRef, raport);
};

export const firebaseAddLogReport = async (
  uid: string,
  data: string,
  points: number,
  newAchievements: AchievementList[],
  newLevel: { isNewLevel: boolean; level: number },
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
