import { statisticsInitial as statistics } from "constants/userStatisticsInitialData";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const firebaseCreateUserDocumentFromAuth = async (user: User) => {
  const userDocRef = doc(db, "users", user.uid);

  const userSnapshot = await getDoc(userDocRef);
  if (!userSnapshot.exists()) {
    const { displayName, photoURL: avatar } = user;
    const createdAt = new Date();
    try {
      await setDoc(userDocRef, {
        displayName,
        createdAt,
        statistics,
        avatar,
      });
    } catch {
      throw new Error();
    }
  }
  return user.uid;
};
