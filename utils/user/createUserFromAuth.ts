import { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { statisticsInitial as statistics } from "constants/userStatisticsInitialData";

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
    } catch (error) {
      throw new Error();
    }
  }
  return user.uid;
};
