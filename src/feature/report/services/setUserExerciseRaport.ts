import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import {  doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../../../utils/firebase/client/firebase.utils";

export const firebaseGetUserData = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await getDoc(userDocRef);
  return userSnapshot.data();
};


export const firebaseSetUserExerciseRaprot = async (
  userAuth: string,
  raport: ReportDataInterface,
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
  const dataRaport = { ...raport, exceriseTitle, timeSumary, isDateBackReport };

  const userDocRef = doc(db, "users", userAuth, "exerciseData", raport.reportDate.toISOString());


  await setDoc(userDocRef, dataRaport);
};
