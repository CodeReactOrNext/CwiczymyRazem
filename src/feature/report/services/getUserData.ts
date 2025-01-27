import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const firebaseGetUserData = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await getDoc(userDocRef);
  return userSnapshot.data()!.statistics;
};
