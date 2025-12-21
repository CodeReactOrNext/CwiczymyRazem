import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const getGlobalGenres = async (): Promise<string[]> => {
  try {
    const metaRef = doc(db, "metadata", "global");
    const metaSnap = await getDoc(metaRef);

    if (metaSnap.exists()) {
      return (metaSnap.data().genres || []).sort();
    }
    return [];
  } catch (error) {
    console.error("Error getting global genres:", error);
    return [];
  }
};
