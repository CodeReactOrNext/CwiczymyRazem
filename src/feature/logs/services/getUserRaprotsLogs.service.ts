import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import {
  collection,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";


export const firebaseGetUserRaprotsLogs = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  
  const exerciseDocRef = await getDocs(collection(userDocRef, "exerciseData"));

  const exerciseArr: FirebaseUserExceriseLog[] = [];

  exerciseDocRef.forEach((exercise) => {
    const log = exercise.data() as FirebaseUserExceriseLog;

    exerciseArr.push(log);
  });
  
  return exerciseArr;
};
