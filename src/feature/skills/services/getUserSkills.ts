import { doc, getDoc } from "firebase/firestore";
import { UserSkills } from "feature/skills/skills.types";
import { db } from "utils/firebase/client/firebase.utils";

export const getUserSkills = async (userId: string): Promise<UserSkills> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    // Default skills structure with 0 points
    const defaultSkills: UserSkills = {
      availablePoints: {
        technique: 0,
        theory: 0,
        hearing: 0,
        creativity: 0,
      },
      unlockedSkills: {},
    };

    if (!userDoc.exists()) {
      return defaultSkills;
    }

    const userData = userDoc.data();
    // Get points from statistics.availablePoints
    const availablePoints =
      userData.statistics?.availablePoints || defaultSkills.availablePoints;
    const unlockedSkills = userData.skills?.unlockedSkills || {};

    return {
      availablePoints,
      unlockedSkills,
    };
  } catch (error) {
    console.error("Error getting user skills:", error);
    throw error;
  }
};
