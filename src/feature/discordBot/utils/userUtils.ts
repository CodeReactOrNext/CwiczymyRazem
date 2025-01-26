import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data()?.displayName || userId;
    }
    return userId;
  } catch {
    return userId;
  }
};
