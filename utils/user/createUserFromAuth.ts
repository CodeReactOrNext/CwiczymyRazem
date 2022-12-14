import { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/firebase.utils";
import { statisticsInitial as statistics } from "../../constants/userStatisticsInitialData";
import { shuffleUid } from "./shuffleUid";

export const firebaseCreateUserDocumentFromAuth = async (user: User) => {
  const shuffledUid = shuffleUid(user.uid);
  const userDocRef = doc(db, "users", shuffledUid);

  const userSnapshot = await getDoc(userDocRef);
  if (!userSnapshot.exists()) {
    const { displayName } = user;
    const createdAt = new Date();
    try {
      await setDoc(userDocRef, {
        displayName,
        createdAt,
        statistics,
      });
    } catch (error) {
      console.log(error);
    }
  }
  return shuffledUid;
};
