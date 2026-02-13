import type { UserSkills } from "feature/skills/skills.types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const getUserSkills = async (userId: string): Promise<UserSkills> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    // Default skills structure with 0 points
    const defaultSkills: UserSkills = {

      unlockedSkills: {},
    };

    if (!userDoc.exists()) {
      return defaultSkills;
    }

    const userData = userDoc.data();
    // Get points from statistics.availablePoints
    const unlockedSkills = userData.skills?.unlockedSkills || {};

    return {
      unlockedSkills,
    };
    
  } catch (error) {
    console.error("Error getting user skills:", error);
    throw error;
  }
};
